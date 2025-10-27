import { createVuetify } from 'vuetify'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { piniaVersioningPlugin } from '@/plugins/pinia-versioning.js'
import { useUIStore } from './stores/ui'

import '@/assets/styles/main.css'
import 'vuetify/styles'

const bootstrap = async () => {
  // 避免 Safari 的 bfcache 導致無法獲取最新的 index.html
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      window.location.reload()
    }
  })

  // 註冊 Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker 註冊成功: ', registration);
        })
        .catch(registrationError => {
          console.log('Service Worker 註冊失敗: ', registrationError);
        });
    });
  }

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

  const uiStore = useUIStore()
  await uiStore.restoreBackgroundImage()

  app.use(router)
  app.use(vuetify)

  app.mount('#app')
}

bootstrap()
