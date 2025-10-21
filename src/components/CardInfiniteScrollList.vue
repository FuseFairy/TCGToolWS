<template>
  <v-container
    v-if="cards.length === 0"
    class="d-flex align-center justify-center text-grey h-100 w-100"
    :="$attrs"
  >
    {{ emptyText }}
  </v-container>

  <v-infinite-scroll
    v-else
    ref="infiniteScrollRef"
    @load="load"
    empty-text=""
    :margin="margin"
    :="$attrs"
  >
    <TransitionGroup
      name="card-transition"
      tag="div"
      class="card-grid-container"
      :class="{ 'freeze-layout': isLayoutFrozen }"
      :style="{
        paddingTop: `${headerOffsetHeight - 10}px`,
        gridTemplateColumns: frozenColumns,
      }"
    >
      <div v-for="card in displayedCards" :key="card.id" class="d-flex justify-center">
        <CardTemplate :card="card" @show-details="onShowDetails" />
      </div>
    </TransitionGroup>
  </v-infinite-scroll>

  <v-dialog
    v-if="selectedCardData"
    v-model="isModalVisible"
    :max-width="smAndDown ? '100%' : '60%'"
    :max-height="smAndDown ? '80%' : '95%'"
    :min-height="smAndDown ? null : '60%'"
  >
    <CardDetailModal
      :card="selectedCardData.card"
      :img-url="selectedCardData.imageUrl"
      :linked-cards="selectedLinkedCards"
      :is-loading-links="isLoadingLinks"
      :showActions="true"
      :card-index="selectedCardIndex"
      :total-cards="displayedCards.length"
      @close="isModalVisible = false"
      @show-new-card="onShowNewCard"
      @prev-card="onPrevCard"
      @load-more="load({ done: () => {} })"
      @next-card="onNextCard"
    />
  </v-dialog>

  <BackToTopButton :scroll-container="scrollContainer" :extra-class="{ 'mb-18': xs }" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useTheme, useDisplay } from 'vuetify'
import CardTemplate from '@/components/CardTemplate.vue'
import CardDetailModal from '@/components/CardDetailModal.vue'
import BackToTopButton from '@/components/BackToTopButton.vue'
import { fetchCardsByBaseIdAndPrefix } from '@/utils/card'
import { useCardImage } from '@/composables/useCardImage.js'
import { useCardNavigation } from '@/composables/useCardNavigation.js'
import { useUIStore } from '@/stores/ui'
import collator from '@/utils/collator.js'

const props = defineProps({
  cards: {
    type: Array,
    required: true,
  },
  itemsPerLoad: {
    type: Number,
    default: 24,
  },
  emptyText: {
    type: String,
    default: '~没有更多卡片~',
  },
  margin: {
    type: [String, Number],
    default: 300,
  },
  headerOffsetHeight: {
    type: Number,
    default: 0,
  },
})

const { smAndDown, xs } = useDisplay()
const theme = useTheme()
const uiStore = useUIStore()

const isModalVisible = ref(false)
const selectedCardData = ref(null)
const selectedLinkedCards = ref([])
const isLoadingLinks = ref(false)

const displayedCards = computed(() => props.cards.slice(0, page.value * props.itemsPerLoad))
const selectedCard = computed(() => selectedCardData.value?.card)

const { selectedCardIndex, getPrevCard, getNextCard } = useCardNavigation(
  displayedCards,
  selectedCard
)

const onPrevCard = () => {
  const prevCard = getPrevCard()
  if (prevCard) {
    onShowDetails({
      card: prevCard,
      imageUrl: useCardImage(prevCard.cardIdPrefix, prevCard.id).value,
    })
  }
}

const onNextCard = () => {
  const nextCard = getNextCard()
  if (nextCard) {
    onShowDetails({
      card: nextCard,
      imageUrl: useCardImage(nextCard.cardIdPrefix, nextCard.id).value,
    })
  }
}

const fetchLinkedCards = async (card) => {
  if (!card?.link || card.link.length === 0) {
    selectedLinkedCards.value = []
    return
  }

  try {
    isLoadingLinks.value = true

    // sanitize all link IDs to get clean base IDs.
    const baseIds = [...new Set(card.link.map((linkId) => linkId.replace(/[a-zA-Z]+$/, '')))]
    const linkRequests = baseIds.map(
      async (baseId) => await fetchCardsByBaseIdAndPrefix(baseId, card.cardIdPrefix)
    )

    const linkedCardsData = await Promise.all(linkRequests)
    selectedLinkedCards.value = linkedCardsData
      .flat()
      .filter(Boolean)
      .sort((a, b) => collator.compare(a.name, b.name))
  } catch (error) {
    console.error('Failed to fetch linked cards:', error)
    selectedLinkedCards.value = []
  } finally {
    isLoadingLinks.value = false
  }
}

const onShowDetails = async (payload) => {
  selectedCardData.value = payload
  isModalVisible.value = true
  await fetchLinkedCards(payload.card)
}

const onShowNewCard = async (payload) => {
  selectedCardData.value = payload
  await fetchLinkedCards(payload.card)
}

const page = ref(1)
const infiniteScrollRef = ref(null)

const load = async ({ done }) => {
  if (displayedCards.value.length >= props.cards.length) {
    return done('empty')
  }
  await new Promise((resolve) => setTimeout(resolve, 150))
  page.value++
  done('ok')
}

const reset = () => {
  page.value = 1
  if (infiniteScrollRef.value) {
    infiniteScrollRef.value.reset()
    nextTick(() => {
      if (infiniteScrollRef.value?.$el) {
        infiniteScrollRef.value.$el.scrollTop = 0
      }
    })
  }
}

const getScrollState = () => {
  return {
    page: page.value,
    scrollTop: infiniteScrollRef.value?.$el.scrollTop ?? 0,
  }
}

const restoreScrollState = (state) => {
  if (state) {
    page.value = state.page
    nextTick(() => {
      if (infiniteScrollRef.value?.$el) {
        infiniteScrollRef.value.$el.scrollTop = state.scrollTop
      }
    })
  }
}

defineExpose({
  reset,
  getScrollState,
  restoreScrollState,
})

const scrollContainer = ref(null)

// Layout freeze logic for smooth sidebar transitions
const isLayoutFrozen = ref(false)
const frozenColumns = ref(null)
const gridElement = ref(null)
let freezeTimeout = null

const captureCurrentColumns = () => {
  if (!gridElement.value) return null

  const computedStyle = window.getComputedStyle(gridElement.value)
  return computedStyle.gridTemplateColumns
}

const freezeLayout = () => {
  // Capture current column layout before sidebar animation
  frozenColumns.value = captureCurrentColumns()
  isLayoutFrozen.value = true

  // Clear any existing timeout
  if (freezeTimeout) {
    clearTimeout(freezeTimeout)
  }

  // Unfreeze after sidebar animation completes (0.4s) + small buffer
  freezeTimeout = setTimeout(() => {
    isLayoutFrozen.value = false
    // Wait one more frame before clearing frozen columns to allow smooth transition
    requestAnimationFrame(() => {
      frozenColumns.value = null
    })
  }, 450)
}

// Watch sidebar states from UI store
watch([() => uiStore.isFilterOpen, () => uiStore.isCardDeckOpen], () => {
  freezeLayout()
})

onMounted(() => {
  // Use the v-infinite-scroll element as the scroll container
  scrollContainer.value = infiniteScrollRef.value?.$el

  if (!scrollContainer.value) {
    // Fallback if the ref isn't available for some reason
    scrollContainer.value = document.documentElement
  }

  // Get reference to grid element
  nextTick(() => {
    gridElement.value = infiniteScrollRef.value?.$el?.querySelector('.card-grid-container')
  })
})

onUnmounted(() => {
  if (freezeTimeout) {
    clearTimeout(freezeTimeout)
  }
})
</script>

<style scoped>
.card-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  width: 100%;
}

/* When layout is frozen, use the captured column layout */
.card-grid-container.freeze-layout {
  transition: none;
}

/*
 * Enter Animation: Pop-up effect for new cards.
 * When a new card is added to the DOM, it scales up from a transparent,
 * smaller state.
 */
.card-transition-enter-from {
  opacity: 0;
  transform: scale(0);
}
.card-transition-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.card-transition-enter-to {
  opacity: 1;
  transform: scale(1);
}

/*
 * Leave Animation: Its main purpose is to allow time for the move animation
 * and to hide rendering artifacts. `position: absolute` takes the element out
 * of the document flow, so the move animation can play. `opacity: 0` hides
 * potential visual glitches where the element might "jump" before being removed.
 */
.card-transition-leave-active {
  transition: opacity 0.3s ease;
  position: absolute;
}

.card-transition-leave-to {
  opacity: 0;
}

/*
 * Move Animation: Allows remaining cards to move smoothly to their new
 * positions after filtering. This is triggered by the FLIP mechanism.
 */
.card-transition-move {
  transition: transform 0.5s ease;
}

/* 740 is a mysterious number, a chosen number woven from human effort, blood, and tears. */
@media (max-width: 740px) {
  .card-grid-container {
    grid-template-columns: repeat(auto-fill, minmax(46%, 1fr));
  }
}
</style>
