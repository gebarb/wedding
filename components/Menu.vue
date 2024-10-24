<template>
    <nav class="navbar">
        <button @click="toggleMenu" class="navbar-toggler">
            <font-awesome-icon icon="fa-solid fa-bars" class="navbar-toggle-icon" />
        </button>
        <div class="navbar-menu collapse" :class="{ 'show': isMobileMenuOpen }">
            <div class="navbar-nav">
                <NuxtLink class="nav-link" to="/">Home</NuxtLink>
                <NuxtLink class="nav-link" to="/faq">FAQ</NuxtLink>
                <NuxtLink class="nav-link" to="https://www.amazon.com" target="_blank">Registry</NuxtLink>
            </div>
        </div>
    </nav>
</template>

<script lang="ts">
export default {
    data() {
        return {
            isMobileMenuOpen: false,
        };
    },
    methods: {
        toggleMenu() {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
        },
    },
};
</script>

<style lang="css">
@import url("~/assets/css/menu.css");
</style>