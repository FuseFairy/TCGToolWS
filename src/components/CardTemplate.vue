<template>
  <v-card class="detail-card d-flex flex-column w-100" variant="flat" color="surface" rounded="3md"
    @click="handleCardClick">
    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <div class="ma-3" style="position: relative;" v-bind="hoverProps">
        <v-skeleton-loader v-if="!imageUrl" class="w-100" rounded="3md"
          style="aspect-ratio: 400/559;"></v-skeleton-loader>
        <v-img v-else :key="card.id" :src="imageUrl" :alt="card.id" :aspect-ratio="400 / 559" cover rounded="3md">
          <template #error>
            <v-img src="/placehold.webp" :alt="card.id" :aspect-ratio="400 / 559" cover rounded="3md" />
          </template>

          <v-fade-transition>
            <div v-if="isHovering && !isTouch" class="d-flex flex-column"
              style="position: absolute; top: 60%; right: 4px; transform: translateY(-50%); opacity: 0.9; gap: 6px;">
              <v-btn icon="mdi-plus" :size="buttonSize" variant="flat" color="grey-darken-3"
                @click.stop="deckStore.addCard(card)"></v-btn>
              <v-btn icon="mdi-minus" :size="buttonSize" variant="flat" color="grey-lighten-2"
                :style="{ visibility: cardCount > 0 ? 'visible' : 'hidden' }"
                @click.stop="deckStore.removeCard(card)"></v-btn>
            </div>
          </v-fade-transition>

          <v-fade-transition>
            <div v-if="cardCount > 0" style="position: absolute; top: 8px; right: 8px;">
              <v-chip color="red" label class="font-weight-bold">{{ cardCount }}</v-chip>
            </div>
          </v-fade-transition>
        </v-img>
      </div>
    </v-hover>

    <div class="card-content pa-3 pt-0">
      <div class="text-grey text-caption-2 mb-1 text-truncate">{{ card.id }}</div>
      <h3 class="text-subtitle-1 font-weight-bold text-truncate">{{ card.name }}</h3>
      <v-row dense :class="isTouch ? 'mt-1' : 'mt-2'" class="text-center">
        <v-col cols="6">
          <div :class="isTouch ? 'text-caption' : 'text-body-2'" class="text-grey">类型</div>
          <div :class="isTouch ? 'text-body-2' : 'text-subtitle-1'" class="font-weight-medium">{{ card.type }}</div>
        </v-col>
        <v-col cols="6">
          <div :class="isTouch ? 'text-caption' : 'text-body-2'" class="text-grey">颜色</div>
          <div :class="isTouch ? 'text-body-2' : 'text-subtitle-1'" class="font-weight-medium">{{ card.color }}</div>
        </v-col>
        <v-col cols="6">
          <div :class="isTouch ? 'text-caption' : 'text-body-2'" class="text-grey">等级</div>
          <div :class="isTouch ? 'text-body-2' : 'text-subtitle-1'" class="font-weight-medium">{{ card.level }}</div>
        </v-col>
        <v-col cols="6">
          <div :class="isTouch ? 'text-caption' : 'text-body-2'" class="text-grey">战力</div>
          <div :class="isTouch ? 'text-body-2' : 'text-subtitle-1'" class="font-weight-medium">{{ card.power }}</div>
        </v-col>
      </v-row>
      <v-row v-if="isTouch" dense class="mt-2 text-center">
        <v-col cols="6">
          <v-btn variant="flat" size="x-small" icon="mdi-plus" color="grey-darken-3"
            @click.stop="deckStore.addCard(card)">
          </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn variant="flat" size="x-small" icon="mdi-minus" color="grey-lighten-2" :disabled="cardCount === 0"
            @click.stop="cardCount > 0 && deckStore.removeCard(card)">
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useCardImage } from '@/composables/useCardImage.js';
import { useDeckStore } from '@/stores/deck';
import { useDevice } from '@/composables/useDevice';

const props = defineProps({
  card: { type: Object, required: true },
});

const emit = defineEmits(['show-details']);

const deckStore = useDeckStore();
const { isTouch } = useDevice();
const { smAndDown } = useDisplay();

const imageUrl = useCardImage(computed(() => props.card.cardIdPrefix), computed(() => props.card.id));
const cardCount = computed(() => deckStore.getCardCount(props.card.id));
const buttonSize = computed(() => smAndDown.value ? 'x-small' : 'small');

const handleCardClick = () => {
  if (!props.card) return;
  emit('show-details', {
    card: props.card,
    imageUrl: imageUrl.value,
  });
};
</script>

<style scoped>
.detail-card {
  transition: transform 0.2s ease-in-out;
  overflow: hidden;
}

.detail-card:hover {
  transform: translateY(-6px);
}

.card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>
