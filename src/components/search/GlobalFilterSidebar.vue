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
          v-model="globalSearchStore.keyword"
          variant="underlined"
        ></v-text-field>

        <v-switch
          label="高罕过滤"
          hide-details
          v-model="globalSearchStore.showUniqueCards"
          color="primary"
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
          v-model="globalSearchStore.selectedCardTypes"
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
          v-model="globalSearchStore.selectedColors"
          variant="outlined"
        ></v-select>

        <v-select
          label="产品"
          :items="globalSearchStore.productNames"
          hide-details
          clearable
          v-model="globalSearchStore.selectedProductName"
          variant="outlined"
        ></v-select>

        <v-select
          label="稀有度"
          :items="globalSearchStore.rarities"
          hide-details
          multiple
          chips
          clearable
          v-model="globalSearchStore.selectedRarities"
          variant="outlined"
        ></v-select>

        <v-select
          label="特征"
          :items="globalSearchStore.traits"
          hide-details
          multiple
          chips
          clearable
          v-model="globalSearchStore.selectedTraits"
          variant="outlined"
        ></v-select>

        <v-select
          label="等级"
          :items="['0', '1', '2', '3']"
          hide-details
          multiple
          chips
          clearable
          v-model="globalSearchStore.selectedLevels"
          variant="outlined"
        ></v-select>

        <div>
          <div class="text-caption text-disabled">费用</div>
          <v-range-slider
            hide-details
            :thumb-label="true"
            :min="globalSearchStore.costRange.min"
            :max="globalSearchStore.costRange.max"
            step="1"
            v-model="globalSearchStore.selectedCostRange"
          ></v-range-slider>
        </div>

        <div>
          <div class="text-caption text-disabled">战斗力</div>
          <v-range-slider
            hide-details
            :thumb-label="true"
            :min="globalSearchStore.powerRange.min"
            :max="globalSearchStore.powerRange.max"
            step="500"
            v-model="globalSearchStore.selectedPowerRange"
          ></v-range-slider>
        </div>
      </div>
    </v-sheet>
  </aside>
</template>

<script setup>
import { useDisplay } from 'vuetify'
import { useGlobalSearchStore } from '@/stores/globalSearch'
import { useUIStore } from '@/stores/ui'

defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  },
  transparent: {
    type: Boolean,
    default: false,
  },
})

const { smAndUp } = useDisplay()
const globalSearchStore = useGlobalSearchStore()
const uiStore = useUIStore()
const hasBackgroundImage = !!uiStore.backgroundImage
</script>

<style scoped></style>
