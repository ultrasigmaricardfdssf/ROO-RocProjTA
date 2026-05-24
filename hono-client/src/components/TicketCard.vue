<template>
  <RouterLink
    :to="`/tickets/${ticket.id}`"
    class="ticket-card"
    :class="variant"
  >
    <div class="tk-avatar dashed">
      <img
        v-if="ticket.authorAvatar"
        :src="ticket.authorAvatar"
        alt=""
        class="ta-img"
      />
      <span v-else class="ta-initials">{{
        ticket.authorName.slice(0, 2).toUpperCase()
      }}</span>
    </div>
    <div class="tk-body">
      <span class="tk-title">{{ ticket.title }}</span>
      <span class="tk-preview">{{ ticket.preview }}</span>
    </div>
    <span class="tk-time">{{ ticket.openedAgo }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
export interface Ticket {
  id: string;
  title: string;
  preview: string;
  authorName: string;
  authorAvatar?: string;
  openedAgo: string;
}
defineProps<{ ticket: Ticket; variant?: "orange" | "blue" }>();
</script>

<style scoped>
.ticket-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: box-shadow 0.15s;
  text-decoration: none;
  color: inherit;
}
.ticket-card.orange {
  background: #fff8ee;
  border: 2px solid var(--orange);
}
.ticket-card.blue {
  background: var(--blue-soft);
  border: 2px solid var(--blue-pale);
}
.ticket-card:hover {
  box-shadow: var(--shadow);
}

.tk-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--purple);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ta-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ta-initials {
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}

.tk-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tk-title {
  font-weight: 700;
  font-size: 14px;
}
.tk-preview {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tk-time {
  font-size: 11px;
  color: var(--text-light);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
