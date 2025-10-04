<template>
  <aside class="d-flex flex-column flex-shrink-0" :style="{ paddingTop: `${smAndUp ? headerOffsetHeight + 18 : 0}px` }">
    <v-sheet :rounded="smAndUp ? '3md' : false" class="pa-4 ga-4 d-flex flex-column fill-height overflow-hidde">
      <div class="d-flex justify-space-between align-center mb-2">
        <h2 class="text-h6">当前卡组</h2>
        <v-chip pill>
          <v-icon start icon="mdi-cards-diamond-outline"></v-icon>
          {{ deckStore.totalCardCount }} / 50
        </v-chip>
      </div>
      <v-btn block color="error" variant="tonal" :disabled="deckStore.totalCardCount === 0" @click="deckStore.clearDeck"
        class="mb-2">
        清空牌组
      </v-btn>
      <v-btn-toggle v-model="activeMode" color="primary" variant="tonal" divided mandatory>
        <v-btn value="remove" class="flex-grow-1">
          <v-icon icon="mdi-minus"></v-icon>
        </v-btn>
        <v-btn value="none" class="flex-grow-1">
          <v-icon icon="mdi-cursor-default-click-outline"></v-icon>
        </v-btn>
        <v-btn value="add" class="flex-grow-1">
          <v-icon icon="mdi-plus"></v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-divider></v-divider>

      <div class="fill-height overflow-y-auto themed-scrollbar pl-4 pr-4" :class="`mode-${activeMode}`">
        <div v-if="deckStore.cardsInDeck.size === 0" class="text-center text-disabled mt-8">
          <v-icon size="48" icon="mdi-cards-outline"></v-icon>
          <p class="mt-2">尚未加入卡片</p>
        </div>

        <v-row v-else dense>
          <v-col v-for="[cardId, item] in deckStore.cardsInDeck" :key="cardId" cols="6" sm="4">
            <div class="card-container" @click="handleCardClick(item)">
              <div class="image-container">
                <v-img :src="useCardImage(item.card.cardIdPrefix, item.card.id).value" aspect-ratio="0.718" cover
                  class="rounded"></v-img>
                <div class="quantity-badge">{{ item.quantity }}</div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-sheet>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { useDeckStore } from '@/stores/deck';
import { useCardImage } from '@/composables/useCardImage';
import { useDisplay } from 'vuetify';

defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  }
});

const { smAndUp } = useDisplay();
const deckStore = useDeckStore();
const activeMode = ref('none'); // 'add', 'remove', 'none'

const handleCardClick = (item) => {
  if (!item) return;

  switch (activeMode.value) {
    case 'add':
      deckStore.addCard(item.card);
      break;
    case 'remove':
      deckStore.removeCard(item.card);
      break;
    default:
      // TODO
      break;
  }
};
</script>

<style scoped>
.card-container {
  position: relative;
  cursor: pointer;
}

.mode-add .card-container {
  cursor: crosshair;
}

.mode-remove .card-container {
  cursor: not-allowed;
}

.image-container {
  position: relative;
  border: 2px solid transparent;
  border-radius: 6px;
  transition: border-color 0.2s ease-in-out;
}

.quantity-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background-color: rgb(var(--v-theme-primary));
  color: white;
  border-radius: 12px;
  padding: 0 6px;
  font-size: 0.8rem;
  font-weight: bold;
  border: 2px solid white;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
