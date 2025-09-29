import { ref } from 'vue'

const show = ref(false)
const text = ref('')
const color = ref('success')

export const useSnackbar = () => {
  const triggerSnackbar = (message, snackbarColor = 'success') => {
    text.value = message
    color.value = snackbarColor
    show.value = true
  }

  return {
    show,
    text,
    color,
    triggerSnackbar,
  }
}
