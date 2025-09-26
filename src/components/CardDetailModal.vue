<template>
  <!-- v-card 提供了一個美觀的容器和背景 -->
  <v-card>
    <v-card-text>
      <!-- v-row 和 v-col 用於建立響應式網格佈局 -->
      <v-row>
        <!-- 圖片欄：在大螢幕 (md) 佔 5/12，在小螢幕佔滿 12/12 -->
        <v-col cols="12" md="5">
          <v-img :src="props.imgUrl" :alt="props.card.name" rounded="lg" cover :aspect-ratio="400 / 559">
            <template #error>
              <v-alert type="error" density="compact" class="text-caption h-100" title="圖片載入失敗"
                :closable="false"></v-alert>
            </template>
          </v-img>
        </v-col>

        <!-- 詳細資訊欄：在大螢幕 (md) 佔 7/12，在小螢幕佔滿 12/12 -->
        <v-col cols="12" md="7">
          <!-- 系列名稱 -->
          <v-card-subtitle class="pb-1">{{ props.card.product_name }}</v-card-subtitle>

          <!-- 卡片名稱 -->
          <v-card-title class="pt-0 text-h5 text-wrap">{{ props.card.name }}</v-card-title>

          <!-- 核心屬性 (Level, Cost, Power, Soul) -->
          <v-row dense class="my-4 text-center">
            <v-col>
              <div class="text-caption text-grey">等級</div>
              <div class="font-weight-bold text-h6">{{ props.card.level }}</div>
            </v-col>
            <v-col>
              <div class="text-caption text-grey">費用</div>
              <div class="font-weight-bold text-h6">{{ props.card.cost }}</div>
            </v-col>
            <v-col>
              <div class="text-caption text-grey">戰力</div>
              <div class="font-weight-bold text-h6">{{ props.card.power }}</div>
            </v-col>
            <v-col>
              <div class="text-caption text-grey">靈魂</div>
              <div class="font-weight-bold text-h6">{{ props.card.soul }}</div>
            </v-col>
          </v-row>

          <!-- 分隔線，讓佈局更清晰 -->
          <v-divider class="mb-4"></v-divider>

          <!-- 效果文本 -->
          <div>
            <div class="text-subtitle-1 font-weight-bold mb-2">效果</div>
            <!-- 使用 v-html 來渲染效果文本中的 <br/> 標籤 -->
            <div class="text-body-2" v-html="formattedEffect"></div>
          </div>

          <!-- 關聯卡片 (Link) - 未來擴充點 -->
          <div v-if="card.link && card.link.length > 0" class="mt-4">
            <div class="text-subtitle-1 font-weight-bold mb-2">關聯卡片</div>
            <!-- v-chip 適合用來顯示這類標籤式資訊 -->
            <v-chip v-for="linkId in card.link" :key="linkId" class="mr-2 mb-2" label size="small">
              {{ linkId }}
            </v-chip>
          </div>

        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  seriesId: {
    type: String,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
});

// 將 effect 文本的處理封裝到 computed 中，讓模板保持乾淨
const formattedEffect = computed(() => {
  // 如果 effect 不存在，返回一個提示，避免渲染空內容
  return props.card.effect || '無';
});
</script>

<style scoped>
/* 讓卡片標題在空間不足時可以自動換行，提升響應式體驗 */
.v-card-title.text-wrap {
  white-space: normal;
}
</style>
