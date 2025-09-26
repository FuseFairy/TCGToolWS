<template>
  <div v-if="cards.length === 0" class="text-center text-grey mt-4"
    :style="{ paddingTop: `${headerOffsetHeight - 10}px` }">
    {{ emptyText }}
  </div>

  <v-infinite-scroll v-else ref="infiniteScrollRef" @load="load" empty-text="" :margin="margin" :class="$attrs.class">
    <v-row class="ma-0 flex-grow-0" :style="{ paddingTop: `${headerOffsetHeight - 10}px` }">
      <v-col v-for="card in displayedCards" :key="card.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
        <CardTemplate :card="card" @show-details="onShowDetails" />
      </v-col>
    </v-row>
  </v-infinite-scroll>

  <v-dialog v-if="selectedCardData" v-model="isModalVisible" :max-width="smAndDown ? '100%' : '60%'"
    :max-height="smAndDown ? '80%' : '60%'">
    <CardDetailModal :card="selectedCardData.card" :img-url="selectedCardData.imageUrl"
      :linked-cards="selectedLinkedCards" @close="isModalVisible = false" @show-new-card="onShowNewCard" />
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';
import CardTemplate from '@/components/CardTemplate.vue';
import CardDetailModal from '@/components/CardDetailModal.vue';

const props = defineProps({
  cards: {
    type: Array,
    required: true,
  },
  allCards: {
    type: Array,
    required: true,
  },
  itemsPerLoad: {
    type: Number,
    default: 24,
  },
  emptyText: {
    type: String,
    default: '~没有更多卡片~',
  },
  margin: {
    type: [String, Number],
    default: 300,
  },
  headerOffsetHeight: {
    type: Number,
    default: 0
  }
});

const { smAndDown } = useDisplay();
const isModalVisible = ref(false);
const selectedCardData = ref(null);

const allCardsMap = computed(() => new Map(props.allCards.map(c => [c.id, c])));
const selectedLinkedCards = computed(() => {
  if (!selectedCardData.value?.card?.link) return [];
  const linkIds = selectedCardData.value.card.link ?? [];
  return linkIds.map(linkId => allCardsMap.value.get(linkId)).filter(Boolean);
});

const onShowDetails = (payload) => {
  selectedCardData.value = payload;
  isModalVisible.value = true;
};

const onShowNewCard = (payload) => {
  selectedCardData.value = payload;
};

const page = ref(1);
const infiniteScrollRef = ref(null);

const displayedCards = computed(() => props.cards.slice(0, page.value * props.itemsPerLoad));

const load = async ({ done }) => {
  if (displayedCards.value.length >= props.cards.length) {
    return done('empty');
  }
  await new Promise(resolve => setTimeout(resolve, 150));
  page.value++;
  done('ok');
};

const reset = () => {
  page.value = 1;
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset();
  }
};

defineExpose({
  reset,
});
</script>
