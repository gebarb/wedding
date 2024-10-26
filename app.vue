<style>
@import url("https://fonts.googleapis.com/css2?family=Meow+Script&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");
</style>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator :throttle=0 :height=8 />
    <NuxtLayout>
      <Menu></Menu>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
