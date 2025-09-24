<template>
  <aside class="d-flex flex-column flex-shrink-0" :style="{ paddingTop: `${headerOffsetHeight + 18}px` }">
    <v-sheet rounded="lg" class="pa-4 ga-4 d-flex flex-column flex-grow-1 overflow-y-auto themed-scrollbar">
      <slot></slot>
      <v-spacer class="fill-height"></v-spacer>
    </v-sheet>
  </aside>
</template>

<script setup>
defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  }
});
</script>
