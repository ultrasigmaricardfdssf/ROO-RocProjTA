<template>
  <AppLayout>
    <div class="settings-page">
      <div class="settings-header">
        <h1 class="settings-title">Settings</h1>
        <RouterLink to="/account" class="account-link"
          >(Account customization here) (link)</RouterLink
        >
      </div>

      <div class="sections card">
        <SettingsSection title="Credentials" :open="true" accent="default">
          <div class="creds-form">
            <label class="field-row">
              <span class="field-label">Current password:</span>
              <input
                v-model="creds.current"
                type="password"
                class="field-input"
              />
            </label>
            <label class="field-row">
              <span class="field-label">Desired password:</span>
              <input
                v-model="creds.desired"
                type="password"
                class="field-input"
              />
            </label>
            <label class="field-row">
              <span class="field-label">Confirm password:</span>
              <input
                v-model="creds.confirm"
                type="password"
                class="field-input"
              />
            </label>
            <div class="field-row">
              <span class="field-label" />
              <button class="pill confirm-btn" @click="changePassword">
                Confirm password change
              </button>
            </div>
            <p v-if="pwMsg" class="pw-msg" :class="pwMsgType">{{ pwMsg }}</p>
          </div>
        </SettingsSection>

        <div class="section-divider" />

        <SettingsSection title="Forums" accent="default">
          <label class="toggle-row">
            <span>Email notifications for replies</span>
            <input type="checkbox" v-model="forums.emailReplies" />
          </label>
          <label class="toggle-row">
            <span>Show post count on profile</span>
            <input type="checkbox" v-model="forums.showPostCount" />
          </label>
        </SettingsSection>

        <div class="section-divider" />

        <SettingsSection
          v-if="authStore.isAdmin || isSupport"
          title="Tickets"
          accent="orange"
        >
          <label class="toggle-row">
            <span>Auto-assign new tickets to me</span>
            <input type="checkbox" v-model="tickets.autoAssign" />
          </label>
          <label class="toggle-row">
            <span>Email on ticket update</span>
            <input type="checkbox" v-model="tickets.emailUpdate" />
          </label>
        </SettingsSection>

        <div v-if="authStore.isAdmin || isSupport" class="section-divider" />

        <SettingsSection title="Chat rooms" accent="default">
          <label class="toggle-row">
            <span>Show online status</span>
            <input type="checkbox" v-model="chat.showOnline" />
          </label>
          <label class="toggle-row">
            <span>Sound on message</span>
            <input type="checkbox" v-model="chat.sound" />
          </label>
        </SettingsSection>

        <div class="section-divider" />

        <SettingsSection title="Inbox" accent="default">
          <label class="toggle-row">
            <span>Allow messages from non-followers</span>
            <input type="checkbox" v-model="inbox.allowAll" />
          </label>
          <label class="toggle-row">
            <span>Notification popups on reload</span>
            <input type="checkbox" v-model="inbox.notified" />
          </label>
        </SettingsSection>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import AppLayout from "@/layouts/AppLayout.vue";
  import SettingsSection from "@/components/SettingsSection.vue";
  import { useAuthStore } from "@/stores/auth.js";

  const authStore = useAuthStore();
  const isSupport = false; // wire to role check

  const creds = ref({ current: "", desired: "", confirm: "" });
  const pwMsg = ref("");
  const pwMsgType = ref<"ok" | "err">("ok");
  const forums = ref({ emailReplies: true, showPostCount: true });
  const tickets = ref({ autoAssign: false, emailUpdate: true });
  const chat = ref({ showOnline: true, sound: false });
  const inbox = ref({
    allowAll: false,
    notified: authStore.user?.notified ?? true,
  });

  async function changePassword() {
    pwMsg.value = "";
    if (!creds.value.current) {
      pwMsg.value = "Enter your current password.";
      pwMsgType.value = "err";
      return;
    }
    if (creds.value.desired.length < 8) {
      pwMsg.value = "New password must be at least 8 characters.";
      pwMsgType.value = "err";
      return;
    }
    if (creds.value.desired !== creds.value.confirm) {
      pwMsg.value = "Passwords do not match.";
      pwMsgType.value = "err";
      return;
    }
    // TODO: call API
    pwMsg.value = "Password changed successfully!";
    pwMsgType.value = "ok";
    creds.value = { current: "", desired: "", confirm: "" };
  }
</script>

<style scoped>
  .settings-page {
    max-width: 720px;
    margin: 0 auto;
  }

  .settings-header {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .settings-title {
    font-size: 32px;
    font-weight: 800;
  }

  .account-link {
    font-size: 13px;
    color: var(--purple);
  }

  .account-link:hover {
    text-decoration: underline;
  }

  .sections {
    padding: 0;
    overflow: hidden;
  }

  .section-divider {
    border-top: 1.5px dashed var(--border);
  }

  .creds-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .field-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .field-label {
    width: 155px;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
    text-align: right;
  }

  .field-input {
    flex: 1;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 7px 12px;
    font-family: var(--font-mono);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }

  .field-input:focus {
    border-color: var(--navy-light);
  }

  .confirm-btn {
    padding: 7px 18px;
    font-size: 13px;
    background: #fff;
    color: var(--navy);
    border: 1.5px solid var(--navy) !important;
  }

  .confirm-btn:hover {
    background: var(--blue-soft);
  }

  .pw-msg {
    font-size: 13px;
    padding-left: 167px;
  }

  .pw-msg.ok {
    color: var(--green);
  }

  .pw-msg.err {
    color: var(--red);
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 0;
  }

  .toggle-row:not(:last-child) {
    border-bottom: 1px solid var(--blue-pale);
    padding-bottom: 8px;
    margin-bottom: 4px;
  }
</style>
