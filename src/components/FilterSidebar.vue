<template>
  <aside v-bind="$attrs" class="d-flex flex-column flex-shrink-0"
    :style="{ paddingTop: `${smAndUp ? headerOffsetHeight + 18 : 0}px` }">
    <v-sheet :rounded="smAndUp ? '3md' : false"
      class="pa-4 ga-4 d-flex flex-column fill-height overflow-y-auto themed-scrollbar">
      <div class="d-flex flex-column ga-4">
        <v-text-field label="关键字" hide-details clearable v-model="filterStore.keyword"></v-text-field>

        <v-divider></v-divider>

        <v-select label="卡片类型"
          :items="[{ title: '角色', value: '角色卡' }, { title: '事件', value: '事件卡' }, { title: '高潮卡', value: '高潮卡' }]"
          hide-details multiple chips clearable v-model="filterStore.selectedCardTypes"></v-select>

        <v-select label="颜色"
          :items="[{ title: '黄', value: '黄色' }, { title: '绿', value: '绿色' }, { title: '红', value: '红色' }, { title: '蓝', value: '蓝色' }]"
          hide-details multiple chips clearable v-model="filterStore.selectedColors"></v-select>

        <v-divider></v-divider>

        <v-select label="产品名称" :items="filterStore.productNames" hide-details clearable
          v-model="filterStore.selectedProductName"></v-select>

        <v-select label="特征" :items="filterStore.traits" hide-details multiple chips clearable
          v-model="filterStore.selectedTraits"></v-select>

        <v-divider></v-divider>

        <v-select label="等级" :items="['0', '1', '2', '3']" hide-details multiple chips clearable
          v-model="filterStore.selectedLevels"></v-select>

        <v-range-slider label="费用" class="mt-6" hide-details thumb-label="always" :min="filterStore.costRange.min"
          :max="filterStore.costRange.max" step="1" v-model="filterStore.selectedCostRange"></v-range-slider>

        <v-range-slider label="攻击力" class="mt-6" hide-details thumb-label="always" :min="filterStore.powerRange.min"
          :max="filterStore.powerRange.max" step="500" v-model="filterStore.selectedPowerRange"></v-range-slider>
      </div>
    </v-sheet>
  </aside>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useFilterStore } from '@/stores/filter';

defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  },
});

const { smAndUp } = useDisplay();
const filterStore = useFilterStore();
</script>

<style scoped></style>
