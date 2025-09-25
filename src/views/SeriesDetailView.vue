<template>
  <v-container fluid class="h-100 pa-0">
    <div v-if="isLoading" class="d-flex justify-center align-center h-100">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="allCards.length === 0" class="text-center text-grey d-flex justify-center align-center h-100">
      此系列中没有找到任何卡片。
    </div>

    <div v-else class="d-flex flex-column h-100">

      <div ref="headerRef" class="overlay-header pa-4 pb-0 pt-0">
        <div class="d-flex align-center justify-space-between w-100">

          <v-btn :size="resize" :icon="filterIcon" variant="text" @click="isFilterOpen = !isFilterOpen"></v-btn>

          <div class="d-flex align-center">
            <v-btn :size="resize" icon="mdi-arrow-left" variant="text" :to="{ name: 'SeriesCardTable' }"></v-btn>
            <h1 class="text-h6 text-sm-h4 text-truncate text-center px-2">{{ seriesName }}</h1>
            <v-chip :size="resize" prepend-icon="mdi-cards-diamond-outline" class="counter-chip font-weight-bold">
              {{ filteredCards.length }}
            </v-chip>
          </div>

          <v-btn :size="resize" icon="mdi-cards" variant="text" @click="isCardDeckOpen = !isCardDeckOpen"></v-btn>
        </div>
      </div>

      <div class="d-flex flex-row overflow-hidden">
        <div class="sidebar-container" :class="{ 'left-sidebar-open': isFilterOpen }">
          <SidebarLayout class="fill-height pl-4 pb-4 themed-scrollbar" :header-offset-height="headerOffsetHeight">
            <div class="d-flex flex-column ga-4">
              <v-text-field label="關鍵字" hide-details clearable v-model="keyword"></v-text-field>

              <v-divider></v-divider>

              <div>
                <div class="text-subtitle-1 font-weight-bold">卡片類型</div>
                <v-chip-group multiple v-model="selectedCardTypes">
                  <v-chip filter value="角色卡">角色</v-chip>
                  <v-chip filter value="事件卡">事件</v-chip>
                  <v-chip filter value="高潮卡">高潮</v-chip>
                </v-chip-group>
              </div>

              <div>
                <div class="text-subtitle-1 font-weight-bold">颜色</div>
                <v-chip-group multiple v-model="selectedColors">
                  <v-chip filter value="黄色">黄</v-chip>
                  <v-chip filter value="绿色">绿</v-chip>
                  <v-chip filter value="红色">红</v-chip>
                  <v-chip filter value="蓝色">蓝</v-chip>
                </v-chip-group>
              </div>

              <v-divider></v-divider>

              <v-select label="产品名称" :items="productNames" hide-details clearable
                v-model="selectedProductName"></v-select>

              <v-select label="特徵" :items="traits" hide-details multiple chips clearable
                v-model="selectedTraits"></v-select>

              <v-divider></v-divider>

              <div>
                <div class="text-subtitle-1 font-weight-bold">等级</div>
                <v-chip-group multiple v-model="selectedLevels">
                  <v-chip filter value="0">0</v-chip>
                  <v-chip filter value="1">1</v-chip>
                  <v-chip filter value="2">2</v-chip>
                  <v-chip filter value="3">3</v-chip>
                </v-chip-group>
              </div>

              <div>
                <div class="text-subtitle-1 font-weight-bold">费用</div>
                <v-range-slider hide-details thumb-label="always" :min="costRange.min" :max="costRange.max" step="1"
                  v-model="selectedCostRange"></v-range-slider>
              </div>

              <div>
                <div class="text-subtitle-1 font-weight-bold">攻击力</div>
                <v-range-slider hide-details thumb-label="always" :min="powerRange.min" :max="powerRange.max" step="1"
                  v-model="selectedPowerRange"></v-range-slider>
              </div>
            </div>
          </SidebarLayout>
        </div>

        <CardInfiniteScrollList :cards="filteredCards" :header-offset-height="headerOffsetHeight" empty-text=""
          margin="300" class="flex-grow-1 themed-scrollbar pl-4 pr-4" />

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
  if (selectedLevels.value.length > 0) {
    const mappedLevels = selectedLevels.value.map(level => parseInt(level));
    filtered = filtered.filter(card => mappedLevels.includes(card.level));
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

.sidebar-container.left-sidebar-open {
  width: 15%;
}

.sidebar-container.right-sidebar-open {
  width: 25%;
}
</style>
