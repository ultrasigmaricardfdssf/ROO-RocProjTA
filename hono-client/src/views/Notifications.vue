<template>
  <AppLayout>
    <div class="inbox-page">
      <h1 class="page-title">Messages</h1>

      <div class="inbox-wrap card">
        <div class="inbox-sidebar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn pill dashed"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="inbox-main">
          <h2 class="inbox-section-title">{{ currentTabLabel }}</h2>

          <div v-if="!currentMessages.length" class="empty-state">
            No messages here.
          </div>

          <RouterLink
            v-for="m in currentMessages"
            :key="m.id"
            :to="`/inbox/${m.id}`"
            class="msg-row"
            :class="{ unread: !m.read }"
          >
            <span class="msg-type dashed">msg</span>

            <div class="msg-avatar">
              <span>{{ m.fromName.slice(0, 2).toUpperCase() }}</span>
            </div>

            <div class="msg-content">
              <span class="msg-from">{{ m.fromName }}</span>
              <span class="msg-preview">"{{ m.preview }}"</span>
            </div>

            <div class="msg-right">
              <span class="msg-time">{{ m.time }}</span>
              <span class="sn-badge dashed">sn</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
  import { ref, computed } from "vue";
  import AppLayout from "@/layouts/AppLayout.vue";

  const tabs = [
    { key: "recv", label: "recv" },
    { key: "sent", label: "sent" },
    { key: "read", label: "read" },
  ];
  const activeTab = ref("recv");
  const currentTabLabel = computed(() => {
    const map: Record<string, string> = {
      recv: "Received messages",
      sent: "Sent messages",
      read: "Read messages",
    };
    return map[activeTab.value];
  });

  interface Message {
    id: string;
    fromName: string;
    preview: string;
    time: string;
    read: boolean;
    tab: string;
  }

  const messages = ref<Message[]>([
    {
      id: "1",
      fromName: "Sigma boy",
      preview:
        "i kno ure there, you little mint enjoyer, little pingu lover, dm me back or else grrrrrrrrrrrr...",
      time: "1s ago",
      read: false,
      tab: "recv",
    },
    {
      id: "2",
      fromName: "Sigma boy",
      preview: "hllo sexy i heard u like linux",
      time: "4s ago",
      read: false,
      tab: "recv",
    },
  ]);

  const currentMessages = computed(() =>
    messages.value.filter((m) => m.tab === activeTab.value)
  );
</script>

<style scoped>
  .inbox-page {
    max-width: 860px;
    margin: 0 auto;
  }
  
  .page-title {
    font-size: 20px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 20px;
  } 

  .inbox-wrap {
    display: flex;
    overflow: hidden;
    min-height: 400px;
  } 

  .inbox-sidebar {
    width: 80px;
    background: #e8eef8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px 8px;
    border-right: 1.5px solid var(--border);
    flex-shrink: 0;
  }

  .tab-btn {
    width: 56px;
    height: 34px;
    font-size: 12px;
    background: #fff;
    color: var(--text-muted);
    border-color: var(--border) !important;
  }

  .tab-btn.active {
    background: var(--navy);
    color: #fff;
    border-color: var(--navy) !important;
  }

  .tab-btn:hover:not(.active) {
    background: var(--blue-pale);
  } 

  .inbox-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .inbox-section-title {
    font-size: 16px;
    font-weight: 700;
    text-align: center;
    padding: 16px;
    border-bottom: 1.5px solid var(--blue-pale);
  } 

  .empty-state {
    text-align: center;
    color: var(--text-light);
    padding: 40px;
  } 

  .msg-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--blue-pale);
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: background 0.12s;
  }

  .msg-row:last-child {
    border-bottom: none;
  }

  .msg-row:hover {
    background: var(--blue-soft);
  }

  .msg-row.unread {
    background: #f0f7ff;
  } 

  .msg-type {
    width: 42px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--navy);
    border-color: var(--navy-light) !important;
    border-radius: 999px;
    flex-shrink: 0;
  } 

  .msg-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--purple);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
  } 

  .msg-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .msg-from {
    font-weight: 700;
    font-size: 14px;
  }

  .msg-preview {
    font-size: 13px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  } 

  .msg-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }

  .msg-time {
    font-size: 11px;
    color: var(--text-light);
  }

  .sn-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }
</style>
