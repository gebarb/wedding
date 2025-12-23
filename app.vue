<style>
@import url("https://fonts.googleapis.com/css2?family=Meow+Script&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");
</style>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator :throttle=0 :height=8 />
  <NuxtLayout>
    <Menu @open-modal="toggleModal"></Menu>
    <NuxtPage />
    <Footer @open-modal="toggleModal"></Footer>
  </NuxtLayout>
    <RegistryModal 
      v-if="showModal" 
      :is-open="showModal" 
      @close-modal="toggleModal" 
    />
</template>

<script setup lang="ts">
useHead({
  titleTemplate: "%s • Ebarb Wedding",
});
</script>

<script lang="ts">

export default {
  data() {
    return {
      showModal: false,
    }
  },
  methods: {
    toggleModal() {
      this.showModal = !this.showModal;
    },
  }
};
</script>