<template>
  <v-container fluid class="pa-0 fill-height">
    <FloatingSearch @update:search-term="onSearch" />
    <v-virtual-scroll :items="chunkedSeries" class="h-100 themed-scrollbar">
      <template v-slot:default="{ item: rowItems }">
        <v-container class="pa-0 fill-height">
          <v-row class="ma-0">
            <v-col v-for="item in rowItems" :key="item.data.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
              <SeriesCard :series-name="item.name" :series-data="item.data" />
            </v-col>
          </v-row>
        </v-container>
      </template>
    </v-virtual-scroll>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { seriesMap } from '@/maps/series-map.js';
import SeriesCard from '@/components/SeriesCard.vue';
import FloatingSearch from '@/components/FloatingSearchBar.vue';

const { lgAndUp, mdAndUp, smAndUp } = useDisplay();
const searchTerm = ref('');

const onSearch = (newTerm) => {
  searchTerm.value = newTerm;
};

const seriesArray = computed(() => {
  return Object.entries(seriesMap).map(([name, data]) => ({
    name,
    data,
  }));
});

const filteredSeries = computed(() => {
  if (!searchTerm.value) {
    return seriesArray.value;
  }
  return seriesArray.value.filter(item =>
    item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const colsPerRow = computed(() => {
  if (lgAndUp.value) return 6; // lg="2" -> 12/2 = 6
  if (mdAndUp.value) return 4; // md="3" -> 12/3 = 4
  if (smAndUp.value) return 3; // sm="4" -> 12/4 = 3
  return 2; // cols="6" -> 12/6 = 2
});

const chunkedSeries = computed(() => {
  const chunks = [];
  const items = filteredSeries.value;
  const perRow = colsPerRow.value;

  for (let i = 0; i < items.length; i += perRow) {
    chunks.push(items.slice(i, i + perRow));
  }
  return chunks;
});
</script>
