<script setup>
import { nextTick, ref } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  lang: { type: String, default: '' },
  code: { type: String, required: true },
  html: { type: String, default: null }
});

const status = ref('');
let resetTimer;

const copyToClipboard = async () => {
  clearTimeout(resetTimer);
  let next;
  try {
    await navigator.clipboard.writeText(props.code);
    next = 'Copied';
  } catch {
    next = 'Copy failed';
  }
  // Clear first so repeat copies are announced again.
  status.value = '';
  await nextTick();
  status.value = next;
  resetTimer = setTimeout(() => { status.value = ''; }, 2500);
};
</script>

<template>
  <div class="code-preview">
    <div class="code-preview__header">
      <span class="code-preview__label">{{ label }}</span>
      <span v-if="lang" class="code-preview__lang">{{ lang }}</span>
      <div class="code-preview__actions">
        <slot name="actions" />
      </div>
      <button type="button" class="code-preview__copy" :aria-label="`Copy ${label.toLowerCase()} code`"
        @click="copyToClipboard">
        <img v-if="status === 'Copied'" src="/svg/heroicons-outline-check.svg" alt="" aria-hidden="true">
        <img v-else src="/svg/heroicons-outline-document-duplicate.svg" alt="" aria-hidden="true">
        <span v-if="status" class="code-preview__status" aria-hidden="true">{{ status }}</span>
      </button>
      <span class="code-preview__sr-only" role="status">{{ status }}</span>
    </div>
    <slot name="controls" />
    <slot v-if="$slots.body" name="body" />
    <div v-else-if="html" class="code-preview__block" v-html="html"></div>
    <pre v-else class="code-preview__block"><code>{{ code }}</code></pre>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.code-preview {
  position: relative;
}

.code-preview__header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.625rem;
}

.code-preview__label {
  font-family: var(--sp-font-body);
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--sp-term-text);
}

.code-preview__lang {
  font-family: var(--sp-font-mono);
  font-size: 0.6875rem;
  line-height: 1;
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
  color: var(--sp-term-text-2);
  background: var(--sp-term-chip-bg);
}

.code-preview__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.code-preview__actions:empty {
  display: none;
}

.code-preview__actions:empty + .code-preview__copy {
  margin-left: auto;
}

.code-preview__copy {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 2rem;
  min-height: 2rem;
  padding: 0.375rem;
  border-radius: 6px;
  color: var(--sp-term-text-2);
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.code-preview__copy img {
  width: 1.125rem;
  height: 1.125rem;
}

.code-preview__copy:hover {
  background-color: var(--sp-term-hover);
}

.code-preview__copy:focus-visible {
  outline: 2px solid var(--sp-term-focus);
  outline-offset: 2px;
}

.code-preview__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.code-preview__block,
.code-preview__block :deep(pre) {
  margin: 0;
  background: none !important;
  color: var(--sp-term-text);
  font-family: var(--sp-font-mono);
  font-size: 0.8125rem;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.code-preview__block :deep(pre) {
  overflow: visible;
}

.code-preview__block :deep(code) {
  font-family: inherit;
}
</style>
