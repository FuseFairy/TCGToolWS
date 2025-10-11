import { createVuetify } from 'vuetify'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { piniaVersioningPlugin } from '@/plugins/pinia-versioning.js'

import '@/assets/styles/main.css'
import 'vuetify/styles'

const app = createApp(App)
const pinia = createPinia()
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'system',
  },
})

pinia.use(piniaVersioningPlugin)
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')
