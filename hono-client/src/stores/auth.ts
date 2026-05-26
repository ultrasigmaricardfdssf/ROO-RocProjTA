import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  username: string
  email: string
  role: number
  notified: boolean
  description: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user    = ref<User | null>(null)
  const hydrated = ref(false)

  function setUser(u: User | null) {
    user.value = u
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

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin    = computed(() => user.value?.role === 'admin')

  return { user, hydrated, isLoggedIn, isAdmin, setUser, fetchMe }
})