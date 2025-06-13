<template>
    <div class="modal-overlay" @click="$emit('close-modal')">
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
import { AMAZON_URL, CASHAPP_URL, VENMO_URL } from '~/util/constants';
</script>


<style lang="css">
@import url("~/assets/css/modal.css");
</style>
