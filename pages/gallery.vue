<script setup lang="ts">
  const title = ref("Gallery");

useHead({
    meta: [{ property: 'og:title', content: `Ebarb Wedding - ${title}` }],
    title: title
});

definePageMeta({
    layout: "gallery"
});

// Import images directly
import img1 from '~/assets/img/Grand_Marlin_Proposal-3.jpg';
import img2 from '~/assets/img/Grand_Marlin_Proposal-4.jpg';
import img3 from '~/assets/img/Grand_Marlin_Proposal-63.jpg';
import img4 from '~/assets/img/IMG_0753.jpg';

// Sample images - replace with your actual images
const galleryImages = [
  {
    src: img1,
    alt: 'Beautiful moment from our proposal at The Grand Marlin'
  },
  {
    src: img2,
    alt: 'Another special moment from our proposal'
  },
  {
    src: img3,
    alt: 'Celebrating our engagement'
  },
  {
    src: img4,
    alt: 'A wonderful memory together'
  },
  // Add more images as needed
];
</script>

<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <h1>Our Gallery</h1>
      <p class="subtitle">Proposal</p>
    </div>
    
    <PhotoGallery :images="galleryImages" />
  </div>
</template>
