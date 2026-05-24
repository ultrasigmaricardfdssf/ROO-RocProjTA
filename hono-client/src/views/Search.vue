<template>
  <RouterLink :to="`/forums/topic/${topic.id}`" class="topic-card">
    <div class="topic-avatar dashed">
      <img
        v-if="topic.authorAvatar"
        :src="topic.authorAvatar"
        alt=""
        class="ta-img"
      />
      <span v-else class="ta-initials">{{
        topic.authorName.slice(0, 2).toUpperCase()
      }}</span>
    </div>

    <div class="topic-body">
      <span class="topic-title">{{ topic.title }}</span>
      <span class="topic-preview">{{ topic.preview }}</span>
    </div>

    <div class="topic-meta">
      <span class="meta-time"
        >Posted {{ topic.postedAgo }}, {{ topic.views }} views</span
      >
      <div class="topic-tags">
        <span v-for="tag in topic.tags" :key="tag" class="tag pill">{{
          tag
        }}</span>
        <span
          v-if="topic.replyCount !== undefined"
          class="reply-count dashed"
          >{{ topic.replyCount }}</span
        >
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
export interface Topic {
  id: string;
  title: string;
  preview: string;
  authorName: string;
  authorAvatar?: string;
  postedAgo: string;
  views: number;
  tags?: string[];
  replyCount?: number;
}
defineProps<{ topic: Topic }>();
</script>

<style scoped>
.topic-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--blue-soft);
  border: 2px solid var(--blue-pale);
  border-radius: var(--radius);
  padding: 12px 16px;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
  text-decoration: none;
  color: inherit;
}
.topic-card:hover {
  border-color: var(--navy-light);
  box-shadow: var(--shadow);
}

.topic-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--purple);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-color: var(--border-dash) !important;
}
.ta-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ta-initials {
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}

.topic-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.topic-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--text);
}
.topic-preview {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topic-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.meta-time {
  font-size: 11px;
  color: var(--text-light);
  white-space: nowrap;
}

.topic-tags {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tag {
  padding: 2px 10px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-muted);
  border: 1.5px solid var(--border);
}
.reply-count {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--red);
  border-color: var(--red) !important;
}
</style>
