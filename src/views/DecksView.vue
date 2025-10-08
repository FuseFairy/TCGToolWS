<template>
  <div class="fill-height d-flex overflow-y-auto themed-scrollbar">
    <v-container class="h-100 pa-0">
      <v-row class="ma-0">
        <v-col v-for="(deck, key) in decodedDecks" :key="key" cols="6" sm="4" md="3">
          <DeckCard :deck="deck" :deckKey="key" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useDeckStore } from '@/stores/deck'
import { useDeckEncoder } from '@/composables/useDeckEncoder'
import DeckCard from '@/components/DeckCard.vue'

const deckStore = useDeckStore()
const { decodeDeck } = useDeckEncoder()

const decodedDecks = computed(() => {
  const decks = {}
  for (const key in deckStore.savedDecks) {
    const decoded = decodeDeck(key)
    if (decoded) {
      decks[key] = decoded
    }
  }
  return decks
})

onMounted(() => {
  deckStore.fetchDecks()
})
</script>

<style scoped></style>
