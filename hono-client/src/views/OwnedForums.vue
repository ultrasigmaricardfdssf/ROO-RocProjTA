<template>
  <AppLayout>
    <div class="my-forums-page">
      <h1 class="page-title">My forums</h1>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="pill tab-btn"
          :class="{ active: tab === 'questions' }"
          @click="tab = 'questions'"
        >My questions <span class="count">{{ questions.length }}</span></button>
        <button
          class="pill tab-btn"
          :class="{ active: tab === 'replies' }"
          @click="tab = 'replies'"
        >My replies <span class="count">{{ replies.length }}</span></button>
      </div>

      <!-- Questions tab -->
      <div v-if="tab === 'questions'">
        <div v-if="loadingQuestions" class="loading-list">
          <div v-for="i in 3" :key="i" class="skeleton-row" />
        </div>
        <div v-else-if="!questions.length" class="empty-state">
          You haven't posted any questions yet.
          <RouterLink to="/forums" class="empty-link">Browse forums →</RouterLink>
        </div>
        <div v-else class="topic-list">
          <TopicCard
            v-for="q in questions"
            :key="q.id"
            :topic="toTopicCard(q)"
            @click="router.push(`/forums/${q.id}`)"
            @tagClick="tag => router.push(tagSearchRoute(tag))"
          />
        </div>
      </div>

      <!-- Replies tab -->
      <div v-if="tab === 'replies'">
        <div v-if="loadingReplies" class="loading-list">
          <div v-for="i in 3" :key="i" class="skeleton-row" />
        </div>
        <div v-else-if="!replies.length" class="empty-state">
          You haven't replied to anything yet.
        </div>
        <div v-else class="reply-list">
          <div
            v-for="r in replies"
            :key="r.id"
            class="reply-item"
            :class="{ 'reply-item--solution': r.isSolution }"
            @click="router.push(`/forums/${r.questionId}`)"
          >
            <div class="reply-meta">
              <span class="reply-question">{{ r.questionTitle }}</span>
              <div class="reply-badges">
                <span v-if="r.isSolution" class="solution-badge">✓ Solution</span>
                <span class="reply-time">{{ timeAgo(r.createdAt) }}</span>
              </div>
            </div>
            <p class="reply-preview">{{ r.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/AppLayout.vue'
import TopicCard from '@/components/TopicCard.vue'
import { useForums, type QuestionSummary } from '@/composables/useForums'
import { useTopicUtils } from '@/composables/useTopicUtils'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const authStore = useAuthStore()
const forums    = useForums()

const tab              = ref<'questions' | 'replies'>('questions')
const questions        = ref<QuestionSummary[]>([])
const replies          = ref<any[]>([])
const loadingQuestions = ref(true)
const loadingReplies   = ref(true)
const tags             = ref([])

const { toTopicCard, timeAgo, tagSearchRoute } = useTopicUtils({ value: tags.value })

onMounted(async () => {
  const [tagList, myQ, myR] = await Promise.allSettled([
    forums.getTags(),
    fetch(`/api/forums/by-user/${authStore.user?.id}`,       { credentials: 'include' }).then(r => r.json()),
    fetch(`/api/forums/replies-by-user/${authStore.user?.id}`, { credentials: 'include' }).then(r => r.json()),
  ])

  if (tagList.status === 'fulfilled') tags.value = tagList.value
  if (myQ.status     === 'fulfilled') questions.value = myQ.value
  if (myR.status     === 'fulfilled') replies.value   = myR.value

  loadingQuestions.value = false
  loadingReplies.value   = false
})
</script>

<style scoped>
.my-forums-page { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.page-title { font-size: 24px; font-weight: 800; }

.tabs { display: flex; gap: 8px; }
.tab-btn {
  padding: 8px 18px; font-size: 13px;
  background: #fff; color: var(--text-muted);
  border: 2px solid var(--border) !important;
  display: flex; align-items: center; gap: 6px;
}
.tab-btn.active { background: var(--navy); color: #fff; border-color: var(--navy) !important; }
.tab-btn:hover:not(.active) { background: var(--blue-soft); }

.count {
  background: rgba(0,0,0,0.12); border-radius: 999px;
  padding: 1px 7px; font-size: 11px;
}
.tab-btn.active .count { background: rgba(255,255,255,0.25); }

.topic-list { display: flex; flex-direction: column; gap: 10px; }

.reply-list { display: flex; flex-direction: column; gap: 10px; }
.reply-item {
  padding: 14px 16px;
  background: var(--blue-soft); border: 1.5px solid var(--blue-pale);
  border-radius: var(--radius); cursor: pointer; transition: border-color 0.15s;
}
.reply-item:hover { border-color: var(--navy-light); }
.reply-item--solution { background: #f0fdf4; border-color: var(--green); }

.reply-meta {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px; gap: 12px;
}
.reply-question { font-weight: 700; font-size: 13px; color: var(--navy); }
.reply-badges   { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.reply-time     { font-size: 11px; color: var(--text-light); }
.solution-badge {
  font-size: 11px; font-weight: 700; color: var(--green);
  background: #dcfce7; padding: 2px 8px; border-radius: 999px;
}
.reply-preview {
  font-size: 13px; color: var(--text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.empty-state {
  text-align: center; color: var(--text-light);
  padding: 40px; display: flex; flex-direction: column; gap: 10px; align-items: center;
}
.empty-link { color: var(--navy); font-weight: 700; font-size: 13px; }

.loading-list { display: flex; flex-direction: column; gap: 10px; }
.skeleton-row {
  height: 68px; border-radius: var(--radius);
  background: linear-gradient(90deg, var(--blue-pale) 25%, var(--blue-soft) 50%, var(--blue-pale) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>