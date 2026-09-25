<script setup>
import DocFigure from './DocFigure.vue'

// Rows shared by both layouts.
const engineParts = [
  'Parse and validate',
  'Workflow evaluation',
  'Input localization',
  'Call cache',
  'Provenance and outputs',
]

const backends = ['local', 'docker', 'tes', 'lsf_apptainer', 'slurm_apptainer']

const compute = ['Your machine', 'TES server', 'HPC cluster']
</script>

<template>
  <DocFigure
    caption="Workflow logic never leaves the Sprocket process. It hands each task command to the
             one configured execution backend, which runs it on your machine, a TES server, or a
             cluster."
  >
    <svg class="sp-fig--wide" viewBox="0 0 720 292" role="img"
      aria-labelledby="exec-arch-w-title exec-arch-w-desc">
      <title id="exec-arch-w-title">The Sprocket process, its execution backend, and compute</title>
      <desc id="exec-arch-w-desc">
        Three columns. The Sprocket process parses and validates the document, evaluates the
        workflow, localizes inputs, consults the call cache, and records provenance and outputs.
        It sends task commands and inputs to one configured execution backend — local, docker,
        tes, lsf_apptainer, or slurm_apptainer — and gets back exit codes and files. The backend
        starts and monitors the command on your machine, a TES server, or an HPC cluster.
      </desc>
      <defs>
        <marker id="exec-arch-w-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10"
          markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
          <path class="sp-fig-arrow" d="M0,1 L9,5 L0,9 Z" />
        </marker>
      </defs>

      <text class="sp-fig-title" x="114" y="24" text-anchor="middle">The Sprocket process</text>
      <text class="sp-fig-title" x="398" y="24" text-anchor="middle">Execution backend</text>
      <text class="sp-fig-title" x="644" y="24" text-anchor="middle">Compute</text>

      <rect class="sp-fig-panel" x="5" y="38" width="218" height="246" rx="12" />
      <rect class="sp-fig-panel" x="315" y="38" width="166" height="246" rx="12" />
      <rect class="sp-fig-panel" x="573" y="38" width="142" height="246" rx="12" />

      <g v-for="(part, i) in engineParts" :key="part">
        <rect class="sp-fig-box" x="15" :y="52 + i * 46" width="198" height="34" rx="8" />
        <text class="sp-fig-label" x="114" :y="74 + i * 46" text-anchor="middle">{{ part }}</text>
      </g>

      <g v-for="(backend, i) in backends" :key="backend">
        <rect :class="backend === 'docker' ? 'sp-fig-box--accent' : 'sp-fig-box'" x="325"
          :y="52 + i * 46" width="146" height="34" rx="8" />
        <text class="sp-fig-mono" x="398" :y="74 + i * 46" text-anchor="middle">{{ backend }}</text>
      </g>

      <g v-for="(target, i) in compute" :key="target">
        <rect class="sp-fig-box" x="583" :y="98 + i * 46" width="122" height="34" rx="8" />
        <text class="sp-fig-label" x="644" :y="120 + i * 46" text-anchor="middle">{{ target }}</text>
      </g>

      <path class="sp-fig-edge" d="M223,126 H315" marker-end="url(#exec-arch-w-arrow)" />
      <text class="sp-fig-note" x="269" y="98" text-anchor="middle">command</text>
      <text class="sp-fig-note" x="269" y="116" text-anchor="middle">and inputs</text>
      <path class="sp-fig-edge" d="M315,196 H223" marker-end="url(#exec-arch-w-arrow)" />
      <text class="sp-fig-note" x="269" y="216" text-anchor="middle">exit code</text>
      <text class="sp-fig-note" x="269" y="234" text-anchor="middle">and files</text>

      <path class="sp-fig-edge" d="M481,126 H573" marker-end="url(#exec-arch-w-arrow)" />
      <text class="sp-fig-note" x="527" y="98" text-anchor="middle">start and</text>
      <text class="sp-fig-note" x="527" y="116" text-anchor="middle">monitor</text>
      <path class="sp-fig-edge" d="M573,196 H481" marker-end="url(#exec-arch-w-arrow)" />
      <text class="sp-fig-note" x="527" y="216" text-anchor="middle">status and</text>
      <text class="sp-fig-note" x="527" y="234" text-anchor="middle">output files</text>
    </svg>

    <svg class="sp-fig--narrow" viewBox="0 0 320 656" role="img"
      aria-labelledby="exec-arch-n-title exec-arch-n-desc">
      <title id="exec-arch-n-title">The Sprocket process, its execution backend, and compute</title>
      <desc id="exec-arch-n-desc">
        Three stacked panels. The Sprocket process parses and validates the document, evaluates the
        workflow, localizes inputs, consults the call cache, and records provenance and outputs.
        It sends task commands and inputs to one configured execution backend — local, docker,
        tes, lsf_apptainer, or slurm_apptainer — and gets back exit codes and files. The backend
        starts and monitors the command on your machine, a TES server, or an HPC cluster.
      </desc>
      <defs>
        <marker id="exec-arch-n-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10"
          markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
          <path class="sp-fig-arrow" d="M0,1 L9,5 L0,9 Z" />
        </marker>
      </defs>

      <rect class="sp-fig-panel" x="8" y="8" width="304" height="248" rx="12" />
      <text class="sp-fig-title" x="20" y="32">The Sprocket process</text>
      <g v-for="(part, i) in engineParts" :key="part">
        <rect class="sp-fig-box" x="20" :y="44 + i * 42" width="280" height="32" rx="8" />
        <text class="sp-fig-label" x="160" :y="65 + i * 42" text-anchor="middle">{{ part }}</text>
      </g>

      <path class="sp-fig-edge" d="M96,256 V316" marker-end="url(#exec-arch-n-arrow)" />
      <text class="sp-fig-note" x="106" y="282">task command</text>
      <text class="sp-fig-note" x="106" y="298">and inputs</text>
      <path class="sp-fig-edge" d="M232,316 V256" marker-end="url(#exec-arch-n-arrow)" />
      <text class="sp-fig-note" x="242" y="282">exit code</text>
      <text class="sp-fig-note" x="242" y="298">and files</text>

      <rect class="sp-fig-panel" x="8" y="316" width="304" height="108" rx="12" />
      <text class="sp-fig-title" x="20" y="340">Execution backend</text>
      <text class="sp-fig-note" x="160" y="364" text-anchor="middle">
        exactly one is configured per run
      </text>
      <text class="sp-fig-mono" x="160" y="388" text-anchor="middle">local · docker · tes</text>
      <text class="sp-fig-mono" x="160" y="410" text-anchor="middle">
        lsf_apptainer · slurm_apptainer
      </text>

      <path class="sp-fig-edge" d="M96,424 V484" marker-end="url(#exec-arch-n-arrow)" />
      <text class="sp-fig-note" x="106" y="450">start and</text>
      <text class="sp-fig-note" x="106" y="466">monitor</text>
      <path class="sp-fig-edge" d="M232,484 V424" marker-end="url(#exec-arch-n-arrow)" />
      <text class="sp-fig-note" x="242" y="450">status and</text>
      <text class="sp-fig-note" x="242" y="466">output files</text>

      <rect class="sp-fig-panel" x="8" y="484" width="304" height="164" rx="12" />
      <text class="sp-fig-title" x="20" y="508">Compute</text>
      <g v-for="(target, i) in compute" :key="target">
        <rect class="sp-fig-box" x="20" :y="520 + i * 42" width="280" height="32" rx="8" />
        <text class="sp-fig-label" x="160" :y="541 + i * 42" text-anchor="middle">{{ target }}</text>
      </g>
    </svg>
  </DocFigure>
</template>
