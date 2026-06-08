import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  username: string
  email: string
  notified: boolean
  description: string | null
  roleId: number
  roleName: string
  roleColor: string | null
  canAsk: boolean
  canReply: boolean
  canDeleteReply: boolean
  canPostTicket: boolean
  canAcceptTicket: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user     = ref<User | null>(null)
  const hydrated = ref(false)

  function setUser(u: User | null) {
    user.value     = u
    hydrated.value = true
  }

  async function fetchMe() {
    try {
      const res = await fetch('/auth/me', { credentials: 'include' })
      if (!res.ok) { setUser(null); return }
      const data = await res.json()
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    }
  }

  const isLoggedIn      = computed(() => !!user.value)
  const isAdmin         = computed(() => user.value?.roleName === 'admin')
  const isSupport       = computed(() => user.value?.roleName === 'support' || user.value?.roleName === 'admin')
  const canAsk          = computed(() => user.value?.canAsk ?? false)
  const canReply        = computed(() => user.value?.canReply ?? false)
  const canDeleteReply  = computed(() => user.value?.canDeleteReply ?? false)
  const canPostTicket   = computed(() => user.value?.canPostTicket ?? false)
  const canAcceptTicket = computed(() => user.value?.canAcceptTicket ?? false)

  return {
    user, hydrated,
    isLoggedIn, isAdmin, isSupport, canAsk, canReply,
    canDeleteReply, canPostTicket, canAcceptTicket,
    setUser, fetchMe,
  }
})