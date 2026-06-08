<template>
  <AppLayout>
    <div class="admin-page">
      <div class="admin-header">
        <h1 class="admin-title">Admin Panel</h1>
      </div>

      <!-- Sidebar + content -->
      <div class="admin-layout">
        <nav class="admin-nav card">
          <button
            v-for="s in sections"
            :key="s.key"
            class="nav-item"
            :class="{ active: activeSection === s.key }"
            @click="activeSection = s.key"
          >
            <span class="nav-icon">{{ s.icon }}</span>
            <span>{{ s.label }}</span>
          </button>
        </nav>

        <div class="admin-content">
          <!-- STATS -->
          <section v-if="activeSection === 'stats'">
            <h2 class="section-title">Overview</h2>
            <div v-if="loadingStats" class="stats-grid">
              <div v-for="i in 5" :key="i" class="stat-card skeleton" />
            </div>
            <div v-else class="stats-grid">
              <div class="stat-card card" v-for="s in statCards" :key="s.label">
                <span class="stat-value" :style="{ color: s.color }">{{ s.value }}</span>
                <span class="stat-label">{{ s.label }}</span>
              </div>
            </div>
          </section>

          <!-- USERS -->
          <section v-if="activeSection === 'users'">
            <div class="section-header">
              <h2 class="section-title">Users</h2>
              <input v-model="userSearch" class="search-input" placeholder="Search username or email…" @input="debouncedUserSearch" />
            </div>

            <div v-if="loadingUsers" class="loading-list">
              <div v-for="i in 5" :key="i" class="skeleton-row" />
            </div>
            <div v-else class="data-table card">
              <div class="table-row table-head">
                <span>User</span>
                <span>Email</span>
                <span>Role</span>
                <span>Joined</span>
                <span>Actions</span>
              </div>
              <div v-for="u in userList" :key="u.id" class="table-row">
                <span class="cell-user">
                  <RouterLink :to="`/user/${u.id}`" class="user-link">{{ u.username }}</RouterLink>
                </span>
                <span class="cell-muted">{{ u.email }}</span>
                <span>
                  <select
                    class="role-select"
                    :value="u.roleId"
                    @change="handleRoleChange(u.id, Number(($event.target as HTMLSelectElement).value))"
                  >
                    <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
                  </select>
                </span>
                <span class="cell-muted">{{ formatDate(u.createdAt) }}</span>
                <span class="cell-actions">
                  <button class="pill action-btn" @click="openUserDetail(u.id)">Detail</button>
                  <button class="pill danger-btn" @click="handleDeleteUser(u.id, u.username)">Delete</button>
                </span>
              </div>
              <p v-if="!userList.length" class="empty-msg">No users found.</p>
            </div>

            <!-- Pagination -->
            <div class="pagination" v-if="userPages > 1">
              <button class="pill page-btn" :disabled="userPage <= 1" @click="userPage--; loadUsers()">←</button>
              <span class="page-info">{{ userPage }} / {{ userPages }}</span>
              <button class="pill page-btn" :disabled="userPage >= userPages" @click="userPage++; loadUsers()">→</button>
            </div>
          </section>

          <!-- ROLES -->
          <section v-if="activeSection === 'roles'">
            <div class="section-header">
              <h2 class="section-title">Roles</h2>
              <button class="pill new-btn" @click="showNewRole = true">+ New role</button>
            </div>

            <div class="roles-list">
              <div v-for="r in roles" :key="r.id" class="role-card card">
                <div class="role-header">
                  <span class="role-name" :style="{ color: r.color ?? 'inherit' }">{{ r.name }}</span>
                  <span class="role-color-dot" :style="{ background: r.color ?? '#888' }" />
                </div>
                <div class="role-perms">
                  <span class="perm" :class="{ on: r.canReply }">reply</span>
                  <span class="perm" :class="{ on: r.canDeleteReply }">delete</span>
                  <span class="perm" :class="{ on: r.canPostTicket }">tickets</span>
                  <span class="perm" :class="{ on: r.canAcceptTicket }">support</span>
                </div>
                <button class="pill edit-btn" @click="openEditRole(r)">Edit</button>
              </div>
            </div>
          </section>

          <!-- QUESTIONS -->
          <section v-if="activeSection === 'questions'">
            <div class="section-header">
              <h2 class="section-title">Forum questions</h2>
              <input v-model="questionSearch" class="search-input" placeholder="Search title…" @input="debouncedQSearch" />
            </div>

            <div v-if="loadingQuestions" class="loading-list">
              <div v-for="i in 5" :key="i" class="skeleton-row" />
            </div>
            <div v-else class="data-table card">
              <div class="table-row table-head">
                <span>Title</span>
                <span>Author</span>
                <span>Replies</span>
                <span>Posted</span>
                <span>Actions</span>
              </div>
              <div v-for="q in questionList" :key="q.id" class="table-row">
                <RouterLink :to="`/forums/${q.id}`" class="cell-link">{{ q.title }}</RouterLink>
                <RouterLink :to="`/user/${q.authorId}`" class="cell-muted user-link">{{ q.authorName }}</RouterLink>
                <span class="cell-muted">{{ q.replyCount }}</span>
                <span class="cell-muted">{{ formatDate(q.createdAt) }}</span>
                <span class="cell-actions">
                  <button class="pill danger-btn" @click="handleDeleteQuestion(q.id, q.title)">Delete</button>
                </span>
              </div>
              <p v-if="!questionList.length" class="empty-msg">No questions found.</p>
            </div>
            <div class="pagination" v-if="questionPages > 1">
              <button class="pill page-btn" :disabled="questionPage <= 1" @click="questionPage--; loadQuestions()">←</button>
              <span class="page-info">{{ questionPage }} / {{ questionPages }}</span>
              <button class="pill page-btn" :disabled="questionPage >= questionPages" @click="questionPage++; loadQuestions()">→</button>
            </div>
          </section>

          <!-- TICKETS -->
          <section v-if="activeSection === 'tickets'">
            <h2 class="section-title">Tickets</h2>
            <div v-if="loadingTickets" class="loading-list">
              <div v-for="i in 5" :key="i" class="skeleton-row" />
            </div>
            <div v-else class="data-table card">
              <div class="table-row table-head">
                <span>Subject</span>
                <span>Requester</span>
                <span>Status</span>
                <span>Created</span>
                <span>Actions</span>
              </div>
              <div v-for="t in ticketList" :key="t.id" class="table-row">
                <RouterLink class="cell-link" :to="`/tickets/${t.id}`">{{ t.subject }}</RouterLink>
                <RouterLink :to="`/user/${t.requesterId}`" class="cell-muted user-link">{{ t.requesterName }}</RouterLink>
                <span class="status-badge" :class="t.resolvedAt ? 'resolved' : 'open'">
                  {{ t.resolvedAt ? 'resolved' : 'open' }}
                </span>
                <span class="cell-muted">{{ formatDate(t.createdAt) }}</span>
                <span class="cell-actions">
                  <button class="pill danger-btn" @click="handleDeleteTicket(t.id, t.subject)">Delete</button>
                </span>
              </div>
              <p v-if="!ticketList.length" class="empty-msg">No tickets found.</p>
            </div>
            <div class="pagination" v-if="ticketPages > 1">
              <button class="pill page-btn" :disabled="ticketPage <= 1" @click="ticketPage--; loadTickets()">←</button>
              <span class="page-info">{{ ticketPage }} / {{ ticketPages }}</span>
              <button class="pill page-btn" :disabled="ticketPage >= ticketPages" @click="ticketPage++; loadTickets()">→</button>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- User detail modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailUser" class="modal-backdrop" @click.self="detailUser = null">
          <div class="modal card">
            <div class="modal-header">
              <h2 class="modal-title">{{ detailUser.username }}</h2>
              <button class="modal-close" @click="detailUser = null">✕</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <span class="detail-label">Email</span>      <span>{{ detailUser.email }}</span>
                <span class="detail-label">Role</span>       <span :style="{ color: detailUser.roleColor ?? 'inherit' }">{{ detailUser.roleName }}</span>
                <span class="detail-label">Questions</span>  <span>{{ detailUser.questionCount }}</span>
                <span class="detail-label">Replies</span>    <span>{{ detailUser.replyCount }}</span>
                <span class="detail-label">Tickets</span>    <span>{{ detailUser.ticketCount }}</span>
                <span class="detail-label">Joined</span>     <span>{{ formatDate(detailUser.createdAt) }}</span>
              </div>
              <div class="reset-pw-section">
                <p class="reset-label">Force password reset</p>
                <div class="reset-row">
                  <input v-model="newPassword" type="password" class="field-input" placeholder="New password (min 8 chars)" />
                  <button class="pill reset-btn" :disabled="newPassword.length < 8" @click="handleResetPassword">Reset</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Role edit modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="editingRole" class="modal-backdrop" @click.self="editingRole = null">
          <div class="modal card">
            <div class="modal-header">
              <h2 class="modal-title">{{ showNewRole ? 'New role' : `Edit: ${editingRole.name}` }}</h2>
              <button class="modal-close" @click="editingRole = null; showNewRole = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label class="field-label">Name</label>
                <input v-model="editingRole.name" class="field-input" />
              </div>
              <div class="field">
                <label class="field-label">Color</label>
                <div class="color-row">
                  <input v-model="editingRole.color" class="field-input" placeholder="#aabbcc" />
                  <span class="color-preview" :style="{ background: editingRole.color ?? '#888' }" />
                </div>
              </div>
              <div class="perms-grid">
                <label class="perm-toggle" v-for="p in permKeys" :key="p.key">
                  <input type="checkbox" v-model="(editingRole as any)[p.key]" />
                  <span>{{ p.label }}</span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="pill cancel-btn" @click="editingRole = null; showNewRole = false">Cancel</button>
              <button class="pill submit-btn" @click="handleSaveRole">Save</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/AppLayout.vue'
import { useAdmin, type AdminUser, type AdminUserDetail, type AdminStats, type AdminQuestion, type AdminTicket, type Role } from '@/composables/useAdmin'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const authStore = useAuthStore()
const admin_api = useAdmin()

// Redirect non-admins
if (!authStore.isAdmin) router.replace('/')

const activeSection = ref('stats')
const sections = [
  { key: 'stats',     label: 'Overview',   icon: '📊' },
  { key: 'users',     label: 'Users',      icon: '👥' },
  { key: 'roles',     label: 'Roles',      icon: '🏷️' },
  { key: 'questions', label: 'Questions',  icon: '💬' },
  { key: 'tickets',   label: 'Tickets',    icon: '🎫' },
]

const permKeys = [
  { key: 'canReply',        label: 'Can reply' },
  { key: 'canDeleteReply',  label: 'Can delete content' },
  { key: 'canPostTicket',   label: 'Can post tickets' },
  { key: 'canAcceptTicket', label: 'Can accept tickets (support)' },
]

// ── Stats ──────────────────────────────────────────────────────────────────
const stats        = ref<AdminStats | null>(null)
const loadingStats = ref(true)

const statCards = computed(() => !stats.value ? [] : [
  { label: 'Users',        value: stats.value.users,       color: 'var(--navy)'   },
  { label: 'Questions',    value: stats.value.questions,   color: 'var(--purple)' },
  { label: 'Replies',      value: stats.value.replies,     color: 'var(--navy)'   },
  { label: 'Tickets',      value: stats.value.tickets,     color: 'var(--orange)' },
  { label: 'Open tickets', value: stats.value.openTickets, color: 'var(--red)'    },
])

// ── Users ──────────────────────────────────────────────────────────────────
const userList     = ref<AdminUser[]>([])
const userSearch   = ref('')
const userPage     = ref(1)
const userPages    = ref(1)
const loadingUsers = ref(false)
const detailUser   = ref<AdminUserDetail | null>(null)
const newPassword  = ref('')
const roles        = ref<Role[]>([])

let userSearchTimer: ReturnType<typeof setTimeout>
function debouncedUserSearch() {
  clearTimeout(userSearchTimer)
  userSearchTimer = setTimeout(() => { userPage.value = 1; loadUsers() }, 300)
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const data = await admin_api.getUsers(userSearch.value, userPage.value)
    userList.value  = data.users
    userPages.value = data.pages
  } finally {
    loadingUsers.value = false
  }
}

async function openUserDetail(id: number) {
  detailUser.value = await admin_api.getUserDetail(id)
  newPassword.value = ''
}

async function handleRoleChange(userId: number, roleId: number) {
  await admin_api.setUserRole(userId, roleId)
  const u = userList.value.find(x => x.id === userId)
  if (u) u.roleId = roleId
}

async function handleDeleteUser(id: number, username: string) {
  if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
  await admin_api.deleteUser(id)
  userList.value = userList.value.filter(u => u.id !== id)
}

async function handleResetPassword() {
  if (!detailUser.value) return
  await admin_api.resetPassword(detailUser.value.id, newPassword.value)
  newPassword.value = ''
  detailUser.value  = null
}

// ── Roles ──────────────────────────────────────────────────────────────────
const showNewRole  = ref(false)
const editingRole  = ref<Role | null>(null)

function openEditRole(r: Role) {
  editingRole.value = { ...r }
  showNewRole.value = false
}

function openNewRole() {
  editingRole.value = { id: 0, name: '', color: '#6366f1', canReply: true, canDeleteReply: false, canPostTicket: false, canAcceptTicket: false }
  showNewRole.value = true
}

// Watch showNewRole to open the modal
import { watch } from 'vue'
watch(showNewRole, (val) => { if (val) openNewRole() })

async function handleSaveRole() {
  if (!editingRole.value) return
  if (showNewRole.value) {
    const created = await admin_api.createRole(editingRole.value)
    roles.value.push(created)
  } else {
    const updated = await admin_api.updateRole(editingRole.value.id, editingRole.value)
    const idx = roles.value.findIndex(r => r.id === updated.id)
    if (idx !== -1) roles.value[idx] = updated
  }
  editingRole.value = null
  showNewRole.value = false
}

// ── Questions ──────────────────────────────────────────────────────────────
const questionList    = ref<AdminQuestion[]>([])
const questionSearch  = ref('')
const questionPage    = ref(1)
const questionPages   = ref(1)
const loadingQuestions = ref(false)

let qSearchTimer: ReturnType<typeof setTimeout>
function debouncedQSearch() {
  clearTimeout(qSearchTimer)
  qSearchTimer = setTimeout(() => { questionPage.value = 1; loadQuestions() }, 300)
}

async function loadQuestions() {
  loadingQuestions.value = true
  try {
    const data = await admin_api.getQuestions(questionSearch.value, questionPage.value)
    questionList.value  = data.questions
    questionPages.value = data.pages
  } finally {
    loadingQuestions.value = false
  }
}

async function handleDeleteQuestion(id: number, title: string) {
  if (!confirm(`Delete "${title}"?`)) return
  await admin_api.deleteQuestion(id)
  questionList.value = questionList.value.filter(q => q.id !== id)
}

// ── Tickets ────────────────────────────────────────────────────────────────
const ticketList    = ref<AdminTicket[]>([])
const ticketPage    = ref(1)
const ticketPages   = ref(1)
const loadingTickets = ref(false)

async function loadTickets() {
  loadingTickets.value = true
  try {
    const data = await admin_api.getTickets(ticketPage.value)
    ticketList.value  = data.tickets
    ticketPages.value = data.pages
  } finally {
    loadingTickets.value = false
  }
}

async function handleDeleteTicket(id: number, subject: string) {
  if (!confirm(`Delete ticket "${subject}"?`)) return
  await admin_api.deleteTicket(id)
  ticketList.value = ticketList.value.filter(t => t.id !== id)
}

// ── Utils ──────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB')
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  const [s, r] = await Promise.allSettled([
    admin_api.getStats(),
    admin_api.getRoles(),
  ])
  if (s.status === 'fulfilled') { stats.value = s.value; loadingStats.value = false }
  if (r.status === 'fulfilled') roles.value = r.value

  await loadUsers()
  await loadQuestions()
  await loadTickets()
})
</script>

<style scoped>
.admin-page   { display: flex; flex-direction: column; gap: 20px; }
.admin-header { display: flex; align-items: center; gap: 12px; }
.admin-title  { font-size: 26px; font-weight: 800; }
.admin-badge  {
  padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;
  background: var(--red-pale); color: var(--red); border: 1.5px solid var(--red);
}

.admin-layout {
  display: flex; gap: 20px; align-items: flex-start;
}

/* Sidebar */
.admin-nav {
  width: 180px; flex-shrink: 0;
  padding: 8px 0; border: 1.5px solid var(--border);
  position: sticky; top: 80px;
}
.nav-item {
  width: 100%; padding: 10px 18px;
  display: flex; align-items: center; gap: 10px;
  background: none; border: none; cursor: pointer;
  font-family: var(--font); font-size: 13px; font-weight: 600;
  color: var(--text-muted); text-align: left;
  transition: background 0.12s, color 0.12s;
}
.nav-item:hover  { background: var(--blue-soft); color: var(--text); }
.nav-item.active { background: var(--navy); color: #fff; }
.nav-icon { font-size: 15px; }

/* Content */
.admin-content { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.section-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.section-title { font-size: 18px; font-weight: 800; }
.search-input {
  padding: 7px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 13px; outline: none; width: 240px;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--navy-light); }
.new-btn {
  padding: 7px 16px; font-size: 12px;
  background: var(--navy); color: #fff; border: none;
}

/* Stats */
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px;
}
.stat-card {
  padding: 20px; border: 1.5px solid var(--border);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.stat-card.skeleton {
  height: 80px;
  background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
.stat-value { font-size: 32px; font-weight: 800; }
.stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }

/* Table */
.data-table { border: 1.5px solid var(--border); overflow: hidden; }
.table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
  gap: 12px; align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--blue-pale);
  font-size: 13px;
}
.table-row:last-child { border-bottom: none; }
.table-head {
  background: var(--blue-soft); font-weight: 700;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted);
}
.table-row:not(.table-head):hover { background: var(--blue-soft); }
.cell-muted { color: var(--text-muted); font-size: 12px; }
.cell-link  { color: var(--navy); font-weight: 600; cursor: pointer; }
.cell-link:hover { text-decoration: underline; }
.user-link  { color: var(--navy); font-weight: 600; }
.user-link:hover { text-decoration: underline; }
.cell-actions { display: flex; gap: 6px; }

.role-select {
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  padding: 3px 8px; font-family: var(--font); font-size: 12px; outline: none;
  background: var(--card);
}

.action-btn {
  padding: 3px 10px; font-size: 11px;
  background: none; color: var(--navy); border: 1.5px solid var(--navy-light) !important;
}
.danger-btn {
  padding: 3px 10px; font-size: 11px;
  background: none; color: var(--red); border: 1.5px solid var(--red) !important;
}
.danger-btn:hover { background: var(--red); color: #fff; }

.empty-msg { grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 24px; }

/* Pagination */
.pagination { display: flex; align-items: center; gap: 10px; justify-content: center; }
.page-btn {
  padding: 6px 14px; font-size: 13px;
  background: #fff; color: var(--navy); border: 1.5px solid var(--navy-light) !important;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--text-muted); }

/* Roles */
.roles-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.role-card  { padding: 16px; border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
.role-header { display: flex; align-items: center; justify-content: space-between; }
.role-name  { font-weight: 800; font-size: 15px; }
.role-color-dot { width: 14px; height: 14px; border-radius: 50%; }
.role-perms { display: flex; gap: 5px; flex-wrap: wrap; }
.perm {
  padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700;
  background: var(--bg); color: var(--text-light); border: 1.5px solid var(--border);
}
.perm.on { background: var(--blue-soft); color: var(--navy); border-color: var(--navy-light); }
.edit-btn {
  padding: 4px 12px; font-size: 12px; align-self: flex-start;
  background: none; color: var(--navy); border: 1.5px solid var(--navy-light) !important;
}

/* Status badge */
.status-badge {
  padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
}
.status-badge.open     { background: var(--orange-pale); color: var(--orange); }
.status-badge.resolved { background: #f0fdf4; color: var(--green); }

/* User detail modal */
.detail-grid {
  display: grid; grid-template-columns: auto 1fr; gap: 8px 16px;
  align-items: center; margin-bottom: 20px;
}
.detail-label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

.reset-pw-section { border-top: 1.5px dashed var(--border); padding-top: 16px; }
.reset-label { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.reset-row   { display: flex; gap: 8px; }
.reset-btn {
  padding: 8px 16px; font-size: 13px; flex-shrink: 0;
  background: var(--red); color: #fff; border: none;
}
.reset-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Role edit modal */
.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.field-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.field-input {
  padding: 8px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 13px; outline: none;
  transition: border-color 0.15s;
}
.field-input:focus { border-color: var(--navy-light); }
.color-row   { display: flex; gap: 8px; align-items: center; }
.color-preview { width: 28px; height: 28px; border-radius: var(--radius-sm); flex-shrink: 0; border: 1.5px solid var(--border); }
.perms-grid  { display: flex; flex-direction: column; gap: 8px; }
.perm-toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 500; padding: 20px;
}
.modal { width: 100%; max-width: 480px; border: 1.5px solid var(--border); }
.modal-header {
  display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0;
}
.modal-title { font-size: 17px; font-weight: 800; }
.modal-close {
  background: none; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer;
}
.modal-body   { padding: 20px 24px; }
.modal-footer { padding: 0 24px 20px; display: flex; gap: 10px; justify-content: flex-end; }
.cancel-btn {
  padding: 8px 18px; font-size: 13px; background: none;
  color: var(--text-muted); border: 1.5px solid var(--border) !important;
}
.submit-btn {
  padding: 8px 18px; font-size: 13px;
  background: var(--navy); color: #fff; border: none;
}

/* Loading */
.loading-list { display: flex; flex-direction: column; gap: 8px; }
.skeleton-row {
  height: 44px; border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from,   .modal-leave-to     { opacity: 0; transform: scale(0.97); }

@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>