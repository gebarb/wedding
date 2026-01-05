<template>
  <ClientOnly>
    <div class="gallery-container">
      <!-- Gallery Header and Category Selector -->
      <div class="gallery-header">
        <h1 class="gallery-title">Our Gallery</h1>
        <div class="gallery-categories">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            class="gallery-category"
            :class="{'active': selectedCategory === category}"
          >
            {{ category }}
          </button>
        </div>
        
        <!-- Subcategories -->
        <div v-if="showSubcategories" class="gallery-subcategories">
          <button
            v-for="subcategory in categorySubcategories[selectedCategory!]"
            :key="subcategory"
            @click="selectedSubcategory = subcategory"
            class="gallery-subcategory"
            :class="{'active': selectedSubcategory === subcategory}"
          >
            {{ subcategory }}
          </button>
        </div>
      </div>
      
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
              :src="image.src"
              :alt="image.alt"
              loading="lazy"
              class="gallery-image"
              :class="{ 'opacity-0': !image.loaded }"
              @load="image.loaded = true"
            />
            <div v-if="!image.loaded" class="image-placeholder"></div>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <span>Loading photos...</span>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1" 
          class="pagination-button pagination-prev"
          :class="{ 'disabled': currentPage === 1 }"
          aria-label="Previous page"
        >
          <font-awesome-icon :icon="['fas', 'chevron-left']" />
        </button>
        
        <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage >= totalPages" 
          class="pagination-button pagination-next"
          :class="{ 'disabled': currentPage >= totalPages }"
          aria-label="Next page"
        >
          <font-awesome-icon :icon="['fas', 'chevron-right']" />
        </button>
      </div>

      <!-- Modal for full-size image -->
      <div 
        v-if="isModalOpen" 
        class="gallery-modal-overlay"
        :class="{ 'visible': isModalOpen }"
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
              @load="handleImageLoad"
            />
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

// State for images and pagination
const images = ref<Array<{src: string, alt: string, key: string, loaded: boolean}>>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoading = ref(true);

// Category and Subcategory types
type Category = 'Proposal' | 'Wedding' /*| 'Honeymoon'*/;

// Subcategory configuration
const categorySubcategories: Record<Category, string[] | null> = {
  'Proposal': null, // No subcategories for Proposal
  'Wedding': ['Ceremony', 'Reception', 'Dancing', 'Exit', 'Details', 'Bridal Party', 'First Look', 'Family', 'Portraits'],
  // 'Honeymoon': ['Positano', 'Rome', 'Florence']
};

// State
const categories = Object.keys(categorySubcategories) as Category[];
const selectedCategory = ref<Category | null>(null);
const selectedSubcategory = ref<string | null>(null);
const showSubcategories = computed(() => 
  selectedCategory.value && categorySubcategories[selectedCategory.value] !== null
);

// Modal state
const isModalOpen = ref(false);
const selectedImage = ref<{src: string, alt: string} | null>(null);
const isImageLoaded = ref(false);
const showLoading = ref(false);

// Responsive settings
const screenWidth = ref(process.client ? window.innerWidth : 0);
const isMobile = computed(() => screenWidth.value < 768);

const columns = computed(() => isMobile.value ? 2 : 3);
const perPage = computed(() => isMobile.value ? 4 : 6);

// Build the folder path based on selected category and subcategory
const getFolderPath = (category: Category, subcategory: string | null): string => {
  return subcategory 
    ? `${category.toLowerCase()}/${subcategory.replaceAll(' ', '-').toLowerCase()}`
    : category.toLowerCase();
};

// Fetch images with pagination
const fetchImages = async () => {
  isLoading.value = true;
  
  if (!selectedCategory.value) {
    images.value = [];
    totalPages.value = 0;
    isLoading.value = false;
    return;
  }
  
  // If category has subcategories but none is selected, don't fetch yet
  if (showSubcategories.value && !selectedSubcategory.value) {
    images.value = [];
    totalPages.value = 0;
    isLoading.value = false;
    return;
  }
  
  try {
    const response = await $fetch('/api/s3-images', {
      method: 'GET',
      query: { 
        folder: getFolderPath(selectedCategory.value, selectedSubcategory.value),
        page: currentPage.value,
        perPage: perPage.value
      },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    
    if (!response) {
      throw new Error('No response from server');
    }
    
    // Process images - handle both direct array response and wrapped response
    let items: any[] = [];
    let meta = { totalPages: 1 };
    
    if (Array.isArray(response)) {
      items = response;
      totalPages.value = Math.max(1, Math.ceil(items.length / perPage.value));
    } else if (response && typeof response === 'object') {
      // Handle response with body/meta structure
      items = Array.isArray((response as any).body) ? (response as any).body : [];
      if ((response as any).meta) {
        meta = (response as any).meta;
        totalPages.value = meta.totalPages || 1;
      } else {
        totalPages.value = Math.max(1, Math.ceil(items.length / perPage.value));
      }
    }
    
    images.value = items.map((item: any) => ({
      src: item.url || item.Key || item.src || '',
      alt: (item.key || item.alt || '').split('/').pop() || 'Wedding photo',
      key: item.ETag || item.key || Math.random().toString(),
      loaded: false
    }));
    isLoading.value = false;
  } catch (err) {
    // Silently handle errors without showing them in the UI
    console.error('Error fetching images:', err);
    // Clear any existing images on error
    images.value = [];
    // Keep loading state true to show the loading indicator
    isLoading.value = true;
  } finally {
    // Don't set isLoading to false in the finally block
    // We want to keep the loading state when there's an error
  }
};

// Pagination methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchImages();
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchImages();
  }
};

// Image dimensions for modal
const imageDimensions = ref<{width: number, height: number} | null>(null);

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

// Modal methods
const openModal = (image: { src: string, alt: string }) => {
  selectedImage.value = image;
  isModalOpen.value = true;
  isImageLoaded.value = false;
  showLoading.value = true;
  document.body.style.overflow = 'hidden';
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedImage.value = null;
  document.body.style.overflow = '';
};

const handleImageLoad = () => {
  isImageLoaded.value = true;
  showLoading.value = false;
};

// Debounce utility
const debounce = <F extends (...args: any[]) => void>(fn: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

// Watch for category changes
watch(selectedCategory, (newCategory) => {
  // Reset subcategory when category changes
  selectedSubcategory.value = null;
  // Reset to first page
  currentPage.value = 1;
  
  // Only fetch if the category doesn't have subcategories
  if (newCategory && !categorySubcategories[newCategory]) {
    fetchImages();
  } else {
    images.value = [];
    totalPages.value = 0;
  }
});

// Watch for subcategory changes
watch(selectedSubcategory, () => {
  if (selectedCategory.value) {
    currentPage.value = 1;
    fetchImages();
  }
});

// Update screen width with debounce
const updateScreenWidth = debounce(() => {
  if (process.client) {
    const newWidth = window.innerWidth;
    if (screenWidth.value !== newWidth) {
      screenWidth.value = newWidth;
    }
  }
}, 150);

// Lifecycle hooks
const handleResize = debounce(updateDimensions, 100);
const handleScreenResize = debounce(updateScreenWidth, 100);

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal();
  }
};

onMounted(() => {
  if (!process.client) return;
  
  // Initial screen width check and logging
  updateScreenWidth();
  
  updateDimensions();
  window.addEventListener('resize', handleResize);
  window.addEventListener('resize', handleScreenResize);
  document.addEventListener('keydown', handleEscape);
  
  // Initial fetch
  fetchImages();
});

onBeforeUnmount(() => {
  if (!process.client) return;
  
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('resize', handleScreenResize);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<style>
@import url("~/assets/css/photo-gallery.css");
</style>