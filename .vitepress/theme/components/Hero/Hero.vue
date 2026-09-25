<script setup>
import CodePreview from "./CodePreview.vue";
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
const compactNotesQuery =
  "(min-width: 1175px) and (max-width: 1535px) and (max-height: 975px), (min-width: 1536px) and (max-height: 940px)";
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
    html: null
  }
]);

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
      step.html = highlighter.codeToHtml(step.code, {
        lang: step.lang,
        theme: "github-dark",
        decorations: noteDecorations(step.code, step.notes)
      });
    }
    await nextTick();
    syncMarkerFocus(notesCard);
  } catch (error) {
    console.warn("Sprocket hero: code highlighting unavailable", error);
  }
});
</script>

<template>
  <section class="hero" :class="{ 'hero--compact-notes': compactNotes }" aria-labelledby="hero-title">
    <svg class="hero__arcs" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-arc-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--sp-hero-arc-start)" />
          <stop offset="55%" stop-color="var(--sp-hero-arc-middle)" />
          <stop offset="100%" stop-color="var(--sp-hero-arc-end)" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#hero-arc-stroke)" stroke-width="1">
        <circle v-for="i in 9" :key="i" cx="600" cy="0" :r="180 + i * 44" />
      </g>
    </svg>

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
  height: auto;
  opacity: 0.28;
  pointer-events: none;
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
  .hero__card :deep(.code-preview__block pre) {
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
  .hero--compact-notes .hero__card :deep(.code-preview__block pre) {
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

  .hero__content {
    grid-template-columns: minmax(0, 1fr) minmax(0, 30rem);
    align-items: center;
    gap: 3.5rem;
  }
}

@media (min-width: 1280px) {
  .hero__content {
    grid-template-columns: minmax(0, 1fr) minmax(0, 36rem);
    gap: 4.5rem;
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
}
</style>
