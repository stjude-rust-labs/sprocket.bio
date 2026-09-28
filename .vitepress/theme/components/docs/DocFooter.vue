<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import type { SprocketThemeConfig } from '../../types'
import { useSidebar } from '../../composables/useSidebar'
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon } from '@heroicons/vue/24/outline'

const { theme, page } = useData<SprocketThemeConfig>()
const { prev, next } = useSidebar()

const editUrl = computed(() => theme.value.editLink?.pattern.replace(':path', page.value.relativePath))

// Formatted on the client only so the locale and time zone cannot cause a hydration mismatch.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const updatedIso = computed(() => (page.value.lastUpdated ? new Date(page.value.lastUpdated).toISOString() : ''))
const stamp = computed(() =>
  mounted.value && page.value.lastUpdated
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(page.value.lastUpdated)
    : '',
)
</script>

<template>
  <footer class="doc-footer">
    <div class="doc-footer__meta">
      <a v-if="editUrl" :href="editUrl" class="doc-footer__edit" target="_blank" rel="noreferrer">
        <PencilIcon class="sp-icon-16" />
        {{ theme.editLink.text }}
      </a>
      <p v-if="stamp" class="doc-footer__updated">
        Last updated <time :datetime="updatedIso">{{ stamp }}</time>
      </p>
    </div>

    <nav v-if="prev || next" class="doc-footer__pager" aria-label="Pages">
      <a v-if="prev" :href="prev.link" class="doc-footer__page doc-footer__page--prev">
        <span class="doc-footer__dir"><ArrowLeftIcon class="sp-icon-14" /> Previous</span>
        <span class="doc-footer__title" v-html="prev.docFooterText ?? prev.text" />
      </a>
      <a v-if="next" :href="next.link" class="doc-footer__page doc-footer__page--next">
        <span class="doc-footer__dir">Next <ArrowRightIcon class="sp-icon-14" /></span>
        <span class="doc-footer__title" v-html="next.docFooterText ?? next.text" />
      </a>
    </nav>
  </footer>
</template>

<style scoped>
.doc-footer {
  margin-top: 4rem;
}

.doc-footer__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--sp-border);
  font-size: 0.875rem;
}

.doc-footer__edit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--sp-accent);
  border-radius: 4px;
  transition: color 0.2s;
}

.doc-footer__edit:hover {
  color: var(--sp-accent-hover);
}

.doc-footer__updated {
  color: var(--sp-text-3);
}

.doc-footer__pager {
  display: grid;
  gap: 1rem;
  padding-top: 1.5rem;
}

.doc-footer__page {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  transition: border-color 0.25s, background-color 0.25s;
}

.doc-footer__page:hover {
  border-color: var(--sp-accent);
  background: var(--sp-accent-soft);
}

.doc-footer__page--next {
  align-items: flex-end;
  text-align: right;
}

.doc-footer__dir {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--sp-text-3);
}

.doc-footer__title {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--sp-text-strong);
  text-wrap: balance;
}

.doc-footer__page:hover .doc-footer__title {
  color: var(--sp-accent);
}

@media (min-width: 640px) {
  .doc-footer__pager {
    grid-template-columns: 1fr 1fr;
  }

  .doc-footer__page--next:only-child {
    grid-column: 2;
  }
}
</style>
