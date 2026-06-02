<template>
  <AppLayout>
    <div class="forums-page">

      <!-- Header row -->
      <div class="page-header">
        <h1 class="page-title">Forums</h1>
        <button v-if="authStore.isLoggedIn" class="pill new-btn" @click="showNewModal = true">
          + New question
        </button>
      </div>

      <!-- Tag filter bar -->
      <div v-if="tags.length" class="tag-bar">
        <button
          class="pill tag-pill"
          :class="{ active: selectedTag === null }"
          @click="selectedTag = null"
        >all</button>
        <button
          v-for="tag in tags"
          :key="tag.id"
          class="pill tag-pill"
          :class="{ active: selectedTag === tag.id }"
          :style="selectedTag === tag.id ? { background: tag.color ?? undefined, borderColor: tag.color ?? undefined, color: '#fff' } : { borderColor: tag.color ?? undefined, color: tag.color ?? undefined }"
          @click="selectedTag = selectedTag === tag.id ? null : tag.id"
        >{{ tag.short ?? tag.name }}</button>
      </div>

      <!-- Recent topics -->
      <section class="topic-section">
        <h2 class="section-title center">Recent topics</h2>
        <div v-if="loadingRecent" class="loading-list">
          <div v-for="i in 4" :key="i" class="skeleton-row" />
        </div>
        <div v-else class="topic-list">
          <TopicCard
            v-for="q in filteredRecent"
            :key="q.id"
            :topic="toTopicCard(q)"
            @click="router.push(`/forums/${q.id}`)"
          />
          <p v-if="!filteredRecent.length" class="empty-msg">No questions yet. Be the first!</p>
        </div>
      </section>

      <div class="h-divider dashed-line" />

      <!-- Most viewed -->
      <section class="topic-section">
        <h2 class="section-title center">Most viewed topics</h2>
        <div v-if="loadingTop" class="loading-list">
          <div v-for="i in 3" :key="i" class="skeleton-row" />
        </div>
        <div v-else class="topic-list">
          <TopicCard
            v-for="q in filteredTop"
            :key="q.id"
            :topic="toTopicCard(q)"
            @click="router.push(`/forums/${q.id}`)"
          />
          <p v-if="!filteredTop.length" class="empty-msg">Nothing here yet.</p>
        </div>
      </section>

    </div>

    <!-- New question modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showNewModal" class="modal-backdrop" @click.self="showNewModal = false">
          <div class="modal card">
            <div class="modal-header">
              <h2 class="modal-title">New question</h2>
              <button class="modal-close" @click="showNewModal = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="field">
                <label class="field-label">Title</label>
                <input v-model="newTitle" class="field-input" placeholder="What's your question?" maxlength="200" />
                <span class="char-count">{{ newTitle.length }}/200</span>
              </div>

              <div class="field">
                <label class="field-label">Tag</label>
                <div class="tag-select">
                  <button
                    v-for="tag in tags"
                    :key="tag.id"
                    class="pill tag-pill"
                    :class="{ active: newTagId === tag.id }"
                    :style="newTagId === tag.id ? { background: tag.color ?? undefined, color: '#fff', borderColor: tag.color ?? undefined } : { borderColor: tag.color ?? undefined, color: tag.color ?? undefined }"
                    type="button"
                    @click="newTagId = newTagId === tag.id ? undefined : tag.id"
                  >{{ tag.name }}</button>
                </div>
              </div>

              <div class="field">
                <label class="field-label">Content <span class="optional">(optional)</span></label>
                <textarea v-model="newContent" class="field-input field-textarea" placeholder="Add more detail…" rows="5" />
              </div>

              <p v-if="newError" class="form-error">{{ newError }}</p>
            </div>

            <div class="modal-footer">
              <button class="pill cancel-btn" @click="showNewModal = false">Cancel</button>
              <button class="pill submit-btn" :disabled="submitting || !newTitle.trim()" @click="submitQuestion">
                <span v-if="submitting" class="spinner" />
                <span v-else>Post question</span>
              </button>
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
import TopicCard from '@/components/TopicCard.vue'
import { useForums, type QuestionSummary, type Tag } from '@/composables/useForums'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const authStore = useAuthStore()
const forums    = useForums()

const recentQuestions = ref<QuestionSummary[]>([])
const topQuestions    = ref<QuestionSummary[]>([])
const tags            = ref<Tag[]>([])
const loadingRecent   = ref(true)
const loadingTop      = ref(true)
const selectedTag     = ref<number | null>(null)

// New question modal
const showNewModal = ref(false)
const newTitle     = ref('')
const newContent   = ref('')
const newTagId     = ref<number | undefined>(undefined)
const newError     = ref('')
const submitting   = ref(false)

// Convert API shape → TopicCard shape
function toTopicCard(q: QuestionSummary) {
  return {
    id:         String(q.id),
    title:      q.title,
    preview:    q.content ?? '',
    authorName: q.authorName ?? 'Unknown',
    postedAgo:  timeAgo(q.createdAt),
    views:      q.reactionCount ?? 0,
    tags:       q.tagShort ? [q.tagShort] : [],
    replyCount: q.replyCount,
    tagColor:   q.tagColor,
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const filteredRecent = computed(() =>
  selectedTag.value === null
    ? recentQuestions.value
    : recentQuestions.value.filter(q => q.tagId === selectedTag.value)
)
const filteredTop = computed(() =>
  selectedTag.value === null
    ? topQuestions.value
    : topQuestions.value.filter(q => q.tagId === selectedTag.value)
)

async function submitQuestion() {
  newError.value = ''
  if (!newTitle.value.trim()) return
  submitting.value = true
  try {
    const q = await forums.postQuestion({
      title:   newTitle.value.trim(),
      content: newContent.value.trim() || undefined,
      tagId:   newTagId.value,
    })
    showNewModal.value = false
    newTitle.value     = ''
    newContent.value   = ''
    newTagId.value     = undefined
    router.push(`/forums/${q.id}`)
  } catch (err: any) {
    newError.value = err.message ?? 'Failed to post question.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  // Load in parallel
  const [recent, top, tagList] = await Promise.allSettled([
    forums.getRecent(20),
    forums.getTop(10),
    forums.getTags(),
  ])
  if (recent.status  === 'fulfilled') recentQuestions.value = recent.value
  if (top.status     === 'fulfilled') topQuestions.value    = top.value
  if (tagList.status === 'fulfilled') tags.value            = tagList.value
  loadingRecent.value = false
  loadingTop.value    = false
})
</script>

<style scoped>
.forums-page { display: flex; flex-direction: column; gap: 4px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.page-title { font-size: 24px; font-weight: 800; }
.new-btn {
  padding: 8px 18px; font-size: 13px;
  background: var(--navy); color: #fff; border: none;
}
.new-btn:hover { background: var(--navy-dark); }

/* Tag filter */
.tag-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.tag-pill {
  padding: 4px 14px; font-size: 12px; font-weight: 700;
  background: #fff; border: 2px solid var(--border);
  color: var(--text-muted); transition: all 0.15s;
}
.tag-pill.active { background: var(--navy); color: #fff; border-color: var(--navy); }
.tag-pill:hover:not(.active) { background: var(--blue-soft); }

.topic-section { margin-bottom: 8px; }
.topic-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.section-title { font-size: 18px; font-weight: 800; }
.section-title.center { text-align: center; }

.h-divider { margin: 20px 0; }
.dashed-line { border: none; border-top: 2px dashed var(--border); }

.empty-msg { color: var(--text-light); font-size: 13px; text-align: center; padding: 28px 0; }

/* Skeleton loading */
.loading-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.skeleton-row {
  height: 68px; border-radius: var(--radius);
  background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 500; padding: 20px;
}
.modal {
  width: 100%; max-width: 540px;
  border: 1.5px solid var(--border);
  overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0;
}
.modal-title { font-size: 18px; font-weight: 800; }
.modal-close {
  background: none; border: none; font-size: 18px;
  color: var(--text-muted); cursor: pointer; padding: 4px;
}
.modal-close:hover { color: var(--text); }
.modal-body   { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer {
  padding: 0 24px 20px;
  display: flex; gap: 10px; justify-content: flex-end;
}

.field { display: flex; flex-direction: column; gap: 5px; position: relative; }
.field-label {
  font-size: 12px; font-weight: 700;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;
}
.optional { font-weight: 400; text-transform: none; letter-spacing: 0; }
.field-input {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 14px; outline: none;
  background: var(--card); color: var(--text);
  transition: border-color 0.15s;
}
.field-input:focus { border-color: var(--navy-light); }
.field-textarea { resize: vertical; min-height: 100px; }
.char-count { font-size: 11px; color: var(--text-light); text-align: right; }

.tag-select { display: flex; gap: 6px; flex-wrap: wrap; }

.form-error { font-size: 13px; color: var(--red); font-weight: 600; }

.cancel-btn {
  padding: 9px 20px; font-size: 13px;
  background: #fff; color: var(--text-muted);
  border: 1.5px solid var(--border) !important;
}
.cancel-btn:hover { background: var(--bg); }
.submit-btn {
  padding: 9px 20px; font-size: 13px;
  background: var(--navy); color: #fff; border: none;
  display: flex; align-items: center; gap: 6px;
}
.submit-btn:hover:not(:disabled) { background: var(--navy-dark); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97); }
</style>