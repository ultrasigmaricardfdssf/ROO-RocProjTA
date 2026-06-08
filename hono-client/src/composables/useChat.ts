// composables/useChat.ts
import { ref, onUnmounted } from 'vue'

export interface ChatMember {
  userId:   number
  username: string
}

export interface ChatMessage {
  id:       string
  userId:   number
  username: string
  text:     string
  sentAt:   string
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'closed'

export function useChat() {
  const messages    = ref<ChatMessage[]>([])
  const members     = ref<ChatMember[]>([])
  const state       = ref<ConnectionState>('disconnected')
  const roomTitle   = ref('')
  const error       = ref('')

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let currentRoomId: number | null = null

  function connect(roomId: number) {
    currentRoomId = roomId
    state.value   = 'connecting'
    error.value   = ''

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    //ws = new WebSocket(`${protocol}://${location.host.substring(0, location.host.indexOf(':'))}:3000/ws/chat/${roomId}`)
    ws = new WebSocket(`ws://localhost:3000/ws/chat/${roomId}`)

    ws.onopen = () => {
      state.value = 'connected'
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    }

    ws.onmessage = (evt) => {
      let data: any
      try { data = JSON.parse(evt.data) } catch { return }
      handleServerMessage(data)
    }

    ws.onclose = (evt) => {
      // code 1000 = normal close (user left or room closed)
      if (evt.code === 1000 || state.value === 'closed') {
        state.value = 'closed'
        return
      }
      // Abnormal close — try to reconnect once after 2s
      state.value = 'disconnected'
      reconnectTimer = setTimeout(() => {
        if (currentRoomId !== null && state.value === 'disconnected') {
          connect(currentRoomId)
        }
      }, 2000)
    }

    ws.onerror = () => {
      error.value = 'Connection error. Reconnecting…'
    }
  }

  function handleServerMessage(data: any) {
    switch (data.type) {
      case 'init':
        roomTitle.value = data.title
        messages.value  = data.messages ?? []
        members.value   = data.members  ?? []
        break

      case 'message':
        messages.value.push(data.message)
        break

      case 'member_join':
        members.value = data.members
        break

      case 'member_leave':
        members.value = data.members
        break

      case 'error':
        error.value  = data.message ?? 'An error occurred.'
        state.value  = 'closed'
        break
    }
  }

  function sendMessage(text: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'message', text }))
  }

  function leave() {
    currentRoomId = null
    state.value   = 'closed'
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (ws) {
      ws.send(JSON.stringify({ type: 'leave' }))
      ws.close(1000)
      ws = null
    }
  }

  // Auto-disconnect when the component unmounts
  onUnmounted(() => leave())

  return { messages, members, state, roomTitle, error, connect, sendMessage, leave }
}