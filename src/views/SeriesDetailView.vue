<template>
  <v-container fluid class="h-100 pa-0">
    <div v-if="isLoading" class="d-flex justify-center align-center h-100">
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
            <h1 class="text-h6 text-sm-h4 text-truncate text-center px-2">{{ seriesName }}</h1>
            <v-chip :size="resize" prepend-icon="mdi-cards-diamond-outline" class="counter-chip font-weight-bold">
              {{ filteredCards.length }}
            </v-chip>
          </div>

          <v-btn v-if="smAndUp" :size="resize" icon="mdi-cards" variant="text"
            @click="isCardDeckOpen = !isCardDeckOpen"></v-btn>
          <div v-else style="width: 48px;"></div> <!-- Placeholder for spacing -->
        </div>
      </div>

      <div class="d-flex flex-row overflow-hidden fill-height" style="position: relative;">
        <div class="sidebar-container" :class="{ 'left-sidebar-open': isFilterOpen }">
          <SidebarLayout :class="['fill-height', 'themed-scrollbar', smAndUp ? 'pl-4 pb-4' : '']"
            :header-offset-height="headerOffsetHeight">
            <div class="d-flex flex-column ga-4">
              <v-text-field label="關鍵字" hide-details clearable v-model="keyword"></v-text-field>

              <v-divider></v-divider>

              <v-select label="卡片類型"
                :items="[{ title: '角色', value: '角色卡' }, { title: '事件', value: '事件卡' }, { title: '潮卡', value: '高潮卡' }]"
                hide-details multiple chips clearable v-model="selectedCardTypes"></v-select>

              <v-select label="颜色"
                :items="[{ title: '黄', value: '黄色' }, { title: '绿', value: '绿色' }, { title: '红', value: '红色' }, { title: '蓝', value: '蓝色' }]"
                hide-details multiple chips clearable v-model="selectedColors"></v-select>

              <v-divider></v-divider>

              <v-select label="产品名称" :items="productNames" hide-details clearable
                v-model="selectedProductName"></v-select>

              <v-select label="特徵" :items="traits" hide-details multiple chips clearable
                v-model="selectedTraits"></v-select>

              <v-divider></v-divider>

              <v-select label="等级" :items="['0', '1', '2', '3']" hide-details multiple chips clearable
                v-model="selectedLevels"></v-select>

              <v-range-slider label="费用" class="mt-6" hide-details thumb-label="always" :min="costRange.min"
                :max="costRange.max" step="1" v-model="selectedCostRange"></v-range-slider>

              <v-range-slider label="攻击力" class="mt-6" hide-details thumb-label="always" :min="powerRange.min"
                :max="powerRange.max" step="500" v-model="selectedPowerRange"></v-range-slider>
            </div>
          </SidebarLayout>
        </div>

        <CardInfiniteScrollList ref="listRef" :cards="filteredCards" :header-offset-height="headerOffsetHeight"
          :all-cards="allCards" margin=" 300"
          :class="['flex-grow-1', 'themed-scrollbar', 'pl-4', 'pr-4', { 'no-scroll': isScrollDisabled }]" />

        <div class="sidebar-container" :class="{ 'right-sidebar-open': isCardDeckOpen }">
          <SidebarLayout :class="['fill-height', smAndUp ? 'pr-4 pl-4 pb-4' : '']"
            :header-offset-height="headerOffsetHeight">
          </SidebarLayout>
        </div>
      </div>

      <v-bottom-navigation v-if="!smAndUp" :elevation="4">
        <v-btn @click="isFilterOpen = !isFilterOpen">
          <v-icon :icon="filterIcon"></v-icon>
          <span>筛选</span>
        </v-btn>

        <v-btn @click="isCardDeckOpen = !isCardDeckOpen">
          <v-icon>mdi-cards</v-icon>
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
import { useSeriesCards } from '@/composables/useSeriesCards.js';
import CardInfiniteScrollList from '@/components/CardInfiniteScrollList.vue';
import SidebarLayout from '@/components/SidebarLayout.vue';

const props = defineProps({
  seriesId: {
    type: String,
    required: true,
  },
})

const { smAndUp, lgAndUp } = useDisplay();
const resize = computed(() => {
  return smAndUp.value ? 'x-large' : 'small';
});

const headerRef = ref(null);
const rawHeaderHeight = ref(0);
const isCardDeckOpen = ref(false);
const isFilterOpen = ref(false);
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

const { cards: allCards, isLoading, productNames, traits, costRange, powerRange } = useSeriesCards(prefixes);

// Filter states
const keyword = ref('');
const selectedCardTypes = ref([]);
const selectedColors = ref([]);
const selectedProductName = ref(null);
const selectedTraits = ref([]);
const selectedLevels = ref([]);
const selectedCostRange = ref([0, 0]);
const selectedPowerRange = ref([0, 0]);

// Initialize range sliders with actual min/max values
watchEffect(() => {
  if (costRange.value.min !== 0 || costRange.value.max !== 0) {
    selectedCostRange.value = [costRange.value.min, costRange.value.max];
  }
  if (powerRange.value.min !== 0 || powerRange.value.max !== 0) {
    selectedPowerRange.value = [powerRange.value.min, powerRange.value.max];
  }
});

const filteredCards = computed(() => {
  let filtered = allCards.value;

  // Keyword search
  if (keyword.value) {
    const lowerCaseKeyword = keyword.value.toLowerCase();
    filtered = filtered.filter(card =>
      card.baseId.toLowerCase().includes(lowerCaseKeyword) ||
      card.id.toLowerCase().includes(lowerCaseKeyword) ||
      (card.effect && card.effect.toLowerCase().includes(lowerCaseKeyword)) ||
      card.name.toLowerCase().includes(lowerCaseKeyword)
    );
  }

  // Card Type filter
  if (selectedCardTypes.value.length > 0) {
    filtered = filtered.filter(card => selectedCardTypes.value.includes(card.type));
  }

  // Color filter
  if (selectedColors.value.length > 0) {
    filtered = filtered.filter(card => selectedColors.value.includes(card.color));
  }

  // Product Name filter
  if (selectedProductName.value) {
    filtered = filtered.filter(card => card.product_name === selectedProductName.value);
  }

  // Traits filter (AND condition)
  if (selectedTraits.value.length > 0) {
    filtered = filtered.filter(card =>
      selectedTraits.value.every(trait => card.trait && card.trait.includes(trait))
    );
  }

  // Level filter
  const toLevel = level => (level === '-' ? 0 : +level);
  if (selectedLevels.value.length > 0) {
    const mappedLevels = new Set(selectedLevels.value.map(toLevel));
    filtered = filtered.filter(card => mappedLevels.has(toLevel(card.level)));
  }

  // Cost filter
  if (selectedCostRange.value && (selectedCostRange.value[0] !== costRange.value.min || selectedCostRange.value[1] !== costRange.value.max)) {
    filtered = filtered.filter(card =>
      card.cost >= selectedCostRange.value[0] && card.cost <= selectedCostRange.value[1]
    );
  }

  // Power filter
  if (selectedPowerRange.value && (selectedPowerRange.value[0] !== powerRange.value.min || selectedPowerRange.value[1] !== powerRange.value.max)) {
    filtered = filtered.filter(card =>
      card.power >= selectedPowerRange.value[0] && card.power <= selectedPowerRange.value[1]
    );
  }

  return filtered;
});

watch(filteredCards, () => {
  if (listRef.value) {
    listRef.value.reset();
  }
});

onUnmounted(() => {
  observer.disconnect();
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
