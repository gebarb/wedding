<script setup lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

library.add(faBars);
</script>

<template>
    <nav class="navbar">
        <button @click="toggleMenu" class="navbar-toggler">
            <FontAwesomeIcon icon="fa-bars" class="navbar-toggle-icon"></FontAwesomeIcon>
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