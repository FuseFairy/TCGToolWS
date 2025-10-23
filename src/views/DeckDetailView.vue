<template>
  <div class="h-100">
    <v-container fluid class="h-100 pa-0">
      <div class="d-flex flex-column h-100 overflow-hidden">
        <div ref="headerRef" class="overlay-header pl-4 pr-4 pa-1">
          <div class="overlay-header-content">
            <!-- 左側 -->
            <div class="header-left">
              <template v-if="smAndUp">
                <v-btn
                  :size="resize"
                  icon="mdi-download"
                  variant="text"
                  @click="handleDownloadDeckImage"
                ></v-btn>
                <v-btn
                  :size="resize"
                  icon="mdi-share-variant"
                  variant="text"
                  @click="handleShareCard"
                ></v-btn>
                <v-btn
                  :size="resize"
                  icon="mdi-pencil"
                  variant="text"
                  @click="handleEditDeck"
                ></v-btn>
              </template>
              <template v-if="!smAndUp">
                <v-btn
                  :size="resize"
                  icon="mdi-dots-vertical"
                  variant="text"
                  @click="showMoreActionsBottomSheet = true"
                ></v-btn>
              </template>
            </div>

            <!-- 中間 -->
            <div class="header-center d-flex align-center">
              <v-btn
                :size="resize"
                icon="mdi-arrow-left"
                variant="text"
                @click="$router.back()"
              ></v-btn>
              <h1 v-if="deck" class="text-h6 text-sm-h5 text-truncate">
                {{ deck.name }}
              </h1>
              <h1 v-else class="text-h6 text-sm-h5 text-truncate">N/A</h1>
            </div>

            <!-- 右側 -->
            <div class="header-right">
              <template v-if="smAndUp">
                <div style="width: 120px">
                  <v-select
                    v-model="groupBy"
                    :items="groupByOptions"
                    label="分类"
                    density="compact"
                    variant="outlined"
                    hide-details
                  ></v-select>
                </div>
              </template>
              <template v-else>
                <v-btn
                  :size="resize"
                  icon="mdi-format-list-bulleted-type"
                  variant="text"
                  @click="showBottomSheet = true"
                ></v-btn>
              </template>
            </div>
          </div>
        </div>

        <div
          class="h-100 overflow-y-auto themed-scrollbar"
          :style="{ paddingTop: `${headerOffsetHeight}px` }"
          style="position: relative"
        >
          <div class="px-4 pb-4 w-100 h-100 centered-content">
            <div v-for="([groupName, group], index) in groupedCards" :key="groupName">
              <div
                class="d-flex align-center text-subtitle-2 text-disabled mb-1"
                :class="{ 'mt-3': index > 0 }"
              >
                <span class="mr-2">{{ getGroupName(groupName) }}</span>
                <v-chip size="small" variant="tonal" color="secondary" label>
                  {{ group.reduce((sum, item) => sum + item.quantity, 0) }}
                </v-chip>
              </div>
              <v-row dense class="ma-0">
                <v-col v-for="item in group" :key="item.id" cols="4" sm="3" md="2">
                  <v-tooltip :text="item.id" location="top center">
                    <template v-slot:activator="{ props }">
                      <div v-bind="props" class="card-container" @click="handleCardClick(item)">
                        <v-img
                          :src="useCardImage(item.cardIdPrefix, item.id).value"
                          :aspect-ratio="400 / 559"
                          cover
                          lazy-src="/empty-placehold.webp"
                          rounded="3md"
                        >
                          <template #placeholder>
                            <div class="d-flex align-center justify-center fill-height">
                              <v-progress-circular
                                color="grey-lighten-4"
                                indeterminate
                              ></v-progress-circular>
                            </div>
                          </template>
                          <template #error>
                            <v-img src="/placehold.webp" :aspect-ratio="400 / 559" cover />
                          </template>
                        </v-img>
                        <div class="quantity-badge">{{ item.quantity }}</div>
                      </div>
                    </template>
                  </v-tooltip>
                </v-col>
              </v-row>
            </div>
          </div>
        </div>
      </div>
    </v-container>

    <DeckShareImage ref="deckShareImageRef" v-if="deck" :deck-cards="cards" />

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
        :card-index="selectedCardIndex"
        :total-cards="deckCards.length"
        @close="isModalVisible = false"
        @show-new-card="handleShowNewCard"
        @prev-card="onPrevCard"
        @next-card="onNextCard"
      />
    </v-dialog>

    <v-bottom-sheet v-model="showBottomSheet">
      <v-list :class="{ 'glass-sheet': hasBackgroundImage }">
        <v-list-subheader>分类</v-list-subheader>
        <v-list-item
          v-for="option in groupByOptions"
          :key="option.value"
          :value="option.value"
          :active="groupBy === option.value"
          @click="selectGroupBy(option.value)"
        >
          <v-list-item-title>{{ option.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="showMoreActionsBottomSheet">
      <v-list :class="{ 'glass-sheet': hasBackgroundImage }">
        <v-list-subheader>更多操作</v-list-subheader>
        <v-list-item @click="handleEditDeck">
          <template #prepend>
            <v-icon>mdi-pencil</v-icon>
          </template>
          <v-list-item-title>编辑卡组</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleShareClick">
          <template #prepend>
            <v-icon>mdi-share-variant</v-icon>
          </template>
          <v-list-item-title>分享卡组</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleDownloadClick">
          <template #prepend>
            <v-icon>mdi-download</v-icon>
          </template>
          <v-list-item-title>下载图片</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-bottom-sheet>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCardImage } from '@/composables/useCardImage.js'
import { useDeckEncoder } from '@/composables/useDeckEncoder'
import { useDisplay } from 'vuetify'
import { useDeckGrouping } from '@/composables/useDeckGrouping'
import { fetchCardByIdAndPrefix, fetchCardsByBaseIdAndPrefix } from '@/utils/card'
import CardDetailModal from '@/components/card/CardDetailModal.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useUIStore } from '@/stores/ui'
import { useDeckStore } from '@/stores/deck'
import { useCardNavigation } from '@/composables/useCardNavigation.js'
import collator from '@/utils/collator.js'
import { convertElementToPng } from '@/utils/domToImage.js'
import DeckShareImage from '@/components/deck/DeckShareImage.vue'

const { smAndUp, smAndDown } = useDisplay()
const resize = computed(() => {
  return smAndUp.value ? 'default' : 'small'
})

const route = useRoute()
const router = useRouter()
const { decodeDeck } = useDeckEncoder()
const { triggerSnackbar } = useSnackbar()
const uiStore = useUIStore()
const deckStore = useDeckStore()

const deckKey = route.params.key
const deck = ref(null)
const cards = ref({})
const hasBackgroundImage = !!uiStore.backgroundImage

const handleShareCard = async () => {
  if (!deckKey) {
    triggerSnackbar('无法生成分享链接', 'error')
    return
  }
  const shareUrl = `${window.location.origin}/share-decks/${deckKey}`
  try {
    await navigator.clipboard.writeText(shareUrl)
    triggerSnackbar('分享链接已复制到剪贴板', 'success')
  } catch (err) {
    console.error('Failed to copy: ', err)
    triggerSnackbar('复制失败', 'error')
  }
}

const handleEditDeck = () => {
  if (!deck.value) {
    triggerSnackbar('无法编辑卡组', 'error')
    return
  }
  deckStore.loadDeckForEditing(deck.value, deckKey)
  router.push({ name: 'SeriesDetail', params: { seriesId: deck.value.seriesId } })
}

onMounted(async () => {
  uiStore.setLoading(true)

  try {
    const decoded = await decodeDeck(deckKey)
    deck.value = decoded
    cards.value = decoded.cards
  } catch (error) {
    triggerSnackbar(error.message, 'error')
  } finally {
    uiStore.setLoading(false)
  }
})

const groupBy = ref('level')
const groupByOptions = [
  { title: '等级', value: 'level' },
  { title: '颜色', value: 'color' },
  { title: '种类', value: 'type' },
  { title: '产品', value: 'product_name' },
  { title: '费用', value: 'cost' },
]

const deckCards = computed(() => Object.values(cards.value))
const { groupedCards } = useDeckGrouping(deckCards, groupBy)

const flattenedDisplayCards = computed(() => {
  const cardGroups = Array.from(groupedCards.value.values())
  return cardGroups.flat()
})

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

const { selectedCardIndex, getPrevCard, getNextCard } = useCardNavigation(
  flattenedDisplayCards,
  selectedCardData
)

const onPrevCard = () => {
  const prevCard = getPrevCard()
  if (prevCard) {
    handleShowNewCard({ card: prevCard })
  }
}

const onNextCard = () => {
  const nextCard = getNextCard()
  if (nextCard) {
    handleShowNewCard({ card: nextCard })
  }
}

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
        baseIds.map(
          async (baseId) => await fetchCardsByBaseIdAndPrefix(baseId, cardToDisplay.cardIdPrefix)
        )
      )
      linkedCardsDetails.value = fetchedLinks
        .flat()
        .filter(Boolean)
        .sort((a, b) => collator.compare(a.name, b.name))
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

const deckShareImageRef = ref(null)

const handleDownloadDeckImage = async () => {
  if (!deck.value) {
    triggerSnackbar('无法生成图片，卡组数据缺失。', 'error')
    return
  }

  uiStore.setLoading(true)
  try {
    if (deckShareImageRef.value) {
      await deckShareImageRef.value.areAllImagesLoaded()
    }
    await convertElementToPng('deck-share-image-content', deck.value.name.trim())
  } catch (error) {
    console.error('生成圖片失敗:', error)
    triggerSnackbar('生成圖片失敗，請稍後再試。', 'error')
  } finally {
    uiStore.setLoading(false)
  }
}

const showBottomSheet = ref(false)
const selectGroupBy = (value) => {
  groupBy.value = value
  showBottomSheet.value = false
}

const showMoreActionsBottomSheet = ref(false)
const handleDownloadClick = () => {
  handleDownloadDeckImage()
  showMoreActionsBottomSheet.value = false
}
const handleShareClick = () => {
  handleShareCard()
  showMoreActionsBottomSheet.value = false
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

.centered-content {
  margin: 0 auto;
  max-width: 1200px;
}

@media (max-width: 1200px) {
  .centered-content {
    max-width: 100%;
  }
}
</style>
