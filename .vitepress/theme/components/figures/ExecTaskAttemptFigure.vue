<script setup>
import DocFigure from './DocFigure.vue'
</script>

<template>
  <DocFigure
    caption="Inputs and private declarations are evaluated once; everything inside the dashed box
             is repeated for each attempt. Outputs are evaluated after a successful run or a
             cache hit."
  >
    <svg class="sp-fig--wide" viewBox="0 0 720 630" role="img"
      aria-labelledby="exec-attempt-w-title exec-attempt-w-desc">
      <title id="exec-attempt-w-title">The life of a task attempt</title>
      <desc id="exec-attempt-w-desc">
        Sprocket evaluates a task's inputs and private declarations once. Each attempt then
        evaluates the requirements, hints, runtime and command, localizes inputs, and — on the
        first attempt only — looks up the call cache. A hit reuses the cached execution result; a
        miss executes the command on the backend. Sprocket then checks the exit code. If the task
        succeeded it updates the call cache entry and evaluates the outputs. If it failed and
        retries remain, the next attempt starts again from the requirements; if no retries remain,
        the task fails.
      </desc>
      <defs>
        <marker id="exec-attempt-w-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10"
          markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
          <path class="sp-fig-arrow" d="M0,1 L9,5 L0,9 Z" />
        </marker>
      </defs>

      <rect class="sp-fig-box" x="147" y="8" width="300" height="54" rx="8" />
      <text class="sp-fig-label" x="297" y="31" text-anchor="middle">Evaluate inputs and</text>
      <text class="sp-fig-label" x="297" y="50" text-anchor="middle">private declarations</text>
      <path class="sp-fig-edge" d="M297,62 V104" marker-end="url(#exec-attempt-w-arrow)" />

      <rect class="sp-fig-group" x="6" y="74" width="708" height="374" rx="12" />
      <text class="sp-fig-note sp-fig-note--accent" x="702" y="95" text-anchor="end">one attempt</text>

      <rect class="sp-fig-box" x="147" y="104" width="300" height="54" rx="8" />
      <text class="sp-fig-label" x="297" y="127" text-anchor="middle">
        Evaluate requirements, hints, runtime,
      </text>
      <text class="sp-fig-label" x="297" y="146" text-anchor="middle">and command</text>
      <path class="sp-fig-edge" d="M297,158 V186" marker-end="url(#exec-attempt-w-arrow)" />

      <rect class="sp-fig-box" x="147" y="186" width="300" height="34" rx="8" />
      <text class="sp-fig-label" x="297" y="208" text-anchor="middle">Localize inputs</text>
      <path class="sp-fig-edge" d="M297,220 V248" marker-end="url(#exec-attempt-w-arrow)" />

      <rect class="sp-fig-box--accent" x="147" y="248" width="300" height="52" rx="8" />
      <text class="sp-fig-label" x="297" y="271" text-anchor="middle">Look up the call cache</text>
      <text class="sp-fig-note" x="297" y="289" text-anchor="middle">first attempt only</text>

      <path class="sp-fig-edge" d="M447,274 H536" marker-end="url(#exec-attempt-w-arrow)" />
      <text class="sp-fig-note" x="492" y="262" text-anchor="middle">hit</text>
      <rect class="sp-fig-box" x="536" y="247" width="156" height="54" rx="8" />
      <text class="sp-fig-label" x="614" y="270" text-anchor="middle">Reuse the cached</text>
      <text class="sp-fig-label" x="614" y="289" text-anchor="middle">execution result</text>

      <path class="sp-fig-edge" d="M297,300 V334" marker-end="url(#exec-attempt-w-arrow)" />
      <text class="sp-fig-note" x="307" y="320">miss</text>

      <rect class="sp-fig-box" x="147" y="334" width="300" height="34" rx="8" />
      <text class="sp-fig-label" x="297" y="356" text-anchor="middle">
        Execute the command on the backend
      </text>
      <path class="sp-fig-edge" d="M297,368 V396" marker-end="url(#exec-attempt-w-arrow)" />

      <rect class="sp-fig-box" x="147" y="396" width="300" height="34" rx="8" />
      <text class="sp-fig-label" x="297" y="418" text-anchor="middle">Check the exit code</text>

      <path class="sp-fig-edge" d="M147,413 H100 V131 H147"
        marker-end="url(#exec-attempt-w-arrow)" />
      <text class="sp-fig-note" x="92" y="265" text-anchor="end">failed,</text>
      <text class="sp-fig-note" x="92" y="283" text-anchor="end">retries left</text>

      <path class="sp-fig-edge" d="M297,430 V476 M217,476 H377" />
      <path class="sp-fig-edge" d="M217,476 V506" marker-end="url(#exec-attempt-w-arrow)" />
      <path class="sp-fig-edge" d="M377,476 V506" marker-end="url(#exec-attempt-w-arrow)" />
      <text class="sp-fig-note" x="203" y="496" text-anchor="end">failed, no retries left</text>
      <text class="sp-fig-note" x="389" y="496">succeeded</text>

      <rect class="sp-fig-box" x="147" y="506" width="140" height="54" rx="8" />
      <text class="sp-fig-label" x="217" y="538" text-anchor="middle">Task fails</text>

      <rect class="sp-fig-box" x="307" y="506" width="140" height="54" rx="8" />
      <text class="sp-fig-label" x="377" y="529" text-anchor="middle">Update the call</text>
      <text class="sp-fig-label" x="377" y="548" text-anchor="middle">cache entry</text>
      <path class="sp-fig-edge" d="M377,560 V588" marker-end="url(#exec-attempt-w-arrow)" />

      <rect class="sp-fig-box" x="307" y="588" width="140" height="34" rx="8" />
      <text class="sp-fig-label" x="377" y="610" text-anchor="middle">Evaluate outputs</text>

      <path class="sp-fig-edge" d="M614,301 V605 H447" marker-end="url(#exec-attempt-w-arrow)" />
    </svg>

    <svg class="sp-fig--narrow" viewBox="0 0 320 568" role="img"
      aria-labelledby="exec-attempt-n-title exec-attempt-n-desc">
      <title id="exec-attempt-n-title">The life of a task attempt</title>
      <desc id="exec-attempt-n-desc">
        Sprocket evaluates a task's inputs and private declarations once. Each attempt then
        evaluates the requirements, hints, runtime and command, localizes inputs, and — on the
        first attempt only — looks up the call cache. A hit reuses the cached execution result; a
        miss executes the command on the backend. Sprocket then checks the exit code. If the task
        succeeded it updates the call cache entry and evaluates the outputs. If it failed and
        retries remain, the next attempt starts again from the requirements; if no retries remain,
        the task fails.
      </desc>
      <defs>
        <marker id="exec-attempt-n-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10"
          markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
          <path class="sp-fig-arrow" d="M0,1 L9,5 L0,9 Z" />
        </marker>
      </defs>

      <rect class="sp-fig-box" x="50" y="8" width="226" height="50" rx="8" />
      <text class="sp-fig-label" x="163" y="29" text-anchor="middle">Evaluate inputs and</text>
      <text class="sp-fig-label" x="163" y="46" text-anchor="middle">private declarations</text>
      <path class="sp-fig-edge" d="M163,58 V106" marker-end="url(#exec-attempt-n-arrow)" />

      <rect class="sp-fig-group" x="4" y="74" width="312" height="338" rx="12" />
      <text class="sp-fig-note sp-fig-note--accent" x="308" y="95" text-anchor="end">one attempt</text>

      <rect class="sp-fig-box" x="50" y="106" width="226" height="50" rx="8" />
      <text class="sp-fig-label" x="163" y="127" text-anchor="middle">
        Evaluate requirements, hints,
      </text>
      <text class="sp-fig-label" x="163" y="144" text-anchor="middle">runtime, and command</text>
      <path class="sp-fig-edge" d="M163,156 V180" marker-end="url(#exec-attempt-n-arrow)" />

      <rect class="sp-fig-box" x="50" y="180" width="226" height="32" rx="8" />
      <text class="sp-fig-label" x="163" y="201" text-anchor="middle">Localize inputs</text>
      <path class="sp-fig-edge" d="M163,212 V236" marker-end="url(#exec-attempt-n-arrow)" />

      <rect class="sp-fig-box--accent" x="50" y="236" width="226" height="48" rx="8" />
      <text class="sp-fig-label" x="163" y="257" text-anchor="middle">Look up the call cache</text>
      <text class="sp-fig-note" x="163" y="273" text-anchor="middle">first attempt only</text>

      <text class="sp-fig-note" x="294" y="250">hit</text>
      <path class="sp-fig-edge" d="M276,260 H290 V544 H276"
        marker-end="url(#exec-attempt-n-arrow)" />

      <path class="sp-fig-edge" d="M163,284 V314" marker-end="url(#exec-attempt-n-arrow)" />
      <text class="sp-fig-note" x="173" y="302">miss</text>

      <rect class="sp-fig-box" x="50" y="314" width="226" height="32" rx="8" />
      <text class="sp-fig-label" x="163" y="335" text-anchor="middle">Execute on the backend</text>
      <path class="sp-fig-edge" d="M163,346 V370" marker-end="url(#exec-attempt-n-arrow)" />

      <rect class="sp-fig-box" x="50" y="370" width="226" height="32" rx="8" />
      <text class="sp-fig-label" x="163" y="391" text-anchor="middle">Check the exit code</text>

      <path class="sp-fig-edge" d="M50,386 H34 V131 H50" marker-end="url(#exec-attempt-n-arrow)" />
      <text class="sp-fig-note" x="22" y="258" text-anchor="middle"
        transform="rotate(-90 22 258)">failed, retries left</text>

      <path class="sp-fig-edge" d="M163,402 V426 M104,426 H222" />
      <path class="sp-fig-edge" d="M104,426 V454" marker-end="url(#exec-attempt-n-arrow)" />
      <path class="sp-fig-edge" d="M222,426 V454" marker-end="url(#exec-attempt-n-arrow)" />
      <text class="sp-fig-note" x="94" y="444" text-anchor="end">failed</text>
      <text class="sp-fig-note" x="212" y="444" text-anchor="end">succeeded</text>

      <rect class="sp-fig-box" x="50" y="454" width="108" height="50" rx="8" />
      <text class="sp-fig-label" x="104" y="475" text-anchor="middle">Task fails</text>
      <text class="sp-fig-note" x="104" y="492" text-anchor="middle">no retries left</text>

      <rect class="sp-fig-box" x="168" y="454" width="108" height="50" rx="8" />
      <text class="sp-fig-label" x="222" y="475" text-anchor="middle">Update the</text>
      <text class="sp-fig-label" x="222" y="492" text-anchor="middle">cache entry</text>
      <path class="sp-fig-edge" d="M222,504 V528" marker-end="url(#exec-attempt-n-arrow)" />

      <rect class="sp-fig-box" x="50" y="528" width="226" height="32" rx="8" />
      <text class="sp-fig-label" x="163" y="549" text-anchor="middle">Evaluate outputs</text>
    </svg>
  </DocFigure>
</template>
