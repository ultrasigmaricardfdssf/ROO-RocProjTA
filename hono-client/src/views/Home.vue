<template>
  <AppLayout>
    <!-- ADMIN ONLY: ticket split row -->
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

    <!-- RECENT TOPICS -->
    <section class="topic-section">
      <h2 class="section-title center">Recent topics</h2>
      <div class="topic-list">
        <TopicCard v-for="t in recentTopics" :key="t.id" :topic="t" />
      </div>
    </section>

    <div class="h-divider dashed-line" />

    <!-- MOST VIEWED -->
    <section class="topic-section">
      <h2 class="section-title center">Most viewed topics</h2>
      <div class="topic-list">
        <TopicCard v-for="t in mostViewed" :key="t.id" :topic="t" />
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from "@/AppLayout.vue";
import TopicCard from "@/components/TopicCard.vue";
import TicketCard from "@/components/TicketCard.vue";
import { useAuthStore } from "@/stores/auth.js";

const authStore = useAuthStore();

// --- Replace with real API calls ---
const recentTopics = [
  {
    id: "1",
    title: "am i a true sigma?",
    preview:
      "i use linux but all my friedns say im gay so i wanted to know does anyone know where i can...",
    authorName: "Sigma boy",
    postedAgo: "6 weeks ago",
    views: 800,
    tags: ["ntf"],
    replyCount: 69,
  },
  {
    id: "2",
    title: "am i a true sigma?",
    preview:
      "i use linux but all my friedns say im gay so i wanted to know does anyone know where i can...",
    authorName: "Sigma boy",
    postedAgo: "6 weeks ago",
    views: 800,
    tags: ["ntf"],
    replyCount: 69,
  },
  {
    id: "3",
    title: "am i a true sigma?",
    preview:
      "i use linux but all my friedns say im gay so i wanted to know does anyone know where i can...",
    authorName: "Sigma boy",
    postedAgo: "6 weeks ago",
    views: 800,
    tags: ["ntf"],
    replyCount: 69,
  },
];
const mostViewed = [
  {
    id: "4",
    title: "am i a true sigma?",
    preview:
      "i use linux but all my friedns say im gay so i wanted to know does anyone know where i can...",
    authorName: "Sigma boy",
    postedAgo: "6 weeks ago",
    views: 800,
    tags: ["ntf"],
    replyCount: 69,
  },
];
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
