<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useData } from 'vitepress'
import type { SprocketThemeConfig } from '../../types'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps<{ open: boolean; id: string }>()
const emit = defineEmits<{ close: [] }>()
const { theme } = useData<SprocketThemeConfig>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(() => props.open, (open) => {
  document.documentElement.classList.toggle('sp-scroll-lock', open)
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.documentElement.classList.remove('sp-scroll-lock')
})
</script>

<template>
  <Transition name="mobile-menu">
    <div v-show="open" :id="id" class="mobile-menu">
      <nav aria-label="Main">
        <ul class="mobile-menu__list">
          <template v-for="item in theme.nav" :key="item.text">
            <li v-if="item.link">
              <a :href="item.link" class="mobile-menu__link" @click="emit('close')">{{ item.text }}</a>
            </li>
            <li v-for="child in item.items" v-else :key="child.link">
              <a :href="child.link" class="mobile-menu__link" target="_blank" rel="noreferrer">
                {{ child.text }} <span class="mobile-menu__meta">{{ item.text }}</span>
                <ArrowTopRightOnSquareIcon class="sp-icon-16" />
              </a>
            </li>
          </template>
          <li v-for="social in theme.socialLinks" :key="social.link">
            <a :href="social.link" class="mobile-menu__link" target="_blank" rel="noreferrer">
              GitHub <ArrowTopRightOnSquareIcon class="sp-icon-16" />
            </a>
          </li>
        </ul>
      </nav>
      <div class="mobile-menu__footer">
        <ThemeToggle labelled />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.mobile-menu {
  position: fixed;
  inset: var(--sp-nav-height) 0 0;
  z-index: 40;
  overflow-y: auto;
  padding: 1rem 1.5rem 2rem;
  background: var(--sp-bg);
}

.mobile-menu__list {
  display: grid;
}

.mobile-menu__link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid var(--sp-border);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--sp-text-strong);
}

.mobile-menu__meta {
  font-family: var(--sp-font-mono);
  font-size: 0.8125rem;
  color: var(--sp-text-3);
}

.mobile-menu__link svg {
  margin-left: auto;
  color: var(--sp-text-3);
}

.mobile-menu__footer {
  margin-top: 1.5rem;
  margin-left: -0.5rem;
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.25s var(--sp-ease-out), transform 0.35s var(--sp-ease-out);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (min-width: 768px) {
  .mobile-menu {
    display: none !important;
  }
}
</style>
