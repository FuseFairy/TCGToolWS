<template>
  <v-container fluid class="h-100 pa-0">
    <div v-if="isLoading" class="d-flex justify-center align-center h-100">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="cards.length === 0" class="text-center text-grey d-flex justify-center align-center h-100">
      此系列中沒有找到任何卡片。
    </div>

    <div v-else class="d-flex flex-column h-100">

      <div ref="headerRef" class="overlay-header pa-4 pb-0 pt-0">
        <div class="d-flex align-center justify-space-between w-100">

          <v-btn :size="resize" :icon="filterIcon" variant="text" @click="isFilterOpen = !isFilterOpen"></v-btn>

          <div class="d-flex align-center">
            <v-btn :size="resize" icon="mdi-arrow-left" variant="text" :to="{ name: 'SeriesCardTable' }"></v-btn>
            <h1 class="text-h6 text-sm-h4 text-truncate text-center px-2">{{ seriesName }}</h1>
            <v-chip :size="resize" prepend-icon="mdi-cards-diamond-outline" class="counter-chip font-weight-bold">
              {{ cards.length }}
            </v-chip>
          </div>

          <v-btn :size="resize" icon="mdi-cards" variant="text" @click="isCardDeckOpen = !isCardDeckOpen"></v-btn>
        </div>
      </div>

      <div class="d-flex flex-row overflow-hidden">
        <div class="sidebar-container" :class="{ 'left-sidebar-open': isFilterOpen }">
          <SidebarLayout class="fill-height pl-4 pb-4" :header-offset-height="headerOffsetHeight">
            <v-select label="分類" :items="['A', 'B', 'C']" hide-details></v-select>
            <v-text-field label="關鍵字" hide-details></v-text-field>
            <v-checkbox label="僅顯示收藏" hide-details></v-checkbox>
          </SidebarLayout>
        </div>

        <CardInfiniteScrollList :cards="cards" :header-offset-height="headerOffsetHeight" empty-text="" margin="300"
          class="flex-grow-1 themed-scrollbar pl-4 pr-4" />

        <div class="sidebar-container" :class="{ 'right-sidebar-open': isCardDeckOpen }">
          <SidebarLayout class="fill-height pr-4 pl-4 pb-4" :header-offset-height="headerOffsetHeight">
          </SidebarLayout>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, watchEffect, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';
import { seriesMap } from '@/maps/series-map.js';
import { useSeriesCards } from '@/composables/useSeriesCards.js';
import CardInfiniteScrollList from '@/components/CardInfiniteScrollList.vue';
import SidebarLayout from '@/components/SidebarLayout.vue';

const props = defineProps({
  seriesId: {
    type: String,
    required: true,
  },
})

const { smAndUp } = useDisplay();
const resize = computed(() => {
  return smAndUp.value ? 'x-large' : 'small';
});

const headerRef = ref(null);
const rawHeaderHeight = ref(0);
const isCardDeckOpen = ref(false);
const isFilterOpen = ref(false);
const filterIcon = computed(() => isFilterOpen.value ? 'mdi-filter-off' : 'mdi-filter');
const headerOffsetHeight = computed(() => rawHeaderHeight.value);

const observer = new ResizeObserver(([entry]) => {
  if (entry && entry.target) {
    rawHeaderHeight.value = entry.target.offsetHeight;
  }
});

watchEffect(() => {
  if (headerRef.value) {
    observer.observe(headerRef.value);
  }
});

const seriesName = computed(() => {
  const foundEntry = Object.entries(seriesMap).find(([, value]) => value.id === props.seriesId);
  return foundEntry ? foundEntry[0] : '未知系列';
});
const prefixes = computed(() => seriesMap[seriesName.value]?.prefixes ?? []);

const { cards, isLoading } = useSeriesCards(prefixes);

onUnmounted(() => {
  observer.disconnect();
});
</script>

<style scoped>
.sidebar-container {
  width: 0;
  transition: width 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-container.left-sidebar-open {
  width: 15%;
}

.sidebar-container.right-sidebar-open {
  width: 25%;
}
</style>
