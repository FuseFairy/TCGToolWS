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

  <v-dialog v-if="selectedCardData" v-model="isModalVisible" max-width="1000px">
    <CardDetailModal :card="selectedCardData.card" :img-url="selectedCardData.imageUrl" :series-id="seriesId"
      @close="isModalVisible = false" />
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import CardTemplate from '@/components/CardTemplate.vue';
import CardDetailModal from '@/components/CardDetailModal.vue';

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

// 1. 狀態：Modal 是否可見
const isModalVisible = ref(false);
// 2. 狀態：當前選中的卡片詳細資料和圖片 URL
const selectedCardData = ref(null);

// 3. 事件處理器：當 CardTemplate 發出事件時執行
const onShowDetails = (payload) => {
  selectedCardData.value = payload; // 儲存從子元件傳來的資料
  isModalVisible.value = true;      // 打開 Modal
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
