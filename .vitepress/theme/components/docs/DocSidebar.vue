<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useSidebar } from '../../composables/useSidebar'
import SidebarGroup from './SidebarGroup.vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const { groups } = useSidebar()
const root = ref<HTMLElement>()
const closeButton = ref<HTMLButtonElement>()

// Keep focus inside the drawer while it is open on small screens.
function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !root.value) return
  const focusable = [...root.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
    .filter((el) => el.offsetParent !== null)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(() => props.open, async (open) => {
  if (!open) return
  await nextTick()
  const active = root.value?.querySelector<HTMLElement>('[aria-current="page"]')
  ;(active ?? closeButton.value)?.focus()
})
</script>

<template>
  <div ref="root" class="doc-sidebar" :class="{ 'is-open': open }" :role="open ? 'dialog' : undefined"
    :aria-modal="open ? 'true' : undefined" :aria-label="open ? 'Documentation navigation' : undefined"
    @keydown="onKeydown">
    <div class="doc-sidebar__head">
      <span class="doc-sidebar__head-title">Documentation</span>
      <button ref="closeButton" type="button" class="doc-sidebar__close" aria-label="Close navigation"
        @click="emit('close')">
        <XMarkIcon class="sp-icon-20" />
      </button>
    </div>
    <nav class="doc-sidebar__nav" aria-label="Documentation">
      <SidebarGroup v-for="group in groups" :key="group.text" :item="group" :depth="0" class="doc-sidebar__group" />
    </nav>
  </div>
</template>

<style scoped>
.doc-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  width: min(20rem, 86vw);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 1.25rem 3rem;
  background: var(--sp-bg);
  border-right: 1px solid var(--sp-border);
  box-shadow: 16px 0 48px -24px rgba(0, 0, 0, 0.5);
  visibility: hidden;
  transform: translateX(-100%);
  transition: transform 0.4s var(--sp-ease-out), visibility 0s 0.4s;
}

.doc-sidebar.is-open {
  visibility: visible;
  transform: none;
  transition: transform 0.4s var(--sp-ease-out), visibility 0s;
}

.doc-sidebar__head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--sp-nav-height);
  margin: 0 -1.25rem 0.5rem;
  padding: 0 0.75rem 0 1.25rem;
  background: var(--sp-bg);
  border-bottom: 1px solid var(--sp-border);
}

.doc-sidebar__head-title {
  font-weight: 600;
  color: var(--sp-text-strong);
}

.doc-sidebar__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--sp-radius);
  color: var(--sp-text-2);
}

.doc-sidebar__close:hover {
  color: var(--sp-text-strong);
  background: var(--sp-bg-hover);
}

.doc-sidebar__group + .doc-sidebar__group {
  margin-top: 1.5rem;
}

@media (min-width: 960px) {
  .doc-sidebar {
    position: sticky;
    top: var(--sp-nav-height);
    z-index: auto;
    align-self: start;
    width: auto;
    height: calc(100vh - var(--sp-nav-height));
    padding: 2rem 1.5rem 4rem 1.5rem;
    box-shadow: none;
    visibility: visible;
    transform: none;
    transition: none;
    scrollbar-width: thin;
    scrollbar-color: var(--sp-border-strong) transparent;
  }

  .doc-sidebar__head {
    display: none;
  }
}

@media (min-width: 1280px) {
  .doc-sidebar {
    padding-left: 2rem;
  }
}
</style>
