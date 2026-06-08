<template>
  <AppLayout>
    <div v-if="loading" class="loading-state">
      <div class="skeleton-title" />
      <div class="skeleton-body" />
    </div>

    <div v-else-if="error" class="error-state card">
      <span class="error-icon">!</span>
      <p>{{ error }}</p>
      <button class="pill back-btn" @click="router.back()">Go back</button>
    </div>

    <template v-else-if="ticket">
      <div class="ticket-page">

        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <RouterLink to="/my-tickets" class="bc-link">My tickets</RouterLink>
          <span class="bc-sep">›</span>
          <span class="bc-current">{{ ticket.subject }}</span>
        </div>

        <!-- Ticket card -->
        <div class="ticket-card card">
          <div class="ticket-header">
            <div class="header-left">
              <h1 class="ticket-subject">{{ ticket.subject }}</h1>
              <div class="ticket-meta">
                <span class="meta-item">
                  by <RouterLink :to="`/user/${ticket.requesterId}`" class="meta-link">{{ ticket.requesterName }}</RouterLink>
                </span>
                <span class="meta-sep">·</span>
                <span class="meta-item">{{ timeAgo(ticket.createdAt) }}</span>
                <span class="meta-sep">·</span>
                <span
                  class="priority-badge"
                  :style="{ background: ticket.priorityColor ?? '#aaa' }"
                >{{ ticket.priorityName }}</span>
              </div>
            </div>
            <div class="header-right">
              <span class="status-badge" :class="ticket.resolvedAt ? 'resolved' : 'open'">
                {{ ticket.resolvedAt ? 'Resolved' : 'Open' }}
              </span>
              <!-- Support/admin can resolve -->
              <button
                v-if="authStore.canAcceptTicket && !ticket.resolvedAt"
                class="pill resolve-btn"
                :disabled="resolving"
                @click="handleResolve"
              >
                <span v-if="resolving" class="spinner" />
                <span v-else>Mark resolved</span>
              </button>
            </div>
          </div>

          <div v-if="ticket.description" class="ticket-description">
            {{ ticket.description }}
          </div>

          <div v-if="ticket.resolvedAt" class="resolved-notice">
            ✓ Resolved {{ timeAgo(ticket.resolvedAt) }}
          </div>
        </div>

        <!-- Replies -->
        <div class="replies-section">
          <h2 class="replies-title">
            {{ ticket.replies.length }} {{ ticket.replies.length === 1 ? 'reply' : 'replies' }}
          </h2>

          <div class="replies-list">
            <div
              v-for="r in ticket.replies"
              :key="r.id"
              class="reply-card"
              :class="{ 'reply-card--support': isSupport(r.authorId) }"
            >
              <div class="reply-avatar" @click="router.push(`/user/${r.authorId}`)">
                {{ (r.authorName ?? '?').slice(0, 2).toUpperCase() }}
              </div>
              <div class="reply-body">
                <div class="reply-meta">
                  <span class="reply-author" @click="router.push(`/user/${r.authorId}`)">
                    {{ r.authorName }}
                  </span>
                  <span class="reply-time">{{ timeAgo(r.createdAt) }}</span>
                  <span v-if="isSupport(r.authorId)" class="support-label">support</span>
                </div>
                <p class="reply-content">{{ r.content }}</p>
              </div>
            </div>
            <p v-if="!ticket.replies.length" class="empty-msg">No replies yet.</p>
          </div>
        </div>

        <!-- Reply composer — shown if ticket is open and user is requester or support -->
        <div v-if="canReply && !ticket.resolvedAt" class="reply-composer card">
          <div class="composer-avatar">
            {{ (authStore.user?.username ?? '?').slice(0, 2).toUpperCase() }}
          </div>
          <div class="composer-right">
            <textarea
              v-model="replyContent"
              class="composer-input"
              placeholder="Write a reply…"
              rows="3"
              @keydown.ctrl.enter="submitReply"
            />
            <div class="composer-footer">
              <span class="composer-hint">Ctrl+Enter to post</span>
              <button
                class="pill post-btn"
                :disabled="!replyContent.trim() || submitting"
                @click="submitReply"
              >
                <span v-if="submitting" class="spinner" />
                <span v-else>Post reply</span>
              </button>
            </div>
            <p v-if="replyError" class="form-error">{{ replyError }}</p>
          </div>
        </div>

        <p v-else-if="ticket.resolvedAt" class="resolved-msg">
          This ticket is resolved. <RouterLink to="/my-tickets" class="bc-link">Open a new one</RouterLink> if you need further help.
        </p>

      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/AppLayout.vue'
import { useTickets, type TicketDetail } from '@/composables/useTickets'
import { useAuthStore } from '@/stores/auth'
import { useTopicUtils } from '@/composables/useTopicUtils'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const api       = useTickets()
const { timeAgo } = useTopicUtils({ value: [] })

const ticket       = ref<TicketDetail | null>(null)
const loading      = ref(true)
const error        = ref('')
const replyContent = ref('')
const replyError   = ref('')
const submitting   = ref(false)
const resolving    = ref(false)

const ticketId = computed(() => Number(route.params.id))

const canReply = computed(() => {
  if (!authStore.user || !ticket.value) return false
  return authStore.user.id === ticket.value.requesterId || authStore.canAcceptTicket
})

// Heuristic: if the reply author is not the requester, treat them as support
function isSupport(authorId: number): boolean {
  return ticket.value ? authorId !== ticket.value.requesterId : false
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  replyError.value = ''
  submitting.value = true
  try {
    const r = await api.postReply(ticketId.value, replyContent.value.trim())
    ticket.value!.replies.push(r)
    replyContent.value = ''
  } catch (err: any) {
    replyError.value = err.message ?? 'Failed to post reply.'
  } finally {
    submitting.value = false
  }
}

async function handleResolve() {
  if (!confirm('Mark this ticket as resolved?')) return
  resolving.value = true
  try {
    await api.resolveTicket(ticketId.value)
    ticket.value!.resolvedAt = new Date().toISOString()
  } finally {
    resolving.value = false
  }
}

onMounted(async () => {
  try {
    ticket.value = await api.getTicket(ticketId.value)
  } catch (err: any) {
    error.value = err.message ?? 'Failed to load ticket.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ticket-page { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.bc-link    { color: var(--navy); font-weight: 600; }
.bc-link:hover { text-decoration: underline; }
.bc-sep     { color: var(--text-light); }
.bc-current { color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px; }

.ticket-card { padding: 24px; border: 1.5px solid var(--border); }

.ticket-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 16px;
}
.header-left { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.ticket-subject { font-size: 22px; font-weight: 800; line-height: 1.3; }

.ticket-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
.meta-link   { color: var(--navy); font-weight: 600; }
.meta-link:hover { text-decoration: underline; }
.meta-sep    { color: var(--text-light); }
.priority-badge {
  padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff;
}

.header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }

.status-badge {
  padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;
}
.status-badge.open     { background: var(--orange); color: #fff; }
.status-badge.resolved { background: var(--green);  color: #fff; }

.resolve-btn {
  padding: 7px 16px; font-size: 13px;
  background: var(--green); color: #fff; border: none;
  display: flex; align-items: center; gap: 6px;
}
.resolve-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.ticket-description {
  font-size: 15px; line-height: 1.7; color: var(--text);
  white-space: pre-wrap; padding-top: 4px;
}

.resolved-notice {
  margin-top: 12px; font-size: 13px; font-weight: 700; color: var(--green);
  background: #f0fdf4; padding: 8px 14px; border-radius: var(--radius-sm);
}

/* Replies */
.replies-section { display: flex; flex-direction: column; gap: 10px; }
.replies-title   { font-size: 15px; font-weight: 700; color: var(--text-muted); }
.replies-list    { display: flex; flex-direction: column; gap: 10px; }

.reply-card {
  display: flex; gap: 12px; padding: 14px 16px;
  background: var(--blue-soft); border: 1.5px solid var(--blue-pale);
  border-radius: var(--radius);
}
.reply-card--support {
  background: var(--orange-pale); border-color: var(--orange);
}

.reply-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: var(--navy); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; cursor: pointer;
}
.reply-card--support .reply-avatar { background: var(--orange); }
.reply-avatar:hover { opacity: 0.85; }

.reply-body   { flex: 1; min-width: 0; }
.reply-meta   { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.reply-author { font-weight: 700; font-size: 13px; cursor: pointer; }
.reply-author:hover { color: var(--navy); }
.reply-time   { font-size: 11px; color: var(--text-light); flex: 1; }
.support-label {
  font-size: 10px; font-weight: 700; padding: 1px 8px; border-radius: 999px;
  background: var(--orange); color: #fff;
}
.reply-content { font-size: 14px; line-height: 1.6; white-space: pre-wrap; }

.empty-msg { color: var(--text-light); font-size: 13px; text-align: center; padding: 24px 0; }

/* Composer */
.reply-composer { display: flex; gap: 12px; padding: 16px; border: 1.5px solid var(--border); }
.composer-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: var(--navy); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.composer-right  { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.composer-input  {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 14px; outline: none; resize: vertical;
  background: var(--card); color: var(--text); transition: border-color 0.15s;
}
.composer-input:focus { border-color: var(--navy-light); }
.composer-footer { display: flex; align-items: center; justify-content: space-between; }
.composer-hint   { font-size: 11px; color: var(--text-light); }
.post-btn {
  padding: 8px 18px; font-size: 13px;
  background: var(--navy); color: #fff; border: none;
  display: flex; align-items: center; gap: 6px;
}
.post-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.form-error { font-size: 12px; color: var(--red); font-weight: 600; }

.resolved-msg { text-align: center; font-size: 14px; color: var(--text-muted); }

/* Loading */
.loading-state { display: flex; flex-direction: column; gap: 16px; }
.skeleton-title { height: 32px; width: 50%; border-radius: var(--radius-sm); background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-body  { height: 160px; border-radius: var(--radius); background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Error */
.error-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; text-align: center; border: 1.5px solid var(--border); }
.error-icon  { width: 40px; height: 40px; border-radius: 50%; background: var(--red); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; }
.back-btn    { padding: 8px 20px; background: var(--navy); color: #fff; border: none; }

.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>