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
              <span
                v-if="question.tagName"
                class="tag-badge pill"
                :style="{
                  background: question.tagColor ?? '#aaa',
                  color: '#fff',
                  borderColor: question.tagColor ?? '#aaa',
                }"
                @click="router.push(`/search%${reply.authorId}`)"
                >{{ question.tagShort ?? question.tagName }}</span
              >

              <button
                v-if="canDelete"
                class="pill delete-btn"
                @click="handleDeleteQuestion"
              >
                Delete
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

          <button
            v-if="solutionReply"
            class="pill solution-link"
            @click="scrollToSolution"
          >
            <span class="solution-check">✓</span> Solution
          </button>
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
              class="reply-card"
              :class="{
                'reply-card--own': reply.authorId === authStore.user?.id,
                'reply-card--solution': reply.isSolution,
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

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

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
