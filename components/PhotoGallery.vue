<template>
  <ClientOnly>
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
            <img
              v-if="image.loaded"
              :src="image.src"
              :alt="image.alt"
              loading="lazy"
              class="gallery-image"
              format="webp"
              quality="65"
              :modifiers="{ 
                fit: 'cover', 
                gravity: 'center',
                width: isMobile ? 400 : 800,
                height: isMobile ? 400 : 800
              }"
              :sizes="isMobile ? '100vw' : '33vw'"
              @load="image.loaded = true"
            />
            <div v-else class="image-placeholder"></div>
          </div>
        </div>
      </div>

      <!-- Loading indicator and sentinel -->
      <div v-if="isFetching" class="loading-indicator">
        <div class="spinner"></div>
        <span>Loading more photos...</span>
      </div>
      
      <!-- End of results message -->
      <div v-else-if="!hasMore && images.length > 0" class="end-of-results">
        <span>All photos loaded</span>
      </div>
      
      <!-- Intersection observer target -->
      <div ref="sentinel" class="h-1 w-full"></div>

      <!-- Modal for full-size image -->
      <div 
        v-if="isModalOpen" 
        class="gallery-modal-overlay"
        :class="{ 'visible': isModalOpen }"
        @click.self="closeModal"
        @click.stop
      >
        <div class="gallery-modal" :class="{ 'visible': isModalOpen }" @click.stop>
          <button 
            class="close-button" 
            @click="closeModal"
            aria-label="Close modal"
          >
            <font-awesome-icon icon="fa-solid fa-x" />
          </button>
          <div v-if="selectedImage" class="gallery-modal-content">
            <transition name="fade">
              <div v-if="showLoading" class="image-loading">
                <div class="spinner"></div>
                <span>Loading image...</span>
              </div>
            </transition>
            <img 
              :key="selectedImage.src"
              :src="selectedImage.src" 
              :alt="selectedImage.alt"
              class="gallery-modal-image"
              :class="{ 'opacity-0': !isImageLoaded }"
              loading="eager"
              decoding="async"
              format="webp"
              quality="85"
              :modifiers="{
                fit: 'contain',
                ...(imageDimensions?.value || { width: 800, height: 600 })
              }"
              :sizes="'90vw'"
              @load="handleImageLoad"
            />
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
const { $img } = useNuxtApp();
const config = useRuntimeConfig();

// State for images and loading
const images = ref<Array<{src: string, alt: string, key: string, loaded: boolean}>>([]);

// Image dimensions for modal
const imageDimensions = ref<{width: number, height: number} | null>(null);

// Update image dimensions
const updateDimensions = () => {
  if (process.client) {
    imageDimensions.value = {
      width: Math.min(window.innerWidth * 0.9, 1200),
      height: Math.min(window.innerHeight * 0.9, 800)
    };
  } else {
    imageDimensions.value = { width: 800, height: 600 };
  }
};

// Moved cleanup to onBeforeUnmount
const isLoading = ref(true);
const isFetching = ref(false);
const hasMore = ref(true);
const error = ref<string | null>(null);
const retryCount = ref(0);
const MAX_RETRIES = 3;
const page = ref(1);

// Responsive settings with client-side only initialization
const screenWidth = ref(process.client ? window.innerWidth : 0);
const isMobile = computed(() => screenWidth.value < 768);
const columns = computed(() => isMobile.value ? 1 : 3);
const perPage = computed(() => isMobile.value ? 4 : 6); // Smaller batch for mobile

// Debounce utility
const debounce = (fn: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

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
    
    // Process new batch of images with lazy loading
    const newImages = responseItems.map((item: any) => ({
      src: item.url || item.Key,
      alt: item.key?.split('/').pop() || 'Wedding photo',
      key: item.ETag || item.key || Math.random().toString(),
      loaded: false
    }));
    
    // Mark first few images as loaded immediately
    newImages.slice(0, perPage.value).forEach(img => { img.loaded = true; });
    
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
    error.value = err.message || 'Failed to load images';
    
    // Retry logic
    if (retryAttempt < MAX_RETRIES) {
      const delay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
      setTimeout(() => fetchImages(retryAttempt + 1), delay);
      return;
    }
    
    retryCount.value = retryAttempt;
  } finally {
    isLoading.value = false;
    isFetching.value = false;
  }
};

// Intersection Observer for infinite scroll
const observer = ref<IntersectionObserver | null>(null);
const sentinel = ref<HTMLElement | null>(null);

// Debounced scroll handler
const handleScroll = debounce(() => {
  if (isLoading.value || isFetching.value || !hasMore.value || !sentinel.value) return;
  
  const sentinelRect = sentinel.value.getBoundingClientRect();
  const isInViewport = (
    sentinelRect.top <= (window.innerHeight || document.documentElement.clientHeight) + 500
  );
  
  if (isInViewport) {
    fetchImages();
  }
}, 200);

// Update screen width with debounce
const updateScreenWidth = debounce(() => {
  if (process.client) {
    screenWidth.value = window.innerWidth;
  }
}, 150);

// Setup intersection observer
const setupObserver = () => {
  if (process.client) {
    // Make sure we have the sentinel element
    sentinel.value = document.querySelector('.gallery-container')?.lastElementChild as HTMLElement;
    
    if (sentinel.value) {
      // Disconnect any existing observer
      if (observer.value) {
        observer.value.disconnect();
      }

      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !isFetching.value && hasMore.value) {
              fetchImages().catch(() => {});
            }
          });
        },
        {
          root: null,
          rootMargin: '200px 0px',
          threshold: 0.01
        }
      );

      observer.value.observe(sentinel.value);
    }
  }
};

// Responsive grid layout
const gridTemplateColumns = computed(() => {
  return `repeat(${columns.value}, minmax(0, 1fr))`;
});

const selectedImage = ref<{ src: string; alt: string } | null>(null);
const isModalOpen = ref(false);
const isImageLoaded = ref(false);
const showLoading = ref(false);
const imageCache = ref<Record<string, HTMLImageElement>>({});
const CACHE_SIZE_LIMIT = 20; // Limit cache size to prevent memory issues
let loadStartTime = 0;
const MIN_LOADING_TIME = 300; // Minimum time to show loading indicator in ms

// Modal functions
function cleanupCache() {
  const cache = imageCache.value;
  const keys = Object.keys(cache);
  
  // If cache exceeds limit, remove the oldest entries
  if (keys.length > CACHE_SIZE_LIMIT) {
    const toRemove = keys.length - CACHE_SIZE_LIMIT;
    for (let i = 0; i < toRemove; i++) {
      const key = keys[i];
      if (cache[key]?.src) {
        URL.revokeObjectURL(cache[key].src);
      }
      delete cache[key];
    }
  }
}

function openModal(image: { src: string; alt: string }) {
  // Set selected image and open modal immediately
  selectedImage.value = image;
  isModalOpen.value = true;
  isImageLoaded.value = false;
  showLoading.value = true;
  loadStartTime = Date.now();
  
  // Clean up cache before adding new images
  cleanupCache();
  
  // Check if image is already in cache
  if (imageCache.value[image.src]) {
    const img = imageCache.value[image.src];
    if (img.complete) {
      handleImageLoad();
    } else {
      img.onload = handleImageLoad;
      img.onerror = () => {
        console.error('Failed to load cached image:', image.src);
        isImageLoaded.value = true;
        showLoading.value = false;
      };
    }
  } else {
    // Preload the image
    const img = new Image();
    img.src = image.src;
    img.onload = () => {
      // Only cache if we're still on the same image
      if (selectedImage.value?.src === image.src) {
        imageCache.value[image.src] = img;
        handleImageLoad();
      }
    };
    
    // Handle image loading errors
    img.onerror = () => {
      console.error('Failed to load image:', image.src);
      isImageLoaded.value = true;
      showLoading.value = false;
    };
  }
  
  if (process.client) {
    document.body.style.overflow = 'hidden';
  }
}

function handleImageLoad() {
  const loadTime = Date.now() - loadStartTime;
  const remainingTime = Math.max(0, MIN_LOADING_TIME - loadTime);
  
  setTimeout(() => {
    isImageLoaded.value = true;
    // Keep loading indicator for a bit after image is loaded for better UX
    setTimeout(() => {
      showLoading.value = false;
    }, 200);
  }, remainingTime);
}

function closeModal() {
  // Only reset the modal state, keep the cache
  isModalOpen.value = false;
  if (process.client) {
    document.body.style.overflow = '';
  }
  // Don't clear the selected image immediately to allow for smooth transitions
  setTimeout(() => {
    selectedImage.value = null;
    isImageLoaded.value = false;
  }, 300); // Match this with your CSS transition duration
}

// Lifecycle hooks
const handleResize = debounce(updateDimensions, 100);
const handleScreenResize = debounce(updateScreenWidth, 100);

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal();
  }
};

onMounted(() => {
  if (!process.client) return;
  
  updateDimensions();
  window.addEventListener('resize', handleResize);
  window.addEventListener('resize', handleScreenResize);
  window.addEventListener('keydown', handleEscape);
  
  // Small delay to ensure DOM is fully rendered
  nextTick(() => {
    setupObserver();
    fetchImages().then(() => {
      nextTick(setupObserver);
    });
  });
});

// Proper cleanup
onBeforeUnmount(() => {
  if (!process.client) return;
  
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('resize', handleScreenResize);
  window.removeEventListener('keydown', handleEscape);
  
  if (observer.value) {
    observer.value.disconnect();
    observer.value = null;
  }
  
  // Clear image cache to free up memory
  Object.values(imageCache.value).forEach(img => {
    if (img && img.src) {
      URL.revokeObjectURL(img.src);
    }
  });
  imageCache.value = {};
});
</script>

<style>
@import url("~/assets/css/photo-gallery.css");
</style>