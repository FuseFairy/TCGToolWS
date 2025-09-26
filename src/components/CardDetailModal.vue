<template>
  <v-card class="d-flex flex-column h-50" style="position: relative;">
    <v-btn icon="mdi-close" variant="text" class="close-button" @click="emit('close')"></v-btn>
    <v-card-text class="overflow-y-auto themed-scrollbar">
      <v-row class="fill-height">
        <v-col cols="12" md="5" class="d-flex justify-center align-center">
          <v-img :src="props.imgUrl" :alt="props.card.name" rounded="lg" cover :aspect-ratio="400 / 559">
            <template #error>
              <v-img :src="'/placehold.webp'" :aspect-ratio="400 / 559" cover rounded="lg" />
            </template>
          </v-img>
        </v-col>

        <v-col cols="12" md="7">
          <v-card-subtitle class="pb-1 text-body-1">{{ props.card.product_name }}</v-card-subtitle>
          <v-card-title class="pt-0 text-h4 text-wrap">{{ props.card.name }}</v-card-title>

          <v-row dense class="my-4 text-center">
            <v-col>
              <div class="text-body-2 text-grey">等级</div>
              <div class="font-weight-bold text-h5">{{ props.card.level }}</div>
            </v-col>
            <v-col>
              <div class="text-body-2 text-grey">费用</div>
              <div class="font-weight-bold text-h5">{{ props.card.cost }}</div>
            </v-col>
            <v-col>
              <div class="text-body-2 text-grey">战斗力</div>
              <div class="font-weight-bold text-h5">{{ props.card.power }}</div>
            </v-col>
            <v-col>
              <div class="text-body-2 text-grey">灵魂值</div>
              <div class="font-weight-bold text-h5">{{ props.card.soul }}</div>
            </v-col>
          </v-row>

          <v-divider class="mb-4"></v-divider>

          <div>
            <div class="text-h6 font-weight-bold mb-2">效果</div>
            <div class="text-body-1" v-html="formattedEffect"></div>
          </div>

          <!-- 特征 -->
          <div v-if="card.trait && card.trait.length > 0 && card.trait[0] !== '-'" class="mt-4">
            <div class="text-h6 font-weight-bold mb-2">特征</div>
            <v-chip v-for="r in card.trait" :key="r" class="mr-2 mb-2" color="primary" label>
              {{ r }}
            </v-chip>
          </div>

          <div v-if="card.link && card.link.length > 0" class="mt-4">
            <div class="text-h6 font-weight-bold mb-2">關聯卡片</div>
            <!-- 使用 v-row 和 v-col 來建立一個網格佈局 -->
            <v-row dense>
              <v-col v-for="linkId in card.link" :key="linkId" cols="6" sm="4">
                <LinkedCard :card="cardIdMap.get(linkId)" @show-details="handleShowNewCard" />
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import LinkedCard from './LinkedCard.vue';

const emit = defineEmits(['close', 'show-new-card']);

const props = defineProps({
  card: { type: Object, required: true },
  imgUrl: { type: String, required: true },
  allCards: { type: Array, required: false },
});

const formattedEffect = computed(() => props.card.effect || '无');
const cardIdMap = computed(() => {
  return new Map(props.allCards.map(c => [c.id, c]));
});

const handleShowNewCard = (payload) => {
  emit('show-new-card', payload);
};
</script>

<style scoped>
.v-card-title.text-wrap {
  white-space: normal;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}
</style>
