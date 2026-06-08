<template>
  <AppLayout>
    <!-- Connecting -->
    <div v-if="state === 'connecting'" class="status-screen">
      <div class="spinner-lg" />
      <p>Connecting to room…</p>
    </div>

    <!-- Error / closed -->
    <div v-else-if="state === 'closed' || error" class="status-screen error">
      <span class="error-icon">!</span>
      <p>{{ error || 'Room closed.' }}</p>
      <button class="pill back-btn" @click="router.push('/chat')">Back to rooms</button>
    </div>

    <!-- Chat UI -->
    <div v-else class="chat-layout">
      <!-- Header -->
      <div class="chat-header card">
        <div class="chat-header-left">
          <button class="pill back-pill" @click="handleLeave">← Leave</button>
          <h1 class="chat-title">{{ roomTitle }}</h1>
        </div>
        <span class="member-count">{{ members.length }} online</span>
      </div>

      <div class="chat-body">
        <!-- Messages -->
        <div class="messages-col">
          <div class="messages-wrap" ref="messagesEl">
            <div v-if="!messages.length" class="empty-chat">
              No messages yet. Say hello!
            </div>
            <ChatMessage
              v-for="m in messages"
              :key="m.id"
              :message="m"
              :isOwn="m.userId === authStore.user?.id"
            />
          </div>

          <!-- Composer -->
          <div class="composer">
            <input
              v-model="draft"
              class="composer-input"
              placeholder="Message…"
              maxlength="2000"
              @keydown.enter.exact.prevent="send"
            />
            <button class="pill send-btn" :disabled="!draft.trim()" @click="send">Send</button>
          </div>
        </div>

        <!-- Members sidebar -->
        <div class="members-col card">
          <h2 class="members-title">Members <span class="members-count">{{ members.length }}</span></h2>
          <div class="members-list">
            <div
              v-for="m in members"
              :key="m.userId"
              class="member-row"
              @click="openUserProfile(m.userId)"
            >
              <div class="member-avatar" :class="{ self: m.userId === authStore.user?.id }">
                {{ m.username.slice(0, 2).toUpperCase() }}
              </div>
              <span class="member-name">
                {{ m.username }}
                <span v-if="m.userId === authStore.user?.id" class="you-label">(you)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/AppLayout.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import { useChat } from '@/composables/useChat'
import { useAuthStore } from '@/stores/auth'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const { messages, members, state, roomTitle, error, connect, sendMessage, leave } = useChat()

const draft      = ref('')
const messagesEl = ref<HTMLElement | null>(null)

const roomId = Number(route.params.id)

function send() {
  const text = draft.value.trim()
  if (!text) return
  sendMessage(text)
  draft.value = ''
}

function handleLeave() {
  leave()
  router.push('/chat')
}

function openUserProfile(userId: number) {
  window.open(`/user/${userId}`, '_blank')
}

// Auto-scroll to bottom on new messages
watch(messages, async () => {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}, { deep: true })

onMounted(() => connect(roomId))
</script>

<style scoped>
/* Status screens */
.status-screen {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; min-height: 60vh; text-align: center; color: var(--text-muted);
}
.status-screen.error { color: var(--red); }
.spinner-lg {
  width: 36px; height: 36px;
  border: 3px solid var(--blue-pale); border-top-color: var(--navy);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
.error-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--red); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 800;
}
.back-btn { padding: 10px 24px; background: var(--navy); color: #fff; border: none; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Chat layout */
.chat-layout { display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 120px); }

.chat-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border: 1.5px solid var(--border); flex-shrink: 0;
}
.chat-header-left { display: flex; align-items: center; gap: 12px; }
.back-pill {
  padding: 5px 12px; font-size: 12px;
  background: none; color: var(--text-muted); border: 1.5px solid var(--border) !important;
}
.back-pill:hover { color: var(--navy); border-color: var(--navy-light) !important; }
.chat-title   { font-size: 18px; font-weight: 800; }
.member-count { font-size: 13px; color: var(--green); font-weight: 700; }

.chat-body {
  display: flex; gap: 12px; flex: 1; min-height: 0;
}

/* Messages */
.messages-col {
  flex: 1; display: flex; flex-direction: column;
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius); overflow: hidden; min-height: 0;
}
.messages-wrap {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.empty-chat { text-align: center; color: var(--text-light); padding: 40px 0; font-size: 14px; }

.composer {
  display: flex; gap: 8px; padding: 12px 16px;
  border-top: 1.5px solid var(--blue-pale); flex-shrink: 0;
}
.composer-input {
  flex: 1; padding: 10px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 14px; outline: none;
  transition: border-color 0.15s;
}
.composer-input:focus { border-color: var(--navy-light); }
.send-btn {
  padding: 10px 20px; font-size: 13px;
  background: var(--navy); color: #fff; border: none; flex-shrink: 0;
}
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Members */
.members-col {
  width: 200px; flex-shrink: 0;
  border: 1.5px solid var(--border); display: flex; flex-direction: column;
  overflow: hidden;
}
.members-title {
  font-size: 13px; font-weight: 700; padding: 14px 14px 10px;
  border-bottom: 1.5px solid var(--blue-pale);
  display: flex; align-items: center; gap: 6px;
}
.members-count {
  background: var(--blue-soft); color: var(--navy);
  padding: 1px 7px; border-radius: 999px; font-size: 11px;
}
.members-list { flex: 1; overflow-y: auto; padding: 8px 0; }
.member-row {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; cursor: pointer; transition: background 0.12s;
}
.member-row:hover { background: var(--blue-soft); }
.member-avatar {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: var(--purple); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}
.member-avatar.self { background: var(--navy); }
.member-name { font-size: 13px; font-weight: 600; }
.you-label   { font-size: 10px; color: var(--text-light); font-weight: 400; }
</style>