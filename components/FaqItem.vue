<template>
    <h3>{{ faqItem.question }}</h3>
    <p>{{ faqItem.answer }}</p>
    <br>
</template>

<script setup lang="ts">

const props = defineProps({
    faqItem: {
        type: Object,
        required: true,
    },
});

const { faqItem } = props;

</script>