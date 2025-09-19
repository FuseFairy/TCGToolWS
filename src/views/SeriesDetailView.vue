<template>
  <h1>{{ props.seriesName }}</h1>
</template>

<script setup>
const props = defineProps({
  seriesName: {
    type: String,
    required: true,
  },
});
</script>
