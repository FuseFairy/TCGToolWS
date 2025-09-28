<template>
  <v-card class="d-flex flex-column w-100" style="position: relative;"
    :class="{ 'overflow-y-auto themed-scrollbar': !$vuetify.display.mdAndUp }">
    <v-btn icon="mdi-close" variant="tonal" size="small" class="close-button" @click="emit('close')"></v-btn>

    <v-card-text class="pa-0 d-flex flex-column flex-md-row"
      :style="{ overflow: $vuetify.display.mdAndUp ? 'hidden' : 'visible' }">
      <div class="flex-shrink-0 d-flex justify-center align-center pa-4" :style="{
        width: $vuetify.display.mdAndUp ? '40%' : '100%',
        maxWidth: '400px',
        alignSelf: 'center'
      }">
        <v-img :src="props.imgUrl" :alt="props.card.name" rounded="5md" cover :aspect-ratio="400 / 559"
          :max-width="400">
          <template #error>
            <v-img src="/placehold.webp" :aspect-ratio="400 / 559" rounded="5md" cover :max-width="400" />
          </template>
        </v-img>
      </div>

      <div class="flex-grow-1" :style="{ position: $vuetify.display.mdAndUp ? 'relative' : 'static', minWidth: 0 }">
        <div class="themed-scrollbar" :style="{
          position: $vuetify.display.mdAndUp ? 'absolute' : 'static',
          top: $vuetify.display.mdAndUp ? 0 : null,
          left: $vuetify.display.mdAndUp ? 0 : null,
          right: $vuetify.display.mdAndUp ? 0 : null,
          bottom: $vuetify.display.mdAndUp ? 0 : null,
          overflowY: $vuetify.display.mdAndUp ? 'auto' : 'visible',
        }">
          <div class="pa-4">
            <v-card-subtitle class="pb-1 text-body-1 pa-0">
              {{ props.card.product_name }}
            </v-card-subtitle>
            <v-card-title class="pt-0 text-h4 text-wrap pa-0 mb-4">{{ props.card.name }}</v-card-title>

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
            <div v-if="card.trait && card.trait.length > 0 && card.trait[0] !== '-'" class="mt-4">
              <div class="text-h6 font-weight-bold mb-2">特征</div>
              <v-chip v-for="r in card.trait" :key="r" class="mr-2 mb-2" label>{{ r }}</v-chip>
            </div>
            <div v-if="card.link && card.link.length > 0" class="mt-4">
              <div class="text-h6 font-weight-bold mb-2">關聯卡片</div>
              <v-row dense>
                <v-col v-for="card in linkedCards" :key="card.id" style="flex: 0 0 150px; max-width: 150px;">
                  <LinkedCard :card="card" @show-details="handleShowNewCard" />
                </v-col>
              </v-row>
            </div>
          </div>
        </div>
      </div>
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
  linkedCards: { type: Array, required: false, default: () => [] },
});

const formattedEffect = computed(() => props.card.effect || '无');

const handleShowNewCard = (payload) => {
  emit('show-new-card', payload);
};
</script>

<style scoped>
.v-card-title.text-wrap {
  white-space: normal;
}

.close-button {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 15;
  background-color: rgba(0, 0, 0, 0.6) !important;
  color: white !important;
}
</style>
