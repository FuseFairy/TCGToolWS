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

    <v-fade-transition>
      <v-btn
        v-show="isFabVisible"
        position="fixed"
        location="bottom right"
        icon
        size="large"
        class="ma-4 back-to-top-btn"
        @click="scrollToTop"
      >
        <v-img
          :src="WsIcon"
          alt="Back to top"
          width="28"
          height="28"
          draggable="false"
          :style="{ filter: iconFilterStyle }"
        />
      </v-btn>
    </v-fade-transition>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTheme } from 'vuetify'
import { useInfiniteScrollState } from '@/composables/useInfiniteScrollState.js'
import { seriesMap } from '@/maps/series-map.js'
import SeriesCard from '@/components/SeriesCard.vue'
import FloatingSearch from '@/components/FloatingSearchBar.vue'
import collator from '@/utils/collator.js'
import WsIcon from '@/assets/ui/ws-icon.svg'

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

const storageKey = computed(() => 'seriesCardTableViewState')

useInfiniteScrollState({
  storageKey,
  scrollRef: infiniteScrollRef,
  onSave: () => {
    const scrollableElement = infiniteScrollRef.value?.$el
    if (scrollableElement) {
      return {
        itemCount: displayedSeries.value.length,
        scrollPosition: scrollableElement.scrollTop,
      }
    }
    return null
  },
  onRestore: (savedState) => {
    if (savedState.itemCount > 0) {
      displayedSeries.value = filteredSeries.value.slice(0, savedState.itemCount)
    }
    nextTick(() => {
      const scrollableElement = infiniteScrollRef.value?.$el
      if (scrollableElement) {
        scrollableElement.scrollTop = savedState.scrollPosition
      }
    })
  },
})

const theme = useTheme()

const iconFilterStyle = computed(() => {
  return theme.global.name.value === 'light' ? 'invert(1)' : 'none'
})

const isFabVisible = ref(false)
const scrollContainer = ref(null)

const onScroll = () => {
  if (!scrollContainer.value) return

  const scrollTop = scrollContainer.value.scrollTop
  isFabVisible.value = scrollTop > 300
}

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  scrollContainer.value = infiniteScrollRef.value?.$el
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', onScroll)
  }
})

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', onScroll)
  }
})
</script>

<style scoped>
.back-to-top-btn {
  opacity: 0.8;
}
</style>
