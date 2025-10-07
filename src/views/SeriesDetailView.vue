<template>
  <v-container fluid class="h-100 pa-0">
    <div v-if="filterStore.isLoading" class="d-flex justify-center align-center h-100">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else class="d-flex flex-column h-100">

      <div ref="headerRef" class="overlay-header pa-4 pb-0 pt-0">
        <div class="d-flex align-center justify-space-between w-100">

          <v-btn v-if="smAndUp" :size="resize" :icon="filterIcon" variant="text"
            @click="isFilterOpen = !isFilterOpen"></v-btn>
          <div v-else style="width: 48px;"></div> <!-- Placeholder for spacing -->

          <div class="d-flex align-center">
            <v-btn :size="resize" icon="mdi-arrow-left" variant="text" :to="{ name: 'SeriesCardTable' }"></v-btn>
            <h1 class="text-h6 text-sm-h5 text-truncate text-center px-2">{{ seriesName }}</h1>
            <v-chip :size="resize" prepend-icon="mdi-cards-diamond-outline" class="counter-chip font-weight-bold">
              {{ filterStore.filteredCards.length }}
            </v-chip>
          </div>

          <v-badge v-if="smAndUp" :content="deckStore.totalCardCount" :model-value="deckStore.totalCardCount > 0"
            color="primary" offset-x="6" offset-y="12">
            <v-btn :size="resize" icon="mdi-cards" variant="text" @click="isCardDeckOpen = !isCardDeckOpen"></v-btn>
          </v-badge>
          <div v-if="!smAndUp" style="width: 48px;"></div> <!-- Placeholder for spacing -->
        </div>
      </div>

      <div class="d-flex flex-row overflow-hidden fill-height" style="position: relative;">
        <div class="sidebar-container" :class="{ 'left-sidebar-open': isFilterOpen }">
          <FilterSidebar :class="['fill-height', smAndUp ? 'pl-4 pb-4' : '']"
            :header-offset-height="headerOffsetHeight" />
        </div>

        <CardInfiniteScrollList ref="listRef" :cards="filterStore.filteredCards"
          :header-offset-height="headerOffsetHeight" margin=" 300"
          :class="['flex-grow-1', 'themed-scrollbar', 'pl-4', 'pr-4', { 'no-scroll': isScrollDisabled }]" />

        <div class="sidebar-container" :class="{ 'right-sidebar-open': isCardDeckOpen }">
          <DeckSidebar :class="['fill-height', smAndUp ? 'pr-4 pb-4' : '']"
            :header-offset-height="headerOffsetHeight" />
        </div>
      </div>

      <v-bottom-navigation v-if="!smAndUp" :elevation="4">
        <v-btn @click="isFilterOpen = !isFilterOpen">
          <v-icon :icon="filterIcon"></v-icon>
          <span>筛选</span>
        </v-btn>

        <v-btn @click="isCardDeckOpen = !isCardDeckOpen" stacked>
          <v-badge :content="deckStore.totalCardCount" :model-value="deckStore.totalCardCount > 0" color="primary"
            offset-x="-2" offset-y="10">
            <v-icon icon="mdi-cards"></v-icon>
          </v-badge>
          <span>卡组</span>
        </v-btn>
      </v-bottom-navigation>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, watchEffect, onUnmounted, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { seriesMap } from '@/maps/series-map.js';
import { useDeckStore } from '@/stores/deck';
import { useFilterStore } from '@/stores/filter';
import { useUIStore } from '@/stores/ui';
import CardInfiniteScrollList from '@/components/CardInfiniteScrollList.vue';
import FilterSidebar from '@/components/FilterSidebar.vue';
import DeckSidebar from '@/components/DeckSidebar.vue';

const props = defineProps({
  seriesId: {
    type: String,
    required: true,
  },
})

const { smAndUp, lgAndUp } = useDisplay();
const resize = computed(() => {
  return smAndUp.value ? 'default' : 'x-small';
});

const deckStore = useDeckStore();
const filterStore = useFilterStore();
const uiStore = useUIStore();
const headerRef = ref(null);
const rawHeaderHeight = ref(0);
const isCardDeckOpen = computed({
  get: () => uiStore.isCardDeckOpen,
  set: (value) => uiStore.isCardDeckOpen = value
});
const isFilterOpen = computed({
  get: () => uiStore.isFilterOpen,
  set: (value) => uiStore.isFilterOpen = value
});
const filterIcon = computed(() => isFilterOpen.value ? 'mdi-filter-off' : 'mdi-filter');
const headerOffsetHeight = computed(() => rawHeaderHeight.value);
const listRef = ref(null);

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

// --- Mobile & Tablet specific logic ---
const isScrollDisabled = computed(() => !smAndUp.value && (isFilterOpen.value || isCardDeckOpen.value));

watch(isFilterOpen, (newValue) => {
  if (newValue && !lgAndUp.value) {
    isCardDeckOpen.value = false;
  }
});

watch(isCardDeckOpen, (newValue) => {
  if (newValue && !lgAndUp.value) {
    isFilterOpen.value = false;
  }
});

// Close one sidebar if resizing from desktop to a smaller screen with both sidebars open
watch(lgAndUp, (isDesktop) => {
  if (!isDesktop && isFilterOpen.value && isCardDeckOpen.value) {
    isCardDeckOpen.value = false;
  }
});
// --- End of mobile & Tablet specific logic ---

const seriesName = computed(() => {
  const foundEntry = Object.entries(seriesMap).find(([, value]) => value.id === props.seriesId);
  return foundEntry ? foundEntry[0] : '未知系列';
});
const prefixes = computed(() => seriesMap[seriesName.value]?.prefixes ?? []);

watchEffect(() => {
  filterStore.initialize(prefixes.value);
  deckStore.setSeriesId(props.seriesId);
});

watch(() => filterStore.filteredCards, () => {
  if (listRef.value) {
    listRef.value.reset();
  }
});

onUnmounted(() => {
  observer.disconnect();
  filterStore.reset();
});
</script>

<style scoped>
.sidebar-container {
  width: 0;
  transition: width 0.4s ease-in-out;
  overflow: hidden;
  flex-shrink: 0;
}

.no-scroll {
  overflow-y: hidden;
}

/* Tablet (sm, md) */
@media (min-width: 600px) and (max-width: 1279.98px) {

  .sidebar-container.left-sidebar-open,
  .sidebar-container.right-sidebar-open {
    width: 35%;
  }
}

/* Desktop (lg, xl) */
@media (min-width: 1280px) {
  .sidebar-container.left-sidebar-open {
    width: 15%;
  }

  .sidebar-container.right-sidebar-open {
    width: 25%;
  }
}

@media (max-width: 599.98px) {

  .sidebar-container.left-sidebar-open,
  .sidebar-container.right-sidebar-open {
    width: 100%;
    position: absolute;
    z-index: 10;
    background: rgb(var(--v-theme-surface));
    height: 100%;
    top: 0;
  }

  .sidebar-container.left-sidebar-open {
    left: 0;
  }

  .sidebar-container.right-sidebar-open {
    right: 0;
  }
}
</style>
