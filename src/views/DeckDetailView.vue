<template>
  <div class="h-100">
    <v-container fluid class="h-100 pa-0">
      <div class="d-flex flex-column h-100 overflow-hidden">
        <div ref="headerRef" class="overlay-header pl-4 pr-4 pa-1 pb-1">
          <div class="d-flex align-center justify-space-between w-100">
            <v-btn
              :size="resize"
              icon="mdi-arrow-left"
              variant="text"
              @click="$router.back()"
            ></v-btn>
            <div class="d-flex align-center">
              <h1 class="text-h6 text-sm-h5 text-truncate text-center px-2">{{ deck.name }}</h1>
              <v-chip
                :size="resize"
                prepend-icon="mdi-cards-diamond-outline"
                class="counter-chip font-weight-bold"
              >
                {{ Object.keys(cards).length }}
              </v-chip>
            </div>
            <v-select
              v-model="groupBy"
              :items="groupByOptions"
              label="分类"
              density="compact"
              variant="outlined"
              hide-details
              class="flex-grow-0 ml-4"
              style="max-width: 120px"
            ></v-select>
          </div>
        </div>

        <div
          class="h-100 overflow-y-auto themed-scrollbar"
          :style="{ paddingTop: `${headerOffsetHeight}px` }"
          style="position: relative"
        >
          <div class="px-4 pb-4 w-100 h-100">
            <div v-for="([groupName, group], index) in groupedCards" :key="groupName">
              <div
                class="d-flex justify-space-between align-center text-subtitle-2 text-disabled mb-1"
                :class="{ 'mt-3': index > 0 }"
              >
                <span>{{ getGroupName(groupName) }}</span>
                <v-chip size="small" variant="tonal" color="secondary" label>
                  {{ group.length }}
                </v-chip>
              </div>
              <v-row dense class="ma-0">
                <v-col v-for="item in group" :key="item.id" cols="4" sm="3" md="2" lg="1">
                  <div class="card-container" @click="handleCardClick(item)">
                    <v-img
                      :src="useCardImage(item.cardIdPrefix, item.id).value"
                      :aspect-ratio="400 / 559"
                      cover
                    />
                    <div class="quantity-badge">{{ item.quantity }}</div>
                  </div>
                </v-col>
              </v-row>
            </div>
          </div>
        </div>
      </div>
    </v-container>

    <v-dialog
      v-if="selectedCardData"
      v-model="isModalVisible"
      :max-width="smAndDown ? '100%' : '60%'"
      :max-height="smAndDown ? '80%' : '95%'"
      :min-height="smAndDown ? null : '60%'"
    >
      <CardDetailModal
        :card="selectedCardData"
        :imgUrl="modalCardImageUrl"
        :linkedCards="linkedCardsDetails"
        :showActions="false"
        @close="isModalVisible = false"
        @show-new-card="handleShowNewCard"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCardImage } from '@/composables/useCardImage.js'
import { useDeckEncoder } from '@/composables/useDeckEncoder'
import { useDisplay } from 'vuetify'
import { useDeckGrouping } from '@/composables/useDeckGrouping'
import { fetchCardByIdAndPrefix, fetchCardsByBaseIdAndPrefix } from '@/utils/card'
import CardDetailModal from '@/components/CardDetailModal.vue'

const { smAndUp, smAndDown } = useDisplay()
const resize = computed(() => {
  return smAndUp.value ? 'default' : 'x-small'
})

const route = useRoute()
const { decodeDeck } = useDeckEncoder()

const deckKey = route.params.key
const deck = decodeDeck(deckKey)
const cards = deck.cards

const groupBy = ref('level')
const groupByOptions = [
  { title: '等级', value: 'level' },
  { title: '颜色', value: 'color' },
  { title: '种类', value: 'type' },
  { title: '产品', value: 'product_name' },
  { title: '费用', value: 'cost' },
]

const deckCards = computed(() => Object.values(cards))
const { groupedCards } = useDeckGrouping(deckCards, groupBy)

const colorMap = {
  red: '红色',
  blue: '蓝色',
  yellow: '黄色',
  green: '绿色',
}

const getGroupName = (groupName) => {
  switch (groupBy.value) {
    case 'level':
      return groupName === 'CX' ? '高潮卡' : `等级 ${groupName}`
    case 'color':
      return colorMap[groupName.toLowerCase()] || groupName
    case 'cost':
      return `费用 ${groupName}`
    default:
      return groupName
  }
}

const headerRef = ref(null)
const headerOffsetHeight = ref(0)
let observer = null

onMounted(() => {
  if (headerRef.value) {
    observer = new ResizeObserver(([entry]) => {
      if (entry?.target) {
        headerOffsetHeight.value = entry.target.offsetHeight + 18
      }
    })
    observer.observe(headerRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const isModalVisible = ref(false)
const selectedCardData = ref(null)
const linkedCardsDetails = ref([])

const modalCardImageUrl = computed(() => {
  if (selectedCardData.value) {
    return useCardImage(selectedCardData.value.cardIdPrefix, selectedCardData.value.id).value
  }
  return ''
})

const handleShowNewCard = async (cardPayload) => {
  try {
    const cardToDisplay = cardPayload.card || cardPayload
    const card = await fetchCardByIdAndPrefix(cardToDisplay.id, cardToDisplay.cardIdPrefix)
    if (!card) return

    if (card.link && Array.isArray(card.link) && card.link.length > 0) {
      const baseIds = [...new Set(card.link.map((linkId) => linkId.replace(/[a-zA-Z]+$/, '')))]
      const fetchedLinks = await Promise.all(
        baseIds.map((baseId) => fetchCardsByBaseIdAndPrefix(baseId, cardToDisplay.cardIdPrefix))
      )
      linkedCardsDetails.value = fetchedLinks.flat().filter(Boolean)
    } else {
      linkedCardsDetails.value = []
    }
    selectedCardData.value = card
    isModalVisible.value = true
  } catch (error) {
    console.error('Error handling show new card:', error)
  }
}

const handleCardClick = async (item) => {
  await handleShowNewCard({ card: item })
}
</script>

<style scoped>
.card-container {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.card-container:hover {
  transform: translateY(-5px);
}

.image-container {
  position: relative;
  border: 2px solid transparent;
  border-radius: 6px;
  transition: border-color 0.2s ease-in-out;
}

.quantity-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgb(var(--v-theme-primary));
  color: white;
  border-radius: 12px;
  padding: 0 6px;
  font-size: 0.8rem;
  font-weight: bold;
  border: 2px solid white;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
