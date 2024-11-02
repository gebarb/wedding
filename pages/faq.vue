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
    {
        id: 1,
        question: "What Time Should I Arrive?",
        answer: "We will begin seating guests at 5:30 PM.<br>The Ceremony will follow soon after at 6PM."
    },
    {
        id: 2,
        question: "Where Can I Stay?",
        answer: "The Wedding Venue is located just a short distance off of I-35 in Gainesville, Texas.<br>We recommend one of the many reasonable accomodations nearby in Gainesville and Lindsay such as <a href='https://www.marriott.com/en-us/hotels/glefi-fairfield-inn-and-suites-gainesville-i-35/overview/' target='_blank'>Fairfield Inn & Suites</a>, <a href='https://www.hilton.com/en/hotels/gvitxhx-hampton-suites-gainesville/' target='_blank'>Hampton Inn & Suites</a>, or an AirBnB."
    },
    {
        id: 3,
        question: "Are Children Invited?",
        answer: "While we love your children, the Ceremony and Reception will be an Adults Only celebration.<br>Thank you for making the necessary arrangements."
    },
    // {
    //     id: 4,
    //     question: "How Should I RSVP?",
    //     answer: "You may RSVP via our website by clicking the <a href='https://www.google.com' target='_blank'>RSVP</a> option in the menu.<br>Please indicate your name and attendance by filling out the form by August 1<sup>st</sup> 2025."
    // },
    // {
    //     id: 5,
    //     question: "Where Is The Registry?",
    //     answer: "You may find our Registry by clicking the <a href='https://www.amazon.com' target='_blank'>Registry</a> option in the menu.<br>We also welcome other gifting options, including cash."
    // },
    {
        id: 6,
        question: "Will The Wedding Be Indoors?",
        answer: "The Ceremony and Reception will be held indoors.<br>There will also be access to an outdoor patio and photo area."
    },
    {
        id: 7,
        question: "Will There Be Parking At The Venue?",
        answer: "There will be parking available in a large gravel lot.<br>However, please plan your trip responsibly."
    },
    {
        id: 8,
        question: "What Is The Dress Code?",
        answer: "The attire for the night will be Semi-Formal - think cocktail dresses and suit jackets."
    },
    {
        id: 9,
        question: "Can I Bring A Plus-One?",
        answer: "Due to constraints with space and planning, we can only accomodate guests recognized on the invitation and RSVP.<br>We appreciate your understanding."
    },
];
</script>
