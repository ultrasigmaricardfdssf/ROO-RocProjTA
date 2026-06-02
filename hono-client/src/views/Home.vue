<template>
  <AppLayout>
    <div v-if="authStore.isAdmin" class="admin-tickets-row">
      <div class="ticket-col">
        <h2 class="section-title orange">
          Open tickets ({{ openTickets.length }})
        </h2>
        <div class="ticket-list">
          <TicketCard
            v-for="t in openTickets"
            :key="t.id"
            :ticket="t"
            variant="orange"
          />
          <p v-if="!openTickets.length" class="empty-msg">No open tickets.</p>
        </div>
      </div>

      <div class="ticket-divider" />

      <div class="ticket-col">
        <h2 class="section-title blue">My tickets ({{ myTickets.length }})</h2>
        <div class="ticket-list">
          <TicketCard
            v-for="t in myTickets"
            :key="t.id"
            :ticket="t"
            variant="blue"
          />
          <p v-if="!myTickets.length" class="empty-msg">
            No active tickets for the time being.
          </p>
        </div>
      </div>
    </div>

    <div v-if="authStore.isAdmin" class="h-divider" />

    <section class="topic-section">
      <h2 class="section-title center">Recent topics</h2>
      <div class="topic-list">
        <TopicCard
            v-for="q in recentTopics"
            :key="q.id"
            :topic="toTopicCard(q)"
            @click="router.push(`/forums/${q.id}`)"
          />
      </div>
    </section>

    <div class="h-divider dashed-line" />

    <section class="topic-section">
      <h2 class="section-title center">Most viewed topics</h2>
      <div class="topic-list">
        <TopicCard
            v-for="q in recentTopics"
            :key="q.id"
            :topic="toTopicCard(q)"
            @click="router.push(`/forums/${q.id}`)"
          />
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import AppLayout from "@/AppLayout.vue";
  import TopicCard from "@/components/TopicCard.vue";
  import TicketCard from "@/components/TicketCard.vue";
  import { useAuthStore } from "@/stores/auth.js";
  import {
    useForums, type QuestionSummary
  } from "@/composables/useForums.js"

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

  const router = useRouter();

  const authStore = useAuthStore();
  const forums = useForums();

  // --- replace with APIs ---
  const recentTopics = ref<QuestionSummary[]>([])
  const openTickets = [
    {
      id: "t1",
      title: "how delete system32",
      preview: "pls need help",
      authorName: "User",
      openedAgo: "Opened 2 seconds ago",
    },
    {
      id: "t2",
      title: "how delete system32",
      preview: "pls need help",
      authorName: "User",
      openedAgo: "Opened 2 seconds ago",
    },
  ];

  const myTickets: typeof openTickets = [];

  onMounted(async () => {recentTopics.value = await forums.getRecent()})
</script>

<style scoped>
  .admin-tickets-row {
    display: flex;
    gap: 0;
    background: var(--card);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    overflow: hidden;
    margin-bottom: 4px;
  }

  .ticket-col {
    flex: 1;
    padding: 20px;
  }

  .ticket-divider {
    width: 1px;
    background: repeating-linear-gradient(
      to bottom,
      var(--border) 0,
      var(--border) 6px,
      transparent 6px,
      transparent 12px
    );
  }

  .ticket-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }

  .h-divider {
    margin: 20px 0;
  }

  .dashed-line {
    border: none;
    border-top: 2px dashed var(--border);
  }

  .topic-section {
    margin-bottom: 8px;
  }

  .topic-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 14px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
  }

  .section-title.center {
    text-align: center;
  }

  .section-title.orange {
    color: var(--orange);
  }

  .section-title.blue {
    color: var(--navy);
  }

  .empty-msg {
    color: var(--text-light);
    font-size: 13px;
    text-align: center;
    padding: 24px 0;
  }
</style>
