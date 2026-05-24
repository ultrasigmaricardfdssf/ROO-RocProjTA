<template>
  <div class="settings-section">
    <button class="section-header" @click="isOpen = !isOpen">
      <span class="section-title" :class="accent">{{ title }}</span>
      <span class="diamond-icon" :class="{ open: isOpen, [accent]: true }"
        >◆</span
      >
      <span v-if="accent === 'orange'" class="support-note"
        >(support only)</span
      >
    </button>

    <Transition name="expand">
      <div v-if="isOpen" class="section-body">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    open?: boolean;
    accent?: "default" | "orange" | "red";
  }>(),
  { open: false, accent: "default" }
);

const isOpen = ref(props.open);
</script>

<style scoped>
.settings-section {
}

.section-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.section-header:hover {
  background: var(--blue-soft);
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.section-title.orange {
  color: var(--orange);
}
.section-title.red {
  color: var(--red);
}

.diamond-icon {
  font-size: 14px;
  color: var(--border);
  transition:
    transform 0.2s,
    color 0.2s;
}
.diamond-icon.open {
  color: var(--navy);
  transform: rotate(45deg);
}
.diamond-icon.orange.open {
  color: var(--orange);
}

.support-note {
  font-size: 11px;
  color: var(--text-light);
  margin-left: 4px;
}

.section-body {
  padding: 4px 24px 20px;
}

/* Expand animation */
.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
  transform-origin: top;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}
</style>
