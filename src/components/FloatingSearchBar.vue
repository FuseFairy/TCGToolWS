<!-- src/components/MorphingSearch.vue -->
<template>
  <div class="morphing-search-container">
    <div :class="['search-wrapper', { 'is-expanded': isExpanded }]" v-click-outside="collapse">
      <v-text-field ref="inputRef" v-model="searchText" class="search-input" placeholder="查找系列..." variant="plain"
        density="compact" hide-details single-line @keydown.enter="performSearch" />
      <v-btn class="search-button" icon variant="text" @click="toggleExpand">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const emit = defineEmits(['update:searchTerm']);

const isExpanded = ref(false);
const searchText = ref('');
const inputRef = ref(null);

const toggleExpand = async () => {
  if (isExpanded.value && !searchText.value) {
    isExpanded.value = false;
  }
  else if (!isExpanded.value) {
    isExpanded.value = true;
    await nextTick();
    inputRef.value?.focus();
  }
  else {
    performSearch();
  }
};

const collapse = () => {
  isExpanded.value = false;
};

const performSearch = () => {
  if (!searchText.value) return;
  emit('update:searchTerm', searchText.value);
  collapse();
};
</script>

<style scoped>
.morphing-search-container {
  position: fixed;
  top: 13%;
  left: 10px;
  z-index: 1000;
}

.search-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--search-btn-bg);
  overflow: hidden;
  cursor: pointer;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px var(--search-btn-glow),
    0 0 20px var(--search-btn-glow);
  transition: all 0.4s cubic-bezier(0.6, 0.05, 0.28, 0.91);
}

.search-wrapper.is-expanded {
  width: 350px;
  border-radius: 28px;
  background-color: var(--search-btn-bg-expanded);
  cursor: default;
  justify-content: flex-start;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px var(--search-btn-glow-expanded),
    0 0 15px var(--search-btn-glow-expanded);
}

.search-wrapper:hover {
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--search-btn-glow),
    0 0 30px var(--search-btn-glow);
}

.search-wrapper.is-expanded:hover {
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--search-btn-glow-expanded),
    0 0 25px var(--search-btn-glow-expanded);
}

.search-input {
  flex-grow: 1;
  opacity: 0;
  pointer-events: none;
  width: 0;
  padding: 0;
  margin: 0;
  transition: all 0.2s ease-in-out;
  transition-delay: 0.1s;
}

.search-wrapper.is-expanded .search-input {
  opacity: 1;
  pointer-events: auto;
  width: auto;
  padding-left: 20px;
}

.search-button {
  flex-shrink: 0;
  margin: 4px;
  color: var(--search-btn-icon) !important;
}

.search-wrapper.is-expanded .search-button {
  color: var(--search-btn-icon-expanded) !important;
}
</style>
