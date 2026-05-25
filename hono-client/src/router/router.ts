import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/Home.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/user/:id",
      component: () => import("@/views/UserView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/settings",
      component: () => import("@/views/Settings.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/notifications",
      component: () => import("@/views/Notifications.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/inbox",
      component: () => import("@/views/Inbox.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/search",
      component: () => import("@/views/Search.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      component: () => import("@/views/Login.vue"),
    },
    {
      path: "/register",
      component: () => import("@/views/Register.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
  const store = useAuthStore();

  if (!store.user && !store.hydrated) {
    await store.fetchMe();
  }

  if (to.meta.requiresAuth && !store.isLoggedIn) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAdmin && !store.isAdmin) {
    return { path: "/" };
  }
});

export default router;
