<template>
  <aside
    v-bind="$attrs"
    class="d-flex flex-column flex-shrink-0"
    :style="{ paddingTop: `${smAndUp ? headerOffsetHeight + 18 : 0}px` }"
  >
    <v-sheet
      :rounded="smAndUp ? '3md' : false"
      class="pa-4 ga-4 d-flex flex-column fill-height overflow-y-auto overflow-x-hidden themed-scrollbar"
      :class="{ 'glass-sheet': hasBackgroundImage && !transparent }"
      :color="transparent ? 'transparent' : undefined"
    >
      <div class="d-flex flex-column ga-4">
        <v-text-field
          label="关键字"
          placeholder="卡号、卡名、效果"
          hide-details
          clearable
          v-model="keyword"
          variant="underlined"
        ></v-text-field>

        <v-switch
          label="高罕过滤"
          hide-details
          v-model="filterStore.showUniqueCards"
          color="primary"
          :disabled="!filterStore.hasActiveFilters && globalFilter"
        ></v-switch>

        <v-divider></v-divider>

        <v-select
          label="种类"
          :items="[
            { title: '角色', value: '角色卡' },
            { title: '事件', value: '事件卡' },
            { title: '高潮卡', value: '高潮卡' },
          ]"
          hide-details
          multiple
          chips
          clearable
          v-model="filterStore.selectedCardTypes"
          variant="outlined"
        ></v-select>

        <v-select
          label="颜色"
          :items="[
            { title: '黄', value: '黄色' },
            { title: '绿', value: '绿色' },
            { title: '红', value: '红色' },
            { title: '蓝', value: '蓝色' },
          ]"
          hide-details
          multiple
          chips
          clearable
          v-model="filterStore.selectedColors"
          variant="outlined"
        ></v-select>

        <v-autocomplete
          label="产品"
          :items="filterStore.productNames"
          hide-details
          clearable
          v-model="filterStore.selectedProductName"
          variant="outlined"
        ></v-autocomplete>

        <v-autocomplete
          label="稀有度"
          :items="filterStore.rarities"
          hide-details
          multiple
          chips
          clearable
          v-model="filterStore.selectedRarities"
          variant="outlined"
        ></v-autocomplete>

        <v-autocomplete
          label="特征"
          :items="filterStore.traits"
          hide-details
          multiple
          chips
          clearable
          v-model="filterStore.selectedTraits"
          variant="outlined"
        ></v-autocomplete>

        <v-select
          label="等级"
          :items="['0', '1', '2', '3']"
          hide-details
          multiple
          chips
          clearable
          v-model="filterStore.selectedLevels"
          variant="outlined"
        ></v-select>

        <div>
          <div class="text-caption text-disabled">费用</div>
          <v-range-slider
            hide-details
            :thumb-label="true"
            :min="filterStore.costRange.min"
            :max="filterStore.costRange.max"
            step="1"
            v-model="filterStore.selectedCostRange"
          ></v-range-slider>
        </div>

        <div>
          <div class="text-caption text-disabled">战斗力</div>
          <v-range-slider
            hide-details
            :thumb-label="true"
            :min="filterStore.powerRange.min"
            :max="filterStore.powerRange.max"
            step="500"
            v-model="filterStore.selectedPowerRange"
          ></v-range-slider>
        </div>
      </div>
    </v-sheet>
  </aside>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { debounce } from 'es-toolkit/function'
import { useUIStore } from '@/stores/ui'
import { useFilterStore } from '@/stores/filter'
import { useGlobalSearchStore } from '@/stores/globalSearch'

const props = defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  },
  transparent: {
    type: Boolean,
    default: false,
  },
  globalFilter: {
    type: Boolean,
    default: false,
  },
})

const { smAndUp } = useDisplay()
const uiStore = useUIStore()
const hasBackgroundImage = !!uiStore.backgroundImage
const filterStore = props.globalFilter ? useGlobalSearchStore() : useFilterStore()

const keyword = ref(filterStore.keyword)

const debouncedUpdate = debounce((value) => {
  filterStore.keyword = value
}, 300)

watch(keyword, (newValue) => {
  debouncedUpdate(newValue)
})

watch(
  () => filterStore.keyword,
  (newValue) => {
    if (keyword.value !== newValue) {
      keyword.value = newValue
    }
  }
)
</script>

<style scoped></style>
