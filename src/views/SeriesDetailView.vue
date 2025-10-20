<template>
  <v-container fluid class="h-100 pa-0">
    <div v-if="filterStore.isLoading" class="d-flex justify-center align-center h-100">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else class="d-flex flex-column h-100">
      <div ref="headerRef" class="overlay-header pl-4 pr-4 pa-1">
        <div class="overlay-header-content">
          <div class="header-left">
            <v-btn
              v-if="smAndUp"
              :size="resize"
              :icon="filterIcon"
              variant="text"
              @click="isFilterOpen = !isFilterOpen"
            ></v-btn>
          </div>

          <div class="header-center d-flex align-center">
            <v-btn
              :size="resize"
              icon="mdi-arrow-left"
              variant="text"
              :to="{ name: 'SeriesCardTable' }"
              class="flex-shrink-0"
            ></v-btn>
            <h1
              class="text-h6 text-sm-h5 text-truncate text-center px-2 flex-grow-1"
              style="min-width: 0"
            >
              {{ seriesName }}
            </h1>
            <v-chip
              :size="resize"
              prepend-icon="mdi-cards-diamond-outline"
              class="counter-chip font-weight-bold flex-shrink-0"
            >
              {{ filterStore.filteredCards.length }}
            </v-chip>
          </div>

          <div class="header-right">
            <v-badge
              v-if="smAndUp"
              :content="deckStore.totalCardCount"
              :model-value="deckStore.totalCardCount > 0"
              color="primary"
              offset-x="6"
              offset-y="12"
            >
              <v-btn
                :size="resize"
                icon="mdi-cards"
                variant="text"
                @click="isCardDeckOpen = !isCardDeckOpen"
              ></v-btn>
            </v-badge>
          </div>
        </div>
      </div>

      <div class="d-flex flex-row overflow-hidden fill-height" style="position: relative">
        <div class="sidebar-container" :class="{ 'left-sidebar-open': isFilterOpen }">
          <FilterSidebar
            :class="['fill-height', smAndUp ? 'pl-4 pb-4' : '']"
            :header-offset-height="headerOffsetHeight"
          />
        </div>

        <CardInfiniteScrollList
          ref="listRef"
          :cards="filterStore.filteredCards"
          :header-offset-height="headerOffsetHeight"
          margin=" 300"
          :class="[
            'flex-grow-1',
            'themed-scrollbar',
            'pl-4',
            'pr-4',
            { 'no-scroll': isScrollDisabled },
          ]"
        />

        <div class="sidebar-container" :class="{ 'right-sidebar-open': isCardDeckOpen }">
          <DeckSidebar
            :class="['fill-height', smAndUp ? 'pr-4 pb-4' : '']"
            :header-offset-height="headerOffsetHeight"
          />
        </div>
      </div>

      <v-bottom-navigation v-if="!smAndUp" :elevation="4" grow>
        <v-btn @click="isFilterOpen = !isFilterOpen">
          <v-icon :icon="filterIcon"></v-icon>
          <span>筛选</span>
        </v-btn>

        <v-btn @click="isCardDeckOpen = !isCardDeckOpen" stacked>
          <v-badge
            :content="deckStore.totalCardCount"
            :model-value="deckStore.totalCardCount > 0"
            color="primary"
            offset-x="-2"
            offset-y="10"
          >
            <v-icon icon="mdi-cards"></v-icon>
          </v-badge>
          <span>卡组</span>
        </v-btn>
      </v-bottom-navigation>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, watchEffect, onUnmounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { seriesMap } from '@/maps/series-map.js'
import { useDeckStore } from '@/stores/deck'
import { useFilterStore } from '@/stores/filter'
import { useUIStore } from '@/stores/ui'
import { useInfiniteScrollState } from '@/composables/useInfiniteScrollState.js'
import CardInfiniteScrollList from '@/components/CardInfiniteScrollList.vue'
import FilterSidebar from '@/components/FilterSidebar.vue'
import DeckSidebar from '@/components/DeckSidebar.vue'

const props = defineProps({
  seriesId: {
    type: String,
    required: true,
  },
})

const { smAndUp, lgAndUp } = useDisplay()
const resize = computed(() => {
  return smAndUp.value ? 'default' : 'x-small'
})

const deckStore = useDeckStore()
const filterStore = useFilterStore()
const uiStore = useUIStore()
const headerRef = ref(null)
const rawHeaderHeight = ref(0)
const isCardDeckOpen = computed({
  get: () => uiStore.isCardDeckOpen,
  set: (value) => (uiStore.isCardDeckOpen = value),
})
const isFilterOpen = computed({
  get: () => uiStore.isFilterOpen,
  set: (value) => (uiStore.isFilterOpen = value),
})
const filterIcon = computed(() => (isFilterOpen.value ? 'mdi-filter-off' : 'mdi-filter'))
const headerOffsetHeight = computed(() => rawHeaderHeight.value)
const listRef = ref(null)

const observer = new ResizeObserver(([entry]) => {
  if (entry && entry.target) {
    rawHeaderHeight.value = entry.target.offsetHeight
  }
})

watchEffect(() => {
  if (headerRef.value) {
    observer.observe(headerRef.value)
  }
})

// --- Mobile & Tablet specific logic ---
const isScrollDisabled = computed(
  () => !smAndUp.value && (isFilterOpen.value || isCardDeckOpen.value)
)

watch(isFilterOpen, (newValue) => {
  if (newValue && !lgAndUp.value) {
    isCardDeckOpen.value = false
  }
})

watch(isCardDeckOpen, (newValue) => {
  if (newValue && !lgAndUp.value) {
    isFilterOpen.value = false
  }
})

// Close one sidebar if resizing from desktop to a smaller screen with both sidebars open
watch(lgAndUp, (isDesktop) => {
  if (!isDesktop && isFilterOpen.value && isCardDeckOpen.value) {
    isCardDeckOpen.value = false
  }
})
// --- End of mobile & Tablet specific logic ---

const seriesName = computed(() => {
  const foundEntry = Object.entries(seriesMap).find(([, value]) => value.id === props.seriesId)
  return foundEntry ? foundEntry[0] : '未知系列'
})
const prefixes = computed(() => seriesMap[seriesName.value]?.prefixes ?? [])

watchEffect(() => {
  filterStore.initialize(prefixes.value)
  deckStore.setSeriesId(props.seriesId)
})

watch(
  () => filterStore.filteredCards,
  () => {
    if (listRef.value) {
      listRef.value.reset()
    }
  }
)

onUnmounted(() => {
  observer.disconnect()
  filterStore.reset()
})

const storageKey = computed(() => `seriesDetailViewState_${props.seriesId}`)

useInfiniteScrollState({
  storageKey,
  scrollRef: listRef,
  onSave: () => listRef.value?.getScrollState(),
  onRestore: (savedState) => {
    listRef.value?.restoreScrollState(savedState)
  },
  loadingRef: computed(() => filterStore.isLoading),
})
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

/* Small tablet (sm) */
@media (min-width: 600px) and (max-width: 959.98px) {
  .sidebar-container.left-sidebar-open,
  .sidebar-container.right-sidebar-open {
    width: 46%;
  }
}

/* Medium tablet (md) */
@media (min-width: 960px) and (max-width: 1279.98px) {
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
  .sidebar-container {
    position: absolute;
    z-index: 10;
    background: rgb(var(--v-theme-surface));
    height: 100%;
    top: 0;
    right: 0;
  }

  .sidebar-container.left-sidebar-open,
  .sidebar-container.right-sidebar-open {
    width: 100%;
  }
}
</style>
