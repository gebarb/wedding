<template>
    <nav class="navbar">
        <button @click="toggleMenu" class="navbar-toggler">
            <font-awesome-icon icon="fa-solid fa-bars" class="navbar-toggler-icon" />
        </button>
        <div class="navbar-menu collapse" :class="{ 'show': isMobileMenuOpen }">
            <div class="navbar-nav">
                <NuxtLink class="nav-link" to="/">Home</NuxtLink>
                <!-- <NuxtLink class="nav-link" to="/save-the-date">Save The Date</NuxtLink> -->
                <!-- <NuxtLink class="nav-link" to="/faq">FAQ</NuxtLink> -->
                <NuxtLink class="nav-link" @click="$emit('open-modal')">Registry</NuxtLink>
                <!-- <NuxtLink class="nav-link" @click="navigate('/faq')" :to="theKnotUrl" target="_blank">RSVP</NuxtLink> -->
            </div>
        </div>
    </nav>
</template>

<script lang="ts">
import { THE_KNOT_URL } from '~/util/constants';

export default {
    data() {
        return {
            isMobileMenuOpen: false,
            theKnotUrl: THE_KNOT_URL
        };
    },
    methods: {
        toggleMenu() {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
        },
        navigate(path: string) {
            return navigateTo(path);
        }
    },
};
</script>

<style lang="css">
@import url("~/assets/css/menu.css");
</style>