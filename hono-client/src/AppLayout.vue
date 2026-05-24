<template>
  <div class="app-shell">
    <!-- NAVBAR -->
    <nav class="navbar">
      <div class="nav-left">
        <RouterLink
          to="/"
          class="pill pill-nav"
          :class="{ active: route.path === '/' }"
          >home</RouterLink
        >
        <RouterLink
          to="/forums"
          class="pill pill-nav"
          :class="{ active: route.path.startsWith('/forums') }"
          >frms</RouterLink
        >
        <RouterLink
          to="/crms"
          class="pill pill-nav"
          :class="{ active: route.path.startsWith('/crms') }"
          >crms</RouterLink
        >
        <RouterLink
          to="/tickets"
          class="pill pill-nav"
          :class="{ active: route.path.startsWith('/tickets') }"
          >tckts</RouterLink
        >
      </div>

      <div class="nav-center">
        <div class="search-wrap">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="search"
            @keydown.enter="doSearch"
          />
          <button class="search-btn pill" @click="doSearch">lupa</button>
        </div>
      </div>

      <div class="nav-right">
        <RouterLink
          to="/notifications"
          class="pill pill-nav ntf-pill"
          :class="{ active: route.path === '/notifications' }"
        >
          ntfs
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
        </RouterLink>

        <!-- Avatar + dropdown -->
        <div class="avatar-wrap" ref="avatarRef">
          <button
            class="avatar-btn dashed"
            @click="dropdownOpen = !dropdownOpen"
          >
            <img
              v-if="authStore.user?.avatar"
              :src="authStore.user.avatar"
              alt="avatar"
              class="avatar-img"
            />
            <span v-else class="avatar-initials">{{ initials }}</span>
          </button>

          <Transition name="dropdown">
            <div v-if="dropdownOpen" class="dropdown-menu card" @click.stop>
              <RouterLink
                to="/account"
                class="dropdown-item"
                @click="dropdownOpen = false"
                >Account</RouterLink
              >
              <RouterLink
                to="/settings"
                class="dropdown-item"
                @click="dropdownOpen = false"
                >Settings</RouterLink
              >
              <RouterLink
                to="/my-forums"
                class="dropdown-item"
                @click="dropdownOpen = false"
                >My forums</RouterLink
              >
              <RouterLink
                to="/my-tickets"
                class="dropdown-item"
                @click="dropdownOpen = false"
                >My tickets</RouterLink
              >
              <RouterLink
                to="/inbox"
                class="dropdown-item"
                @click="dropdownOpen = false"
                >Inbox</RouterLink
              >
              <button class="dropdown-item logout" @click="handleLogout">
                Log out
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </nav>

    <!-- PAGE CONTENT -->
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { logout } = useAuth();

const dropdownOpen = ref(false);
const searchQuery = ref("");
const avatarRef = ref<HTMLElement | null>(null);

// Placeholder — wire to your notifications store later
const unreadCount = ref(3);

const initials = computed(() => {
  const u = authStore.user;
  if (!u) return "?";
  return (u.username ?? u.email).slice(0, 2).toUpperCase();
});

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: "/search", query: { q: searchQuery.value.trim() } });
  }
}

async function handleLogout() {
  dropdownOpen.value = false;
  await logout();
}

// Close dropdown on outside click
function onClickOutside(e: MouseEvent) {
  if (avatarRef.value && !avatarRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
}
onMounted(() => document.addEventListener("click", onClickOutside));
onUnmounted(() => document.removeEventListener("click", onClickOutside));
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: var(--navy);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
}

.nav-left {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.nav-center {
  flex: 1;
}

.search-wrap {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  padding: 3px 6px 3px 16px;
  gap: 6px;
}
.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-family: var(--font);
  font-size: 14px;
}
.search-input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}
.search-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.35);
}
.search-btn:hover {
  background: rgba(255, 255, 255, 0.32);
}

.ntf-pill {
  position: relative;
}
.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}

.avatar-wrap {
  position: relative;
}
.avatar-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #1a1a2e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  transition: border-color 0.15s;
}
.avatar-btn:hover {
  border-color: #fff;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-initials {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 180px;
  padding: 8px 0;
  border: 2px dashed var(--border-dash);
  z-index: 200;
}
.dropdown-item {
  display: block;
  width: 100%;
  padding: 9px 20px;
  font-family: var(--font);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
}
.dropdown-item:hover {
  background: var(--blue-soft);
}
.dropdown-item.logout {
  color: var(--red);
  border-top: 1px dashed var(--border);
  margin-top: 4px;
  padding-top: 12px;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.page-content {
  flex: 1;
  padding: 28px 24px;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}
</style>
