<template>
  <v-infinite-scroll @load="load" :empty-text="emptyText" :margin="margin" :class="$attrs.class">
    <v-responsive :height="headerOffsetHeight"></v-responsive>

    <v-row class="ma-0">
      <v-col v-for="card in displayedCards" :key="card.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
        <CardTemplate :card="card" />
      </v-col>
    </v-row>

    <template v-if="displayedCards.length === 0 && emptyText" #empty>
      <div class="text-center text-grey mt-4">{{ emptyText }}</div>
    </template>
  </v-infinite-scroll>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import CardTemplate from '@/components/CardTemplate.vue';

const props = defineProps({
  cards: {
    type: Array,
    required: true,
  },
  itemsPerLoad: {
    type: Number,
    default: 24,
  },
  emptyText: {
    type: String,
    default: '~没有找到更多项目~',
  },
  margin: {
    type: [String, Number],
    default: 300,
  },
  headerOffsetHeight: {
    type: Number,
    default: 0
  }
});

const page = ref(1);

const displayedCards = computed(() => props.cards.slice(0, page.value * props.itemsPerLoad));

const load = async ({ done }) => {
  if (displayedCards.value.length >= props.cards.length) {
    return done('empty');
  }
  await new Promise(resolve => setTimeout(resolve, 150));
  page.value++;
  done('ok');
};

watch(() => props.cards, () => {
  page.value = 1;
}, { immediate: true });
</script>
