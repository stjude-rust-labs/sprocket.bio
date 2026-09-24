<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import type { NavItem } from '../../types'
import Icon from '../Icon.vue'

const props = defineProps<{ item: NavItem }>()

const open = ref(false)
const root = ref<HTMLElement>()
const button = ref<HTMLButtonElement>()
const menuId = useId()

function close(returnFocus = false) {
  open.value = false
  if (returnFocus) button.value?.focus()
}

function onDocumentClick(event: MouseEvent) {
  if (open.value && !root.value?.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    event.stopPropagation()
    close(true)
  }
}

function onFocusOut(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node)) close()
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="root" class="version-menu" @keydown="onKeydown" @focusout="onFocusOut">
    <button ref="button" type="button" class="version-menu__button" :aria-expanded="open" :aria-controls="menuId"
      @click="open = !open">
      {{ props.item.text }}
      <Icon name="chevron-down" :size="14" class="version-menu__chevron" />
    </button>
    <ul v-show="open" :id="menuId" class="version-menu__list">
      <li v-for="child in props.item.items" :key="child.link">
        <a :href="child.link" class="version-menu__link" target="_blank" rel="noreferrer" @click="close()">
          {{ child.text }}
          <Icon name="external" :size="14" />
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.version-menu {
  position: relative;
}

.version-menu__button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.625rem;
  border: 1px solid var(--sp-border);
  border-radius: 999px;
  font-family: var(--sp-font-mono);
  font-size: 0.8125rem;
  color: var(--sp-text-2);
  transition: color 0.2s, border-color 0.2s;
}

.version-menu__button:hover,
.version-menu__button[aria-expanded='true'] {
  color: var(--sp-text-strong);
  border-color: var(--sp-border-strong);
}

.version-menu__chevron {
  transition: transform 0.25s var(--sp-ease-out);
}

[aria-expanded='true'] > .version-menu__chevron {
  transform: rotate(180deg);
}

.version-menu__list {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 10;
  min-width: 11rem;
  padding: 0.375rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  background: var(--sp-bg-elev);
  box-shadow: 0 12px 32px -12px rgba(0, 0, 0, 0.35);
}

.version-menu__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0.625rem;
  border-radius: 6px;
  font-size: 0.9375rem;
  color: var(--sp-text-1);
}

.version-menu__link:hover {
  color: var(--sp-text-strong);
  background: var(--sp-bg-hover);
}
</style>
