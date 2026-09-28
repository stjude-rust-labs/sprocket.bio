<script setup>
defineProps({
  /** Caption shown under the diagram. */
  caption: { type: String, required: true },
})
</script>

<template>
  <figure class="sp-figure">
    <div class="sp-figure__body">
      <slot />
    </div>
    <figcaption>{{ caption }}</figcaption>
  </figure>
</template>
