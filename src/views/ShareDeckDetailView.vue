<template>
  <div class="h-100">
    <v-container fluid class="h-100 pa-0">
      <div class="d-flex flex-column h-100 overflow-hidden">
        <div ref="headerRef" class="overlay-header pa-3">
          <div class="d-flex align-center justify-center w-100 position-relative">
            <!-- 左側 -->
            <v-btn
              :size="resize"
              icon="mdi-content-save-outline"
              variant="text"
              @click="openSaveDialog"
              class="position-absolute left-0"
            ></v-btn>

            <!-- 中間 -->
            <div class="d-flex align-center">
              <h1 v-if="deck" class="text-h6 text-sm-h5 text-truncate">
                {{ deck.name }}
              </h1>
              <h1 v-else class="text-h6 text-sm-h5 text-truncate">N/A</h1>
            </div>

            <!-- 右側 -->
            <div class="position-absolute right-0">
              <template v-if="smAndUp">
                <v-select
                  v-model="groupBy"
                  :items="groupByOptions"
                  label="分类"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="width: 120px"
                ></v-select>
              </template>
              <template v-else>
                <v-btn
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
          <div class="px-4 pb-4 w-100 h-100">
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

    <v-bottom-sheet v-model="showBottomSheet">
      <v-list>
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

    <!-- Auth Alert Dialog -->
    <v-dialog v-model="isAuthAlertOpen" max-width="400px">
      <v-card>
        <v-card-title> 需要登入</v-card-title>
        <v-card-text> 储存卡组功能需要登入后才能使用。 </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="isAuthAlertOpen = false">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Save Deck Dialog -->
    <v-dialog v-model="isSaveDialogOpen" max-width="500px" @update:model-value="closeSaveDialog">
      <v-card>
        <v-card-title>储存卡组</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="deckName"
            label="卡组名称"
            :counter="10"
            maxlength="10"
            variant="outlined"
            density="compact"
            hide-details="auto"
            class="mb-4"
          ></v-text-field>
          <p class="text-subtitle-1 mb-2">选择封面</p>
          <v-sheet
            class="overflow-y-auto pa-2 rounded themed-scrollbar"
            max-height="300px"
            :color="$vuetify.theme.current.dark ? 'grey-darken-3' : 'grey-lighten-3'"
          >
            <v-row dense>
              <v-col v-for="card in Object.values(cards)" :key="card.id" cols="4" lg="3">
                <div class="cover-card-container" @click="selectedCoverCardId = card.id">
                  <v-img
                    :src="useCardImage(card.cardIdPrefix, card.id).value"
                    :aspect-ratio="400 / 559"
                    cover
                    class="rounded-lg"
                    :class="{ 'selected-cover': selectedCoverCardId === card.id, clickable: true }"
                  ></v-img>
                </div>
              </v-col>
            </v-row>
          </v-sheet>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="isSaveDialogOpen = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            @click="handleSaveDeck"
            :disabled="!deckName.trim() || !selectedCoverCardId"
            >确认
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
import CardDetailModal from '@/components/CardDetailModal.vue'
import { useAuthStore } from '@/stores/auth'

const { smAndUp, smAndDown } = useDisplay()
const resize = computed(() => {
  return smAndUp.value ? 'default' : 'x-small'
})

const route = useRoute()
const router = useRouter()
const { decodeDeck, encodeDeck } = useDeckEncoder()
const authStore = useAuthStore()

const deckKey = route.params.key
const deck = ref(null)
const cards = ref({})

// Auth Alert Dialog State
const isAuthAlertOpen = ref(false)

// Save Deck Dialog State
const isSaveDialogOpen = ref(false)
const deckName = ref('')
const selectedCoverCardId = ref(null)

const openSaveDialog = () => {
  if (!authStore.isAuthenticated) {
    isAuthAlertOpen.value = true
  } else if (deck.value) {
    deckName.value = deck.value.name || ''
    selectedCoverCardId.value = deck.value.coverCardId || Object.values(cards.value)[0]?.id
    isSaveDialogOpen.value = true
  }
}

const closeSaveDialog = (value) => {
  if (!value) {
    // Reset state when dialog is closed
    isSaveDialogOpen.value = false
    deckName.value = ''
    selectedCoverCardId.value = null
  }
}

const handleSaveDeck = async () => {
  if (!deckName.value.trim() || !selectedCoverCardId.value) return

  const deckData = {
    name: deckName.value,
    version: deck.value.version,
    cards: cards.value,
    seriesId: deck.value.seriesId,
    coverCardId: selectedCoverCardId.value,
  }

  const { success, key } = await encodeDeck(deckData)
  if (success) {
    isSaveDialogOpen.value = false
    router.push(`/decks/${key}`)
  }
}

onMounted(async () => {
  try {
    const decoded = await decodeDeck(deckKey, true) // Assuming ShareDeckDetailView is for shared decks
    if (decoded) {
      deck.value = decoded
      cards.value = decoded.cards
    } else {
      console.error('Failed to decode deck')
    }
  } catch (error) {
    console.error('Error loading deck details:', error)
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

const showBottomSheet = ref(false)
const selectGroupBy = (value) => {
  groupBy.value = value
  showBottomSheet.value = false
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

.cover-card-container .clickable {
  cursor: pointer;
  border: 2px solid transparent;
  transition:
    border-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.cover-card-container .selected-cover {
  border-color: rgb(216, 102, 102);
  box-shadow: 0 0 10px 3px rgba(223, 137, 137, 0.6);
}
</style>
