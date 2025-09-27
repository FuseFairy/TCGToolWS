<template>
  <v-card class="detail-card d-flex flex-column w-100" variant="flat" color="surface" rounded="3md" hover
    style="min-width: 0; " @click="handleCardClick">

    <div class="ma-3">
      <v-skeleton-loader v-if="!imageUrl" class="h-100" rounded="3md"
        style="aspect-ratio: 400/559;"></v-skeleton-loader>
      <v-img v-else :key="card.id" :src="imageUrl" :alt="card.id" :title="card.id" :aspect-ratio="400 / 559" cover
        rounded="3md">
        <template #error>
          <v-img :key="card.id" src="/placehold.webp" alt="card.id" :title="card.id" :aspect-ratio="400 / 559" cover
            rounded="3md" />
        </template>
      </v-img>
    </div>

    <div class="card-content pa-3 pt-0">
      <div class="text-grey text-caption-2 mb-1 text-truncate">{{ card.id }}</div>
      <h3 class="text-subtitle-1 font-weight-bold text-truncate" :class="{ 'd-flex align-center': !imageUrl }"
        style="height: 28px; overflow: hidden;">
        <v-skeleton-loader v-if="!imageUrl" type="text" width="60%"></v-skeleton-loader>
        <template v-else-if="cardInfo">{{ cardInfo.name }}</template>
      </h3>

      <v-row dense class="mt-2" justify="center" align="center">
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">类型</div>
          <div class="text-subtitle-1 font-weight-medium" :class="{ 'd-flex justify-center align-center': !imageUrl }"
            style="height: 28px; overflow: hidden;">
            <v-skeleton-loader v-if="!imageUrl" type="text" width="45px"></v-skeleton-loader>
            <template v-else-if="cardInfo">{{ cardInfo.type }}</template>
          </div>
        </v-col>
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">颜色</div>
          <div class="text-subtitle-1 font-weight-medium" :class="{ 'd-flex justify-center align-center': !imageUrl }"
            style="height: 28px; overflow: hidden;">
            <v-skeleton-loader v-if="!imageUrl" type="text" width="45px"></v-skeleton-loader>
            <template v-else-if="cardInfo">{{ cardInfo.color }}</template>
          </div>
        </v-col>
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">等级</div>
          <div class="text-subtitle-1 font-weight-medium" :class="{ 'd-flex justify-center align-center': !imageUrl }"
            style="height: 28px; overflow: hidden;">
            <v-skeleton-loader v-if="!imageUrl" type="text" width="45px"></v-skeleton-loader>
            <template v-else-if="cardInfo">{{ cardInfo.level }}</template>
          </div>
        </v-col>
        <v-col cols="6" class="text-truncate text-center">
          <div class="text-grey text-body-1">战力</div>
          <div class="text-subtitle-1 font-weight-medium" :class="{ 'd-flex justify-center align-center': !imageUrl }"
            style="height: 28px; overflow: hidden;">
            <v-skeleton-loader v-if="!imageUrl" type="text" width="45px"></v-skeleton-loader>
            <template v-else-if="cardInfo">{{ cardInfo.power }}</template>
          </div>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useCardImage } from '@/composables/useCardImage.js';

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['show-details']);
const cardInfo = computed(() => props.card);
const cardId = computed(() => props.card.id);
const cardIdPrefix = computed(() => props.card.cardIdPrefix);

const imageUrl = useCardImage(cardIdPrefix, cardId);

const handleCardClick = () => {
  if (!cardInfo.value) return;

  emit('show-details', {
    card: cardInfo.value,
    imageUrl: imageUrl.value,
  });
};
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
