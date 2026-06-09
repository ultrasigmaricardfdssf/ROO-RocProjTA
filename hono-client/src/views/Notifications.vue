<template>
  <AppLayout>
    <div class="notifs-page">
      <div class="page-header">
        <h1 class="page-title">Your notifications</h1>
        <button
          v-if="notifications.length"
          class="pill mark-all-btn"
          @click="handleMarkAll"
        >Mark all read</button>
      </div>

      <div v-if="loading" class="notif-list card">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="!notifications.length" class="empty-state card">
        No notifications yet.
      </div>

      <div v-else class="notif-list card">
        <RouterLink
          v-for="n in notifications"
          :key="n.id"
          :to="notificationLink(n)"
          class="notif-row"
          :class="{ unread: !n.read }"
          @click="handleClick(n)"
        >
          <!-- Type badge -->
          <span class="type-badge pill" :class="badgeClass(n.type)">
            {{ badgeLabel(n.type) }}
          </span>

          <!-- Sender avatar -->
          <div class="notif-avatar" :style="{ background: avatarColor(n.type) }">
            {{ (n.fromUsername ?? '?').slice(0, 2).toUpperCase() }}
          </div>

          <!-- Content -->
          <div class="notif-content">
            <span class="notif-from">{{ n.fromUsername ?? 'System' }}</span>
            <span class="notif-message">{{ n.message }}</span>
          </div>

          <div class="notif-right">
            <span class="notif-time">{{ timeAgo(n.createdAt) }}</span>
            <span v-if="!n.read" class="unread-dot" />
          </div>
        </RouterLink>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/AppLayout.vue'
import { useNotifications, notificationLink, type Notification } from '@/composables/useNotifs'
import { useTopicUtils } from '@/composables/useTopicUtils'

const { notifications, loading, fetchNotifications, markRead, markAllRead } = useNotifications()
const { timeAgo } = useTopicUtils([])

async function handleClick(n: Notification) {
  if (!n.read) await markRead(n.id)
}

async function handleMarkAll() {
  await markAllRead()
}

function badgeLabel(type: string): string {
  const map: Record<string, string> = {
    forum_reply:         'reply',
    forum_reaction:      'like',
    reply_reaction:      'like',
    reply_solution:      'solution',
    forum_follow_reply:  'follow',
    ticket_reply:        'ticket',
    ticket_resolved:     'resolved',
    user_follow:         'follow',
  }
  return map[type] ?? 'ntf'
}

function badgeClass(type: string): string {
  if (type.startsWith('ticket'))        return 'badge-orange'
  if (type.includes('reaction'))        return 'badge-red'
  if (type.includes('solution'))        return 'badge-green'
  if (type.includes('follow'))          return 'badge-purple'
  return 'badge-blue'
}

function avatarColor(type: string): string {
  if (type.startsWith('ticket'))        return 'var(--orange)'
  if (type.includes('reaction'))        return 'var(--red)'
  if (type.includes('solution'))        return 'var(--green)'
  if (type.includes('follow'))          return 'var(--purple)'
  return 'var(--navy)'
}

onMounted(() => fetchNotifications())
</script>

<style scoped>
.notifs-page { max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-title  { font-size: 20px; font-weight: 800; }
.mark-all-btn {
  padding: 6px 14px; font-size: 12px;
  background: none; color: var(--text-muted);
  border: 1.5px solid var(--border) !important;
}
.mark-all-btn:hover { color: var(--navy); border-color: var(--navy-light) !important; }

.notif-list { padding: 6px 0; }
.empty-state {
  text-align: center; color: var(--text-light);
  padding: 40px; border: 1.5px solid var(--border);
}

.notif-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; cursor: pointer;
  text-decoration: none; color: inherit;
  border-bottom: 1px solid var(--blue-pale);
  transition: background 0.12s;
}
.notif-row:last-child { border-bottom: none; }
.notif-row:hover  { background: var(--blue-soft); }
.notif-row.unread { background: #f0f7ff; }

.type-badge {
  flex-shrink: 0; height: 24px; padding: 0 10px;
  display: flex; align-items: center;
  font-size: 10px; font-weight: 700; border-radius: 999px;
  min-width: 52px; justify-content: center;
}
.badge-blue   { color: var(--navy);   border: 1.5px solid var(--navy-light) !important; }
.badge-orange { color: var(--orange); border: 1.5px solid var(--orange) !important; }
.badge-red    { color: var(--red);    border: 1.5px solid var(--red) !important; }
.badge-green  { color: var(--green);  border: 1.5px solid var(--green) !important; }
.badge-purple { color: var(--purple); border: 1.5px solid var(--purple) !important; }

.notif-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700;
}

.notif-content { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.notif-from    { font-weight: 700; font-size: 13px; }
.notif-message { font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.notif-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.notif-time  { font-size: 11px; color: var(--text-light); }
.unread-dot  { width: 8px; height: 8px; border-radius: 50%; background: var(--navy); }

/* Skeleton */
.skeleton-row {
  height: 60px; margin: 4px 20px; border-radius: var(--radius);
  background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>