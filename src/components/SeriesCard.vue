<template>
  <v-tooltip :text="seriesName" location="top center">
    <template v-slot:activator="{ props }">
      <v-card v-bind="props" class="series-card d-flex flex-column" hover
        :to="{ name: 'SeriesDetail', params: { seriesId: seriesData.id } }" variant="flat" color="surface"
        rounded="3md">
        <v-img :src="iconUrl" aspect-ratio="1" cover rounded="3md" class="ma-3">
          <template v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
            </div>
          </template>
        </v-img>

        <div class="card-content pa-3 pt-1">
          <div class="d-flex align-center text-caption text-grey-lighten-1 mb-2 text-truncate">
            <v-icon start size="small">mdi-layers-outline</v-icon>
            {{ seriesData.prefixes.join(', ') }}
          </div>

          <p class="text-subtitle-2 text-sm-subtitle-1 text-truncate">
            {{ seriesName }}
          </p>
        </div>
      </v-card>
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
</style>
