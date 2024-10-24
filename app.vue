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
