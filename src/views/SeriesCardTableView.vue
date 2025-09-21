<template>
  <v-container fluid class="fill-height pa-0">
    <v-virtual-scroll :items="chunkedSeries" class="h-100 themed-scrollbar">
      <template v-slot:default="{ item: rowItems }">
        <v-row class="ma-0">
          <v-col v-for="item in rowItems" :key="item.data.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
            <SeriesCard :series-name="item.name" :series-data="item.data" />
          </v-col>
        </v-row>
      </template>
    </v-virtual-scroll>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { seriesMap } from '@/maps/series-map.js';
import SeriesCard from '@/components/SeriesCard.vue';

const { lgAndUp, mdAndUp, smAndUp } = useDisplay();

const seriesArray = computed(() => {
  return Object.entries(seriesMap).map(([name, data]) => ({
    name,
    data,
  }));
});

const colsPerRow = computed(() => {
  if (lgAndUp.value) return 6; // lg="2" -> 12/2 = 6
  if (mdAndUp.value) return 4; // md="3" -> 12/3 = 4
  if (smAndUp.value) return 3; // sm="4" -> 12/4 = 3
  return 2; // cols="6" -> 12/6 = 2
});

const chunkedSeries = computed(() => {
  const chunks = [];
  const items = seriesArray.value;
  const perRow = colsPerRow.value;

  for (let i = 0; i < items.length; i += perRow) {
    chunks.push(items.slice(i, i + perRow));
  }
  return chunks;
});
</script>
