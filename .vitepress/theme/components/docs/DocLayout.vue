<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import { useSidebar } from '../../composables/useSidebar'
import DocSidebar from './DocSidebar.vue'
import DocOutline from './DocOutline.vue'
import DocFooter from './DocFooter.vue'
import Icon from '../Icon.vue'

const route = useRoute()
const { section, flat, isActive } = useSidebar()
const open = ref(false)
const menuButton = ref<HTMLButtonElement>()

const currentTitle = computed(() => flat.value.find((item) => isActive(item.link))?.text)

async function close() {
  if (!open.value) return
  open.value = false
  await nextTick()
  menuButton.value?.focus()
}

watch(open, (value) => document.documentElement.classList.toggle('sp-scroll-lock', value))
watch(() => route.path, () => {
  open.value = false
})
</script>

<template>
  <div class="doc-layout">
    <div class="doc-layout__bar">
      <button ref="menuButton" type="button" class="doc-layout__menu" :aria-expanded="open"
        aria-controls="sp-doc-sidebar" @click="open = true">
        <Icon name="menu" :size="18" />
        Menu
      </button>
      <p v-if="section" class="doc-layout__crumb">
        {{ section.text }}<template v-if="currentTitle"> <span aria-hidden="true">/</span> {{ currentTitle }}</template>
      </p>
    </div>

    <Transition name="doc-backdrop">
      <div v-if="open" class="doc-layout__backdrop" @click="close" />
    </Transition>
    <DocSidebar id="sp-doc-sidebar" :open="open" @close="close" />

    <div class="doc-layout__main">
      <main id="main" class="doc-layout__content">
        <div class="sp-doc">
          <Content />
        </div>
        <DocFooter />
      </main>
      <aside class="doc-layout__outline">
        <DocOutline />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.doc-layout {
  max-width: 96rem;
  margin: 0 auto;
}

.doc-layout__bar {
  position: sticky;
  top: var(--sp-nav-height);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 3rem;
  padding: 0 1rem;
  background: var(--sp-bg);
  border-bottom: 1px solid var(--sp-border);
}

.doc-layout__menu {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  margin-left: -0.5rem;
  padding: 0 0.625rem 0 0.5rem;
  border-radius: var(--sp-radius);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--sp-text-1);
}

.doc-layout__menu:hover {
  color: var(--sp-text-strong);
  background: var(--sp-bg-hover);
}

.doc-layout__crumb {
  min-width: 0;
  overflow: hidden;
  font-size: 0.8125rem;
  color: var(--sp-text-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-layout__backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: var(--sp-overlay);
}

.doc-backdrop-enter-active,
.doc-backdrop-leave-active {
  transition: opacity 0.3s var(--sp-ease-out);
}

.doc-backdrop-enter-from,
.doc-backdrop-leave-to {
  opacity: 0;
}

.doc-layout__main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding: 2rem 1.25rem 5rem;
}

.doc-layout__content {
  min-width: 0;
}

.doc-layout__outline {
  display: none;
}

@media (min-width: 768px) {
  .doc-layout__bar {
    padding: 0 1.5rem;
  }

  .doc-layout__main {
    padding: 3rem 2.5rem 6rem;
  }
}

@media (min-width: 960px) {
  .doc-layout {
    display: grid;
    grid-template-columns: var(--sp-sidebar-width) minmax(0, 1fr);
  }

  .doc-layout__bar,
  .doc-layout__backdrop {
    display: none;
  }

  .doc-layout__main {
    justify-content: center;
    grid-template-columns: minmax(0, var(--sp-content-max));
    padding: 3rem 3rem 6rem;
  }
}

@media (min-width: 1200px) {
  .doc-layout__main {
    grid-template-columns: minmax(0, var(--sp-content-max)) var(--sp-outline-width);
    gap: 3rem;
  }

  .doc-layout__outline {
    display: block;
    position: sticky;
    top: calc(var(--sp-nav-height) + 3rem);
    align-self: start;
    max-height: calc(100vh - var(--sp-nav-height) - 4rem);
    overflow-y: auto;
    scrollbar-width: thin;
  }
}
</style>
