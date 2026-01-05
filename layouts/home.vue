<template>
    <div class="background">
        <slot />
    </div>
</template>

<script setup lang="ts">
const title = ref("Home");

useHead({
    meta: [{ property: 'og:title', content: `Ebarb Wedding - ${title.value}` }],
    title: title.value
});
</script>

<style lang="css">
    @import url("~/assets/css/home.css");
</style>