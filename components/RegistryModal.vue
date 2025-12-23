<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close-modal')">
        <div class="modal" @click.stop>
            <div>
                <NuxtLink class="nav-link bold" :to="AMAZON_URL" target="_blank">Amazon</NuxtLink>
                <br>
                <NuxtLink class="nav-link bold" :to="CASHAPP_URL" target="_blank">CashApp</NuxtLink>
                <br>
                <NuxtLink class="nav-link bold" :to="VENMO_URL" target="_blank">Venmo</NuxtLink>
                <div class="close" @click="$emit('close-modal')">
                    <font-awesome-icon icon="fa-solid fa-x" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { AMAZON_URL, CASHAPP_URL, VENMO_URL } from '~/util/constants';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close-modal']);

// Close modal on escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close-modal');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape);
});
</script>

<style lang="css">
@import url("~/assets/css/modal.css");
</style>
