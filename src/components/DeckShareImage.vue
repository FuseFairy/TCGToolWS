<template>
  <div id="deck-share-image-content" class="share-content-for-screenshot">
    <div v-if="sortedAndFlatCardList.length > 0" class="card-grid">
      <div
        v-for="item in sortedAndFlatCardList"
        :key="`${item.id}-${item.cardIdPrefix}`"
        class="card-item"
      >
        <div class="card-container">
          <v-img
            :src="useCardImage(item.cardIdPrefix, item.id).value"
            :aspect-ratio="400 / 559"
            cover
            eager
          >
            <template #error>
              <v-img src="/placehold.webp" :aspect-ratio="400 / 559" cover />
            </template>
          </v-img>
          <div class="quantity-badge">{{ item.quantity }}</div>
        </div>
      </div>
    </div>
    <div v-else class="text-center d-flex align-center justify-center fill-height">N/A</div>
  </div>
</template>

<script setup>
import { useCardImage } from '@/composables/useCardImage.js'
import { computed } from 'vue'

const props = defineProps({
  deckCards: {
    type: Object,
    required: true,
  },
})

const sortedAndFlatCardList = computed(() => {
  if (!props.deckCards || props.deckCards.size === 0) {
    return []
  }

  const cardList = Object.values(props.deckCards)

  const getTypeOrder = (card) => {
    switch (card.type) {
      case '事件卡':
        return 1
      case '高潮卡':
        return 2
      default:
        return 0
    }
  }

  const parseLevel = (card) => {
    // 將 '-' 視為 0
    if (card.level === '-') return 0
    return parseInt(card.level, 10) || 0
  }

  return cardList.sort((a, b) => {
    const typeOrderA = getTypeOrder(a)
    const typeOrderB = getTypeOrder(b)
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB
    }

    // 在同類型卡片中，按 等級 (level) 由小到大
    const levelA = parseLevel(a)
    const levelB = parseLevel(b)
    if (levelA !== levelB) {
      return levelA - levelB
    }

    return a.id.localeCompare(b.id)
  })
})
</script>

<style scoped>
.share-content-for-screenshot {
  position: absolute;
  left: -9999px;
  top: -9999px;
  z-index: -1;
  width: 1024px;
  overflow: visible;
  box-sizing: border-box;
  background-color: rgb(255, 255, 255);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 24px 12px;
  padding: 16px;
}

.card-item {
  width: 100%;
}

.card-container {
  position: relative;
}

.quantity-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  padding: 0;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
