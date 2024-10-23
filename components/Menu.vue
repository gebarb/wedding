<template>
    <nav class="navbar">
        <button @click="toggleMenu" class="navbar-toggler">
            <font-awesome-icon icon="fa-solid fa-bars" class="navbar-toggle-icon" />
        </button>
        <div class="navbar-menu collapse" :class="{ 'show': isMobileMenuOpen }">
            <div class="navbar-nav">
                <NuxtLink class="nav-link" to="/">Home</NuxtLink>
                <NuxtLink class="nav-link" to="/faq">FAQ</NuxtLink>
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