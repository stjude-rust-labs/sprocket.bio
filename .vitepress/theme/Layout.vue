<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import SearchDialog from './components/search/SearchDialog.vue'
import SiteNav from './components/layout/SiteNav.vue'
import Homepage from './components/Homepage.vue'
import DocLayout from './components/docs/DocLayout.vue'
import NotFound from './components/NotFound.vue'

const { page, frontmatter } = useData()
const searchOpen = ref(false)

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchOpen.value = !searchOpen.value
  } else if (event.key === '/' && !searchOpen.value && !isTyping(event.target)) {
    event.preventDefault()
    searchOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="sp-app">
    <a href="#main" class="sp-skip">Skip to content</a>
    <SiteNav @open-search="searchOpen = true" />
    <NotFound v-if="page.isNotFound" @open-search="searchOpen = true" />
    <Homepage v-else-if="frontmatter.layout === 'home'" />
    <DocLayout v-else />
    <SearchDialog :open="searchOpen" @close="searchOpen = false" />
  </div>
</template>

<style scoped>
.sp-skip {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 100;
  padding: 0.5rem 0.875rem;
  border-radius: var(--sp-radius);
  background: var(--sp-accent-strong);
  color: var(--sp-on-accent);
  font-weight: 500;
  transform: translateY(-200%);
}

.sp-skip:focus-visible {
  transform: none;
}
</style>
