<script setup lang="ts">
const title = ref("Gallery");

useHead({
    meta: [{ property: 'og:title', content: `Ebarb Wedding - ${title}` }],
    title: title
});

definePageMeta({
    layout: "gallery"
});
</script>

<template>
  <div class="gallery-page">
    <PhotoGallery />
  </div>
</template>
