import { createVuetify } from 'vuetify'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import '@/styles/global.css'
import 'vuetify/styles'
import 'unfonts.css'
import 'overlayscrollbars/overlayscrollbars.css'

const app = createApp(App)
const pinia = createPinia()
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'system',
  },
})

pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')
