<template>
  <AppLayout>
    <div class="user-page card">
      <!-- Avatar -->
      <div class="avatar-col">
        <div class="profile-avatar">
          <img v-if="user.avatar" :src="user.avatar" alt="avatar" />
          <span v-else class="av-initials">{{
            user.username.slice(0, 2).toUpperCase()
          }}</span>
        </div>
      </div>

      <!-- Info card -->
      <div class="info-card dashed">
        <div class="info-top">
          <div class="info-left">
            <h1 class="username">{{ user.username }}</h1>
            <span class="role-badge" :class="user.role">{{ user.role }}</span>
            <span class="pronouns">{{ user.pronouns }}</span>
            <blockquote v-if="user.quote" class="user-quote">
              "{{ user.quote }}"
            </blockquote>
          </div>

          <div class="info-actions">
            <button
              v-if="!isOwnProfile"
              class="pill action-btn msg-btn dashed"
              @click="$router.push(`/inbox/new?to=${user.id}`)"
            >
              msg
            </button>
          </div>

          <div class="info-stats">
            <span class="stat-line">Signed up: {{ user.signedUp }}</span>
            <span class="stat-line blue">Following: {{ user.following }}</span>
            <div class="stat-follow-row">
              <span class="stat-line blue"
                >Followers: {{ user.followers }}</span
              >
              <button
                v-if="!isOwnProfile"
                class="pill follow-btn"
                :class="{ following: isFollowing }"
                @click="toggleFollow"
              >
                {{ isFollowing ? "Unfollow" : "Follow" }}
              </button>
            </div>
            <div v-if="!isOwnProfile" class="action-btns">
              <button class="pill action-dark">BLOCK</button>
              <button class="pill action-red">REPORT</button>
            </div>
          </div>
        </div>

        <div class="divider" />

        <!-- Bio -->
        <div class="bio" v-html="renderedBio" />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "@/layouts/AppLayout.vue";
import { useAuthStore } from "@/stores/auth.js";

const route = useRoute();
const authStore = useAuthStore();

// Replace with real API fetch using route.params.id
const user = ref({
  id: (route.params.id as string) ?? "1",
  username: "Sigma boy",
  role: "user" as "user" | "admin" | "support",
  pronouns: "he/him",
  quote: "did somebody say thomas shelby",
  avatar: "",
  signedUp: "1. 4. 1984",
  following: 0,
  followers: 0,
  bio: "lorem ipsum som Dolores ahoj <strong>(basic markdown supported)</strong>",
});

const isOwnProfile = computed(() => authStore.user?.id === user.value.id);
const isFollowing = ref(false);
const renderedBio = computed(() => user.value.bio); // wire to a markdown parser if needed

function toggleFollow() {
  isFollowing.value = !isFollowing.value;
}
</script>

<style scoped>
.user-page {
  display: flex;
  gap: 0;
  padding: 32px;
  align-items: flex-start;
}

.avatar-col {
  flex-shrink: 0;
  margin-right: 28px;
}
.profile-avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: var(--purple);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(124, 58, 237, 0.3);
}
.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.av-initials {
  color: #fff;
  font-size: 48px;
  font-weight: 800;
}

.info-card {
  flex: 1;
  padding: 20px 24px;
  border-color: var(--border) !important;
}
.info-top {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.info-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.username {
  font-size: 26px;
  font-weight: 800;
}

.role-badge {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  padding: 1px 10px;
  border-radius: 999px;
  width: fit-content;
}
.role-badge.user {
  color: var(--purple);
}
.role-badge.admin {
  color: var(--red);
}
.role-badge.support {
  color: var(--orange);
}

.pronouns {
  font-size: 13px;
  color: var(--text-muted);
}

.user-quote {
  font-size: 14px;
  color: var(--text);
  border: 1.5px dashed var(--border);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  margin-top: 4px;
  font-style: normal;
}

.info-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}
.action-btn {
  padding: 6px 14px;
  font-size: 13px;
}
.msg-btn {
  color: var(--navy);
  border-color: var(--navy-light) !important;
}

.info-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}
.stat-line {
  font-size: 13px;
  color: var(--text-muted);
}
.stat-line.blue {
  color: var(--navy);
  font-weight: 700;
}
.stat-follow-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.follow-btn {
  padding: 3px 14px;
  font-size: 12px;
  background: var(--navy);
  color: #fff;
  border-color: var(--navy) !important;
}
.follow-btn.following {
  background: var(--border);
  color: var(--text-muted);
  border-color: var(--border) !important;
}

.action-btns {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.action-dark {
  padding: 5px 12px;
  font-size: 12px;
  background: #1e293b;
  color: #fff;
  border-color: #1e293b !important;
}
.action-red {
  padding: 5px 12px;
  font-size: 12px;
  background: var(--red);
  color: #fff;
  border-color: var(--red) !important;
}

.divider {
  border-top: 1.5px dashed var(--border);
  margin: 16px 0;
}
.bio {
  font-size: 14px;
  color: var(--text);
  line-height: 1.6;
}
</style>
