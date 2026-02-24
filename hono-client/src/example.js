import { createApp } from 'vue'
import App from './ExampleApp.vue'
import router from './router'
import './styles.css'

createApp(App).use(router).mount('#app')