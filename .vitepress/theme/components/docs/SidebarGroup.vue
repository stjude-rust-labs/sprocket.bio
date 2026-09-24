<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { SidebarItem } from '../../types'
import { containsActive, useSidebar } from '../../composables/useSidebar'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ item: SidebarItem; depth: number }>()
const { current, isActive } = useSidebar()

const collapsible = computed(() => props.item.collapsed !== undefined)
const hasActive = computed(() => containsActive(props.item, current.value))
const open = ref(!collapsible.value || !props.item.collapsed || hasActive.value)
const listId = useId()

watch(hasActive, (active) => {
  if (active) open.value = true
})
</script>

<template>
  <div class="sidebar-group" :class="`sidebar-group--depth-${depth}`">
    <button v-if="collapsible" type="button" class="sidebar-group__title sidebar-group__toggle"
      :aria-expanded="open" :aria-controls="listId" @click="open = !open">
      <span>{{ item.text }}</span>
      <ChevronRightIcon class="sp-icon-14 sidebar-group__chevron" />
    </button>
    <p v-else class="sidebar-group__title">{{ item.text }}</p>

    <ul v-show="open" :id="listId" class="sidebar-group__list">
      <li v-for="child in item.items" :key="child.text">
        <SidebarGroup v-if="child.items" :item="child" :depth="depth + 1" />
        <a v-else :href="child.link" class="sidebar-group__link" :class="{ 'is-active': isActive(child.link) }"
          :aria-current="isActive(child.link) ? 'page' : undefined">{{ child.text }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sidebar-group__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 0;
  padding: 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--sp-text-strong);
  text-align: left;
}

.sidebar-group--depth-1 > .sidebar-group__title,
.sidebar-group--depth-2 > .sidebar-group__title {
  padding: 0.3125rem 0;
  font-family: var(--sp-font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--sp-text-2);
}

.sidebar-group__toggle {
  border-radius: 4px;
  transition: color 0.2s;
}

.sidebar-group__toggle:hover {
  color: var(--sp-text-strong);
}

.sidebar-group__chevron {
  color: var(--sp-text-3);
  transition: transform 0.25s var(--sp-ease-out);
}

[aria-expanded='true'] > .sidebar-group__chevron {
  transform: rotate(90deg);
}

/* A thin rail runs down each list; the current page sits on it as a node. */
.sidebar-group__list {
  position: relative;
  margin: 0.25rem 0 0;
  padding-left: 0.875rem;
}

.sidebar-group__list::before {
  content: '';
  position: absolute;
  top: 0.375rem;
  bottom: 0.375rem;
  left: 0.1875rem;
  width: 1px;
  background: var(--sp-border);
}

.sidebar-group__link {
  position: relative;
  display: block;
  padding: 0.3125rem 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--sp-text-2);
  border-radius: 4px;
  transition: color 0.2s;
}

.sidebar-group__link:hover {
  color: var(--sp-text-strong);
}

.sidebar-group__link.is-active {
  color: var(--sp-accent);
  font-weight: 600;
}

.sidebar-group__link.is-active::before {
  content: '';
  position: absolute;
  top: calc(0.3125rem + 0.725em - 4px);
  left: calc(-0.875rem + 0.1875rem - 3.5px);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sp-accent-strong);
  box-shadow: 0 0 0 3px var(--sp-bg);
}

:global(html.dark) .sidebar-group__link.is-active::before {
  background: var(--sp-accent);
}
</style>
