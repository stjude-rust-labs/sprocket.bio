<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import type { SprocketThemeConfig } from '../../types'
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import GitHubMark from '../GitHubMark.vue'
import ThemeToggle from './ThemeToggle.vue'
import VersionMenu from './VersionMenu.vue'
import MobileMenu from './MobileMenu.vue'

const emit = defineEmits<{ 'open-search': [] }>()
const { theme, frontmatter } = useData<SprocketThemeConfig>()
const route = useRoute()

const links = computed(() => theme.value.nav.filter((item) => item.link))
const menus = computed(() => theme.value.nav.filter((item) => item.items?.length))
const isDocs = computed(() => frontmatter.value.layout !== 'home')

const shortcut = ref('Ctrl K')
onMounted(() => {
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) shortcut.value = '⌘K'
})

const menuOpen = ref(false)
watch(() => route.path, () => { menuOpen.value = false })
</script>

<template>
  <header class="site-nav">
    <div class="site-nav__inner">
      <a href="/" class="site-nav__logo">
        <img src="/sprocket-logo-dark.png" alt="Sprocket home" class="site-nav__logo-img site-nav__logo-img--dark"
          width="126" height="32">
        <img src="/sprocket-logo.png" alt="Sprocket home" class="site-nav__logo-img site-nav__logo-img--light"
          width="126" height="32">
      </a>

      <nav class="site-nav__links" aria-label="Main">
        <a v-for="item in links" :key="item.link" :href="item.link" class="site-nav__link"
          :class="{ 'is-active': isDocs && item.link === '/overview' }">{{ item.text }}</a>
      </nav>

      <div class="site-nav__actions">
        <button type="button" class="site-nav__search" aria-label="Search docs" @click="emit('open-search')">
          <MagnifyingGlassIcon class="sp-icon-18" />
          <span class="site-nav__search-label">Search docs</span>
          <kbd class="site-nav__kbd">{{ shortcut }}</kbd>
        </button>
        <div class="site-nav__desktop">
          <VersionMenu v-for="menu in menus" :key="menu.text" :item="menu" />
          <a v-for="social in theme.socialLinks" :key="social.link" :href="social.link" class="site-nav__icon"
            target="_blank" rel="noreferrer" aria-label="Sprocket on GitHub">
            <GitHubMark :size="20"/>
          </a>
          <ThemeToggle />
        </div>
        <button type="button" class="site-nav__icon site-nav__menu-button" :aria-expanded="menuOpen"
          aria-controls="sp-mobile-menu" :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          @click="menuOpen = !menuOpen">
          <component :is="menuOpen ? XMarkIcon : Bars3Icon" class="sp-icon-22" />
        </button>
      </div>
    </div>
    <MobileMenu id="sp-mobile-menu" :open="menuOpen" @close="menuOpen = false" />
  </header>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--sp-nav-height);
  background: var(--sp-bg);
  border-bottom: 1px solid var(--sp-border);
}

.site-nav__inner {
  display: flex;
  align-items: center;
  gap: 2rem;
  height: 100%;
  padding: 0 1rem;
}

.site-nav__logo {
  flex: none;
  border-radius: 4px;
}

.site-nav__logo-img {
  width: auto;
  height: 32px;
}

.site-nav__logo-img--light {
  display: none;
}

:global(html:not(.dark) .site-nav__logo-img--dark) {
  display: none;
}

:global(html:not(.dark) .site-nav__logo-img--light) {
  display: block;
}

.site-nav__links {
  display: none;
  gap: 1.5rem;
}

.site-nav__link {
  position: relative;
  padding: 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--sp-text-2);
  transition: color 0.2s;
}

.site-nav__link:hover,
.site-nav__link.is-active {
  color: var(--sp-text-strong);
}

.site-nav__link.is-active::after {
  content: '';
  position: absolute;
  inset: auto 0 calc((var(--sp-nav-height) - 1.75rem) / -2) 0;
  height: 2px;
  background: var(--sp-accent);
}

.site-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}

.site-nav__search {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  min-width: 2.5rem;
  justify-content: center;
  border-radius: var(--sp-radius);
  color: var(--sp-text-2);
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
}

.site-nav__search:hover {
  color: var(--sp-text-strong);
  background: var(--sp-bg-hover);
}

.site-nav__search-label,
.site-nav__kbd {
  display: none;
}

.site-nav__kbd {
  margin-left: auto;
  padding: 0.125rem 0.375rem;
  border: 1px solid var(--sp-border);
  border-radius: 4px;
  font-family: var(--sp-font-mono);
  font-size: 0.75rem;
  color: var(--sp-text-3);
}

.site-nav__desktop {
  display: none;
  align-items: center;
  gap: 0.25rem;
}

.site-nav__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--sp-radius);
  color: var(--sp-text-2);
  transition: color 0.2s, background-color 0.2s;
}

.site-nav__icon:hover {
  color: var(--sp-text-strong);
  background: var(--sp-bg-hover);
}

@media (min-width: 768px) {
  .site-nav__inner {
    padding: 0 1.5rem;
  }

  .site-nav__links,
  .site-nav__desktop {
    display: flex;
  }

  .site-nav__desktop {
    gap: 0.5rem;
    margin-left: 0.5rem;
  }

  .site-nav__menu-button {
    display: none;
  }

  .site-nav__search {
    width: 15rem;
    justify-content: flex-start;
    padding: 0 0.5rem 0 0.75rem;
    border: 1px solid var(--sp-border);
    background: var(--sp-bg-soft);
    color: var(--sp-text-3);
  }

  .site-nav__search:hover {
    border-color: var(--sp-border-strong);
    background: var(--sp-bg-soft);
    color: var(--sp-text-2);
  }

  .site-nav__search-label,
  .site-nav__kbd {
    display: inline;
  }

  .site-nav__search-label {
    font-size: 0.875rem;
  }
}

@media (min-width: 1280px) {
  .site-nav__inner {
    padding: 0 2rem;
  }
}
</style>
