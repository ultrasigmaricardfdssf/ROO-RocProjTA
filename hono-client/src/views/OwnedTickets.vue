<template>
  <AppLayout>
    <div class="tickets-page">
      <div class="page-header">
        <h1 class="page-title">My tickets</h1>
        <button class="pill new-btn" @click="showCreate = true">+ New ticket</button>
      </div>

      <div v-if="loading" class="loading-list">
        <div v-for="i in 3" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="!tickets.length" class="empty-state card">
        <p>You haven't opened any tickets yet.</p>
        <button class="pill new-btn" @click="showCreate = true">Open a ticket</button>
      </div>

      <div v-else class="ticket-list">
        <div
          v-for="t in tickets"
          :key="t.id"
          class="ticket-card"
          :class="{ resolved: !!t.resolvedAt }"
          @click="router.push(`/tickets/${t.id}`)"
        >
          <div class="ticket-left">
            <span
              class="priority-dot"
              :style="{ background: t.priorityColor ?? '#aaa' }"
              :title="t.priorityName ?? 'Unknown priority'"
            />
            <div class="ticket-info">
              <span class="ticket-subject">{{ t.subject }}</span>
              <span class="ticket-preview">{{ t.description ?? 'No description.' }}</span>
            </div>
          </div>
          <div class="ticket-right">
            <span class="status-badge" :class="t.resolvedAt ? 'resolved' : 'open'">
              {{ t.resolvedAt ? 'Resolved' : 'Open' }}
            </span>
            <span class="ticket-time">{{ timeAgo(t.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create ticket modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
          <div class="modal card">
            <div class="modal-header">
              <h2 class="modal-title">New ticket</h2>
              <button class="modal-close" @click="showCreate = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label class="field-label">Subject</label>
                <input v-model="newSubject" class="field-input" placeholder="Brief description of your issue" maxlength="200" />
              </div>
              <div class="field">
                <label class="field-label">Priority</label>
                <div class="priority-select">
                  <button
                    v-for="p in priorities"
                    :key="p.id"
                    class="pill priority-btn"
                    :class="{ active: newPriorityId === p.id }"
                    :style="newPriorityId === p.id
                      ? { background: p.color ?? '#aaa', borderColor: p.color ?? '#aaa', color: '#fff' }
                      : { borderColor: p.color ?? '#aaa', color: p.color ?? '#aaa' }"
                    @click="newPriorityId = p.id"
                  >{{ p.name }}</button>
                </div>
              </div>
              <div class="field">
                <label class="field-label">Description <span class="optional">(optional)</span></label>
                <textarea v-model="newDescription" class="field-input field-textarea" placeholder="More details about your issue…" rows="5" />
              </div>
              <p v-if="createError" class="form-error">{{ createError }}</p>
            </div>
            <div class="modal-footer">
              <button class="pill cancel-btn" @click="showCreate = false">Cancel</button>
              <button class="pill submit-btn" :disabled="submitting || !newSubject.trim()" @click="handleCreate">
                <span v-if="submitting" class="spinner" />
                <span v-else>Submit ticket</span>
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
import { useTickets, type TicketSummary, type TicketPriority } from '@/composables/useTickets'
import { useTopicUtils } from '@/composables/useTopicUtils'

const router  = useRouter()
const api     = useTickets()
const { timeAgo } = useTopicUtils({ value: [] })

const tickets     = ref<TicketSummary[]>([])
const priorities  = ref<TicketPriority[]>([])
const loading     = ref(true)
const showCreate  = ref(false)
const newSubject     = ref('')
const newDescription = ref('')
const newPriorityId  = ref<number>(1)
const createError    = ref('')
const submitting     = ref(false)

async function handleCreate() {
  createError.value = ''
  submitting.value  = true
  try {
    const t = await api.createTicket({
      subject:     newSubject.value.trim(),
      description: newDescription.value.trim() || undefined,
      priorityId:  newPriorityId.value,
    })
    showCreate.value     = false
    newSubject.value     = ''
    newDescription.value = ''
    router.push(`/tickets/${t.id}`)
  } catch (err: any) {
    createError.value = err.message ?? 'Failed to create ticket.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const [t, p] = await Promise.allSettled([api.getMyTickets(), api.getPriorities()])
  if (t.status === 'fulfilled') tickets.value   = t.value
  if (p.status === 'fulfilled') {
    priorities.value  = p.value
    newPriorityId.value = p.value[0]?.id ?? 1
  }
  loading.value = false
})
</script>

<style scoped>
.tickets-page { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.page-header  { display: flex; align-items: center; justify-content: space-between; }
.page-title   { font-size: 24px; font-weight: 800; }
.new-btn {
  padding: 8px 18px; font-size: 13px;
  background: var(--navy); color: #fff; border: none;
}
.new-btn:hover { background: var(--navy-dark); }

.ticket-list { display: flex; flex-direction: column; gap: 10px; }
.ticket-card {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 14px 18px;
  background: var(--orange-pale); border: 2px solid var(--orange);
  border-radius: var(--radius); cursor: pointer; transition: box-shadow 0.15s;
}
.ticket-card:hover    { box-shadow: var(--shadow); }
.ticket-card.resolved {
  background: #f0fdf4; border-color: var(--green);
  opacity: 0.8;
}

.ticket-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.priority-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.ticket-info    { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ticket-subject { font-weight: 700; font-size: 14px; }
.ticket-preview { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.ticket-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
.status-badge {
  padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
}
.status-badge.open     { background: var(--orange); color: #fff; }
.status-badge.resolved { background: var(--green); color: #fff; }
.ticket-time { font-size: 11px; color: var(--text-muted); }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 48px; text-align: center; border: 1.5px solid var(--border); color: var(--text-muted);
}

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 500; padding: 20px;
}
.modal { width: 100%; max-width: 520px; border: 1.5px solid var(--border); }
.modal-header {
  display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0;
}
.modal-title  { font-size: 18px; font-weight: 800; }
.modal-close  { background: none; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer; }
.modal-body   { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { padding: 0 24px 20px; display: flex; gap: 10px; justify-content: flex-end; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field-label {
  font-size: 12px; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.04em;
}
.optional { font-weight: 400; text-transform: none; letter-spacing: 0; }
.field-input {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 14px; outline: none;
  background: var(--card); color: var(--text); transition: border-color 0.15s;
}
.field-input:focus { border-color: var(--navy-light); }
.field-textarea { resize: vertical; min-height: 100px; }

.priority-select { display: flex; gap: 6px; flex-wrap: wrap; }
.priority-btn {
  padding: 5px 14px; font-size: 12px; font-weight: 700;
  background: #fff; border: 2px solid var(--border); transition: all 0.15s;
}

.form-error  { font-size: 13px; color: var(--red); font-weight: 600; }
.cancel-btn  { padding: 9px 20px; font-size: 13px; background: #fff; color: var(--text-muted); border: 1.5px solid var(--border) !important; }
.submit-btn  { padding: 9px 20px; font-size: 13px; background: var(--navy); color: #fff; border: none; display: flex; align-items: center; gap: 6px; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.loading-list { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row { height: 70px; border-radius: var(--radius); background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97); }
</style>