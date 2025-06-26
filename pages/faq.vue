<template>
    <div>
        <div class="banner faq"></div>
        <div class="content">
            <h1>Frequently Asked Questions</h1>
            <hr class="rounded">
            <FaqItem v-for="faqItem in faq" :faqItem="faqItem" :key="faqItem.id"></FaqItem>
        </div>
    </div>
</template>

<script setup lang="ts">
import { AMAZON_URL, CASHAPP_URL, HILTON_URL, LINDSAY_URL, MARRIOTT_URL, THE_KNOT_URL, VENMO_URL } from '~/util/constants';


definePageMeta({
    layout: "faq"
});

const faq = [
    {
        id: 1,
        question: "What Time Should I Arrive?",
        answer: "We will begin seating guests at 5:30 PM.<br>The Ceremony will follow soon after at 6PM."
    },
    {
        id: 2,
        question: "Will The Wedding Be Indoors?",
        answer: "The Ceremony and Reception will be held indoors.<br>There will also be access to an outdoor patio and photo area."
    },
    {
        id: 3,
        question: "What Is The Dress Code?",
        answer: "The attire for the night will be Semi-Formal - think cocktail dresses and suit jackets."
    },
    {
        id: 4,
        question: "Can I Bring A Plus-One?",
        answer: "Due to constraints with space and planning, we can only accomodate guests recognized on the invitation and RSVP.<br>We appreciate your understanding."
    },
    {
        id: 5,
        question: "Are Children Invited?",
        answer: "While we love your children, the Ceremony and Reception will be an Adults Only celebration.<br>Thank you for making the necessary arrangements."
    },
    {
        id: 6,
        question: "How Should I RSVP?",
        answer: `You may RSVP via our website by clicking the <a href='${THE_KNOT_URL}' target='_blank'>RSVP</a> option in the menu.<br>Please indicate your name and attendance by filling out the form by August 1<sup>st</sup> 2025.`
    },
    {
        id: 7,
        question: "Where Is The Registry?",
        answer: `You may find our Registry by clicking the <a>Registry</a> option in the menu.<br>We welcome multiple gifting options to help us build our home and family - including cash, <a href='${CASHAPP_URL}' target='_blank'>CashApp</a>, <a href='${VENMO_URL}' target='_blank'>Venmo</a>, and <a href='${AMAZON_URL}' target='_blank'>Amazon</a>.`
    },
    {
        id: 8,
        question: "Where Can I Stay?",
        answer: `The Wedding Venue is located just a short distance off of I-35 in Gainesville, Texas.<br>We recommend one of the many reasonable accomodations nearby in Gainesville and Lindsay.<br>This includes <a href='${MARRIOTT_URL}' target='_blank'>Fairfield Inn & Suites</a>, <a href='${HILTON_URL}' target='_blank'>Hampton Inn & Suites</a>, <a href='${LINDSAY_URL}' target='_blank'>Lindsay Inn</a> or an AirBnB.`
    },
    {
        id: 9,
        question: "Will There Be Parking At The Venue?",
        answer: "There will be parking available in a large gravel lot.<br>However, please plan your trip responsibly."
    },
    {
        id: 10,
        question: "What's The Best Way To Get Home After The Reception?",
        answer: "We kindly ask that you plan your travel after the reception by carpooling with family or friends,<br>as rideshare options like Uber & Lyft will be limited in our small-town location."
    }
];
</script>
