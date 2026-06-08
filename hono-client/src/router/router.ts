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
    { path: '/forums',     component: () => import('@/views/ForumsIndex.vue') },
    { path: '/forums/:id', component: () => import('@/views/ForumQuestion.vue') },
    { path: '/my-forums',   component: () => import('@/views/OwnedForums.vue'),   meta: { requiresAuth: true } },
    { path: '/my-tickets',       component: () => import('@/views/OwnedTickets.vue'),    meta: { requiresAuth: true } },
    { path: '/tickets/:id',      component: () => import('@/views/TicketDetails.vue'), meta: { requiresAuth: true } },
    { path: '/admin',            component: () => import('@/views/AdminPanel.vue'),   meta: { requiresAuth: true } },
    { path: '/chat',     component: () => import('@/views/Chatrooms.vue'), meta: { requiresAuth: true } },
    { path: '/chat/:id', component: () => import('@/views/ChatroomView.vue'),  meta: { requiresAuth: true } },
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
