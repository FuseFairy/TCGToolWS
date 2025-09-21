<template>
  <v-container fluid class="h-100 pa-0">
    <FloatingSearch @update:search-term="onSearch" />
    <v-infinite-scroll :key="searchKey" @load="load" empty-text="" class="h-100 themed-scrollbar">
      <v-container class="pt-0">
        <v-row>
          <v-col v-for="item in displayedSeries" :key="item.data.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
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
import { ref, computed, watch } from 'vue';
import { seriesMap } from '@/maps/series-map.js';
import SeriesCard from '@/components/SeriesCard.vue';
import FloatingSearch from '@/components/FloatingSearchBar.vue';

const itemsPerLoad = 24;
const allSeries = ref(
  Object.entries(seriesMap).map(([name, data]) => ({
    name,
    data,
  }))
);
const searchTerm = ref('');
const displayedSeries = ref([]);
const searchKey = ref(0);

const filteredSeries = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) {
    return allSeries.value;
  }
  return allSeries.value.filter(item =>
    item.name.toLowerCase().includes(term)
  );
});

const load = async ({ done }) => {
  const currentLength = displayedSeries.value.length;
  const totalFilteredLength = filteredSeries.value.length;

  if (currentLength >= totalFilteredLength) {
    return done('empty');
  }

  const newItems = filteredSeries.value.slice(
    currentLength,
    currentLength + itemsPerLoad
  );

  await new Promise(resolve => setTimeout(resolve, 100));

  displayedSeries.value.push(...newItems);
  done('ok');
};

watch(searchTerm, () => {
  displayedSeries.value = [];
  searchKey.value++;
});

const onSearch = (newTerm) => {
  searchTerm.value = newTerm;
};
</script>
