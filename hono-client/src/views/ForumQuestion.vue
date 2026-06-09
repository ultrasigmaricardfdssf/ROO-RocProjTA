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

    <template v-else-if="question">
      <div class="question-page">
        <div class="breadcrumb">
          <RouterLink to="/forums" class="bc-link">Forums</RouterLink>
          <span class="bc-sep">›</span>
          <span class="bc-current">{{ question.title }}</span>
        </div>

        <div class="question-card card">
          <div class="question-header">
            <div class="author-row">
              <div
                class="author-avatar"
                @click="router.push(`/user/${question.authorId}`)"
              >
                {{ (question.authorName ?? "?").slice(0, 2).toUpperCase() }}
              </div>
              <div class="author-info">
                <span
                  class="author-name"
                  @click="router.push(`/user/${question.authorId}`)"
                >
                  {{ question.authorName }}
                </span>
                <span class="post-time">{{ timeAgo(question.createdAt) }}</span>
              </div>
            </div>

            <div class="question-actions">
              <button
  v-if="question.tagName"
  class="tag-badge pill"
  :style="{ background: question.tagColor ?? '#aaa', color: '#fff', borderColor: question.tagColor ?? '#aaa' }"
  @click="router.push({ path: '/search', query: { tagId: String(question.tagId) } })"
>{{ question.tagShort ?? question.tagName }}</button>

              <button
                v-if="canDelete"
                class="pill delete-btn"
                @click="handleDeleteQuestion"
              >
                Delete
              </button>
              <button 
          v-if="authStore.isLoggedIn"
          class="pill mark-solution-btn" 
          :class="{ following: question.isFollowing }"
          @click="handleFollow"
        >
          🔔 {{ question.isFollowing ? 'Following Thread' : 'Follow for Updates' }}
        </button>
            </div>
          </div>

          <h1 class="question-title">{{ question.title }}</h1>

          <div v-if="question.content" class="question-content">
            {{ question.content }}
          </div>

          <div v-if="question.editedAt" class="edited-note">
            Edited {{ timeAgo(question.editedAt) }}
          </div>

          <span v-if="solutionReply" class="badge-solved">✓ Solved</span>
          <button 
            class="reaction-trigger" 
            :class="{ active: question.likedQuestion }"
            :disabled="!authStore.isLoggedIn"
            @click="toggleQuestionLike"
          >
            <span class="heart-icon">{{ question.likedQuestion ? '❤️' : '🤍' }}</span>
            <span class="count">{{ question.reactionCount }}</span>
          </button>
          <span class="views-count">👁 {{ question.viewCount }} views</span>
        </div>

        <div v-if="question.solutionReplyId && solutionReply" class="card solution-highlight-card">
        <div class="highlight-banner">🌟 Accepted Solution</div>
        <p class="summary-text">"{{ solutionReply.content }}"</p>
        <a :href="'#reply-' + question.solutionReplyId" class="jump-link">Jump to full answer ↓</a>
      </div>

        <div class="replies-section">
          <h2 class="replies-title">
            {{ replies.length }}
            {{ replies.length === 1 ? "reply" : "replies" }}
          </h2>

          <div v-if="loadingReplies" class="loading-list">
            <div v-for="i in 3" :key="i" class="skeleton-reply" />
          </div>

          <div v-else class="replies-list">
            <div
              v-for="reply in replies"
              :key="reply.id"
              :id="'reply-' + reply.id"
              class="reply-card"
              :class="{
                'reply-card--own': reply.authorId === authStore.user?.id,
                'reply-card--solution': reply == solutionReply,
              }"
            >
              <div
                class="reply-avatar"
                @click="router.push(`/user/${reply.authorId}`)"
              >
                {{ (reply.authorName ?? "?").slice(0, 2).toUpperCase() }}
              </div>

              <div class="reply-body">
                <div class="reply-meta">
                  <span
                    class="reply-author"
                    @click="router.push(`/user/${reply.authorId}`)"
                  >
                    {{ reply.authorName }}
                  </span>
                  <span class="reply-time">{{ timeAgo(reply.createdAt) }}</span>
                  <button
                    v-if="isAuthor"
                    class="pill mark-solution-btn"
                    :class="{ marked: reply.isSolution }"
                    @click="toggleSolution(reply.id)"
                  >
                    {{ reply.isSolution ? "✓ Unmark" : "Mark solution" }}
                  </button>
                  <button
                    v-if="
                      authStore.user?.id === reply.authorId ||
                      authStore.canDeleteReply
                    "
                    class="pill reply-delete"
                    @click="handleDeleteReply(reply.id)"
                  >
                    ✕
                  </button>
                </div>
                <p class="reply-content">{{ reply.content }}</p>
              </div>
              <button 
                class="reaction-trigger"
                :class="{ active: question.likedReplyIds?.includes(reply.id) }"
                :disabled="!authStore.isLoggedIn"
                @click="toggleReplyLike(reply)"
              >
                <span class="heart-icon">
                  {{ question.likedReplyIds?.includes(reply.id) ? '❤️' : '🤍' }}
                </span>
                <span class="count">{{ reply.reactionCount }}</span>
              </button>
            </div>

            <p v-if="!replies.length" class="empty-msg">
              No replies yet. Be the first!
            </p>
          </div>
        </div>

        <div v-if="authStore.isLoggedIn" class="reply-composer card">
          <div class="composer-avatar">
            {{ (authStore.user?.username ?? "?").slice(0, 2).toUpperCase() }}
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
                class="pill post-reply-btn"
                :disabled="!replyContent.trim() || submittingReply"
                @click="submitReply"
              >
                <span v-if="submittingReply" class="spinner" />
                <span v-else>Post reply</span>
              </button>
            </div>
            <p v-if="replyError" class="form-error">{{ replyError }}</p>
          </div>
        </div>

        <div v-else class="login-prompt">
          <RouterLink to="/login" class="auth-link">Sign in</RouterLink> to post
          a reply.
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "@/AppLayout.vue";
import {
  useForums,
  type QuestionDetail,
  type Reply,
} from "@/composables/useForums";
import { useAuthStore } from "@/stores/auth";
import { useTopicUtils } from '@/composables/useTopicUtils'

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const forums = useForums();

const question = ref<QuestionDetail | null>(null);
const replies = ref<Reply[]>([]);
const loading = ref(true);
const loadingReplies = ref(true);
const error = ref("");
const replyContent = ref("");
const replyError = ref("");
const submittingReply = ref(false);
const solutionReply = computed(
  () => replies.value.find((r) => r.isSolution) ?? null,
);

const questionId = computed(() => Number(route.params.id));

const canDelete = computed(() => {
  if (!authStore.user || !question.value) return false;
  return (
    authStore.user.id === question.value.authorId || authStore.canDeleteReply
  );
});

const isAuthor = computed(() => {
  if (!authStore.user || !question.value) return false;
  return authStore.user.id === question.value.authorId;
});

const { timeAgo } = useTopicUtils({ value: [] })

async function submitReply() {
  if (!replyContent.value.trim()) return;
  replyError.value = "";
  submittingReply.value = true;
  try {
    const r = await forums.postReply(
      questionId.value,
      replyContent.value.trim(),
    );
    replies.value.push(r);
    replyContent.value = "";
  } catch (err: any) {
    replyError.value = err.message ?? "Failed to post reply.";
  } finally {
    submittingReply.value = false;
  }
}

async function handleDeleteReply(replyId: number) {
  if (!confirm("Delete this reply?")) return;
  await forums.deleteReply(replyId);
  replies.value = replies.value.filter((r) => r.id !== replyId);
}

async function handleDeleteQuestion() {
  if (!confirm("Delete this question? This cannot be undone.")) return;
  await forums.deleteQuestion(questionId.value);
  router.push("/forums");
}

function scrollToSolution() {
  const id = solutionReply.value?.id;
  if (!id) return;
  replyRefs.value[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function toggleQuestionLike() {
  if (!question.value) return
  try {
    const res = await forums.reactToQuestion(questionId.value)
    question.value.likedQuestion = res.liked
    question.value.reactionCount = res.reactionCount
  } catch (e) { console.error(e) }
}

async function toggleReplyLike(reply: any) {
  try {
    const res = await forums.reactToReply(reply.id)
    reply.reactionCount = res.reactionCount
    
    // Mirror standard inclusion map values toggling
    if (res.liked) {
      if (!question.value.likedReplyIds.includes(reply.id)) {
        question.value.likedReplyIds.push(reply.id)
      }
    } else {
      question.value.likedReplyIds = question.value.likedReplyIds.filter((id: number) => id !== reply.id)
    }
  } catch (e) { console.error(e) }
}

async function handleFollow() {
  try {
    const res = await forums.apiFetch?.(`/forums/${questionId.value}/follow`, { method: 'POST' }) 
      || await fetch(`/api/forums/${questionId.value}/follow`, { method: 'POST', credentials: 'include' }).then(r => r.json());
    question.value.isFollowing = res.following
  } catch (e) { console.error(e) }
}

async function toggleSolution(replyId: number) {
  const reply = replies.value.find((r) => r.id === replyId);
  if (!reply) return;
  const newReplyId = reply.isSolution ? null : replyId;

  await forums.setSolution(question.value!.id, newReplyId);

  // Update local state — clear all, then set the new one
  replies.value = replies.value.map((r) => ({
    ...r,
    isSolution: r.id === newReplyId,
  }));
}

onMounted(async () => {
  try {
    const [q, r] = await Promise.all([
      forums.getQuestion(questionId.value),
      forums.getReplies(questionId.value),
    ]);
    question.value = q;
    replies.value = r;
  } catch (err: any) {
    error.value = err.message ?? "Failed to load question.";
  } finally {
    loading.value = false;
    loadingReplies.value = false;
  }
});
</script>

<style scoped>
.question-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.bc-link {
  color: var(--navy);
  font-weight: 600;
}
.bc-link:hover {
  text-decoration: underline;
}
.bc-sep {
  color: var(--text-light);
}
.bc-current {
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

/* Question card */
.question-card {
  padding: 24px;
  border: 1.5px solid var(--border);
}

.question-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
.author-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--purple);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}
.author-avatar:hover {
  opacity: 0.85;
}
.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.author-name {
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
.author-name:hover {
  color: var(--navy);
}
.post-time {
  font-size: 12px;
  color: var(--text-light);
}

.question-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.tag-badge {
  padding: 3px 12px;
  font-size: 11px;
  font-weight: 700;
}
.delete-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: var(--red-pale);
  color: var(--red);
  border: 1.5px solid var(--red) !important;
}
.delete-btn:hover {
  background: var(--red);
  color: #fff;
}

.question-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 12px;
}
.question-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
}
.edited-note {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 12px;
  font-style: italic;
}

/* Replies */
.replies-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.replies-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-muted);
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-card {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: var(--blue-soft);
  border: 1.5px solid var(--blue-pale);
  border-radius: var(--radius);
  transition: border-color 0.15s;
}
.reply-card--own {
  background: #f0f7ff;
  border-color: var(--navy-light);
}

.reply-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--purple);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}
.reply-avatar:hover {
  opacity: 0.85;
}

.reply-body {
  flex: 1;
  min-width: 0;
}
.reply-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.reply-author {
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
.reply-author:hover {
  color: var(--navy);
}
.reply-time {
  font-size: 11px;
  color: var(--text-light);
  flex: 1;
}
.reply-delete {
  padding: 2px 8px;
  font-size: 11px;
  background: none;
  color: var(--text-light);
  border: 1.5px solid var(--border) !important;
  opacity: 0;
  transition: opacity 0.15s;
}
.reply-card:hover .reply-delete {
  opacity: 1;
}
.reply-delete:hover {
  color: var(--red);
  border-color: var(--red) !important;
}
.reply-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.empty-msg {
  color: var(--text-light);
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
}

/* Composer */
.reply-composer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1.5px solid var(--border);
}
.composer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--navy);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.composer-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.composer-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
  resize: vertical;
  background: var(--card);
  color: var(--text);
  transition: border-color 0.15s;
}
.composer-input:focus {
  border-color: var(--navy-light);
}
.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.composer-hint {
  font-size: 11px;
  color: var(--text-light);
}
.post-reply-btn {
  padding: 8px 18px;
  font-size: 13px;
  background: var(--navy);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.post-reply-btn:hover:not(:disabled) {
  background: var(--navy-dark);
}
.post-reply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  font-size: 12px;
  color: var(--red);
  font-weight: 600;
}

.login-prompt {
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
  padding: 20px;
  background: var(--blue-soft);
  border-radius: var(--radius);
}
.auth-link {
  color: var(--navy);
  font-weight: 700;
}

/* Loading skeletons */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.skeleton-title {
  height: 32px;
  width: 60%;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--blue-pale) 25%,
    var(--blue-soft) 50%,
    var(--blue-pale) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-body {
  height: 120px;
  border-radius: var(--radius);
  background: linear-gradient(
    90deg,
    var(--blue-pale) 25%,
    var(--blue-soft) 50%,
    var(--blue-pale) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.loading-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-reply {
  height: 80px;
  border-radius: var(--radius);
  background: linear-gradient(
    90deg,
    var(--blue-pale) 25%,
    var(--blue-soft) 50%,
    var(--blue-pale) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  text-align: center;
  border: 1.5px solid var(--border);
}
.error-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--red);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
}
.back-btn {
  padding: 8px 20px;
  background: var(--navy);
  color: #fff;
  border: none;
}
/* ==========================================
   REACTIONS & LIKING STYLES
   ========================================== */
.reaction-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg, #f8f9fa);
  border: 1.5px solid var(--border, #e9ecef);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted, #6c757d);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

/* Hover state for logged-in users */
.reaction-trigger:hover:not(:disabled) {
  background: #fff0f1;
  border-color: #ffcdd2;
  color: #d32f2f;
  transform: translateY(-1px);
}

/* Active / Liked state */
.reaction-trigger.active {
  background: #ffebee;
  border-color: #ffcdd2;
  color: #c62828;
}

.reaction-trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.heart-icon {
  font-size: 14px;
  transition: transform 0.2s ease;
}

.reaction-trigger:active:not(:disabled) .heart-icon {
  transform: scale(1.3);
}

/* Context styling inside components */
.views-count {
  font-size: 13px;
  color: var(--text-light, #adb5bd);
  margin-left: auto; /* Pushes view count to the right side of the card footer */
}


/* ==========================================
   WATCHING / FOLLOWING STYLES
   ========================================== */
.question-actions .follow-btn {
  background: #fff;
  border: 1.5px solid var(--navy, #0a2540) !important;
  color: var(--navy, #0a2540);
  font-weight: 700;
  padding: 6px 14px;
  transition: all 0.2s ease;
}

.question-actions .follow-btn:hover {
  background: var(--blue-soft, #eaf2f9);
}

/* Active following state */
.question-actions .follow-btn.following {
  background: var(--navy, #0a2540);
  border-color: var(--navy, #0a2540) !important;
  color: #fff;
}

.question-actions .follow-btn.following:hover {
  background: var(--navy-dark, #051424);
  border-color: var(--navy-dark, #051424) !important;
}


/* ==========================================
   SOLUTIONS & ACCEPTED ANSWERS STYLES
   ========================================== */
/* Solved status indicators */
.badge-solved {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1.5px solid #a5d6a7;
  padding: 4px 12px;
  border-radius: var(--radius-sm, 4px);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
}

/* Top highlighted solution layout preview panel */
.solution-highlight-card {
  border-left: 4px solid #2e7d32;
  background: #f9fdf9;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.highlight-banner {
  font-weight: 800;
  color: #2e7d32;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-text {
  font-size: 14.5px;
  font-style: italic;
  color: var(--text-muted, #495057);
  line-height: 1.5;
  margin: 0;
}

.jump-link {
  font-size: 13px;
  color: var(--navy, #0a2540);
  font-weight: 700;
  text-decoration: none;
  display: inline-block;
  width: fit-content;
}

.jump-link:hover {
  text-decoration: underline;
}

/* Modify reply card when selected as the solution wrapper */
.reply-card--solution {
  border: 2px solid #2e7d32 !important;
  background: #fbfdfb !important;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.05);
}

/* Mark Solution Action Toggle Pill Button */
.mark-solution-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  background: #fff;
  color: var(--text-muted, #6c757d);
  border: 1.5px solid var(--border, #e9ecef) !important;
  transition: all 0.15s ease;
}

.mark-solution-btn:hover {
  background: #f1f8e9;
  color: #2e7d32;
  border-color: #c5e1a5 !important;
}

/* Solution button state when already activated */
.mark-solution-btn.marked {
  background: #2e7d32;
  color: #fff;
  border-color: #2e7d32 !important;
}

.mark-solution-btn.marked:hover {
  background: #c62828;
  color: #fff;
  border-color: #c62828 !important;
  /* Provides a destructive cue when hovering an active match to pull it */
  content: "Unmark"; 
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
