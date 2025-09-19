<template>
  <v-container>
    <v-row>
      <v-col v-for="(data, name) in seriesMap" :key="data.id" cols="6" sm="4" md="3" lg="2" class="d-flex">
        <SeriesCard :series-name="name" :series-data="data" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { seriesMap } from '@/maps/series-map.js';
import SeriesCard from '@/components/SeriesCard.vue';
</script>
