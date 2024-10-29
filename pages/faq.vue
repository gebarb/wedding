<template>
    <div class="banner faq"></div>
    <div class="content">
        <h1>Frequently Asked Questions</h1>
        <hr class="rounded">
        <FaqItem v-for="faqItem in faq" :faqItem="faqItem" :key="faqItem.id">
        </FaqItem>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: "faq"
});

const faq = [
    { id: 1, question: "What Time Should I Arrive?", answer: "ANSWER" },
    { id: 2, question: "Where Can I Stay?", answer: "ANSWER" },
    { id: 3, question: "Are Kids Allowed?", answer: "ANSWER" },
    { id: 4, question: "How Should I RSVP?", answer: "ANSWER" },
    { id: 5, question: "Where Is The Registry?", answer: "ANSWER" },
    { id: 6, question: "Will The Wedding Be Indoors?", answer: "ANSWER" },
    { id: 7, question: "Will There Be Parking At The Venue?", answer: "ANSWER" },
    { id: 8, question: "What Is The Dress Code?", answer: "ANSWER" },
    { id: 9, question: "QUESTION", answer: "ANSWER" },
    { id: 10, question: "QUESTION", answer: "ANSWER" },
];
</script>
