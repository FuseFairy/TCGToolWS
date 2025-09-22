<template>
  <v-card v-if="!isLoading && croppedImageUrl && cardInfo" class="detail-card d-flex flex-column w-100" variant="flat"
    color="surface" rounded="lg" hover style="min-width: 0;">
    <v-img :src="croppedImageUrl" :alt="card.id" :title="card.id" class="ma-3" rounded="lg">
      <template #placeholder>
        <v-skeleton-loader class="h-100"></v-skeleton-loader>
      </template>
      <template #error>
        <v-alert type="error" density="compact" class="text-caption h-100" title="Image Error"></v-alert>
      </template>
    </v-img>

    <div class="card-content pa-3 pt-0">
      <div class="text-grey text-caption-2 mb-1 text-truncate">{{ card.id }}</div>
      <h3 class="text-subtitle-1 font-weight-bold text-truncate">{{ cardInfo.name }}</h3>

      <v-row dense class="mt-2" justify="center" align="center">
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">类型</div>
          <div class="text-subtitle-1 font-weight-medium">{{ cardInfo.type }}</div>
        </v-col>
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">颜色</div>
          <div class="text-subtitle-1 font-weight-medium">{{ cardInfo.color }}</div>
        </v-col>
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">等级</div>
          <div class="text-subtitle-1 font-weight-medium">{{ cardInfo.level }}</div>
        </v-col>
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">战力</div>
          <div class="text-subtitle-1 font-weight-medium">{{ cardInfo.power }}</div>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useSpriteSheet } from '@/composables/useSpriteSheet.js';
import { useCroppedImage } from '@/composables/useCroppedImage.js';
import { useCardInfo } from '@/composables/useCardInfo.js';

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
});

const spriteName = computed(() => props.card.spriteName);
const cardId = computed(() => props.card.id);

const {
  imageUrl,
  metadata,
  isLoading: isLoadingSpriteSheet,
} = useSpriteSheet(spriteName);
const { croppedImageUrl, isLoading: isLoadingCroppedImage } = useCroppedImage(imageUrl, metadata, cardId);
const { cardInfo, isLoading: isLoadingCardInfo } = useCardInfo(spriteName, cardId);
const isLoading = computed(() => isLoadingSpriteSheet.value && isLoadingCroppedImage.value && isLoadingCardInfo.value);
</script>

<style scoped>
.detail-card {
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

.detail-card:hover {
  transform: translateY(-6px);
  box-shadow: none;
}

.card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>
