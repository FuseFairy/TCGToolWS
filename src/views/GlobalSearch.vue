<template>
  <v-layout>
    <v-main>
      <div
        v-if="store.isLoading"
        class="d-flex flex-column align-center justify-center fill-height"
      >
        <v-progress-circular indeterminate size="64"></v-progress-circular>
        <div class="mt-4">正在建立或載入全域索引，請稍候...</div>
      </div>
      <CardInfiniteScrollList
        v-else
        ref="cardListRef"
        :cards="store.searchResults"
        :header-offset-height="64"
        empty-text="~沒有找到符合條件的卡片~"
        key="global-search-list"
      />
    </v-main>

    <v-navigation-drawer>
      <GlobalFilterSidebar :header-offset-height="0" transparent />
    </v-navigation-drawer>
  </v-layout>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useGlobalSearchStore } from '@/stores/globalSearch'
import GlobalFilterSidebar from '@/components/search/GlobalFilterSidebar.vue'
import CardInfiniteScrollList from '@/components/card/CardInfiniteScrollList.vue'
import { debounce } from 'lodash-es'

const store = useGlobalSearchStore()
const cardListRef = ref(null)

onMounted(() => {
  store.initialize()
})

const debouncedSearch = debounce(async () => {
  if (store.isReady) {
    await store.search()
    cardListRef.value?.reset()
  }
}, 300)

watch(
  [
    () => store.keyword,
    () => store.selectedCardTypes,
    () => store.selectedColors,
    () => store.selectedProductName,
    () => store.selectedTraits,
    () => store.selectedLevels,
    () => store.selectedRarities,
    () => store.showUniqueCards,
    () => store.selectedCostRange,
    () => store.selectedPowerRange,
  ],
  debouncedSearch,
  { deep: true }
)
</script>
