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
    <v-row class="ma-0 flex-grow-0" :style="{ paddingTop: `${headerOffsetHeight - 10}px` }">
      <v-col
        v-for="card in displayedCards"
        :key="card.id"
        cols="6"
        sm="4"
        md="3"
        lg="2"
        class="d-flex"
      >
        <CardTemplate :card="card" @show-details="onShowDetails" />
      </v-col>
    </v-row>
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
      @close="isModalVisible = false"
      @show-new-card="onShowNewCard"
    />
  </v-dialog>

  <v-fade-transition>
    <v-btn
      v-show="isFabVisible"
      position="fixed"
      location="bottom right"
      icon
      size="large"
      class="ma-4 back-to-top-btn"
      :class="{ 'mb-18': smAndDown }"
      @click="scrollToTop"
    >
      <v-img
        :src="WsIcon"
        alt="Back to top"
        width="28"
        height="28"
        draggable="false"
        :style="{ filter: iconFilterStyle }"
      />
    </v-btn>
  </v-fade-transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useTheme, useDisplay } from 'vuetify'
import CardTemplate from '@/components/CardTemplate.vue'
import CardDetailModal from '@/components/CardDetailModal.vue'
import { fetchCardsByBaseIdAndPrefix } from '@/utils/card'
import WsIcon from '@/assets/ui/ws-icon.svg'
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

const { smAndDown } = useDisplay()
const theme = useTheme()

const iconFilterStyle = computed(() => {
  return theme.global.name.value === 'light' ? 'invert(1)' : 'none'
})
const isModalVisible = ref(false)
const selectedCardData = ref(null)
const selectedLinkedCards = ref([])
const isLoadingLinks = ref(false)

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

const displayedCards = computed(() => props.cards.slice(0, page.value * props.itemsPerLoad))

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

const isFabVisible = ref(false)
const scrollContainer = ref(null)

const onScroll = () => {
  if (!scrollContainer.value) return

  const scrollTop = scrollContainer.value.scrollTop
  isFabVisible.value = scrollTop > 300
}

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  // Use the v-infinite-scroll element as the scroll container
  scrollContainer.value = infiniteScrollRef.value?.$el

  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', onScroll)
  } else {
    // Fallback if the ref isn't available for some reason
    scrollContainer.value = document.documentElement
    document.addEventListener('scroll', onScroll)
  }
})

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', onScroll)
  } else {
    document.removeEventListener('scroll', onScroll)
  }
})
</script>

<style scoped>
.back-to-top-btn {
  opacity: 0.8;
}
</style>
