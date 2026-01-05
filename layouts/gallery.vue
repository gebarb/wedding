<template>
  <div class="background">
    <slot />
  </div>
</template>

<script setup lang="ts">
const title = ref("Gallery");

useHead({
  meta: [{ property: 'og:title', content: `Ebarb Wedding - ${title.value}` }],
  title: title.value
});
</script>

<style lang="css">
    @import url("~/assets/css/gallery.css");
</style>