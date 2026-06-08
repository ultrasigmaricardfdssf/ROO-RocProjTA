<template>
  <div class="chat-message" :class="{ 'chat-message--own': isOwn }">
    <div v-if="!isOwn" class="msg-avatar" @click="openProfile">
      {{ message.username.slice(0, 2).toUpperCase() }}
    </div>

    <div class="msg-body">
      <div v-if="!isOwn" class="msg-meta">
        <button class="msg-author" @click="openProfile">{{ message.username }}</button>
        <span class="msg-time">{{ timeAgo(message.sentAt) }}</span>
      </div>
      <div class="msg-bubble" :class="{ own: isOwn }">
        {{ message.text }}
      </div>
      <span v-if="isOwn" class="msg-time msg-time--own">{{ timeAgo(message.sentAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/composables/useChat'
import { useTopicUtils } from '@/composables/useTopicUtils'
import { ref } from 'vue'

const props = defineProps<{ message: ChatMessage; isOwn: boolean }>()
const { timeAgo } = useTopicUtils(ref([]))

function openProfile() {
  window.open(`/user/${props.message.userId}`, '_blank')
}
</script>

<style scoped>
.chat-message {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 2px 0;
}
.chat-message--own { flex-direction: row-reverse; }

.msg-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: var(--purple); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; cursor: pointer;
  transition: opacity 0.15s;
}
.msg-avatar:hover { opacity: 0.8; }
.msg-avatar--own  { background: var(--navy); }

.msg-body { display: flex; flex-direction: column; gap: 3px; max-width: 70%; }
.chat-message--own .msg-body { align-items: flex-end; }

.msg-meta   { display: flex; align-items: baseline; gap: 8px; }
.msg-author {
  font-size: 12px; font-weight: 700; color: var(--navy);
  background: none; border: none; cursor: pointer; padding: 0;
  font-family: var(--font);
}
.msg-author:hover { text-decoration: underline; }
.msg-time   { font-size: 10px; color: var(--text-light); }
.msg-time--own { align-self: flex-end; }

.msg-bubble {
  padding: 8px 14px; border-radius: 16px;
  font-size: 14px; line-height: 1.5; word-break: break-word;
  background: var(--blue-soft); border: 1.5px solid var(--blue-pale);
  border-bottom-left-radius: 4px;
}
.msg-bubble.own {
  background: var(--navy); color: #fff;
  border-color: var(--navy); border-bottom-left-radius: 16px;
  border-bottom-right-radius: 4px;
}
</style>