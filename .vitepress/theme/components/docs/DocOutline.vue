<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { onContentUpdated } from 'vitepress'

interface Segment {
  text: string
  code: boolean
}

interface Heading {
  id: string
  segments: Segment[]
  level: 2 | 3
}

function segmentsOf(node: Node, out: Segment[] = []): Segment[] {
  for (const child of node.childNodes) {
    if (child instanceof HTMLElement && child.tagName === 'CODE') {
      out.push({ text: child.textContent ?? '', code: true })
    } else if (child instanceof HTMLElement) {
      segmentsOf(child, out)
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent) {
      const last = out[out.length - 1]
      if (last && !last.code) last.text += child.textContent
      else out.push({ text: child.textContent, code: false })
    }
  }
  return out
}

function trimSegments(segments: Segment[]) {
  const first = segments[0]
  const last = segments[segments.length - 1]
  if (first && !first.code) first.text = first.text.trimStart()
  if (last && !last.code) last.text = last.text.trimEnd()
  return segments.filter((segment) => segment.text)
}

const headings = ref<Heading[]>([])
const activeId = ref('')
let frame = 0

function collect() {
  headings.value = [...document.querySelectorAll<HTMLElement>('.sp-doc :is(h2, h3)[id]')].map((el) => {
    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('.header-anchor, .ignore-header').forEach((node) => node.remove())
    return { id: el.id, segments: trimSegments(segmentsOf(clone)), level: el.tagName === 'H2' ? 2 : 3 }
  })
  update()
}

function update() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 88
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    let current = ''
    for (const heading of headings.value) {
      const el = document.getElementById(heading.id)
      if (el && el.getBoundingClientRect().top <= offset + 8) current = heading.id
    }
    if (atBottom && headings.value.length) current = headings.value[headings.value.length - 1].id
    activeId.value = current
  })
}

onContentUpdated(collect)
onMounted(() => {
  collect()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update, { passive: true })
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
})
</script>

<template>
  <nav v-if="headings.some((h) => h.level === 2)" class="doc-outline" aria-labelledby="doc-outline-title">
    <p id="doc-outline-title" class="doc-outline__title">On this page</p>
    <ul class="doc-outline__list">
      <li v-for="heading in headings" :key="heading.id" :class="`doc-outline__item--h${heading.level}`">
        <a :href="`#${heading.id}`" class="doc-outline__link" :class="{ 'is-active': heading.id === activeId }"
          :aria-current="heading.id === activeId ? 'location' : undefined"><template
            v-for="(segment, i) in heading.segments" :key="i"><code v-if="segment.code"
              class="doc-outline__code">{{ segment.text }}</code><template v-else>{{ segment.text }}</template></template></a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.doc-outline {
  font-size: 0.8125rem;
}

.doc-outline__title {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sp-text-strong);
}

.doc-outline__list {
  --rail-gap: 1.25rem;
  position: relative;
  padding-left: var(--rail-gap);
}

.doc-outline__list::before {
  content: '';
  position: absolute;
  top: 0.375rem;
  bottom: 0.375rem;
  left: 0.1875rem;
  width: 1px;
  background: var(--sp-border);
}

.doc-outline__item--h3 {
  padding-left: 0.75rem;
}

.doc-outline__link {
  position: relative;
  display: block;
  padding: 0.25rem 0;
  line-height: 1.45;
  color: var(--sp-text-2);
  border-radius: 4px;
  transition: color 0.2s;
}

.doc-outline__link:hover {
  color: var(--sp-text-strong);
}

.doc-outline__link.is-active {
  color: var(--sp-accent);
}

.doc-outline__code {
  padding: 0.0625rem 0.3125rem;
  border-radius: 4px;
  font-family: var(--sp-font-mono);
  font-size: 0.9em;
  color: inherit;
  background: var(--sp-code-inline-bg);
  overflow-wrap: anywhere;
}

.doc-outline__link::before {
  content: '';
  position: absolute;
  top: calc(0.25rem + 0.725em - 3.5px);
  left: calc(-1 * var(--rail-gap) + 0.1875rem - 3px);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sp-accent);
  box-shadow: 0 0 0 3px var(--sp-bg);
  opacity: 0;
  transform: scale(0.4);
  transition: opacity 0.25s var(--sp-ease-out), transform 0.35s var(--sp-ease-out);
}

.doc-outline__item--h3 .doc-outline__link::before {
  left: calc(-1 * var(--rail-gap) - 0.75rem + 0.1875rem - 3px);
}

.doc-outline__link.is-active::before {
  opacity: 1;
  transform: none;
}
</style>
