<template>
  <v-container v-if="cards.length === 0" class="d-flex align-center justify-center text-grey h-100 w-100" :="$attrs">
    {{ emptyText }}
  </v-container>

  <v-infinite-scroll v-else ref="infiniteScrollRef" @load="load" empty-text="" :margin="margin" :="$attrs">
    <v-row class="ma-0 flex-grow-0" :style="{ paddingTop: `${headerOffsetHeight - 10}px` }">
      <v-col v-for="card in displayedCards" :key="card.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
        <CardTemplate :card="card" @show-details="onShowDetails" />
      </v-col>
    </v-row>
  </v-infinite-scroll>

  <v-dialog v-if="selectedCardData" v-model="isModalVisible" :max-width="smAndDown ? '100%' : '60%'"
    :max-height="smAndDown ? '80%' : '95%'" :min-height="smAndDown ? null : '60%'">
    <CardDetailModal :card="selectedCardData.card" :img-url="selectedCardData.imageUrl"
      :linked-cards="selectedLinkedCards" :is-loading-links="isLoadingLinks" @close="isModalVisible = false"
      @show-new-card="onShowNewCard" />
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';
import CardTemplate from '@/components/CardTemplate.vue';
import CardDetailModal from '@/components/CardDetailModal.vue';
import { fetchCardsByBaseIdAndPrefix } from '@/composables/card-api';

const props = defineProps({
  cards: {
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
const selectedLinkedCards = ref([]);
const isLoadingLinks = ref(false);

const fetchLinkedCards = async (card) => {
  if (!card?.link || card.link.length === 0) {
    selectedLinkedCards.value = [];
    return;
  }

  try {
    isLoadingLinks.value = true;

    // sanitize all link IDs to get clean base IDs.
    const baseIds = [...new Set(card.link.map(linkId => linkId.replace(/[a-zA-Z]+$/, '')))]
    const linkRequests = baseIds.map(baseId =>
      fetchCardsByBaseIdAndPrefix(baseId, card.cardIdPrefix)
    );

    const linkedCardsData = await Promise.all(linkRequests);
    selectedLinkedCards.value = linkedCardsData.flat().filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch linked cards:", error);
    selectedLinkedCards.value = [];
  } finally {
    isLoadingLinks.value = false;
  }
};

const onShowDetails = async (payload) => {
  selectedCardData.value = payload;
  isModalVisible.value = true;
  await fetchLinkedCards(payload.card);
};

const onShowNewCard = async (payload) => {
  selectedCardData.value = payload;
  await fetchLinkedCards(payload.card);
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
