<template>
    <div>
        <div class="banner save-the-date"></div>
        <div class="content">
            <h1><i>Save The Date</i></h1>
            <br>
            <h2>Alessandra Rodriguez</h2>
            <h2>&</h2>
            <h2>Grayson Ebarb</h2>
            <hr class="rounded">
            <br>
            <h3>
                Saturday, September 13<sup>th</sup>, 2025 @ 6 PM
            </h3>
            <br>
            <h3>
                The Barn @ Wolf Ridge Farm
            </h3>
            <br>
            <h3>
                1467 FM 1200, Gainesville, TX 76240
            </h3>
            <br>
            <iframe class="google-map" allow="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                :src="GOOGLE_EMBED_URL"></iframe>
        </div>
    </div>
</template>

<script setup lang="ts">
import { GOOGLE_EMBED_URL } from '~/util/constants';

definePageMeta({
    layout: "home"
});
</script>
