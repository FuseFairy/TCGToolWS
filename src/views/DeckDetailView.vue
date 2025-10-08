<template>
  <h1>Deck Detail View</h1>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const deckKey = route.params.key

console.log('Deck Key:', deckKey)
</script>

<style scoped></style>
