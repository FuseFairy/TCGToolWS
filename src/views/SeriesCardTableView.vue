<template>
  <v-container fluid class="h-100 pa-0">
    <FloatingSearch @update:search-term="onSearch" />
    <v-infinite-scroll
      ref="infiniteScrollRef"
      @load="load"
      empty-text=""
      class="h-100 themed-scrollbar"
    >
      <v-container class="pt-0">
        <v-row>
          <v-col
            v-for="item in displayedSeries"
            :key="item.data.id"
            cols="6"
            sm="3"
            md="2"
            class="d-flex"
          >
            <SeriesCard :series-name="item.name" :series-data="item.data" />
          </v-col>
        </v-row>

        <template v-slot:loading>
          <v-row justify="center" class="my-4">
            <v-progress-circular indeterminate />
          </v-row>
        </template>
      </v-container>
    </v-infinite-scroll>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { seriesMap } from '@/maps/series-map.js'
import SeriesCard from '@/components/SeriesCard.vue'
import FloatingSearch from '@/components/FloatingSearchBar.vue'
import collator from '@/utils/collator.js'

const itemsPerLoad = 24
const allSeries = ref(
  Object.entries(seriesMap).map(([name, data]) => ({
    name,
    data,
  }))
)
const searchTerm = ref('')
const displayedSeries = ref([])
const infiniteScrollRef = ref(null)

const filteredSeries = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  const list = term
    ? allSeries.value.filter((item) => item.name.toLowerCase().includes(term))
    : allSeries.value.slice()

  return list.sort((a, b) => collator.compare(a.name, b.name))
})

const load = async ({ done }) => {
  const currentLength = displayedSeries.value.length
  const totalFilteredLength = filteredSeries.value.length

  if (currentLength >= totalFilteredLength) {
    return done('empty')
  }

  const newItems = filteredSeries.value.slice(currentLength, currentLength + itemsPerLoad)

  await new Promise((resolve) => setTimeout(resolve, 100))

  displayedSeries.value.push(...newItems)
  done('ok')
}

watch(searchTerm, () => {
  displayedSeries.value = []
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
  }
})

const onSearch = (newTerm) => {
  searchTerm.value = newTerm
}

onMounted(() => {
  const savedState = sessionStorage.getItem('seriesCardTableViewState')
  if (savedState) {
    const { series, scrollPosition } = JSON.parse(savedState)
    displayedSeries.value = series
    nextTick(() => {
      if (infiniteScrollRef.value) {
        const scrollableElement = infiniteScrollRef.value.$el
        scrollableElement.scrollTop = scrollPosition
      }
    })
  }
})

onBeforeRouteLeave((to, from, next) => {
  if (infiniteScrollRef.value) {
    const scrollableElement = infiniteScrollRef.value.$el
    const savedState = {
      series: displayedSeries.value,
      scrollPosition: scrollableElement.scrollTop,
    }
    sessionStorage.setItem('seriesCardTableViewState', JSON.stringify(savedState))
  }
  next()
})
</script>
