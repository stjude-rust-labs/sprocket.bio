<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useRouter, withBase } from 'vitepress'
import type MiniSearch from 'minisearch'
import { useSidebar } from '../../composables/useSidebar'
import { ArrowTurnDownLeftIcon, DocumentIcon, HashtagIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

interface Result {
  id: string
  title: string
  titles: string[]
}

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const { flat } = useSidebar()
const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const list = ref<HTMLElement>()
const query = ref('')
const selected = ref(0)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const index = shallowRef<MiniSearch<Result>>()

// Only pages that appear in the sidebar are documentation pages.
const docPaths = computed(() => new Set(flat.value.map((item) => item.link?.replace(/^\//, ''))))

async function load() {
  if (status.value === 'loading' || status.value === 'ready') return
  status.value = 'loading'
  try {
    const [{ default: MiniSearchClass }, { default: locales }] = await Promise.all([
      import('minisearch'),
      import('@localSearchIndex'),
    ])
    const data = (await locales.root()).default
    index.value = MiniSearchClass.loadJSON<Result>(data, {
      fields: ['title', 'titles', 'text'],
      storeFields: ['title', 'titles'],
      searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 } },
    })
    status.value = 'ready'
  } catch (error) {
    console.error(error)
    status.value = 'error'
  }
}

const results = computed<Result[]>(() => {
  if (!index.value || !query.value.trim()) return []
  return (index.value.search(query.value) as unknown as Result[])
    .filter((result) => docPaths.value.has(result.id.replace(/^\//, '').replace(/\.html(#.*)?$/, '').replace(/#.*$/, '')))
    .slice(0, 20)
})

watch(results, () => { selected.value = 0 })

watch(() => props.open, async (open) => {
  if (!dialog.value) return
  if (open) {
    if (!dialog.value.open) dialog.value.showModal()
    load()
    await nextTick()
    input.value?.focus()
    input.value?.select()
  } else if (dialog.value.open) {
    dialog.value.close()
  }
})

function go(result?: Result) {
  if (!result) return
  emit('close')
  router.go(withBase(result.id))
}

function move(step: number) {
  if (!results.value.length) return
  selected.value = (selected.value + step + results.value.length) % results.value.length
  nextTick(() => list.value?.querySelector<HTMLElement>(`[aria-selected="true"]`)?.scrollIntoView({ block: 'nearest' }))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') { event.preventDefault(); move(1) }
  else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1) }
  else if (event.key === 'Enter') { event.preventDefault(); go(results.value[selected.value]) }
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="search" aria-label="Search documentation" @close="emit('close')"
    @cancel.prevent="emit('close')" @click="onBackdropClick">
    <div class="search__panel">
      <div class="search__field">
        <MagnifyingGlassIcon class="sp-icon-20 search__icon" />
        <input ref="input" v-model="query" type="search" class="search__input" placeholder="Search the docs"
          role="combobox" aria-label="Search the docs" aria-autocomplete="list" aria-controls="sp-search-results"
          :aria-expanded="results.length > 0"
          :aria-activedescendant="results.length ? `sp-search-result-${selected}` : undefined" autocomplete="off"
          spellcheck="false" @keydown="onKeydown">
        <button type="button" class="search__close" @click="emit('close')">
          <span class="sp-sr-only">Close search</span>
          <kbd aria-hidden="true">Esc</kbd>
        </button>
      </div>

      <ul v-show="results.length" id="sp-search-results" ref="list" class="search__results" role="listbox"
        aria-label="Results">
        <li v-for="(result, i) in results" :id="`sp-search-result-${i}`" :key="result.id" role="option"
          class="search__result" :aria-selected="i === selected" @click="go(result)" @mousemove="selected = i">
          <component :is="result.id.includes('#') ? HashtagIcon : DocumentIcon" class="sp-icon-18 search__result-icon" />
          <span class="search__result-text">
            <span v-if="result.titles.length" class="search__crumb">{{ result.titles.join(' › ') }}</span>
            <span class="search__title">{{ result.title }}</span>
          </span>
          <ArrowTurnDownLeftIcon class="sp-icon-16 search__enter" />
        </li>
      </ul>

      <p class="search__state" role="status">
        <template v-if="status === 'error'">The search index didn't load. Check your connection, then reopen search.</template>
        <template v-else-if="status === 'loading' && query">Loading the search index…</template>
        <template v-else-if="query.trim() && status === 'ready' && !results.length">No results for “{{ query.trim() }}”. Try a command name such as <code>run</code> or <code>lint</code>.</template>
        <template v-else-if="!query.trim()">Search commands, configuration, and guides.</template>
        <template v-else>{{ results.length }} result{{ results.length === 1 ? '' : 's' }}</template>
      </p>

      <div class="search__foot" aria-hidden="true">
        <span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
        <span><kbd>↵</kbd> to open</span>
        <span><kbd>Esc</kbd> to close</span>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.search {
  width: min(40rem, calc(100vw - 1.5rem));
  max-width: none;
  max-height: none;
  margin: 10vh auto auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--sp-text-1);
  overflow: visible;
}

.search::backdrop {
  background: var(--sp-overlay);
}

.search[open] {
  animation: search-in 0.35s var(--sp-ease-out);
}

@keyframes search-in {
  from {
    opacity: 0;
    transform: translateY(-0.5rem) scale(0.98);
  }
}

.search__panel {
  display: flex;
  flex-direction: column;
  max-height: 76vh;
  overflow: hidden;
  border: 1px solid var(--sp-border-strong);
  border-radius: 12px;
  background: var(--sp-bg-elev);
  box-shadow: 0 24px 64px -16px rgba(0, 0, 0, 0.45);
}

.search__field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.75rem 0 1rem;
  border-bottom: 1px solid var(--sp-border);
}

.search__icon {
  color: var(--sp-text-3);
}

.search__input {
  flex: 1;
  min-width: 0;
  height: 3.5rem;
  font-size: 1.0625rem;
  color: var(--sp-text-strong);
  outline: none;
}

.search__input::-webkit-search-cancel-button {
  display: none;
}

.search__close {
  flex: none;
  padding: 0.25rem;
  border-radius: 6px;
}

kbd {
  display: inline-block;
  min-width: 1.5rem;
  padding: 0.0625rem 0.375rem;
  border: 1px solid var(--sp-border);
  border-bottom-width: 2px;
  border-radius: 4px;
  font-family: var(--sp-font-mono);
  font-size: 0.6875rem;
  line-height: 1.5;
  text-align: center;
  color: var(--sp-text-2);
  background: var(--sp-bg-soft);
}

.search__results {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.5rem;
}

.search__result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--sp-radius);
  cursor: pointer;
}

.search__result[aria-selected='true'] {
  background: var(--sp-accent-soft);
}

.search__result-icon {
  color: var(--sp-text-3);
}

.search__result[aria-selected='true'] .search__result-icon {
  color: var(--sp-accent);
}

.search__result-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.search__crumb {
  overflow: hidden;
  font-size: 0.75rem;
  color: var(--sp-text-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search__title {
  font-weight: 500;
  color: var(--sp-text-strong);
}

.search__enter {
  color: var(--sp-accent);
  opacity: 0;
}

.search__result[aria-selected='true'] .search__enter {
  opacity: 1;
}

.search__state {
  padding: 0.875rem 1.25rem;
  font-size: 0.875rem;
  color: var(--sp-text-3);
}

.search__results:not([style*='none']) + .search__state {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.search__state code {
  padding: 0.1em 0.3em;
  border-radius: 4px;
  font-size: 0.875em;
  color: var(--sp-code-inline-text);
  background: var(--sp-code-inline-bg);
}

.search__foot {
  display: none;
  gap: 1.25rem;
  padding: 0.625rem 1.25rem;
  border-top: 1px solid var(--sp-border);
  font-size: 0.75rem;
  color: var(--sp-text-3);
}

.search__foot kbd {
  margin-right: 0.25rem;
}

@media (min-width: 640px) {
  .search__foot {
    display: flex;
  }
}
</style>
