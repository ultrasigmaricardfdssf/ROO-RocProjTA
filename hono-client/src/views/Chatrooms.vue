<template>
  <AppLayout>
    <div class="rooms-page">
      <div class="page-header">
        <h1 class="page-title">Chat rooms</h1>
        <button class="pill new-btn" @click="showCreate = true">+ New room</button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Search rooms…"
          @input="debouncedSearch"
        />
      </div>

      <!-- Room list -->
      <div v-if="loading" class="rooms-list">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="!rooms.length" class="empty-state">
        No active rooms. Create one!
      </div>

      <div v-else class="rooms-list">
        <div
          v-for="r in rooms"
          :key="r.id"
          class="room-card"
          @click="enterRoom(r.id)"
        >
          <div class="room-left">
            <span class="room-icon">💬</span>
            <div class="room-info">
              <span class="room-title">{{ r.title }}</span>
              <span class="room-meta">Created {{ timeAgo(r.createdAt) }}</span>
            </div>
          </div>
          <div class="room-right">
            <span class="member-badge" :class="{ active: r.memberCount > 0 }">
              {{ r.memberCount }} {{ r.memberCount === 1 ? 'member' : 'members' }}
            </span>
            <span class="join-hint">Join →</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create room modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
          <div class="modal card">
            <div class="modal-header">
              <h2 class="modal-title">New chat room</h2>
              <button class="modal-close" @click="showCreate = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label class="field-label">Room title</label>
                <input
                  v-model="newTitle"
                  class="field-input"
                  placeholder="e.g. linux tips"
                  maxlength="80"
                  @keydown.enter="handleCreate"
                />
                <span class="char-count">{{ newTitle.length }}/80</span>
              </div>
              <p v-if="createError" class="form-error">{{ createError }}</p>
            </div>
            <div class="modal-footer">
              <button class="pill cancel-btn" @click="showCreate = false">Cancel</button>
              <button class="pill submit-btn" :disabled="creating || newTitle.trim().length < 3" @click="handleCreate">
                <span v-if="creating" class="spinner" />
                <span v-else>Create & join</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/AppLayout.vue'
import { useTopicUtils } from '@/composables/useTopicUtils'

const router = useRouter()
const { timeAgo } = useTopicUtils(ref([]))

interface Room { id: number; title: string; createdAt: string; memberCount: number }

const rooms       = ref<Room[]>([])
const loading     = ref(true)
const searchQuery = ref('')
const showCreate  = ref(false)
const newTitle    = ref('')
const createError = ref('')
const creating    = ref(false)

let searchTimer: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadRooms, 250)
}

async function loadRooms() {
  loading.value = true
  try {
    const params = searchQuery.value.trim() ? `?q=${encodeURIComponent(searchQuery.value)}` : ''
    const res    = await fetch(`/api/chat${params}`, { credentials: 'include' })
    rooms.value  = await res.json()
  } finally {
    loading.value = false
  }
}

async function enterRoom(id: number) {
  // Check the room is still active before navigating
  try {
    const res = await fetch(`/api/chat/${id}`, { credentials: 'include' })
    if (!res.ok) {
      await loadRooms() // refresh list — room may have closed
      return
    }
    router.push(`/chat/${id}`)
  } catch {
    router.push(`/chat/${id}`) // let the room page handle the error
  }
}

async function handleCreate() {
  createError.value = ''
  creating.value    = true
  try {
    const res  = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:    JSON.stringify({ title: newTitle.value.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { createError.value = data.error?.message ?? 'Failed to create room.'; return }

    showCreate.value = false
    newTitle.value   = ''
    router.push(`/chat/${data.id}`)
  } catch {
    createError.value = 'Something went wrong.'
  } finally {
    creating.value = false
  }
}

onMounted(loadRooms)
</script>

<style scoped>
.rooms-page   { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.page-header  { display: flex; align-items: center; justify-content: space-between; }
.page-title   { font-size: 24px; font-weight: 800; }
.new-btn      { padding: 8px 18px; font-size: 13px; background: var(--navy); color: #fff; border: none; }
.new-btn:hover { background: var(--navy-dark); }

.search-bar   { display: flex; }
.search-input {
  width: 100%; padding: 10px 16px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 14px; outline: none;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--navy-light); }

.rooms-list  { display: flex; flex-direction: column; gap: 10px; }
.room-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; background: var(--blue-soft);
  border: 2px solid var(--blue-pale); border-radius: var(--radius);
  cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
}
.room-card:hover { border-color: var(--navy-light); box-shadow: var(--shadow); }

.room-left  { display: flex; align-items: center; gap: 14px; }
.room-icon  { font-size: 24px; }
.room-info  { display: flex; flex-direction: column; gap: 3px; }
.room-title { font-weight: 700; font-size: 15px; }
.room-meta  { font-size: 12px; color: var(--text-muted); }

.room-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.member-badge {
  padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
  background: var(--bg); color: var(--text-light); border: 1.5px solid var(--border);
}
.member-badge.active { background: #f0fdf4; color: var(--green); border-color: var(--green); }
.join-hint  { font-size: 12px; color: var(--navy); font-weight: 600; }

.empty-state {
  text-align: center; color: var(--text-light); padding: 48px;
  border: 2px dashed var(--border); border-radius: var(--radius);
}

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 20px; }
.modal          { width: 100%; max-width: 440px; border: 1.5px solid var(--border); }
.modal-header   { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-title    { font-size: 18px; font-weight: 800; }
.modal-close    { background: none; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer; }
.modal-body     { padding: 20px 24px; display: flex; flex-direction: column; gap: 10px; }
.modal-footer   { padding: 0 24px 20px; display: flex; gap: 10px; justify-content: flex-end; }
.field          { display: flex; flex-direction: column; gap: 5px; }
.field-label    { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.field-input    { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-family: var(--font); font-size: 14px; outline: none; transition: border-color 0.15s; }
.field-input:focus { border-color: var(--navy-light); }
.char-count     { font-size: 11px; color: var(--text-light); text-align: right; }
.form-error     { font-size: 13px; color: var(--red); font-weight: 600; }
.cancel-btn     { padding: 9px 20px; font-size: 13px; background: #fff; color: var(--text-muted); border: 1.5px solid var(--border) !important; }
.submit-btn     { padding: 9px 20px; font-size: 13px; background: var(--navy); color: #fff; border: none; display: flex; align-items: center; gap: 6px; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner        { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97); }

.skeleton-row { height: 72px; border-radius: var(--radius); background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>