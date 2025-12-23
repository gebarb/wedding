<script setup lang="ts">
const { $img } = useNuxtApp();
const config = useRuntimeConfig();

// State for images and loading
const images = ref<Array<{src: string, alt: string, key: string}>>([]);
const isLoading = ref(true);
const isFetching = ref(false);
const hasMore = ref(true);
const error = ref<string | null>(null);
const retryCount = ref(0);
const MAX_RETRIES = 3;
const page = ref(1);
// Responsive settings
const screenWidth = ref(0);
const isMobile = computed(() => screenWidth.value < 768);
const columns = computed(() => isMobile.value ? 1 : 3);
const perPage = computed(() => isMobile.value ? 3 : 6); // Initial load count

// Fetch images from S3 with infinite scroll
const fetchImages = async (retryAttempt = 0) => {
  if (isFetching.value || !hasMore.value) return;
  
  isFetching.value = true;
  error.value = null;
  
  if (retryAttempt === 0) {
    isLoading.value = true;
  }
  
  try {
    // Using $fetch with response type
    const response = await $fetch.raw('/api/s3-images', {
      method: 'GET',
      query: { 
        folder: 'proposal',
        page: page.value,
        perPage: perPage.value
      },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    
    // The actual data is in response._data
    const responseData = response._data;
    
    if (!responseData || responseData.statusCode !== 200) {
      console.error('Invalid response:', responseData);
      throw new Error('Failed to fetch images: Invalid response from server');
    }
    
    // The API returns { statusCode: number, body: Image[], meta: { hasNextPage, ... } }
    const responseItems = Array.isArray(responseData.body) ? responseData.body : [];
    
    // Process new batch of images
    const newImages = responseItems.map((item: any) => ({
      src: item.url || item.Key,
      alt: item.key?.split('/').pop() || 'Wedding photo',
      key: item.ETag || item.key || Math.random().toString()
    }));
    
    // Append new images to existing ones
    images.value = [...images.value, ...newImages];
    
    // Update pagination state based on metadata
    if (responseData.meta) {
      hasMore.value = responseData.meta.hasNextPage;
      if (responseData.meta.hasNextPage) {
        page.value++;
      }
    } else {
      // Fallback to the old behavior if no metadata is present
      if (newImages.length >= perPage) {
        page.value++;
      } else {
        hasMore.value = false;
      }
    }
    
    retryCount.value = 0; // Reset retry count on success
  } catch (err: any) {
    console.error('Error fetching images:', err);
    error.value = err.message || 'Failed to load images';
    
    // Retry logic
    if (retryAttempt < MAX_RETRIES) {
      const delay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      setTimeout(() => fetchImages(retryAttempt + 1), delay);
      return;
    }
    
    retryCount.value = retryAttempt;
  } finally {
    isLoading.value = false;
    isFetching.value = false;
  }
};

// Handle scroll events for infinite loading
const handleScroll = () => {
  if (isLoading.value || isFetching.value || !hasMore.value) return;
  
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollThreshold = 200; // pixels from bottom to trigger load
  
  if (scrollY + windowHeight >= documentHeight - scrollThreshold) {
    fetchImages();
  }
};

// Screen size detection and update
const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
};

// Handle window resize
onMounted(() => {
  updateScreenWidth();
  window.addEventListener('resize', updateScreenWidth);
  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth);
  });
});

// Responsive grid layout
const gridTemplateColumns = computed(() => {
  return `repeat(${columns.value}, minmax(0, 1fr))`;
});

const selectedImage = ref<{ src: string; alt: string } | null>(null);
const isModalOpen = ref(false);

// Initial fetch when component mounts
onMounted(async () => {
  await nextTick(); // Wait for the DOM to be ready
  await fetchImages();
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', updateScreenWidth);
});

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', updateScreenWidth);
});

function openModal(image: { src: string; alt: string }) {
  selectedImage.value = image;
  isModalOpen.value = true;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  isModalOpen.value = false;
  document.body.style.overflow = '';
}

// Close modal on escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  window.addEventListener('keydown', handleEscape);
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape);
  });
});
</script>

<template>
  <div class="gallery-container">
    <div 
      class="gallery-grid" 
      :style="{ '--columns': columns, '--gap': '1rem' }"
    >
      <div
        v-for="(image, index) in images"
        :key="image.key || index"
        class="gallery-item"
        @click="openModal(image)"
      >
        <div class="aspect-w-1 aspect-h-1 w-full">
          <NuxtImg
            :src="image.src"
            :alt="image.alt"
            loading="lazy"
            class="gallery-image"
            format="webp"
            quality="80"
            :modifiers="{ fit: 'cover', gravity: 'center' }"
            sizes="sm:100vw md:50vw lg:33vw"
          />
        </div>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isFetching" class="loading-indicator">
      <div class="spinner"></div>
      <span>Loading more photos...</span>
    </div>
    
    <!-- End of results message -->
    <div v-else-if="!hasMore && images.length > 0" class="end-of-results">
      <span>All photos loaded</span>
    </div>

    <!-- Modal for full-size image -->
    <div 
      v-if="isModalOpen" 
      class="gallery-modal-overlay" 
      @click.self="closeModal"
      @click.stop
    >
      <div class="gallery-modal" @click.stop>
        <button 
          class="close-button" 
          @click="closeModal"
          aria-label="Close modal"
        >
          <font-awesome-icon icon="fa-solid fa-x" />
        </button>
        <div v-if="selectedImage" class="gallery-modal-content">
          <NuxtImg 
            :src="selectedImage.src" 
            :alt="selectedImage.alt" 
            loading="eager"
            class="gallery-modal-image"
            format="webp"
            quality="90"
            :modifiers="{ fit: 'contain' }"
            :sizes="'90vw'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import url("~/assets/css/photo-gallery.css");
</style>