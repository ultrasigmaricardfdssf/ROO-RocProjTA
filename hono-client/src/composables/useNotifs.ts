import { ref } from 'vue'

export interface Notification {
  id: number
  type: string
  message: string
  read: boolean
  refId: number | null
  refType: string | null
  createdAt: string
  fromUserId: number | null
  fromUsername: string | null
}

// Route to navigate to when a notification is clicked
export function notificationLink(n: Notification): string {
  if (!n.refId || !n.refType) return '/notifications'
  switch (n.refType) {
    case 'question': return `/forums/${n.refId}`
    case 'ticket':   return `/tickets/${n.refId}`
    case 'user':     return `/user/${n.refId}`
    default:         return '/notifications'
  }
}

async function apiFetch(url: string, options?: RequestInit) {
  const res  = await fetch(url, { credentials: 'include', ...options })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.error?.message ?? 'Request failed'), { code: data.error?.code })
  return data
}

export function useNotifications() {
  const notifications = ref<Notification[]>([])
  const unreadCount   = ref(0)
  const loading       = ref(false)

  async function fetchNotifications(limit = 50) {
    loading.value = true
    try {
      const data = await apiFetch(`/api/notifications?limit=${limit}`)
      notifications.value = data
      unreadCount.value   = data.filter((n: Notification) => !n.read).length
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const data = await apiFetch('/api/notifications/unread-count')
      unreadCount.value = data.count
    } catch {
      // silently fail — unread count is non-critical
    }
  }

  async function markRead(id: number) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    const n = notifications.value.find(x => x.id === id)
    if (n && !n.read) {
      n.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  async function markAllRead() {
    await apiFetch('/api/notifications/read-all', { method: 'PATCH' })
    notifications.value.forEach(n => { n.read = true })
    unreadCount.value = 0
  }

  return { notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markRead, markAllRead }
}