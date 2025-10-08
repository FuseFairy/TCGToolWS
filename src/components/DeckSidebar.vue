<template>
  <aside
    v-bind="$attrs"
    class="d-flex flex-column flex-shrink-0"
    :style="{ paddingTop: `${smAndUp ? headerOffsetHeight + 18 : 0}px` }"
  >
    <v-sheet
      :rounded="smAndUp ? '3md' : false"
      class="pa-4 ga-4 d-flex flex-column fill-height overflow-hidde"
    >
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex align-center ga-2">
          <v-btn
            icon="mdi-delete-sweep-outline"
            variant="text"
            color="error"
            density="compact"
            :disabled="deckStore.totalCardCount === 0"
            @click="deckStore.clearDeck"
          >
          </v-btn>
          <h2 class="text-h6">当前卡组</h2>
          <v-chip pill size="small">
            <v-icon start icon="mdi-cards-diamond-outline"></v-icon>
            {{ deckStore.totalCardCount }} / 50
          </v-chip>
        </div>
        <v-btn
          icon="mdi-content-save-outline"
          variant="text"
          color="primary"
          density="compact"
          :disabled="deckStore.totalCardCount === 0"
          @click="openSaveDialog"
        >
        </v-btn>
      </div>

      <v-row dense>
        <v-col cols="7" sm="8" class="pa-0">
          <v-btn-toggle
            v-model="activeMode"
            density="compact"
            color="primary"
            variant="tonal"
            divided
            mandatory
            class="w-100 h-100"
          >
            <v-btn value="remove" class="flex-grow-1">
              <v-icon icon="mdi-minus"></v-icon>
            </v-btn>
            <v-btn value="none" class="flex-grow-1">
              <v-icon icon="mdi-cursor-default-click-outline"></v-icon>
            </v-btn>
            <v-btn value="add" class="flex-grow-1">
              <v-icon icon="mdi-plus"></v-icon>
            </v-btn>
          </v-btn-toggle>
        </v-col>
        <v-col cols="5" sm="4" class="pa-0 pl-2">
          <v-select
            v-model="groupBy"
            :items="groupByOptions"
            label="分类"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
      </v-row>

      <v-divider></v-divider>

      <div class="fill-height overflow-y-auto themed-scrollbar pl-4 pr-4">
        <div
          v-if="Object.keys(deckStore.cardsInDeck).length === 0"
          class="text-center text-disabled mt-8"
        >
          <v-icon size="48" icon="mdi-cards-outline"></v-icon>
          <p class="mt-2">尚未加入卡片</p>
        </div>

        <div v-else>
          <div v-for="([groupName, group], index) in groupedCards" :key="groupName">
            <div
              class="d-flex justify-space-between align-center text-subtitle-2 text-disabled mb-1"
              :class="{ 'mt-3': index > 0 }"
            >
              <span>{{ getGroupName(groupName) }}</span>
              <v-chip size="small" variant="tonal" color="secondary" label>{{
                group.length
              }}</v-chip>
            </div>
            <v-row dense>
              <v-col v-for="item in group" :key="item.id" cols="4" lg="3">
                <div class="card-container" @click="handleCardClick(item)">
                  <div class="image-container">
                    <v-img
                      :src="useCardImage(item.cardIdPrefix, item.id).value"
                      :aspect-ratio="400 / 559"
                      cover
                      class="rounded"
                    ></v-img>
                    <div class="quantity-badge">{{ item.quantity }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </div>
      </div>
    </v-sheet>
  </aside>

  <!-- Card Detail Modal -->
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
      :showActions="true"
      @close="isModalVisible = false"
      @show-new-card="handleShowNewCard"
    />
  </v-dialog>

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
            <v-col v-for="card in deckCards" :key="card.id" cols="4" lg="3">
              <div class="cover-card-container" @click="selectedCoverCardId = card.id">
                <v-img
                  :src="useCardImage(card.cardIdPrefix, card.id).value"
                  :aspect-ratio="400 / 559"
                  cover
                  class="rounded"
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDeckStore } from '@/stores/deck'
import { useCardImage } from '@/composables/useCardImage'
import { fetchCardByIdAndPrefix, fetchCardsByBaseIdAndPrefix } from '@/utils/card'
import CardDetailModal from '@/components/CardDetailModal.vue'
import { useDisplay } from 'vuetify'
import { useDeckGrouping } from '@/composables/useDeckGrouping'
import { useDeckEncoder } from '@/composables/useDeckEncoder'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

defineProps({
  headerOffsetHeight: {
    type: Number,
    required: true,
  },
})

const { smAndUp, smAndDown } = useDisplay()
const deckStore = useDeckStore()
const { encodeDeck } = useDeckEncoder()
const { triggerSnackbar } = useSnackbar()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Auth Alert Dialog State
const isAuthAlertOpen = ref(false)

// Save Deck Dialog State
const isSaveDialogOpen = ref(false)
const deckName = ref('')
const selectedCoverCardId = ref(null)

const openSaveDialog = () => {
  if (!authStore.isAuthenticated) {
    isAuthAlertOpen.value = true
  } else if (deckCards.value.length > 0) {
    selectedCoverCardId.value = deckCards.value[0].id
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

  uiStore.setLoading(true)
  try {
    const deckData = {
      name: deckName.value,
      version: deckStore.version,
      cards: deckStore.cardsInDeck,
      seriesId: deckStore.seriesId,
      coverCardId: selectedCoverCardId.value,
    }

    const success = await encodeDeck(deckData)
    if (success) {
      triggerSnackbar('保存成功')
      isSaveDialogOpen.value = false
    }
  } finally {
    uiStore.setLoading(false)
  }
}

const groupBy = ref('level')
const groupByOptions = [
  { title: '等级', value: 'level' },
  { title: '颜色', value: 'color' },
  { title: '种类', value: 'type' },
  { title: '产品', value: 'product_name' },
  { title: '费用', value: 'cost' },
]

const deckCards = computed(() => Object.values(deckStore.cardsInDeck))
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

// UI State
const activeMode = ref('none') // 'add', 'remove', 'none'
const isModalVisible = ref(false)

// Card Data for Modal
const selectedCardData = ref(null)
const linkedCardsDetails = ref([])

const modalCardImageUrl = computed(() => {
  if (selectedCardData.value) {
    return useCardImage(selectedCardData.value.cardIdPrefix, selectedCardData.value.id).value
  }
  return ''
})

/**
 * Handles displaying a new card in the CardDetailModal.
 * Fetches card details and linked cards based on the provided payload.
 * The payload can either be the card object directly (from initial click) or an object containing a 'card' property (from CardDetailModal emit).
 * @param {object|{card: object, imgUrl: string}} cardPayload - The payload containing card information.
 */
const handleShowNewCard = async (cardPayload) => {
  try {
    const cardToDisplay = cardPayload.card || cardPayload
    const card = await fetchCardByIdAndPrefix(cardToDisplay.id, cardToDisplay.cardIdPrefix)
    if (!card) {
      console.error('Failed to fetch card details for', cardToDisplay.id)
      return
    }

    if (card.link && Array.isArray(card.link) && card.link.length > 0) {
      // Sanitize and deduplicate link IDs to prevent redundant fetches.
      const baseIds = [...new Set(card.link.map((linkId) => linkId.replace(/[a-zA-Z]+$/, '')))]
      const fetchedLinks = await Promise.all(
        baseIds.map((baseId) => fetchCardsByBaseIdAndPrefix(baseId, cardToDisplay.cardIdPrefix))
      )
      linkedCardsDetails.value = fetchedLinks.flat().filter(Boolean)
    } else {
      linkedCardsDetails.value = []
    }
    isModalVisible.value = true
    selectedCardData.value = card
  } catch (error) {
    console.error('Error handling show new card:', error)
    // Optionally, show a snackbar or other user-facing error message
  }
}

/**
 * Handles the click event on a card in the deck sidebar.
 * Depending on the active mode ('add', 'remove', 'none'), it will add/remove the card from the deck or display its details in the modal.
 * @param {object} item - The card item that was clicked.
 */
const handleCardClick = async (item) => {
  switch (activeMode.value) {
    case 'add':
      deckStore.addCard(item)
      break
    case 'remove':
      deckStore.removeCard(item.id)
      break
    default: {
      await handleShowNewCard({ card: item })
      break
    }
  }
}
</script>

<style scoped>
.card-container {
  position: relative;
  cursor: pointer;
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
  left: 8px;
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
