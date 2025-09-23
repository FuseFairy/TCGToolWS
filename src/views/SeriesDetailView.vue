<template>
  <v-container fluid class="h-100 pa-0">
    <div v-if="isLoading" class="d-flex justify-center align-center h-100">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="cards.length === 0" class="text-center text-grey d-flex justify-center align-center h-100">
      此系列中沒有找到任何卡片。
    </div>

    <div v-else class="d-flex flex-column h-100">
      <div ref="headerRef" class="sticky-header pa-4 pb-0 pt-0">
        <div class="d-flex align-center">
          <v-btn :size="chipSize" icon="mdi-arrow-left" variant="text" :to="{ name: 'SeriesCardTable' }"
            class="mr-2"></v-btn>

          <h1 class="text-h6 text-sm-h4 text-truncate flex-grow-1 text-center px-2">{{ seriesName }}</h1>

          <v-chip :size="chipSize" prepend-icon="mdi-cards-outline" class="counter-chip font-weight-bold">
            {{ cards.length }}
          </v-chip>
        </div>
      </div>

      <v-infinite-scroll @load="load" empty-text="" margin="300" class="flex-grow-1 themed-scrollbar pl-4 pr-4">

        <v-responsive :height="headerHeight"></v-responsive>

        <v-row class="ma-0">
          <v-col v-for="card in displayedCards" :key="card.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
            <CardTemplate :card="card" />
          </v-col>
        </v-row>
      </v-infinite-scroll>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { seriesMap } from '@/maps/series-map.js';
import { useSeriesCards } from '@/composables/useSeriesCards.js';
import CardTemplate from '@/components/CardTemplate.vue';

const props = defineProps({
  seriesId: {
    type: String,
    required: true,
  },
})

const ITEMS_PER_LOAD = 24;

const page = ref(1);

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

const displayedCards = computed(() => cards.value.slice(0, page.value * ITEMS_PER_LOAD));

const load = async ({ done }) => {
  if (displayedCards.value.length >= cards.value.length) {
    return done('empty');
  }
  await new Promise(resolve => setTimeout(resolve, 150));
  page.value++;
  done('ok');
};

watch(seriesName, () => {
  page.value = 1;
});
</script>
