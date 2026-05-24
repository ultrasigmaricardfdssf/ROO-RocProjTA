import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/router.js'
import App from './AppLayout.vue'
import './styles.css'

createApp(App).use(createPinia()).use(router).mount('#app')