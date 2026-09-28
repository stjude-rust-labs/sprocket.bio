<script setup>
import CodePreview from "./CodePreview.vue";
import { ArrowPathIcon, PauseIcon, PlayIcon } from "@heroicons/vue/20/solid";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData } from "vitepress";

const grammarUrl = "https://raw.githubusercontent.com/stjude-rust-labs/sprocket-vscode/refs/heads/main/syntaxes/wdl.tmGrammar.json";

const { theme } = useData();

// Mirrors the options in installation.md.
const installOptions = ref([
  {
    id: "macos",
    label: "macOS",
    code: "brew install sprocket",
    html: null,
    note: "Installs with Homebrew.",
    link: { text: "Get Homebrew", href: "https://brew.sh" }
  },
  {
    id: "linux",
    label: "Linux",
    code: "brew install sprocket",
    html: null,
    note: "Installs with Homebrew on Linux.",
    link: { text: "Get Homebrew", href: "https://brew.sh" }
  },
  {
    id: "windows",
    label: "Windows",
    code: "cargo install sprocket",
    html: null,
    note: "Builds from source with Rust and cargo, or use a pre-built binary.",
    link: { text: "Latest release", href: "https://github.com/stjude-rust-labs/sprocket/releases" }
  },
  {
    id: "docker",
    label: "Docker",
    code: `docker run ghcr.io/stjude-rust-labs/sprocket:v${theme.value.sprocketVersion} -h`,
    html: null,
    note: "Every release is published to the GitHub Container Registry.",
    link: null
  }
]);

const activeInstall = ref("macos");
const install = computed(
  () => installOptions.value.find((option) => option.id === activeInstall.value) ?? installOptions.value[0]
);

const detectPlatform = () => {
  const platform = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "").toLowerCase();
  if (platform.includes("win")) return "windows";
  if (platform.includes("mac") || /iphone|ipad/.test(platform)) return "macos";
  if (platform.includes("linux") || platform.includes("x11") || platform.includes("cros")) return "linux";
  return null;
};

// Turns each note's `match` into a Shiki decoration so the matching code gets a
// numbered marker.
const noteDecorations = (code, notes = []) => {
  const lines = code.split("\n");
  return notes.flatMap((note, index) => {
    const line = lines.findIndex((text) => text.includes(note.match));
    if (line < 0) return [];
    const character = lines[line].indexOf(note.match);
    return [{
      start: { line, character },
      end: { line, character: character + note.match.length },
      properties: {
        class: "wdl-note",
        "data-note": String(index + 1),
        "aria-describedby": `hero-note-${index + 1}`
      }
    }];
  });
};

// Splits `inline code` out of note text.
const noteParts = (text) => text.split("`").map((value, index) => ({ value, code: index % 2 === 1 }));

const setActiveNote = (card, index) => {
  card?.querySelectorAll(".wdl-note").forEach((el) => {
    el.classList.toggle("is-active", index !== null && el.dataset.note === String(index + 1));
  });
};

const highlightNote = (event, index) => setActiveNote(event.currentTarget.closest(".hero__card"), index);

// On desktop screens too short to fit the notes list, the list is hidden and
// each note shows as a tooltip on its marker instead. The heights are where
// the full hero stops fitting at each column width.
// Evenly spaced arcs in pixels, treating the motion toggle's edge as arc zero
// so every gap, including the first, is the same. 47.5 is the centre of the
// toggle's 1px border (48px box).
const ARC_GAP = 56;
const arcRadii = Array.from({ length: 13 }, (_, k) => 47.5 + (k + 1) * ARC_GAP);

const compactNotesQuery =
  "(min-width: 1175px) and (max-width: 1279px) and (max-height: 1030px), (min-width: 1280px) and (max-width: 1535px) and (max-height: 1011px), (min-width: 1536px) and (max-height: 993px)";
const compactNotes = ref(false);
const tooltip = ref(null);
let hideTimer;

const showTooltip = (event) => {
  if (!compactNotes.value) return;
  const marker = event.target.closest?.(".wdl-note");
  if (!marker) return;
  clearTimeout(hideTimer);
  const card = event.currentTarget;
  const cardBox = card.getBoundingClientRect();
  const markerBox = marker.getBoundingClientRect();
  const index = Number(marker.dataset.note) - 1;
  tooltip.value = {
    index,
    top: markerBox.bottom - cardBox.top + 6,
    left: Math.max(16, Math.min(markerBox.left - cardBox.left - 8, cardBox.width - 304))
  };
  setActiveNote(card, index);
};

const hideTooltip = (card, delay = 0) => {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    tooltip.value = null;
    setActiveNote(card, null);
  }, delay);
};

const keepTooltip = () => clearTimeout(hideTimer);

// Leaving a marker waits briefly so the pointer can move onto the tooltip.
const leaveMarker = (event) => {
  const marker = event.target.closest?.(".wdl-note");
  if (!marker || marker.contains(event.relatedTarget)) return;
  hideTooltip(event.currentTarget, 150);
};

const syncMarkerFocus = (card) => {
  card?.querySelectorAll(".wdl-note").forEach((el) => {
    if (compactNotes.value) el.setAttribute("tabindex", "0");
    else el.removeAttribute("tabindex");
  });
};

let notesCard = null;
const setNotesCard = (el) => { notesCard = el; };
watch(compactNotes, (compact) => {
  if (!compact) hideTooltip(notesCard);
  nextTick(() => syncMarkerFocus(notesCard));
});

let media;
const updateCompactNotes = () => { compactNotes.value = media.matches; };

onMounted(() => {
  media = window.matchMedia(compactNotesQuery);
  updateCompactNotes();
  media.addEventListener("change", updateCompactNotes);
});

onBeforeUnmount(() => {
  media?.removeEventListener("change", updateCompactNotes);
  clearTimeout(hideTimer);
});

const steps = ref([
  {
    label: "Write",
    lang: "wdl",
    code: `version 1.3

task say_hello {
    input {
        String greeting
    }

    command <<<
        echo "~{greeting}, world!"
    >>>

    output {
        String out = read_string(stdout())
    }

    requirements {
        container: "ubuntu:latest"
    }
}`,
    html: null,
    notes: [
      { match: "version 1.3", text: "Declares which version of WDL the document uses." },
      { match: "String greeting", text: "A typed input. The Run step sets it with `greeting=\"Hello\"`." },
      { match: "command <<<", text: "The command is just a Bash script, run inside the task's container." },
      { match: "~{greeting}", text: "`~{…}` places a value into the command." },
      { match: "read_string(stdout())", text: "Captures what the command prints as the task's output." },
      { match: 'container: "ubuntu:latest"', text: "The container image the task runs in. `sprocket lint` suggests pinning it to a SHA256 digest." }
    ]
  },
  {
    label: "Run",
    lang: "bash",
    code: 'sprocket run example.wdl --target say_hello greeting="Hello"',
    html: null,
    animated: true
  }
]);

// ========================================
// Motion: the Run card types its command and prints the output once, and the
// arcs ripple continuously. The toggle pauses both, and reduced motion turns
// both off (CSS shows the finished Run card before this script runs).
// ========================================
const runCode = steps.value[1].code;
const plainTokens = [{ content: runCode, color: null, start: 0 }];
let highlightedTokens = null;
const runTokens = ref(plainTokens);

const runPhase = ref("idle");
const typedChars = ref(0);
const outputLines = ref(0);
const hasPlayed = ref(false);
const tadaKey = ref(0);

const paused = ref(false);
const reducedMotion = ref(false);
const runInView = ref(false);
const pageVisible = ref(true);
const canRun = computed(() => !paused.value && !reducedMotion.value && runInView.value && pageVisible.value);

const visibleText = (token) => token.content.slice(0, Math.max(0, typedChars.value - token.start));

// A pausable timeline: pausing keeps the time left on the current step, and a
// generation number drops callbacks from a run that has since been restarted.
let timer = null;
let deadline = 0;
let remaining = 0;
let pending = null;
let generation = 0;

const suspend = () => {
  if (!timer) return;
  clearTimeout(timer);
  timer = null;
  remaining = Math.max(0, deadline - performance.now());
};

const resume = () => {
  if (!pending || timer || !canRun.value) return;
  const current = generation;
  deadline = performance.now() + remaining;
  timer = setTimeout(() => {
    timer = null;
    if (current !== generation) return;
    const next = pending;
    pending = null;
    next();
  }, remaining);
};

const schedule = (step, delay) => {
  pending = step;
  remaining = delay;
  resume();
};

// Slight, repeatable variation so the typing doesn't feel mechanical.
const typingDelay = (index) => 28 + ((index * 7) % 5) * 6;

const typeNext = () => {
  typedChars.value += 1;
  if (typedChars.value < runCode.length) {
    schedule(typeNext, typingDelay(typedChars.value));
  } else {
    runPhase.value = "running";
    schedule(printNext, 650);
  }
};

const printNext = () => {
  outputLines.value += 1;
  if (outputLines.value < 3) {
    schedule(printNext, 110);
  } else {
    finishRun();
  }
};

const finishRun = () => {
  runPhase.value = "done";
  hasPlayed.value = true;
  tadaKey.value += 1;
};

const startRun = () => {
  generation += 1;
  clearTimeout(timer);
  timer = null;
  pending = null;
  // Tokens are fixed for a run so late highlighting can't restyle it midway.
  runTokens.value = highlightedTokens ?? plainTokens;
  typedChars.value = 0;
  outputLines.value = 0;
  runPhase.value = "typing";
  schedule(typeNext, 400);
};

const showFinalRun = () => {
  generation += 1;
  clearTimeout(timer);
  timer = null;
  pending = null;
  runTokens.value = highlightedTokens ?? plainTokens;
  typedChars.value = runCode.length;
  outputLines.value = 3;
  runPhase.value = "done";
};

watch(canRun, (running) => {
  if (!running) return suspend();
  if (runPhase.value === "idle") startRun();
  else resume();
});

// Confetti thrown from the 🎉, spread up and out. Fixed values keep the SSR
// and client renders identical.
const confettiColors = ["var(--sp-wordmark-start)", "var(--sp-wordmark-middle)", "var(--sp-wordmark-end)", "var(--sp-term-focus)"];
const confetti = Array.from({ length: 18 }, (_, index) => {
  const angle = (-200 + index * (220 / 17)) * (Math.PI / 180);
  const distance = 56 + ((index * 37) % 5) * 11;
  return {
    "--x": `${Math.round(Math.cos(angle) * distance)}px`,
    "--y": `${Math.round(Math.sin(angle) * distance)}px`,
    "--r": `${((index * 83) % 360) - 180}deg`,
    "--delay": `${(index % 4) * 25}ms`,
    "--color": confettiColors[index % confettiColors.length],
    "--w": index % 3 === 0 ? "6px" : "4px",
    "--h": index % 3 === 0 ? "6px" : "9px",
    "--radius": index % 3 === 0 ? "50%" : "1px"
  };
});

const togglePaused = () => { paused.value = !paused.value; };
const replayRun = () => startRun();

let runObserver;
let motionQuery;
const updateReducedMotion = () => {
  reducedMotion.value = motionQuery.matches;
  if (reducedMotion.value) showFinalRun();
};
const updatePageVisible = () => { pageVisible.value = document.visibilityState !== "hidden"; };

const setRunCard = (el) => {
  if (!el || runObserver || typeof IntersectionObserver === "undefined") return;
  runObserver = new IntersectionObserver(([entry]) => { runInView.value = entry.isIntersecting; }, { threshold: 0.15 });
  runObserver.observe(el);
};

onMounted(() => {
  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", updateReducedMotion);
  document.addEventListener("visibilitychange", updatePageVisible);
  updatePageVisible();
  if (typeof IntersectionObserver === "undefined") runInView.value = true;
  updateReducedMotion();
});

onBeforeUnmount(() => {
  generation += 1;
  clearTimeout(timer);
  runObserver?.disconnect();
  motionQuery?.removeEventListener("change", updateReducedMotion);
  document.removeEventListener("visibilitychange", updatePageVisible);
});

// Plain code renders immediately; highlighting upgrades it once Shiki and the
// WDL grammar are available, and silently stays plain if either fails.
onMounted(async () => {
  activeInstall.value = detectPlatform() ?? activeInstall.value;

  try {
    const [{ createHighlighter }, grammar] = await Promise.all([
      import("shiki"),
      fetch(grammarUrl).then((r) => {
        if (!r.ok) throw new Error(`grammar request failed: ${r.status}`);
        return r.json();
      })
    ]);

    const highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: ["bash", grammar]
    });

    for (const option of installOptions.value) {
      option.html = highlighter.codeToHtml(option.code, {
        lang: "bash",
        theme: "github-dark"
      });
    }

    for (const step of steps.value) {
      if (step.animated) continue;
      step.html = highlighter.codeToHtml(step.code, {
        lang: step.lang,
        theme: "github-dark",
        decorations: noteDecorations(step.code, step.notes)
      });
    }

    let start = 0;
    highlightedTokens = highlighter
      .codeToTokens(runCode, { lang: "bash", theme: "github-dark" })
      .tokens.flat()
      .map((token) => {
        const entry = { content: token.content, color: token.color ?? null, start };
        start += token.content.length;
        return entry;
      });
    if (runPhase.value === "idle" || runPhase.value === "done") {
      runTokens.value = highlightedTokens;
    }
    await nextTick();
    syncMarkerFocus(notesCard);
  } catch (error) {
    console.warn("Sprocket hero: code highlighting unavailable", error);
  }
});
</script>

<template>
  <section class="hero" :class="{ 'hero--compact-notes': compactNotes, 'hero--paused': paused }"
    aria-labelledby="hero-title">
    <svg class="hero__arcs" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-arc-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--sp-hero-arc-start)" />
          <stop offset="55%" stop-color="var(--sp-hero-arc-middle)" />
          <stop offset="100%" stop-color="var(--sp-hero-arc-end)" />
        </linearGradient>
      </defs>
      <g class="hero__ripple" fill="none" stroke="url(#hero-arc-stroke)" stroke-width="1">
        <circle v-for="(r, i) in arcRadii" :key="r" cx="100%" cy="0" :r="r" :style="{ '--i': i }" />
      </g>
    </svg>
    <button type="button" class="hero__motion-toggle" :title="`${paused ? 'Play' : 'Pause'} animation`"
      @click="togglePaused">
      <PlayIcon v-if="paused" aria-hidden="true" />
      <PauseIcon v-else aria-hidden="true" />
      <span class="hero__sr-only">{{ paused ? "Play" : "Pause" }} animation</span>
    </button>

    <div class="container hero__content">
      <div class="hero__intro">
        <h1 id="hero-title" class="hero__title">
          <span class="hero__wordmark">Sprocket.</span>
          The Bioinformatics Workflow Engine.
        </h1>
        <p class="typo-body1 hero__subtitle">
          Sprocket is a high-performance, modern, and open-source workflow
          engine for bioinformatics. Create, test, and run your analyses
          locally, then seamlessly move to HPC or the cloud to handle
          thousands of parallel workflows.
        </p>
        <div class="hero__actions">
          <a href="/getting-started/introduction" class="typo-btn hero__btn hero__btn--primary">
            Explore documentation
            <span aria-hidden="true">→</span>
          </a>
          <a href="https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw"
            class="typo-btn hero__btn hero__btn--secondary">
            <span class="hero__slack-icon" aria-hidden="true"></span>
            Join us on Slack
          </a>
        </div>

      </div>

      <ol class="hero__steps" aria-label="Get started in three steps">
        <li class="hero__step">
          <div class="card hero__card">
            <CodePreview label="Install" lang="bash" :code="install.code" :html="install.html">
              <template #controls>
                <div class="hero__platforms" role="group" aria-label="Platform">
                  <button v-for="option in installOptions" :key="option.id" type="button" class="hero__platform"
                    :aria-pressed="activeInstall === option.id" @click="activeInstall = option.id">
                    {{ option.label }}
                  </button>
                </div>
              </template>
              <template #footer>
                <p class="hero__install-note">
                  {{ install.note }}
                  <template v-if="install.link">
                    <a :href="install.link.href">{{ install.link.text }}</a>
                    <span aria-hidden="true"> · </span>
                  </template>
                  <a href="/getting-started/installation">All options</a>
                </p>
              </template>
            </CodePreview>
          </div>
        </li>
        <li v-for="step in steps" :key="step.label" class="hero__step">
          <div v-if="step.notes" :ref="setNotesCard" class="card hero__card" @mouseover="showTooltip"
            @mouseout="leaveMarker" @focusin="showTooltip" @focusout="hideTooltip($event.currentTarget)"
            @keydown.esc="hideTooltip($event.currentTarget)">
            <CodePreview :label="step.label" :lang="step.lang" :code="step.code" :html="step.html">
              <template v-if="step.html" #footer>
                <ol class="hero__notes" aria-label="What this task does">
                  <li v-for="(note, index) in step.notes" :id="`hero-note-${index + 1}`" :key="note.match"
                    class="hero__note" @mouseenter="highlightNote($event, index)"
                    @mouseleave="highlightNote($event, null)">
                    <span class="hero__note-marker" aria-hidden="true">{{ index + 1 }}</span>
                    <span>
                      <template v-for="(part, i) in noteParts(note.text)" :key="i">
                        <code v-if="part.code">{{ part.value }}</code>
                        <template v-else>{{ part.value }}</template>
                      </template>
                    </span>
                  </li>
                </ol>
              </template>
            </CodePreview>
            <div v-if="compactNotes && tooltip" class="hero__tooltip" aria-hidden="true"
              :style="{ top: `${tooltip.top}px`, left: `${tooltip.left}px` }" @mouseenter="keepTooltip"
              @mouseleave="hideTooltip($event.currentTarget.closest('.hero__card'), 150)">
              <span class="hero__note-marker">{{ tooltip.index + 1 }}</span>
              <span>
                <template v-for="(part, i) in noteParts(step.notes[tooltip.index].text)" :key="i">
                  <code v-if="part.code">{{ part.value }}</code>
                  <template v-else>{{ part.value }}</template>
                </template>
              </span>
            </div>
          </div>
          <div v-else-if="step.animated" :ref="setRunCard" class="card hero__card">
            <CodePreview :label="step.label" :lang="step.lang" :code="step.code">
              <template #actions>
                <button v-if="hasPlayed && !paused && !reducedMotion" type="button" class="hero__replay"
                  :aria-disabled="runPhase !== 'done'" @click="runPhase === 'done' && replayRun()">
                  <ArrowPathIcon aria-hidden="true" />
                  <span>Replay</span>
                </button>
              </template>
              <template #body>
                <div class="hero__run" :class="`hero__run--${runPhase}`">
                  <!-- The finished output, invisible, reserves the card's final height. -->
                  <div class="hero__run-screen hero__run-screen--final" aria-hidden="true">
                    <div class="hero__run-line"><span class="hero__run-prompt">$ </span><span
                        v-for="token in runTokens" :key="token.start" :style="{ color: token.color }">{{
                        token.content }}</span></div>
                    <div class="hero__run-line">{</div>
                    <div class="hero__run-line">{{ "  " }}<span class="hero__run-key">"say_hello.out"</span>: <span
                        class="hero__run-string">"Hello, world!"</span></div>
                    <div class="hero__run-line">}</div>
                  </div>
                  <div class="hero__run-screen hero__run-screen--live" aria-hidden="true">
                    <div class="hero__run-line"><span class="hero__run-prompt">$ </span><span
                        v-for="token in runTokens" :key="token.start" :style="{ color: token.color }">{{
                        visibleText(token) }}</span><span v-if="runPhase === 'idle' || runPhase === 'typing'"
                        class="hero__run-caret"></span></div>
                    <div v-if="runPhase === 'running' && outputLines === 0" class="hero__run-line"><span class="hero__run-caret"></span>
                    </div>
                    <div v-if="outputLines >= 1" class="hero__run-line">{</div>
                    <div v-if="outputLines >= 2" class="hero__run-line">{{ "  " }}<span
                        class="hero__run-key">"say_hello.out"</span>: <span
                        class="hero__run-string">"Hello, world!"</span></div>
                    <div v-if="outputLines >= 3" class="hero__run-line">}</div>
                  </div>
                  <pre class="hero__sr-only"><code>$ {{ step.code }}
{
  "say_hello.out": "Hello, world!"
}</code></pre>
                </div>
              </template>
            </CodePreview>
            <div v-if="tadaKey" :key="tadaKey" class="hero__tada" aria-hidden="true">
              <div class="hero__tada-burst">
                <span v-for="(piece, index) in confetti" :key="index" class="hero__confetti" :style="piece"></span>
                <span class="hero__tada-emoji">🎉</span>
              </div>
            </div>
          </div>
          <div v-else class="card hero__card">
            <CodePreview :label="step.label" :lang="step.lang" :code="step.code" :html="step.html" />
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.hero__card :deep(.wdl-note) {
  border-radius: 3px;
  transition: background-color 0.2s;
}

.hero__card :deep(.wdl-note)::after,
.hero__note-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--sp-term-note-marker-bg);
  color: var(--sp-term-note-marker-text);
  font-family: var(--sp-font-body);
  font-size: 0.5625rem;
  font-weight: 700;
  line-height: 1;
  transition: box-shadow 0.2s;
}

.hero__card :deep(.wdl-note)::after {
  content: attr(data-note);
  margin-left: 0.25rem;
  vertical-align: 0.2em;
}

.hero__card :deep(.wdl-note.is-active) {
  background: var(--sp-term-highlight-bg);
}

.hero__card :deep(.wdl-note.is-active)::after,
.hero__note:hover .hero__note-marker {
  box-shadow: 0 0 0 3px var(--sp-term-highlight-ring);
}

.hero__notes {
  list-style: none;
  margin: 0.875rem 0 0;
  padding: 0.75rem 0 0;
  display: grid;
  gap: 0.25rem;
  border-top: 1px solid var(--sp-term-divider);
}

.hero__note {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  gap: 0.5rem;
  align-items: start;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--sp-term-text-3);
}

.hero__note-marker {
  margin-top: 0.125rem;
}

.hero__note code {
  font-family: var(--sp-font-mono);
  font-size: 0.95em;
  color: var(--sp-term-text-2);
}

.hero__platforms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.125rem 1rem;
  margin: -0.125rem 0 0.625rem;
}

.hero__platform {
  position: relative;
  padding: 0.25rem 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--sp-term-text-3);
  cursor: pointer;
  transition: color 0.2s;
}

.hero__platform:hover {
  color: var(--sp-term-text);
}

.hero__platform[aria-pressed="true"] {
  color: var(--sp-term-text);
}

.hero__platform[aria-pressed="true"]::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--sp-term-focus);
}

.hero__platform:focus-visible {
  outline: 2px solid var(--sp-term-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

.hero__install-note {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--sp-term-text-3);
}

.hero__install-note a {
  color: var(--sp-term-text-2);
  text-decoration: underline;
  text-decoration-color: var(--sp-term-link-underline);
  text-underline-offset: 0.2em;
  transition: color 0.2s, text-decoration-color 0.2s;
}

.hero__install-note a:hover {
  color: var(--sp-term-text-strong);
  text-decoration-color: currentColor;
}

.hero__install-note a:focus-visible {
  outline: 2px solid var(--sp-term-focus-strong);
  outline-offset: 2px;
  border-radius: 2px;
}

.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-height: calc(100svh - var(--sp-nav-height));
  padding: 3.5rem 0 4rem;
  color: var(--sp-text-strong);
  background:
    radial-gradient(circle at top right, var(--sp-hero-glow-top) 0%, var(--sp-home-transparent) 55%),
    radial-gradient(circle at bottom right, var(--sp-hero-glow-bottom) 0%, var(--sp-home-transparent) 45%),
    var(--sp-hero-bg);
}

.hero__arcs {
  position: absolute;
  top: 0;
  right: 0;
  width: min(80vw, 760px);
  height: min(80vw, 760px);
  pointer-events: none;
  /* Centred on the corner the arcs radiate from, so each arc fades evenly
     and the outermost reaches zero. */
  -webkit-mask-image: radial-gradient(circle farthest-side at 100% 0, #000 8%, transparent 96%);
  mask-image: radial-gradient(circle farthest-side at 100% 0, #000 8%, transparent 96%);
}

/* A slow wave travels outward across the arcs every few seconds. */
.hero__ripple circle {
  opacity: 0.28;
  animation: hero-ripple 6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.16s);
}

@keyframes hero-ripple {
  0%,
  26%,
  100% {
    opacity: 0.28;
  }

  11% {
    opacity: 0.7;
  }
}

.hero--paused .hero__ripple circle,
.hero--paused .hero__run-caret,
.hero--paused .hero__tada-emoji,
.hero--paused .hero__confetti {
  animation-play-state: paused;
}

.hero__content {
  position: relative;
  display: grid;
  gap: 3.5rem;
}

/* ========================================
  Headline
  ======================================== */
.hero__intro {
  container-type: inline-size;
}

.hero__title {
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: clamp(2.625rem, 1.5rem + 3.2vw, 4.5rem);
  /* Also capped by the column width so "The Bioinformatics" stays on one line. */
  font-size: clamp(2.625rem, min(1.5rem + 3.2vw, 11.5cqi), 4.5rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
  text-wrap: balance;
  max-width: 13ch;
}

.hero__wordmark {
  display: block;
  margin-bottom: 0.08em;
  background: linear-gradient(90deg,
      var(--sp-wordmark-start),
      var(--sp-wordmark-middle),
      var(--sp-wordmark-end));
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--sp-wordmark-fill);
}

.hero__subtitle {
  margin-top: 1.75rem;
  max-width: 36rem;
  color: var(--sp-text-1);
}

/* ========================================
  Actions
  ======================================== */
.hero__actions {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3rem;
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--sp-home-transparent);
  border-radius: 2rem;
  color: var(--sp-on-accent);
  white-space: nowrap;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s;
}

.hero__btn:focus-visible {
  outline: 2px solid var(--sp-focus);
  outline-offset: 3px;
}

.hero__btn--primary {
  background: var(--sp-accent-strong);
}

.hero__btn--primary:hover {
  background: var(--sp-accent-strong-hover);
}

.hero__btn--primary span {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero__btn--primary:hover span {
  transform: translateX(3px);
}

.hero__btn--secondary {
  background: var(--sp-home-button-secondary-bg);
  border-color: var(--sp-home-button-secondary-border);
  color: var(--sp-text-strong);
}

.hero__btn--secondary:hover {
  background: var(--sp-home-button-secondary-hover-bg);
  border-color: var(--sp-home-button-secondary-hover-border);
}

/* A quarter circle in the corner the arcs radiate from, like one more arc
   inside the smallest. */
.hero__motion-toggle {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  display: grid;
  place-items: start end;
  /* Pixels, so its edge stays on the arc grid. */
  width: 48px;
  height: 48px;
  padding: 0.75rem;
  border: 1px solid var(--sp-home-button-secondary-border);
  border-width: 0 0 1px 1px;
  border-bottom-left-radius: 100%;
  background: var(--sp-home-button-secondary-bg);
  color: var(--sp-text-1);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.hero__motion-toggle svg {
  width: 0.875rem;
  height: 0.875rem;
}

.hero__motion-toggle:hover {
  background: var(--sp-home-button-secondary-hover-bg);
  border-color: var(--sp-home-button-secondary-hover-border);
}

.hero__motion-toggle:focus-visible {
  outline: 2px solid var(--sp-focus);
  outline-offset: -3px;
}

.hero__slack-icon {
  display: inline-block;
  width: 1.2em;
  height: 1.2em;
  background: url("https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png") no-repeat center/contain;
}

/* ========================================
  Steps: install → write → run, joined by a
  single drive line like the engine's timing chain
  ======================================== */
.hero__steps {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0 0 0 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.hero__step {
  position: relative;
  min-width: 0;
}

.hero__step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 1.9375rem;
  left: -1.4375rem;
  width: 1px;
  height: calc(100% + 1rem);
  background: linear-gradient(to bottom, var(--sp-wordmark-start), var(--sp-wordmark-end));
}

.hero__step::before {
  content: '';
  position: absolute;
  top: 1.59375rem;
  left: -1.75rem;
  width: 0.6875rem;
  height: 0.6875rem;
  border-radius: 50%;
  background: var(--sp-hero-step-node-bg);
  border: 1px solid var(--sp-hero-step-node-border);
  box-shadow: 0 0 0 3px var(--sp-hero-step-node-ring);
  z-index: 1;
}

.hero__card {
  position: relative;
  padding: 0.875rem 1rem 1rem;
  background: var(--sp-term-card-bg-strong);
}

/* ========================================
  Run card: types the command, then prints the output
  ======================================== */
.hero__replay {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  color: var(--sp-term-text-2);
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
}

.hero__replay svg {
  width: 1rem;
  height: 1rem;
}

.hero__replay:hover {
  background-color: var(--sp-term-hover);
}

.hero__replay:focus-visible {
  outline: 2px solid var(--sp-term-focus);
  outline-offset: 2px;
}

.hero__replay[aria-disabled="true"] {
  opacity: 0.55;
  cursor: default;
}

.hero__replay[aria-disabled="true"]:hover {
  background-color: transparent;
}

.hero__run {
  display: grid;
  color: var(--sp-term-text);
  font-family: var(--sp-font-mono);
  font-size: 0.8125rem;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.hero__run-screen {
  grid-area: 1 / 1;
  min-width: 0;
}

.hero__run-screen--final {
  visibility: hidden;
}

.hero__run-prompt {
  color: var(--sp-term-token-prompt);
  user-select: none;
}

.hero__run-key {
  color: var(--sp-term-token-key);
}

.hero__run-string {
  color: var(--sp-term-token-string);
}

.hero__run-caret {
  display: inline-block;
  width: 0.55em;
  height: 1.15em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: var(--sp-term-text-2);
  animation: hero-caret 1.1s steps(1) infinite;
}

.hero__run--typing .hero__run-caret {
  animation: none;
}

@keyframes hero-caret {
  50% {
    opacity: 0;
  }
}

/* When the run finishes, a 🎉 pops up beside the output and throws confetti,
   kept within the card. */
.hero__tada {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.hero__tada-burst {
  position: absolute;
  right: 1.25rem;
  bottom: 0.75rem;
  width: 2.5rem;
  height: 2.5rem;
}

.hero__tada-emoji {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 1.875rem;
  line-height: 1;
  animation: hero-tada 2.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes hero-tada {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-30deg);
  }

  18% {
    opacity: 1;
    transform: scale(1.25) rotate(8deg);
  }

  30%,
  75% {
    opacity: 1;
    transform: scale(1) rotate(0);
  }

  100% {
    opacity: 0;
    transform: scale(0.9) rotate(0);
  }
}

.hero__confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--w);
  height: var(--h);
  margin: calc(var(--h) / -2) 0 0 calc(var(--w) / -2);
  border-radius: var(--radius);
  background: var(--color);
  opacity: 0;
  animation: hero-confetti 1.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(120ms + var(--delay));
}

@keyframes hero-confetti {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0) scale(0.4);
  }

  60% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(var(--x), calc(var(--y) + 28px)) rotate(var(--r)) scale(1);
  }
}

.hero__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.hero__tooltip {
  position: absolute;
  z-index: 2;
  width: 18rem;
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  gap: 0.5rem;
  align-items: start;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--sp-term-card-border);
  border-radius: 6px;
  background: var(--sp-term-bg);
  box-shadow: var(--sp-shadow-window);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--sp-term-text-2);
}

.hero__tooltip .hero__note-marker {
  margin-top: 0.125rem;
}

.hero__tooltip code {
  font-family: var(--sp-font-mono);
  font-size: 0.95em;
  color: var(--sp-term-text);
}

@media (min-width: 640px) {
  .hero__actions {
    flex-direction: row;
  }
}

/* On desktop the hero should fit in one screen (e.g. a 15" MacBook Air), so
   the vertical rhythm is tightened; min-height still centers it on taller
   screens. */
@media (min-width: 1175px) {
  .hero {
    padding: 1.5rem 0;
  }

  .hero__card {
    padding: 0.75rem 1rem 0.875rem;
  }

  .hero__card :deep(.code-preview__header) {
    margin-bottom: 0.5rem;
  }

  .hero__steps {
    gap: 0.75rem;
  }

  .hero__step::before {
    top: 1.46875rem;
  }

  .hero__step:not(:last-child)::after {
    top: 1.8125rem;
    height: calc(100% + 0.75rem);
  }

  .hero__card :deep(.code-preview__block),
  .hero__card :deep(.code-preview__block pre),
  .hero__run {
    line-height: 1.45;
  }

  .hero__notes {
    margin-top: 0.625rem;
    padding-top: 0.625rem;
    gap: 0.125rem;
  }

  .hero--compact-notes {
    padding: 0.75rem 0;
  }

  .hero--compact-notes .hero__card :deep(.code-preview__block),
  .hero--compact-notes .hero__card :deep(.code-preview__block pre),
  .hero--compact-notes .hero__run {
    line-height: 1.4;
  }

  .hero--compact-notes .hero__notes {
    display: none;
  }

  .hero--compact-notes .hero__card :deep(.wdl-note) {
    cursor: help;
  }

  .hero--compact-notes .hero__card :deep(.wdl-note:focus-visible) {
    outline: 2px solid var(--sp-term-focus);
    outline-offset: 2px;
  }

  /* Leaves room for the motion toggle in the corner. */
  .hero__content {
    grid-template-columns: minmax(0, 1fr) minmax(0, 30rem);
    align-items: center;
    gap: 3.5rem;
    padding-right: 3rem;
  }
}

@media (min-width: 1280px) {
  .hero__content {
    grid-template-columns: minmax(0, 1fr) minmax(0, 36rem);
    gap: 4.5rem;
    padding-right: 3.5rem;
  }
}

@media (min-width: 1536px) {
  .hero__content {
    grid-template-columns: minmax(0, 1fr) minmax(0, 42rem);
    gap: 6rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__card :deep(.wdl-note) {
    transition: none;
  }

  .hero__btn--primary span {
    transition: none;
  }

  .hero__ripple circle,
  .hero__run-caret {
    animation: none;
  }

  /* Show the finished Run card, even before the script has run. */
  .hero__run-screen--final {
    visibility: visible;
  }

  .hero__run-screen--live,
  .hero__motion-toggle,
  .hero__replay,
  .hero__tada {
    display: none;
  }
}
</style>
