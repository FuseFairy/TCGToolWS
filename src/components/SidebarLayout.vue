<template>
  <aside class="overflow-y w-25 pl-4 pb-4 d-flex flex-column flex-shrink-0"
    :style="{ paddingTop: `${headerOffsetHeight + 18}px` }">
    <v-sheet rounded="lg" class="pa-4 d-flex flex-column ga-4 flex-grow-1">
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
