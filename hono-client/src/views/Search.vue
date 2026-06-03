<template>
  <AppLayout>
    <div class="search-page">
      <h1 class="page-title">Search</h1>

      <!-- Search bar -->
      <div class="search-bar card">
        <input
          v-model="query"
          class="search-input"
          placeholder="Search questions…"
          @keydown.enter="runSearch"
        />
        <div class="search-filters">
          <div class="filter-field">
            <label class="filter-label">Author</label>
            <input v-model="authorFilter" class="filter-input" placeholder="username" @keydown.enter="runSearch" />
          </div>
          <div class="filter-field">
            <label class="filter-label">Tag</label>
            <div class="tag-select">
              <button
                class="pill tag-pill"
                :class="{ active: !selectedTagId }"
                @click="selectedTagId = undefined"
              >any</button>
              <button
                v-for="tag in tags"
                :key="tag.id"
                class="pill tag-pill"
                :class="{ active: selectedTagId === tag.id }"
                :style="selectedTagId === tag.id
                  ? { background: tag.color ?? undefined, borderColor: tag.color ?? undefined, color: '#fff' }
                  : { borderColor: tag.color ?? undefined, color: tag.color ?? undefined }"
                @click="selectedTagId = selectedTagId === tag.id ? undefined : tag.id"
              >{{ tag.short ?? tag.name }}</button>
            </div>
          </div>
        </div>
        <button class="pill search-btn" :disabled="loading" @click="runSearch">
          <span v-if="loading" class="spinner" />
          <span v-else>Search</span>
        </button>
      </div>

      <!-- Results -->
      <template v-if="hasSearched">
        <p class="result-count">
          <template v-if="results.length">
            {{ results.length }} result{{ results.length === 1 ? '' : 's' }}
            <span v-if="query"> for "<strong>{{ query }}</strong>"</span>
          </template>
          <template v-else>No results found.</template>
        </p>

        <div class="results-list">
          <TopicCard
            v-for="r in results"
            :key="r.id"
            :topic="toTopicCard(r)"
            @click="router.push(`/forums/${r.id}`)"
          />
        </div>
      </template>

      <div v-else class="empty-hint">
        Type something above to search forum questions.
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/AppLayout.vue'
import TopicCard from '@/components/TopicCard.vue'
import { useForums, type QuestionSummary, type Tag } from '@/composables/useForums'

const route  = useRoute()
const router = useRouter()
const forums = useForums()

const query         = ref('')
const authorFilter  = ref('')
const selectedTagId = ref<number | undefined>(undefined)
const results       = ref<QuestionSummary[]>([])
const tags          = ref<Tag[]>([])
const loading       = ref(false)
const hasSearched   = ref(false)

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
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

async function runSearch() {
  if (!query.value.trim() && !selectedTagId.value && !authorFilter.value.trim()) return
  loading.value   = true
  hasSearched.value = true
  try {
    const params = new URLSearchParams()
    if (query.value.trim())        params.set('q',      query.value.trim())
    if (selectedTagId.value)       params.set('tagId',  String(selectedTagId.value))
    if (authorFilter.value.trim()) params.set('author', authorFilter.value.trim())

    const res  = await fetch(`/api/search?${params}`, { credentials: 'include' })
    const data = await res.json()
    results.value = data.results ?? []
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Load tags for filter bar
  tags.value = await forums.getTags().catch(() => [])

  // If arrived from navbar search (?q=...) or tag click (?tagId=...)
  const q     = route.query.q     as string | undefined
  const tagId = route.query.tagId as string | undefined

  if (q)     query.value         = q
  if (tagId) selectedTagId.value = Number(tagId)

  if (q || tagId) runSearch()
})
</script>

<style scoped>
.search-page { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.page-title  { font-size: 24px; font-weight: 800; }

.search-bar {
  padding: 20px;
  border: 1.5px solid var(--border);
  display: flex; flex-direction: column; gap: 14px;
}

.search-input {
  width: 100%; padding: 11px 16px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 15px; outline: none;
  background: var(--card); color: var(--text);
  transition: border-color 0.15s;
}
.search-input:focus { border-color: var(--navy-light); }

.search-filters { display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start; }

.filter-field  { display: flex; flex-direction: column; gap: 5px; }
.filter-label  {
  font-size: 11px; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.04em;
}
.filter-input {
  padding: 7px 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  font-family: var(--font); font-size: 13px; outline: none;
  transition: border-color 0.15s; width: 160px;
}
.filter-input:focus { border-color: var(--navy-light); }

.tag-select { display: flex; gap: 6px; flex-wrap: wrap; }
.tag-pill {
  padding: 4px 12px; font-size: 12px; font-weight: 700;
  background: #fff; border: 2px solid var(--border);
  color: var(--text-muted); transition: all 0.15s;
}
.tag-pill.active { background: var(--navy); color: #fff; border-color: var(--navy); }
.tag-pill:hover:not(.active) { background: var(--blue-soft); }

.search-btn {
  padding: 10px 24px; font-size: 14px; align-self: flex-start;
  background: var(--navy); color: #fff; border: none;
  display: flex; align-items: center; gap: 6px;
}
.search-btn:hover:not(:disabled) { background: var(--navy-dark); }
.search-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.result-count { font-size: 14px; color: var(--text-muted); }
.result-count strong { color: var(--text); }

.results-list { display: flex; flex-direction: column; gap: 10px; }

.empty-hint {
  text-align: center; color: var(--text-light); font-size: 14px;
  padding: 48px 0; border: 2px dashed var(--border); border-radius: var(--radius);
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>