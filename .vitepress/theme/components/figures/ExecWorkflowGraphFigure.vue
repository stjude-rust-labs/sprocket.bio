<script setup>
import DocFigure from './DocFigure.vue'
</script>

<template>
  <DocFigure
    caption="Every node runs as soon as the calls it depends on have finished: describe and the
             scatter start together, and combine waits for the whole scatter and receives the
             gathered array."
  >
    <svg class="sp-fig--wide" viewBox="0 0 720 244" role="img"
      aria-labelledby="exec-graph-w-title exec-graph-w-desc">
      <title id="exec-graph-w-title">A workflow as a dependency graph</title>
      <desc id="exec-graph-w-desc">
        The workflow inputs feed two independent branches that run concurrently: a call to
        describe, and a scatter over items that runs one call to process per element. The scatter
        gathers its results into arrays and feeds the call to combine. The outputs depend on both
        describe and combine.
      </desc>
      <defs>
        <marker id="exec-graph-w-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10"
          markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
          <path class="sp-fig-arrow" d="M0,1 L9,5 L0,9 Z" />
        </marker>
      </defs>

      <rect class="sp-fig-box" x="8" y="71" width="88" height="34" rx="8" />
      <text class="sp-fig-label" x="52" y="93" text-anchor="middle">inputs</text>

      <path class="sp-fig-edge" d="M96,88 H128 V25 H158" marker-end="url(#exec-graph-w-arrow)" />
      <path class="sp-fig-edge" d="M96,88 H128 V151 H152" marker-end="url(#exec-graph-w-arrow)" />

      <rect class="sp-fig-box" x="158" y="8" width="132" height="34" rx="8" />
      <text class="sp-fig-label" x="224" y="30" text-anchor="middle">call describe</text>

      <rect class="sp-fig-group" x="152" y="66" width="210" height="170" rx="12" />
      <text class="sp-fig-note sp-fig-note--accent" x="166" y="90">scatter (item in items)</text>
      <g v-for="i in 3" :key="i">
        <rect class="sp-fig-box" x="166" :y="58 + i * 44" width="180" height="34" rx="8" />
        <text class="sp-fig-label" x="256" :y="80 + i * 44" text-anchor="middle">call process</text>
      </g>

      <path class="sp-fig-edge" d="M362,151 H432" marker-end="url(#exec-graph-w-arrow)" />
      <text class="sp-fig-note" x="397" y="139" text-anchor="middle">gather</text>

      <rect class="sp-fig-box" x="432" y="134" width="124" height="34" rx="8" />
      <text class="sp-fig-label" x="494" y="156" text-anchor="middle">call combine</text>

      <path class="sp-fig-edge" d="M290,25 H584 V80 H616" marker-end="url(#exec-graph-w-arrow)" />
      <path class="sp-fig-edge" d="M556,151 H584 V96 H616" marker-end="url(#exec-graph-w-arrow)" />

      <rect class="sp-fig-box" x="616" y="71" width="96" height="34" rx="8" />
      <text class="sp-fig-label" x="664" y="93" text-anchor="middle">outputs</text>
    </svg>

    <svg class="sp-fig--narrow" viewBox="0 0 320 366" role="img"
      aria-labelledby="exec-graph-n-title exec-graph-n-desc">
      <title id="exec-graph-n-title">A workflow as a dependency graph</title>
      <desc id="exec-graph-n-desc">
        The workflow inputs feed two independent branches that run concurrently: a call to
        describe, and a scatter over items that runs one call to process per element. The scatter
        gathers its results into arrays and feeds the call to combine. The outputs depend on both
        describe and combine.
      </desc>
      <defs>
        <marker id="exec-graph-n-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10"
          markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
          <path class="sp-fig-arrow" d="M0,1 L9,5 L0,9 Z" />
        </marker>
      </defs>

      <rect class="sp-fig-box" x="8" y="8" width="304" height="32" rx="8" />
      <text class="sp-fig-label" x="160" y="29" text-anchor="middle">inputs</text>

      <path class="sp-fig-edge" d="M160,40 V56 M78,56 H240" />
      <path class="sp-fig-edge" d="M78,56 V76" marker-end="url(#exec-graph-n-arrow)" />
      <path class="sp-fig-edge" d="M240,56 V76" marker-end="url(#exec-graph-n-arrow)" />

      <rect class="sp-fig-box" x="10" y="76" width="136" height="32" rx="8" />
      <text class="sp-fig-label" x="78" y="97" text-anchor="middle">call describe</text>

      <rect class="sp-fig-group" x="166" y="76" width="146" height="150" rx="12" />
      <text class="sp-fig-note sp-fig-note--accent" x="176" y="95">scatter</text>
      <g v-for="i in 3" :key="i">
        <rect class="sp-fig-box" x="176" :y="64 + i * 40" width="126" height="32" rx="8" />
        <text class="sp-fig-label" x="239" :y="85 + i * 40" text-anchor="middle">call process</text>
      </g>

      <path class="sp-fig-edge" d="M239,226 V258" marker-end="url(#exec-graph-n-arrow)" />
      <text class="sp-fig-note" x="247" y="245">gather</text>

      <rect class="sp-fig-box" x="166" y="258" width="146" height="32" rx="8" />
      <text class="sp-fig-label" x="239" y="279" text-anchor="middle">call combine</text>

      <path class="sp-fig-edge" d="M78,108 V326" marker-end="url(#exec-graph-n-arrow)" />
      <path class="sp-fig-edge" d="M239,290 V326" marker-end="url(#exec-graph-n-arrow)" />

      <rect class="sp-fig-box" x="8" y="326" width="304" height="32" rx="8" />
      <text class="sp-fig-label" x="160" y="347" text-anchor="middle">outputs</text>
    </svg>
  </DocFigure>
</template>
