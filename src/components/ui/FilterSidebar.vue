<template>
  <BaseFilterSidebar
    v-bind="$attrs"
    :headerOffsetHeight="headerOffsetHeight"
    :transparent="transparent"
    :filterStore="filterStore"
  />
</template>

<script setup>
import BaseFilterSidebar from '@/components/base/BaseFilterSidebar.vue'
import { useFilterStore } from '@/stores/filter'

defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  },
  transparent: {
    type: Boolean,
    default: false,
  },
})

const filterStore = useFilterStore()
</script>

<style scoped></style>
