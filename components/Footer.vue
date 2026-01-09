<template>
    <div class="footer">
        <NuxtLink class="nav-link" to="/">Home</NuxtLink>
        <!-- <NuxtLink class="nav-link" to="/save-the-date">Save The Date</NuxtLink> -->
        <!-- <NuxtLink class="nav-link" to="/faq">FAQ</NuxtLink> -->
        <NuxtLink class="nav-link" @click="$emit('open-modal')">Registry</NuxtLink>
        <!-- <NuxtLink class="nav-link" :to="THE_KNOT_URL" target="_blank">RSVP</NuxtLink> -->
    </div>
</template>

<style lang="css">
@import url("~/assets/css/footer.css");
</style>