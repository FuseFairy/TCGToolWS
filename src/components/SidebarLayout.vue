<template>
  <aside class="d-flex flex-column flex-shrink-0" :style="{ paddingTop: `${smAndUp ? headerOffsetHeight + 18 : 0}px` }">
    <v-sheet :rounded="smAndUp ? '3md' : false"
      class="pa-4 ga-4 d-flex flex-column flex-grow-1 overflow-y-auto themed-scrollbar">
      <slot></slot>
    </v-sheet>
  </aside>
</template>

<script setup>
import { useDisplay } from 'vuetify';

const { smAndUp } = useDisplay();

defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  }
});
</script>
