<template>
  <v-card variant="tonal" class="linked-card" rounded="lg" @click="handleCardClick">
    <v-img :src="imageUrl" :aspect-ratio="400 / 559" rounded="lg" cover>
      <template #error>
        <v-img src="/placehold.webp" :aspect-ratio="400 / 559" cover />
      </template>
    </v-img>
    <div class="pa-2" style="width: 100%;">
      <div class="text-caption text-grey text-truncate">{{ props.card.id }}</div>
      <div class="text-subtitle-2 font-weight-bold text-truncate" style="height: 24px;">
        <span>{{ props.card.name }}</span>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { toRefs } from 'vue';
import { useCardImage } from '@/composables/useCardImage.js';

const props = defineProps({
  card: { type: Object, required: true },
});

const emit = defineEmits(['show-details']);

const cardId = toRefs(props.card).id;

const imageUrl = useCardImage(cardId);

const handleCardClick = () => {
  emit('show-details', {
    card: props.card,
    imageUrl: imageUrl.value,
  });
};
</script>

<style scoped>
.linked-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.linked-card:hover {
  transform: translateY(-4px);
}
</style>
