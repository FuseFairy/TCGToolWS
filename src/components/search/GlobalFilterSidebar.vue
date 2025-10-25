<template>
  <BaseFilterSidebar
    v-bind="$attrs"
    :headerOffsetHeight="headerOffsetHeight"
    :transparent="transparent"
    :filterStore="globalSearchStore"
  />
</template>

<script setup>
import BaseFilterSidebar from '@/components/base/BaseFilterSidebar.vue'
import { useGlobalSearchStore } from '@/stores/globalSearch'

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

const globalSearchStore = useGlobalSearchStore()
</script>

<style scoped></style>
