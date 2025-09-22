<template>
  <div ref="draggableContainer" class="floating-search-container" :style="containerStyle" @mousedown="startDrag"
    @touchstart="startDrag">
    <div :class="['search-wrapper', { 'is-expanded': isExpanded }]" v-click-outside="collapse">
      <v-text-field ref="inputRef" v-model="searchText" class="search-input" placeholder="查找系列..." variant="plain"
        density="compact" hide-details single-line @keydown.enter="performSearch" />
      <v-btn class="search-button" icon variant="text" @touchend="handleButtonTap">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['update:searchTerm']);

const isExpanded = ref(false);
const searchText = ref('');
const inputRef = ref(null);

const draggableContainer = ref(null);
const position = ref({ x: 10, y: window.innerHeight * 0.13 });
const dragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const movedDuringDrag = ref(false);

const containerStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px)`,
}));

onMounted(() => {
  if (draggableContainer.value) {
    position.value = {
      x: 10,
      y: window.innerHeight * 0.13,
    };
  }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', drag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', drag);
  window.removeEventListener('touchend', stopDrag);
});

const startDrag = (event) => {
  // Prevent dragging when clicking on the input field
  if (isExpanded.value) {
    return;
  }
  movedDuringDrag.value = false;
  dragging.value = true;
  document.body.style.cursor = 'grabbing';

  const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX;
  const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY;

  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y,
  };
  window.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', drag, { passive: false });
  window.addEventListener('touchend', stopDrag, { passive: false });
};

const drag = (event) => {
  if (dragging.value) {
    event.preventDefault();
    document.body.style.pointerEvents = 'none';
    movedDuringDrag.value = true;
    const parentRect = draggableContainer.value.parentElement.getBoundingClientRect();

    const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX;
    const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY;

    const newX = clientX - dragOffset.value.x;
    const newY = clientY - dragOffset.value.y;

    const elRect = draggableContainer.value.getBoundingClientRect();

    position.value.x = Math.max(
      0,
      Math.min(newX, parentRect.width - elRect.width)
    );
    position.value.y = Math.max(
      0,
      Math.min(newY, parentRect.height - elRect.height)
    );
  }
};

const stopDrag = () => {
  dragging.value = false;
  document.body.style.cursor = 'auto';
  document.body.style.pointerEvents = 'auto';
  window.removeEventListener('mousemove', drag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', drag, { passive: false });
  window.removeEventListener('touchend', stopDrag, { passive: false });

  if (!movedDuringDrag.value) {
    toggleExpand();
  }
};

const toggleExpand = async () => {
  if (movedDuringDrag.value) {
    return;
  }
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
  emit('update:searchTerm', searchText.value);
  collapse();
};

const handleButtonTap = () => {
  if (movedDuringDrag.value) {
    return;
  }
  if (isExpanded.value) {
    performSearch();
  } else {
    toggleExpand(); // This will expand the search bar
  }
};
</script>

<style scoped>
.floating-search-container {
  position: absolute;
  z-index: 1000;
  cursor: grab;
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
  border-radius: 28px;
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