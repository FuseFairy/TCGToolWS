<template>
  <v-container fluid class="h-100 pa-0">
    <div v-if="store.isLoading" class="d-flex justify-center align-center h-100">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else class="d-flex flex-column h-100">
      <div ref="headerRef" class="overlay-header pl-4 pr-4 pa-1">
        <div class="overlay-header-content">
          <div class="header-left">
            <v-btn
              v-if="smAndUp"
              :size="resize"
              :icon="searchIcon"
              variant="text"
              @click="isFilterOpen = !isFilterOpen"
            ></v-btn>
          </div>

          <div class="header-center d-flex align-center">
            <h1
              class="text-h6 text-sm-h5 text-truncate text-center px-2 flex-grow-1"
              style="min-width: 0"
            >
              全域搜寻
            </h1>
            <v-chip
              :size="resize"
              prepend-icon="mdi-cards-diamond-outline"
              class="counter-chip font-weight-bold flex-shrink-0"
            >
              {{ store.searchResults.length }}
            </v-chip>
          </div>

          <div class="header-right">
            <v-btn
              v-if="smAndUp"
              :size="resize"
              :icon="isTableModeActive ? 'mdi-grid' : 'mdi-grid-large'"
              variant="text"
              @click="isTableModeActive = !isTableModeActive"
            ></v-btn>
          </div>
        </div>
      </div>

      <div class="d-flex flex-row overflow-hidden fill-height" style="position: relative">
        <template v-if="smAndUp">
          <div class="sidebar-container" :class="{ 'left-sidebar-open': isFilterOpen }">
            <BaseFilterSidebar
              class="fill-height pl-4 pb-4"
              :header-offset-height="headerOffsetHeight"
              :filterStore="store"
            />
          </div>
        </template>

        <v-container
          v-if="displayEmptySearchMessage"
          class="d-flex align-center justify-center text-grey h-100 w-100"
        >
          {{ currentEmptyText }}
        </v-container>

        <CardInfiniteScrollList
          v-else
          ref="cardListRef"
          :cards="store.searchResults"
          :header-offset-height="headerOffsetHeight"
          :is-table-mode-active="isTableModeActive"
          :empty-text="currentEmptyText"
          key="global-search-list"
          margin=" 300"
          class="flex-grow-1 themed-scrollbar pl-4 pr-4"
        />
      </div>

      <!-- Mobile FABs for Bottom Sheet -->
      <div v-if="!smAndUp" style="height: 0px; overflow-y: hidden">
        <div class="fab-bottom-left-container d-flex ga-3">
          <v-btn
            icon="mdi-layers-search"
            size="large"
            color="primary"
            class="opacity-90"
            @click="sheetContent = 'filter'"
          ></v-btn>
        </div>
      </div>

      <!-- Bottom Sheet for Mobile -->
      <v-bottom-sheet v-model="isSheetOpen" :scrim="false" inset persistent>
        <v-card
          class="rounded-t-xl d-flex flex-column"
          :class="{ 'glass-sheet': hasBackgroundImage }"
          style="height: 100%"
        >
          <div class="sheet-header">
            <div class="header-spacer-left"></div>
            <div class="header-drag-area" @mousedown="startDrag" @touchstart.prevent="startDrag">
              <div class="resize-handle"></div>
              <div class="pt-2">
                <span class="text-h6">{{ sheetTitle }}</span>
              </div>
            </div>
            <div class="header-close-area">
              <v-btn icon="mdi-close" variant="text" @click="isSheetOpen = false"></v-btn>
            </div>
          </div>
          <v-divider></v-divider>
          <v-card-text
            class="pa-0"
            :style="{
              'height': sheetHeight + 'px',
              'overflow-y': 'auto',
            }"
          >
            <BaseFilterSidebar
              v-if="sheetContent === 'filter'"
              :header-offset-height="0"
              class="px-4"
              transparent
              :filterStore="store"
            />
          </v-card-text>
        </v-card>
      </v-bottom-sheet>
    </div>
  </v-container>
</template>

<script setup>
import { onMounted, ref, watch, computed, watchEffect, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useGlobalSearchStore } from '@/stores/globalSearch'
import { useUIStore } from '@/stores/ui'
import { useInfiniteScrollState } from '@/composables/useInfiniteScrollState.js'
import CardInfiniteScrollList from '@/components/card/CardInfiniteScrollList.vue'
import BaseFilterSidebar from '@/components/base/BaseFilterSidebar.vue'
import { useBottomSheet } from '@/composables/useBottomSheet.js'

const store = useGlobalSearchStore()
const uiStore = useUIStore()
const cardListRef = ref(null)
const headerRef = ref(null)
const { isFilterOpen, isTableModeActive } = storeToRefs(uiStore)
const { hasActiveFilters } = storeToRefs(store)
const rawHeaderHeight = ref(0)
const hasBackgroundImage = !!uiStore.backgroundImage

const { sheetContent, isSheetOpen, sheetHeight, startDrag, smAndUp } = useBottomSheet()

const resize = computed(() => {
  return smAndUp.value ? 'default' : 'x-small'
})

const searchIcon = computed(() =>
  isFilterOpen.value ? 'mdi-layers-search-outline' : 'mdi-layers-search'
)
const headerOffsetHeight = computed(() => rawHeaderHeight.value)

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

watch(isTableModeActive, () => {
  if (cardListRef.value) {
    cardListRef.value.reset()
  }
})

const sheetTitle = computed(() => {
  if (sheetContent.value === 'filter') return '搜寻'
  return ''
})

const displayEmptySearchMessage = computed(() => !hasActiveFilters.value && !store.isLoading)
const currentEmptyText = computed(() =>
  displayEmptySearchMessage.value
    ? '请输入关键字或选择筛选条件以开始搜寻'
    : '~没有找到符合条件的卡片~'
)

onMounted(() => {
  store.initialize()
})

watch(
  [
    () => store.keyword,
    () => store.selectedCardTypes,
    () => store.selectedColors,
    () => store.selectedProductName,
    () => store.selectedTraits,
    () => store.selectedLevels,
    () => store.selectedRarities,
    () => store.showUniqueCards,
    () => store.selectedCostRange,
    () => store.selectedPowerRange,
  ],
  async ([
    newKeyword,
    newCardTypes,
    newColors,
    newProductName,
    newTraits,
    newLevels,
    newRarities,
    newShowUniqueCards,
    newCostRange,
    newPowerRange,
  ]) => {
    // 檢查是否有任何篩選條件被設定或關鍵字不為空
    const hasAnyActiveFilters = [
      newKeyword !== '',
      newCardTypes.length > 0,
      newColors.length > 0,
      newProductName !== null,
      newTraits.length > 0,
      newLevels.length > 0,
      newRarities.length > 0,
      newShowUniqueCards === true,
      newCostRange[0] !== store.costRange.min || newCostRange[1] !== store.costRange.max,
      newPowerRange[0] !== store.powerRange.min || newPowerRange[1] !== store.powerRange.max,
    ].some(Boolean)

    if (store.isReady && hasAnyActiveFilters) {
      await store.search()
      cardListRef.value?.reset()
    } else if (!hasAnyActiveFilters) {
      // 如果沒有任何篩選條件，清空搜尋結果並重置 hasActiveFilters
      store.searchResults = []
      store.hasActiveFilters = false
      cardListRef.value?.reset()
    }
  },
  { deep: true }
)

onUnmounted(() => {
  observer.disconnect()
})

const storageKey = computed(() => `globalSearchViewState`)

useInfiniteScrollState({
  storageKey,
  scrollRef: cardListRef,
  onSave: () => cardListRef.value?.getScrollState(),
  onRestore: (savedState) => {
    cardListRef.value?.restoreScrollState(savedState)
  },
  loadingRef: computed(() => store.isLoading),
})
</script>

<style scoped>
.sidebar-container {
  width: 0;
  transition: width 0.4s ease-in-out;
  overflow: hidden;
  flex-shrink: 0;
}

/* Small tablet (sm) */
@media (min-width: 600px) and (max-width: 959.98px) {
  .sidebar-container.left-sidebar-open {
    width: 46%;
  }
}

/* Medium tablet (md) */
@media (min-width: 960px) and (max-width: 1279.98px) {
  .sidebar-container.left-sidebar-open {
    width: 35%;
  }
}

/* Desktop (lg, xl) */
@media (min-width: 1280px) {
  .sidebar-container.left-sidebar-open {
    width: 15%;
  }
}

.fab-bottom-left-container {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 10;
}

.sheet-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.header-spacer-left {
  width: 56px; /* Balance the close button area */
}

.header-drag-area {
  flex-grow: 1;
  position: relative;
  cursor: grab;
  padding: 12px 0;
  text-align: center;
}

.header-drag-area:active {
  cursor: grabbing;
}

.header-close-area {
  width: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.resize-handle {
  width: 80px;
  height: 4px;
  background-color: grey;
  border-radius: 2px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
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

  .sidebar-container.left-sidebar-open {
    width: 100%;
  }
}
</style>
