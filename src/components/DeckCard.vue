<template>
  <v-hover v-slot="{ isHovering, props }">
    <div v-bind="props" class="position-relative">
      <v-card
        :to="{ name: 'DeckDetail', params: { key: deckKey } }"
        variant="flat"
        rounded="3md"
        class="deck-card"
        :class="{ 'is-lifted': isHovering && !isTouch }"
      >
        <v-skeleton-loader
          v-if="!imageUrl"
          class="w-100"
          style="aspect-ratio: 1"
        ></v-skeleton-loader>
        <v-img
          :src="imageUrl"
          class="align-end"
          style="transform: scale(1.1)"
          aspect-ratio="1"
          cover
          position="top"
        >
          <div class="title-background"></div>
          <v-card-text class="text-h6 position-relative text-white" style="z-index: 1">
            {{ deck.name }}
          </v-card-text>
        </v-img>
      </v-card>

      <v-scale-transition>
        <div v-show="(isHovering || isTouch) && imageUrl" class="delete-btn-container">
          <v-btn
            icon="mdi-trash-can-outline"
            size="large"
            variant="text"
            color="pink-accent-3"
            @click.prevent="handleDeleteDeck"
          ></v-btn>
        </div>
      </v-scale-transition>
    </div>
  </v-hover>
</template>

<script setup>
import { computed } from 'vue'
import { useCardImage } from '@/composables/useCardImage'
import { useDeckStore } from '@/stores/deck'
import { useDevice } from '@/composables/useDevice'

const props = defineProps({
  deck: {
    type: Object,
    required: true,
  },
  deckKey: {
    type: String,
    required: true,
  },
})

const deckStore = useDeckStore()
const { isTouch } = useDevice()

const coverCard = computed(() => {
  const cards = props.deck?.cards || {}
  const cardsArray = Object.values(cards)
  return cardsArray.find((card) => card.id === props.deck?.coverCardId) || null
})

const imageUrl = useCardImage(
  computed(() => coverCard.value.cardIdPrefix),
  computed(() => coverCard.value.id)
)

async function handleDeleteDeck() {
  if (window.confirm(`确定要删除卡组 "${props.deck.name}" 吗？`)) {
    await deckStore.deleteDeck(props.deckKey)
  }
}
</script>

<style scoped>
.deck-card {
  transition: transform 0.2s ease-in-out;
  overflow: hidden;
}

.deck-card.is-lifted {
  transform: translateY(-6px);
}

.delete-btn-container {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 2;
}

.title-background {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 20%, transparent 100%);
  pointer-events: none;
}
</style>
