import { hydrateOnMediaQuery } from 'vue';
import { createRouter, createWebHistory } from 'vue-router'
const routes = [
    {   // home page, use dis as a template ig (iam gonna forget how this)
        path: '/',
        name: 'home',
        component: import('../views/Home.vue')
    }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})

export default router
