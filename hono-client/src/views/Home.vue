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
            :ticket="{id: t.id, title: t.subject, preview: t.description || '', authorName: t.requesterName, openedAgo: timeAgo(t.createdAt)}"
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
            :ticket="{id: t.id, title: t.subject, preview: t.description || '', authorName: t.requesterName, openedAgo: timeAgo(t.createdAt)}"
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
  @tagClick="(tag) => router.push({ path: '/search', query: { tagId: String(tagIdByShort(tag)) } })"
/>
      </div>
    </section>

    <div class="h-divider dashed-line" />

    <section class="topic-section">
      <h2 class="section-title center">Most viewed topics</h2>
      <div class="topic-list">
        <TopicCard
  v-for="q in topTopics"
  :key="q.id"
  :topic="toTopicCard(q)"
  @click="router.push(`/forums/${q.id}`)"
  @tagClick="(tag) => router.push({ path: '/search', query: { tagId: String(tagIdByShort(tag)) } })"
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
  import { useTickets, type TicketSummary, type OpenTicket } from "@/composables/useTickets.js"
  import { useTopicUtils } from '@/composables/useTopicUtils'

  const router = useRouter();

  const authStore = useAuthStore();
  const forums = useForums();
  const tickets = useTickets();

  const recentTopics = ref<QuestionSummary[]>([])
const topTopics    = ref<QuestionSummary[]>([])
const tags = ref([])
const loadingTopics      = ref(true)

const { toTopicCard, timeAgo, tagSearchRoute, tagIdByShort } = useTopicUtils(tags)

const filteredTop = computed(() => topTopics.value)

const openTickets = ref<OpenTicket[]>([]);
const myTickets: typeof openTickets = [];

 onMounted(async () => {
  const [recent, top, tagList, ticketList] = await Promise.allSettled([
    forums.getRecent(20),
    forums.getTop(10),
    forums.getTags(),
    tickets.getOpenTickets()
  ])
  if (recent.status  === 'fulfilled') recentTopics.value = recent.value
  if (top.status     === 'fulfilled') topTopics.value    = top.value
  if (tagList.status === 'fulfilled') tags.value         = tagList.value
  if (ticketList.status === 'fulfilled') openTickets.value      = ticketList.value
  loadingTopics.value = false
})
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
