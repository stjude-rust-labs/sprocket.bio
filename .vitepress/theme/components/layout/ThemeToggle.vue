<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline'

defineProps<{ labelled?: boolean }>()

const { isDark } = useData()
// The stored choice is only known on the client, so the state attribute waits for mount.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
</script>

<template>
  <button type="button" class="theme-toggle" :class="{ 'theme-toggle--labelled': labelled }"
    :aria-label="labelled ? undefined : 'Dark theme'" :aria-pressed="mounted ? isDark : undefined"
    @click="isDark = !isDark">
    <span class="theme-toggle__icons" aria-hidden="true">
      <MoonIcon class="sp-icon-20 theme-toggle__moon" />
      <SunIcon class="sp-icon-20 theme-toggle__sun" />
    </span>
    <span v-if="labelled">Dark theme</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  min-width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--sp-radius);
  color: var(--sp-text-2);
  transition: color 0.2s, background-color 0.2s;
}

.theme-toggle:hover {
  color: var(--sp-text-strong);
  background: var(--sp-bg-hover);
}

.theme-toggle--labelled {
  justify-content: flex-start;
  padding: 0 0.75rem 0 0.5rem;
  font-size: 0.9375rem;
}

.theme-toggle__icons {
  display: grid;
}

.theme-toggle__icons > * {
  grid-area: 1 / 1;
  transition: opacity 0.3s var(--sp-ease-out), transform 0.5s var(--sp-ease-out);
}

.theme-toggle__sun {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

:global(html:not(.dark) .theme-toggle__moon) {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

:global(html:not(.dark) .theme-toggle__sun) {
  opacity: 1;
  transform: none;
}
</style>
