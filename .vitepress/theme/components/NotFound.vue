<script setup lang="ts">
import { withBase } from 'vitepress'
import { ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

defineEmits<{ 'open-search': [] }>()
</script>

<template>
  <main id="main" class="not-found">
    <p class="not-found__code" aria-hidden="true">404</p>
    <h1 class="not-found__title">This page isn't here</h1>
    <p class="not-found__text">
      The link may be out of date, or the page may have moved.
    </p>
    <div class="not-found__actions">
      <a class="not-found__action not-found__action--primary" :href="withBase('/overview')">
        Read the docs
        <ArrowRightIcon class="sp-icon-16" />
      </a>
      <button type="button" class="not-found__action" @click="$emit('open-search')">
        <MagnifyingGlassIcon class="sp-icon-16" />
        Search
      </button>
      <a class="not-found__action" :href="withBase('/')">Go home</a>
    </div>
  </main>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 40rem;
  margin: 0 auto;
  padding: clamp(4rem, 12vh, 8rem) 1.5rem 6rem;
}

.not-found__code {
  font-family: var(--sp-font-mono);
  font-size: 0.875rem;
  color: var(--sp-text-2);
}

.not-found__title {
  margin-top: 0.75rem;
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: clamp(2.25rem, 1.5rem + 2.4vw, 3.25rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--sp-text-strong);
  text-wrap: balance;
}

.not-found__text {
  margin-top: 1rem;
  max-width: 34rem;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--sp-text-2);
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.not-found__action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 1.125rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--sp-text-strong);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.not-found__action:hover {
  border-color: var(--sp-accent);
}

.not-found__action--primary {
  border-color: var(--sp-accent-strong);
  color: var(--sp-on-accent);
  background: var(--sp-accent-strong);
}

.not-found__action--primary:hover {
  border-color: var(--sp-accent-strong-hover);
  background: var(--sp-accent-strong-hover);
}
</style>
