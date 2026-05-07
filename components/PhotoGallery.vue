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
        <NuxtLink
          v-for="(image, index) in images"
          :key="image.key || index"
          :to="image.src"
          target="_blank"
          rel="noopener noreferrer"
          class="gallery-item"
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
        </NuxtLink>
      </div>

      <!-- No images found splash message -->
      <div v-if="noImagesFound" class="no-images-found">
        <div class="no-images-icon">
          <font-awesome-icon :icon="['fas', 'image']" />
        </div>
        <h3>No photos found</h3>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <span>Loading photos...</span>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button 
          @click="firstPage" 
          :disabled="currentPage === 1" 
          class="pagination-button pagination-first"
          :class="{ 'disabled': currentPage === 1 }"
          aria-label="First page"
        >
          <font-awesome-icon :icon="['fas', 'angles-left']" />
        </button>
        
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
        
        <button 
          @click="lastPage" 
          :disabled="currentPage === totalPages" 
          class="pagination-button pagination-last"
          :class="{ 'disabled': currentPage === totalPages }"
          aria-label="Last page"
        >
          <font-awesome-icon :icon="['fas', 'angles-right']" />
        </button>
      </div>

    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// State for images and pagination
const images = ref<Array<{src: string, alt: string, key: string, loaded: boolean}>>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoading = ref(true);

// Router access for URL state management
const route = useRoute();
const router = useRouter();

// Flag to prevent URL updates during initialization
const isInitializing = ref(true);

// Category and Subcategory types
type Category = 'Proposal' | 'Wedding' | 'Honeymoon';

// Subcategory configuration
const categorySubcategories: Record<Category, string[] | null> = {
  'Proposal': null, // No subcategories for Proposal
  'Wedding': ['Ceremony', 'Reception', 'Dancing', 'Exit', 'Details', 'Bridal Party', 'First Look', 'Family', 'Portraits'],
  'Honeymoon': ['Pompeii', 'Positano & Capri', 'Rome', 'Vatican', 'Colosseum', 'Tuscany', 'Florence']
};

// State
const categories = Object.keys(categorySubcategories) as Category[];
const selectedCategory = ref<Category | null>(null);
const selectedSubcategory = ref<string | null>(null);
const showSubcategories = computed(() => 
  selectedCategory.value && categorySubcategories[selectedCategory.value] !== null
);

// URL state management functions
const updateURL = () => {
  // Skip URL updates during initialization to prevent overwriting URL state
  if (isInitializing.value) return;
  
  const query: Record<string, string> = {};
  
  if (selectedCategory.value) {
    const categoryIndex = categories.indexOf(selectedCategory.value);
    if (categoryIndex !== -1) {
      query.c = categoryIndex.toString();
    }
  }
  
  if (selectedSubcategory.value && selectedCategory.value) {
    const subcategories = categorySubcategories[selectedCategory.value];
    if (subcategories) {
      const subcategoryIndex = subcategories.indexOf(selectedSubcategory.value);
      if (subcategoryIndex !== -1) {
        query.s = subcategoryIndex.toString();
      }
    }
  }
  
  if (currentPage.value > 1) {
    query.p = currentPage.value.toString();
  }
  
  router.replace({ query });
};

// URL parameter parsing functions
const parseCategoryFromURL = (query: any) => {
  let categoryIndex = 0; // Default to index 0
  if (query.c && typeof query.c === 'string') {
    const parsedIndex = parseInt(query.c, 10);
    if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < categories.length) {
      categoryIndex = parsedIndex;
    } else {
      categoryIndex = 0;
    }
  }
  return categories[categoryIndex];
};

const parseSubcategoryFromURL = (query: any, category: Category) => {
  let subcategoryFromURL: string | null = null; // Default to user selection
  if (query.s && typeof query.s === 'string') {
    const subcategoryIndex = parseInt(query.s, 10);
    const subcategories = categorySubcategories[category];
    
    if (subcategories && subcategories.length > 0) {
      if (!isNaN(subcategoryIndex) && subcategoryIndex >= 0 && subcategoryIndex < subcategories.length) {
        subcategoryFromURL = subcategories[subcategoryIndex];
      } else {
        subcategoryFromURL = null;
      }
    } else {
      // Category has no subcategories
      subcategoryFromURL = null;
    }
  }
  return subcategoryFromURL;
};

const parsePageFromURL = (query: any) => {
  let pageFromURL = 1; // Default to page 1
  if (query.p && typeof query.p === 'string') {
    const page = parseInt(query.p, 10);
    if (!isNaN(page) && page > 0 && page <= 10000) { // Large upper bound for basic validation
      pageFromURL = page;
    } else {
      pageFromURL = 1;
    }
  }
  return pageFromURL;
};

// Validation functions
const validatePageSubcategoryDependency = (page: number, category: Category, subcategory: string | null) => {
  const categoryHasSubcategories = categorySubcategories[category] !== null;
  if (page > 1 && categoryHasSubcategories && !subcategory) {
    return { page: 1, subcategory: null };
  }
  return { page, subcategory };
};

const initializeFromURL = () => {
  const query = route.query;
  
  // Parse URL parameters
  const category = parseCategoryFromURL(query);
  const subcategory = parseSubcategoryFromURL(query, category);
  const page = parsePageFromURL(query);
  
  // Validate page-subcategory dependency
  const validatedState = validatePageSubcategoryDependency(page, category, subcategory);
  
  // Set final values
  selectedCategory.value = category;
  selectedSubcategory.value = validatedState.subcategory;
  currentPage.value = validatedState.page;
};

// Responsive settings
const screenWidth = ref(process.client ? window.innerWidth : 0);
const isMobile = computed(() => screenWidth.value < 768);

const columns = computed(() => isMobile.value ? 2 : 3);
const perPage = computed(() => isMobile.value ? 6 : 9);

// Computed property to detect when no images are found
const noImagesFound = computed(() => {
  return !isLoading.value && images.value.length === 0 && selectedCategory.value && (!showSubcategories.value || selectedSubcategory.value);
});

// Build the folder path based on selected category and subcategory
const getFolderPath = (category: Category, subcategory: string | null): string => {
  return subcategory 
    ? `${category.toLowerCase()}/${subcategory.replaceAll(' & ', '-').replaceAll(' ', '-').toLowerCase()}`
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
    
    // Validate page number against total pages after fetch
    if (currentPage.value > totalPages.value) {
      currentPage.value = 1;
      updateURL();
      // Re-fetch with corrected page
      fetchImages();
      return;
    }
    
    isLoading.value = false;
  } catch (err) {
    // Silently handle errors without showing them in the UI
    console.error('Error fetching images:', err);
    images.value = [];
    isLoading.value = true;
  }
};

// Pagination methods
const firstPage = () => {
  if (currentPage.value > 1) {
    currentPage.value = 1;
    fetchImages();
  }
};

const lastPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value = totalPages.value;
    fetchImages();
  }
};

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

// Debounce utility
const debounce = <F extends (...args: any[]) => void>(fn: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

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
const handleScreenResize = debounce(() => {
  if (process.client) {
    screenWidth.value = window.innerWidth;
  }
}, 100);

onMounted(() => {
  if (!process.client) return;
  
  // Initial screen width check and logging
  updateScreenWidth();
  
  window.addEventListener('resize', handleScreenResize);
  
  // Initialize state from URL
  initializeFromURL();
  
  // Allow URL updates after initialization is complete
  nextTick(() => {
    isInitializing.value = false;
    
    // Force immediate fetch if we have a valid state after initialization
    // This ensures state is properly synchronized before checking conditions
    setTimeout(() => {
      const hasValidState = selectedCategory.value && (!categorySubcategories[selectedCategory.value] || selectedSubcategory.value);
      const categoryHasSubcategories = selectedCategory.value ? categorySubcategories[selectedCategory.value] !== null : false;
      const pageSpecifiedWithoutSubcategory = categoryHasSubcategories && !selectedSubcategory.value && currentPage.value > 1;
      
      if (hasValidState && !pageSpecifiedWithoutSubcategory) {
        fetchImages();
      } else {
        // No valid state - ensure loading is false to prevent spinner
        isLoading.value = false;
      }
    }, 0); // Small delay to ensure state is synchronized
  });
});

onBeforeUnmount(() => {
  if (!process.client) return;
  
  window.removeEventListener('resize', handleScreenResize);
});

// Watch for category changes
watch(selectedCategory, (newCategory) => {
  // Skip during initialization to prevent overwriting URL state
  if (isInitializing.value) return;
  
  // Reset subcategory when category changes
  selectedSubcategory.value = null;
  // Reset to first page
  currentPage.value = 1;
  
  // Update URL
  updateURL();
  
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
  // Skip during initialization to prevent overwriting URL state
  if (isInitializing.value) return;
  
  if (selectedCategory.value) {
    currentPage.value = 1;
    updateURL();
    fetchImages();
  }
});

// Watch for page changes
watch(currentPage, () => {
  updateURL();
  if (selectedCategory.value && (!showSubcategories.value || selectedSubcategory.value)) {
    fetchImages();
  }
});

// Initial fetch after all state is set up
watch([selectedCategory, selectedSubcategory], () => {
  if (selectedCategory.value && (!showSubcategories.value || selectedSubcategory.value)) {
    fetchImages();
  }
}, { immediate: true });
</script>

<style>
@import url("~/assets/css/photo-gallery.css");
</style>