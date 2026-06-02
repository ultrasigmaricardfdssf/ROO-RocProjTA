<template>
  <AppLayout>
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-avatar" />
      <div class="skeleton-info" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state card">
      <span class="error-icon">!</span>
      <p>{{ error }}</p>
      <button class="pill back-btn" @click="router.back()">Go back</button>
    </div>

    <!-- Profile -->
    <div v-else-if="user" class="user-page card">
      <div class="avatar-col">
        <div class="profile-avatar">
          <span class="av-initials">{{ user.username.slice(0, 2).toUpperCase() }}</span>
        </div>
      </div>

      <div class="info-card dashed">
        <div class="info-top">
          <div class="info-left">
            <h1 class="username">{{ user.username }}</h1>
            <span
              class="role-badge"
              :style="{ color: user.roleColor ?? '#888' }"
            >{{ user.roleName }}</span>

            <!-- Editable description (own profile) -->
            <template v-if="isOwnProfile && editingBio">
              <textarea
                v-model="bioEdit"
                class="bio-input"
                rows="3"
                maxlength="1000"
                placeholder="Write something about yourself…"
              />
              <div class="bio-edit-actions">
                <button class="pill save-bio-btn" :disabled="savingBio" @click="saveBio">
                  <span v-if="savingBio" class="spinner" />
                  <span v-else>Save</span>
                </button>
                <button class="pill cancel-bio-btn" @click="cancelBioEdit">Cancel</button>
              </div>
            </template>
            <template v-else>
              <p v-if="user.description" class="bio-text">{{ user.description }}</p>
              <p v-else class="bio-empty">No description yet.</p>
              <button v-if="isOwnProfile" class="pill edit-bio-btn" @click="startBioEdit">
                Edit bio
              </button>
            </template>
          </div>

          <div class="info-actions">
            <button
              v-if="!isOwnProfile && authStore.isLoggedIn"
              class="pill action-btn msg-btn dashed"
              @click="router.push(`/inbox/new?to=${user.id}`)"
            >msg</button>
          </div>

          <div class="info-stats">
            <span class="stat-line">
              Signed up: {{ formatDate(user.createdAt) }}
            </span>
            <span class="stat-line blue">Following: {{ user.following }}</span>
            <div class="stat-follow-row">
              <span class="stat-line blue">Followers: {{ user.followers }}</span>
              <button
                v-if="!isOwnProfile && authStore.isLoggedIn"
                class="pill follow-btn"
                :class="{ following: isFollowing }"
                @click="toggleFollow"
              >{{ isFollowing ? 'Unfollow' : 'Follow' }}</button>
            </div>
            <div v-if="!isOwnProfile && authStore.isLoggedIn" class="action-btns">
              <button class="pill action-dark">BLOCK</button>
              <button class="pill action-red">REPORT</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

interface PublicUser {
  id: number
  username: string
  description: string | null
  createdAt: string
  roleId: number
  roleName: string
  roleColor: string | null
  following: number
  followers: number
}

const user      = ref<PublicUser | null>(null)
const loading   = ref(true)
const error     = ref('')
const isFollowing = ref(false)

// Bio editing
const editingBio = ref(false)
const bioEdit    = ref('')
const savingBio  = ref(false)

const userId = computed(() => Number(route.params.id))
const isOwnProfile = computed(() => authStore.user?.id === userId.value)

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'numeric', year: 'numeric'
  })
}

function startBioEdit() {
  bioEdit.value  = user.value?.description ?? ''
  editingBio.value = true
}

function cancelBioEdit() {
  editingBio.value = false
}

async function saveBio() {
  savingBio.value = true
  try {
    const res = await fetch(`/api/users/${userId.value}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ description: bioEdit.value }),
    })
    if (!res.ok) throw new Error('Failed to save')
    if (user.value) user.value.description = bioEdit.value
    editingBio.value = false
  } catch {
    // silently fail for now — could add an error message here
  } finally {
    savingBio.value = false
  }
}

function toggleFollow() {
  // stub — wire to follow API when built
  isFollowing.value = !isFollowing.value
}

onMounted(async () => {
  try {
    const res = await fetch(`/api/users/${userId.value}`, { credentials: 'include' })
    if (!res.ok) {
      const data = await res.json()
      error.value = data.error?.message ?? 'User not found'
      return
    }
    user.value = await res.json()
  } catch {
    error.value = 'Failed to load user profile.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.user-page {
  display: flex;
  gap: 0;
  padding: 32px;
  align-items: flex-start;
}

/* Loading skeletons */
.loading-state { display: flex; gap: 28px; padding: 32px; }
.skeleton-avatar {
  width: 180px; height: 180px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
.skeleton-info {
  flex: 1; height: 180px; border-radius: var(--radius);
  background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Error */
.error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 40px; text-align: center; border: 1.5px solid var(--border);
}
.error-icon {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--red); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 800;
}
.back-btn { padding: 8px 20px; background: var(--navy); color: #fff; border: none; }

.avatar-col { flex-shrink: 0; margin-right: 28px; }
.profile-avatar {
  width: 180px; height: 180px; border-radius: 50%;
  background: var(--purple);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; box-shadow: 0 4px 24px rgba(124,58,237,0.3);
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.av-initials { color: #fff; font-size: 48px; font-weight: 800; }

.info-card { flex: 1; padding: 20px 24px; border-color: var(--border) !important; }
.info-top  { display: flex; gap: 20px; align-items: flex-start; }
.info-left { flex: 1; display: flex; flex-direction: column; gap: 6px; }

.username { font-size: 26px; font-weight: 800; }

.role-badge {
  display: inline-block; font-size: 13px; font-weight: 700;
  padding: 1px 10px; border-radius: 999px; width: fit-content;
}

/* Bio */
.bio-text  { font-size: 14px; color: var(--text); line-height: 1.6; }
.bio-empty { font-size: 13px; color: var(--text-light); font-style: italic; }

.bio-input {
  width: 100%; padding: 8px 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 14px; outline: none; resize: vertical;
  transition: border-color 0.15s;
}
.bio-input:focus { border-color: var(--navy-light); }

.bio-edit-actions { display: flex; gap: 8px; }
.edit-bio-btn {
  padding: 4px 12px; font-size: 12px;
  background: none; color: var(--text-muted);
  border: 1.5px solid var(--border) !important;
  width: fit-content;
}
.edit-bio-btn:hover { color: var(--navy); border-color: var(--navy-light) !important; }
.save-bio-btn {
  padding: 5px 14px; font-size: 12px;
  background: var(--navy); color: #fff; border: none;
  display: flex; align-items: center; gap: 5px;
}
.save-bio-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.cancel-bio-btn {
  padding: 5px 14px; font-size: 12px;
  background: none; color: var(--text-muted);
  border: 1.5px solid var(--border) !important;
}

.spinner {
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.info-actions {
  display: flex; flex-direction: column;
  align-items: center; padding-top: 4px;
}
.action-btn { padding: 6px 14px; font-size: 13px; }
.msg-btn { color: var(--navy); border-color: var(--navy-light) !important; }

.info-stats { display: flex; flex-direction: column; gap: 4px; min-width: 130px; }
.stat-line  { font-size: 13px; color: var(--text-muted); }
.stat-line.blue { color: var(--navy); font-weight: 700; }
.stat-follow-row { display: flex; align-items: center; gap: 8px; }

.follow-btn {
  padding: 3px 14px; font-size: 12px;
  background: var(--navy); color: #fff; border-color: var(--navy) !important;
}
.follow-btn.following {
  background: var(--border); color: var(--text-muted); border-color: var(--border) !important;
}

.action-btns { display: flex; gap: 6px; margin-top: 6px; }
.action-dark {
  padding: 5px 12px; font-size: 12px;
  background: #1e293b; color: #fff; border-color: #1e293b !important;
}
.action-red {
  padding: 5px 12px; font-size: 12px;
  background: var(--red); color: #fff; border-color: var(--red) !important;
}
</style>