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
        <div class="d-flex align-center">
          <v-btn :size="chipSize" icon="mdi-arrow-left" variant="text" :to="{ name: 'SeriesCardTable' }"
            class="mr-2"></v-btn>

          <h1 class="text-h6 text-sm-h4 text-truncate flex-grow-1 text-center px-2">{{ seriesName }}</h1>

          <v-chip :size="chipSize" prepend-icon="mdi-cards-outline" class="counter-chip font-weight-bold">
            {{ cards.length }}
          </v-chip>
        </div>
      </div>

      <CardInfiniteScrollList :cards="cards" :header-offset-height="headerHeight" empty-text="" margin="300"
        class="flex-grow-1 themed-scrollbar pl-4 pr-4" />
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { seriesMap } from '@/maps/series-map.js';
import { useSeriesCards } from '@/composables/useSeriesCards.js';
import CardInfiniteScrollList from '@/components/CardInfiniteScrollList.vue';

const props = defineProps({
  seriesId: {
    type: String,
    required: true,
  },
})

const { smAndUp } = useDisplay();
const chipSize = computed(() => {
  return smAndUp.value ? 'x-large' : 'small';
});

const headerRef = ref(null);
const rawHeaderHeight = ref(0);

watchEffect((onCleanup) => {
  const element = headerRef.value;
  if (!element) return;

  const observer = new ResizeObserver(([entry]) => {
    rawHeaderHeight.value = entry.contentRect.height;
  });

  observer.observe(element);

  onCleanup(() => {
    observer.disconnect();
  });
});

const headerHeight = computed(() => {
  if (rawHeaderHeight.value === 0) return 0;
  return rawHeaderHeight.value - 10;
});

const seriesName = computed(() => {
  const foundEntry = Object.entries(seriesMap).find(([, value]) => value.id === props.seriesId);
  return foundEntry ? foundEntry[0] : '未知系列';
});
const prefixes = computed(() => seriesMap[seriesName.value]?.prefixes ?? []);

const { cards, isLoading } = useSeriesCards(prefixes);
</script>
