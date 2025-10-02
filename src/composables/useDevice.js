import { ref, onMounted } from 'vue'

export const useDevice = () => {
  const isTouch = ref(false)

  onMounted(() => {
    const hasFinePointer = window.matchMedia('(any-pointer: fine)').matches
    isTouch.value = !hasFinePointer
  })

  return { isTouch }
}
