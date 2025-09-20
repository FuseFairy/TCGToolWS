<template>
  <v-tooltip :text="seriesName" location="top center">
    <template v-slot:activator="{ props }">
      <v-lazy :options="{ 'threshold': 0.5 }" transition="fade-transition" class="w-100">
        <v-card v-bind="props" class="series-card d-flex flex-column" hover
          :to="{ name: 'SeriesDetail', params: { seriesName: seriesData.id } }" variant="flat" color="surface"
          rounded="lg">
          <v-img :src="iconUrl" aspect-ratio="1" cover rounded="lg" class="ma-3">
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
              </div>
            </template>
          </v-img>

          <div class="card-content pa-3">
            <div class="d-flex align-center text-caption text-grey-lighten-1 mb-2 text-truncate-container">
              <v-icon start size="small">mdi-layers-outline</v-icon>
              <span class="text-truncate">{{ seriesData.prefixes.join(', ') }}</span>
            </div>

            <p class="text-h6 font-weight-bold text-truncate-container">
              <span class="text-truncate">{{ seriesName }}</span>
            </p>
          </div>
        </v-card>
      </v-lazy>
    </template>
  </v-tooltip>
</template>

<script setup>
import { computed } from 'vue';
import { getAssetsFile } from '@/utils/getAssetsFile.js';

const props = defineProps({
  seriesName: {
    type: String,
    required: true,
  },
  seriesData: {
    type: Object,
    required: true,
  },
});

const iconUrl = computed(() => {
  return getAssetsFile(`series-icons/${props.seriesData.icon}`);
});
</script>

<style scoped>
.series-card {
  transition: all 0.2s ease-in-out;
  overflow: hidden;
  height: 100%;
}

.series-card:hover {
  transform: translateY(-6px);
  box-shadow: none;
}

.card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.text-truncate-container {
  overflow: hidden;
  min-width: 0;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
</style>
