<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// A tiny highlighter for the short, static TOML snippets on this page.
const highlightToml = (source) =>
  source
    .split('\n')
    .map((line) => {
      if (/^\s*#/.test(line)) return `<span class="tk-comment">${escapeHtml(line)}</span>`
      const section = line.match(/^(\s*)(\[[^\]]+\])\s*$/)
      if (section) return `${section[1]}<span class="tk-section">${escapeHtml(section[2])}</span>`
      const pair = line.match(/^(\s*)([\w.]+)(\s*=\s*)(.*)$/)
      if (pair) {
        const valueClass = pair[4].startsWith('"') ? 'tk-string' : 'tk-number'
        return `${pair[1]}<span class="tk-key">${escapeHtml(pair[2])}</span>${escapeHtml(pair[3])}<span class="${valueClass}">${escapeHtml(pair[4])}</span>`
      }
      return escapeHtml(line)
    })
    .join('\n')

const backends = [
  {
    id: 'docker',
    label: 'Docker',
    icon: '/svg/docker-mark-white.svg',
    code: `# Run every task in a local Docker container.
[run.backends.default]
type = "docker"`
  },
  {
    id: 'slurm',
    label: 'Slurm',
    icon: '/svg/server.svg',
    experimental: true,
    code: `# Set the default backend to Slurm + Apptainer.
[run.backends.default]
type = "slurm_apptainer"

# The Slurm partition used by default for task execution.
default_slurm_partition.name = "gpu"
default_slurm_partition.max_cpu_per_task = 64
default_slurm_partition.max_memory_per_task = "96 GB"`
  },
  {
    id: 'lsf',
    label: 'LSF',
    icon: '/svg/server.svg',
    experimental: true,
    code: `# Set the default backend to LSF + Apptainer.
[run.backends.default]
type = "lsf_apptainer"

# The LSF queue used by default for task execution.
default_lsf_queue.name = "standard"
default_lsf_queue.max_cpu_per_task = 64
default_lsf_queue.max_memory_per_task = "96 GB"`
  },
  {
    id: 'tes',
    label: 'TES',
    icon: '/svg/tfs.svg',
    code: `[run.backends.default]
type = "tes"
# The URL of the TES API server
url = "<tes-server-url>"
# The cloud storage URL where Sprocket will upload inputs
inputs = "<cloud-storage-url>"
# The cloud storage URL where the TES API server will upload outputs
outputs = "<cloud-storage-url>"`
  }
].map((backend) => ({ ...backend, html: highlightToml(backend.code) }))

const cacheHtml = highlightToml(`[run.task]
cache = "on"`)

// Modeled on the Problems panel shown in the guided tour.
const problems = [
  {
    severity: 'warning',
    message: 'unused input `color`',
    rule: 'UnusedInput',
    line: 30,
    column: 16
  },
  {
    severity: 'info',
    message: 'task `say_hello` is missing both `meta` and `parameter_meta` sections',
    rule: 'MetaSections',
    line: 3,
    column: 6,
    fix: 'add both the `meta` and `parameter_meta` sections'
  },
  {
    severity: 'info',
    message: 'container URI uses a mutable tag',
    rule: 'ContainerUri',
    line: 18,
    column: 20,
    fix: 'replace the mutable tag with its SHA256 equivalent (e.g., `ubuntu@sha256:foobar` instead of `ubuntu:latest`)'
  },
  {
    severity: 'info',
    message: 'workflow `main` is missing both `meta` and `parameter_meta` sections',
    rule: 'MetaSections',
    line: 22,
    column: 10,
    fix: 'add both the `meta` and `parameter_meta` sections'
  }
]

const platforms = [
  { icon: '/svg/macos.svg', label: 'macOS' },
  { icon: '/svg/linux.svg', label: 'Linux' },
  { icon: '/svg/windows.svg', label: 'Windows' }
]

const storage = [
  { icon: '/svg/aws.svg', label: 'Amazon S3' },
  { icon: '/svg/azure.svg', label: 'Azure Blob Storage' },
  { icon: '/svg/google-cloud.svg', label: 'Google Cloud Storage' }
]

const highlightShell = (source) =>
  source
    .split('\n')
    .map((line) => {
      if (line.startsWith('#')) return `<span class="tk-comment">${escapeHtml(line)}</span>`
      if (line.startsWith('$ ')) return `<span class="tk-prompt">$</span> <span class="tk-command">${escapeHtml(line.slice(2))}</span>`
      return `<span class="tk-command">${escapeHtml(line)}</span>`
    })
    .join('\n')

const highlightYaml = (source) =>
  source
    .split('\n')
    .map((line) => {
      if (/^\s*#/.test(line)) return `<span class="tk-comment">${escapeHtml(line)}</span>`
      const pair = line.match(/^(\s*-?\s*)([\w-]+)(:)(.*)$/)
      if (pair) {
        const value = pair[4] ? `<span class="tk-string">${escapeHtml(pair[4])}</span>` : ''
        return `${escapeHtml(pair[1])}<span class="tk-key">${escapeHtml(pair[2])}</span>${pair[3]}${value}`
      }
      return escapeHtml(line)
    })
    .join('\n')

const extensions = [
  {
    id: 'ci',
    label: 'CI',
    title: '.github/workflows/wdl.yml',
    html: highlightYaml(`steps:
  # Lint every WDL document in the repository.
  - uses: stjude-rust-labs/sprocket-action@main
    with:
      action: lint
      except: TrailingComma,ContainerUri`)
  },
  {
    id: 'libraries',
    label: 'Libraries',
    title: 'Terminal',
    html: highlightShell(`# Analyze WDL documents from Python 3.10 or later
$ pip install sprocket-bio

# Use Sprocket's WDL crate in your own Rust tools
$ cargo add wdl`)
  },
  {
    id: 'server',
    label: 'Server',
    title: 'Terminal',
    experimental: true,
    html: highlightShell(`# Start a server that accepts workflows from a directory
$ sprocket dev server start \\
    --allowed-file-paths /home/user/workflows \\
    --port 8080

# Submit a run from anything that speaks HTTP
$ curl -X POST http://localhost:8080/api/v1/runs \\
    -H "Content-Type: application/json" \\
    -d '{"source": "/home/user/workflows/hello.wdl", "inputs": {"name": "World"}}'`)
  }
]

// Roving-tabindex tabs: arrow keys, Home, and End move and activate.
const useTabs = (items, initial) => {
  const active = ref(initial)
  const refs = ref([])
  const select = (index, focus = false) => {
    const next = (index + items.length) % items.length
    active.value = items[next].id
    if (focus) refs.value[next]?.focus()
  }
  const onKeydown = (event, index) => {
    const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 }
    if (!(event.key in keys)) return
    event.preventDefault()
    select(keys[event.key], true)
  }
  return { active, refs, select, onKeydown }
}

const backendTabs = useTabs(backends, 'slurm')
const extensionTabs = useTabs(extensions, 'ci')

// The drive line fills between the first and last stage nodes as the
// reader scrolls, and each node lights up once it passes the reading line.
const trackRef = ref(null)
let frame = 0
let resizeObserver = null

const measure = () => {
  frame = 0
  const track = trackRef.value
  if (!track) return
  const nodes = track.querySelectorAll('.stage__node')
  if (!nodes.length) return

  const trackTop = track.getBoundingClientRect().top
  const centers = Array.from(nodes, (node) => {
    const rect = node.getBoundingClientRect()
    return rect.top + rect.height / 2
  })
  const first = centers[0]
  const last = centers[centers.length - 1]
  const readingLine = window.innerHeight * 0.6
  const progress = last > first ? Math.min(1, Math.max(0, (readingLine - first) / (last - first))) : 1

  track.style.setProperty('--rail-start', `${first - trackTop}px`)
  track.style.setProperty('--rail-end', `${last - trackTop}px`)
  track.style.setProperty('--progress', progress.toFixed(4))
  nodes.forEach((node, i) => node.classList.toggle('is-reached', centers[i] <= readingLine))
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(measure)
}

onMounted(() => {
  measure()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  if ('ResizeObserver' in window && trackRef.value) {
    resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(trackRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  resizeObserver?.disconnect()
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <section class="pipeline" aria-labelledby="pipeline-title">
    <div class="container">
      <div class="pipeline__header">
        <h2 id="pipeline-title" class="pipeline__title">One tool from first line to full scale</h2>
        <p class="typo-body1 pipeline__intro">
          Sprocket covers the whole life of a WDL workflow. Follow one through it, from the first check to the cluster.
        </p>
      </div>

      <div ref="trackRef" class="pipeline__track">
        <div class="pipeline__rail" aria-hidden="true">
          <span class="pipeline__rail-fill"></span>
        </div>

        <ol class="pipeline__stages">
          <!-- Check -->
          <li class="stage">
            <div class="stage__text">
              <h3 class="stage__name"><span class="stage__node" aria-hidden="true"></span>Check</h3>
              <p class="stage__lead">Validate every document before it runs.</p>
              <p class="typo-body2 stage__body">
                <code>sprocket lint</code> points to the exact line of each problem and suggests a fix. Invalid WDL
                exits with a non-zero code, so the same check can guard your CI, and <code>sprocket format</code>
                keeps every file in one style.
              </p>
              <a href="/subcommands/check-lint" class="typo-btn stage__link">Read about check and lint <span
                  aria-hidden="true">→</span></a>
            </div>
            <div class="stage__artifact window">
              <div class="window__bar">
                <span class="window__title">Terminal</span>
              </div>
              <pre class="window__code" tabindex="0" role="region" aria-label="Output of sprocket lint"><span class="t-prompt">$</span> <span class="t-cmd">sprocket lint example.wdl</span>
<span class="t-note">note[ContainerUri]</span>: container URI uses a mutable tag
<span class="t-dim">   ┌─ example.wdl:18:20
   │
18 │</span>         container: "ubuntu:latest"
<span class="t-dim">   │</span>                    <span class="t-note">^^^^^^^^^^^^^^^</span>
<span class="t-dim">   │
   =</span> <span class="t-fix">fix: replace the mutable tag with its SHA256 equivalent</span>

<span class="t-warn">warning[UnusedInput]</span>: unused input `color`
<span class="t-dim">   ┌─ example.wdl:30:16
   │
30 │</span>         String color = "green"
<span class="t-dim">   │</span>                <span class="t-warn">^^^^^</span></pre>
            </div>
          </li>

          <!-- Edit -->
          <li class="stage">
            <div class="stage__text">
              <h3 class="stage__name"><span class="stage__node" aria-hidden="true"></span>Edit</h3>
              <p class="stage__lead">See the same checks while you write.</p>
              <p class="typo-body2 stage__body">
                The Visual Studio Code extension runs <code>sprocket analyzer</code>, Sprocket's language server,
                and lists validation and lint problems as you edit. It also adds WDL syntax highlighting and
                snippets. For Neovim, use <code>sprocket.nvim</code>.
              </p>
              <a href="/vscode/getting-started" class="typo-btn stage__link">Set up the editor extension <span
                  aria-hidden="true">→</span></a>
            </div>
            <figure class="stage__artifact window problems"
              aria-label="The Problems panel in Visual Studio Code, showing Sprocket diagnostics for example.wdl">
              <div class="window__bar problems__bar">
                <svg class="problems__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="m4 6 4 4 4-4" />
                </svg>
                <span class="problems__heading">Problems</span>
                <span class="problems__filter" aria-hidden="true">Filter (e.g. text, **/*.ts, !**/node_modules/**)</span>
              </div>
              <div class="problems__body">
                <div class="problems__file">
                  <svg class="problems__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                  <span class="problems__filename">example.wdl</span>
                  <span class="problems__path">~/Desktop</span>
                  <span class="problems__count">{{ problems.length }}<span class="sp-sr-only"> problems</span></span>
                </div>
                <ul class="problems__list">
                  <li v-for="(problem, index) in problems" :key="index" class="problem"
                    :class="{ 'is-selected': index === 0 }">
                    <div class="problem__row">
                      <svg v-if="problem.fix" class="problems__chevron" viewBox="0 0 16 16" aria-hidden="true"
                        focusable="false">
                        <path d="m4 6 4 4 4-4" />
                      </svg>
                      <span v-else class="problems__chevron" aria-hidden="true"></span>
                      <svg v-if="problem.severity === 'warning'" class="problem__icon problem__icon--warning"
                        viewBox="0 0 16 16" role="img" aria-label="Warning" focusable="false">
                        <path d="M8 2.2 14.3 13.3H1.7Z" />
                        <path d="M8 6.4v3.4M8 11.4v.2" />
                      </svg>
                      <svg v-else class="problem__icon problem__icon--info" viewBox="0 0 16 16" role="img"
                        aria-label="Info" focusable="false">
                        <circle cx="8" cy="8" r="6" />
                        <path d="M8 7.2v4M8 4.9v.2" />
                      </svg>
                      <span class="problem__message">{{ problem.message }}</span>
                      <span class="problem__source">Sprocket({{ problem.rule }})</span>
                      <span class="problem__position">[Ln {{ problem.line }}, Col {{ problem.column }}]</span>
                    </div>
                    <p v-if="problem.fix" class="problem__fix">
                      example.wdl[Ln {{ problem.line }}, Col {{ problem.column }}]: fix: {{ problem.fix }}
                    </p>
                  </li>
                </ul>
              </div>
            </figure>
          </li>

          <!-- Run -->
          <li class="stage">
            <div class="stage__text">
              <h3 class="stage__name"><span class="stage__node" aria-hidden="true"></span>Run locally</h3>
              <p class="stage__lead">Develop on your own machine first.</p>
              <p class="typo-body2 stage__body">
                Write, run, and debug a workflow on your laptop before it goes anywhere near a cluster.
                <code>sprocket inputs</code> writes a template of the inputs a workflow expects,
                <code>sprocket validate</code> checks your values, and <code>sprocket run</code> executes it right
                there with the local Docker backend.
              </p>
              <ul class="stage__chips" aria-label="Develop on">
                <li v-for="platform in platforms" :key="platform.label" class="chip">
                  <img :src="platform.icon" alt="" class="chip__icon">{{ platform.label }}
                </li>
              </ul>
              <a href="/guided-tour" class="typo-btn stage__link">Take the guided tour <span
                  aria-hidden="true">→</span></a>
            </div>
            <div class="stage__artifact window">
              <div class="window__bar">
                <span class="window__title">Terminal</span>
                <span class="window__meta">Your machine · Docker</span>
              </div>
              <pre class="window__code" tabindex="0" role="region" aria-label="Output of sprocket run on your machine"><span class="t-prompt">$</span> <span class="t-cmd">sprocket run example.wdl --target main name="World"</span>
{
  <span class="t-key">"main.messages"</span>: [
    <span class="t-str">"Hello, World!"</span>,
    <span class="t-str">"Hallo, World!"</span>,
    <span class="t-str">"Hej, World!"</span>
  ]
}</pre>
            </div>
          </li>

          <!-- Scale -->
          <li class="stage">
            <div class="stage__text">
              <h3 class="stage__name"><span class="stage__node" aria-hidden="true"></span>Scale</h3>
              <p class="stage__lead">Move to a cluster by changing configuration, not code.</p>
              <p class="typo-body2 stage__body">
                Point <code>sprocket.toml</code> at a Slurm or LSF cluster with Apptainer, or at a Task Execution
                Service (TES) server. Sprocket moves inputs and outputs to and from cloud storage as the workflow
                needs them. It is built toward a target of 20,000+ concurrent jobs.
              </p>
              <ul class="stage__chips" aria-label="Cloud storage">
                <li v-for="service in storage" :key="service.label" class="chip">
                  <img :src="service.icon" alt="" class="chip__icon">{{ service.label }}
                </li>
              </ul>
              <a href="/configuration/backends/overview" class="typo-btn stage__link">Configure a backend <span
                  aria-hidden="true">→</span></a>
            </div>
            <div class="stage__artifact window">
              <div class="window__bar window__bar--tabs">
                <span class="window__title">sprocket.toml</span>
                <div class="tabs" role="tablist" aria-label="Execution backend">
                  <button v-for="(backend, index) in backends" :id="`backend-tab-${backend.id}`" :key="backend.id"
                    :ref="(el) => (backendTabs.refs.value[index] = el)" type="button" role="tab" class="tabs__tab"
                    :aria-selected="backendTabs.active.value === backend.id" :aria-controls="`backend-panel-${backend.id}`"
                    :tabindex="backendTabs.active.value === backend.id ? 0 : -1" @click="backendTabs.select(index)"
                    @keydown="backendTabs.onKeydown($event, index)">
                    <img :src="backend.icon" alt="" class="tabs__icon">{{ backend.label }}
                  </button>
                </div>
              </div>
              <div v-for="backend in backends" v-show="backendTabs.active.value === backend.id"
                :id="`backend-panel-${backend.id}`" :key="backend.id" role="tabpanel"
                :aria-labelledby="`backend-tab-${backend.id}`" tabindex="0" class="window__panel">
                <pre class="window__code" v-html="backend.html"></pre>
                <p v-if="backend.experimental" class="window__note">The {{ backend.label }} + Apptainer backend is
                  experimental.</p>
              </div>
            </div>
          </li>

          <!-- Reproduce -->
          <li class="stage">
            <div class="stage__text">
              <h3 class="stage__name"><span class="stage__node" aria-hidden="true"></span>Reproduce</h3>
              <p class="stage__lead">Every run leaves a complete record.</p>
              <p class="typo-body2 stage__body">
                Each run gets its own directory with its inputs, outputs, logs, and every task attempt, and a SQLite
                database keeps the history. Turn on the call cache and a rerun after a failure reuses the tasks that
                already succeeded.
              </p>
              <a href="/concepts/provenance" class="typo-btn stage__link">How provenance tracking works <span
                  aria-hidden="true">→</span></a>
            </div>
            <div class="stage__artifact stage__artifact--stack">
              <div class="window">
                <div class="window__bar">
                  <span class="window__title">./out</span>
                </div>
                <pre class="window__code" tabindex="0" role="region" aria-label="Output directory layout"><span class="t-key">./out/</span>
<span class="t-dim">├──</span> sprocket.db              <span class="t-dim"># SQLite provenance database</span>
<span class="t-dim">├──</span> runs/
<span class="t-dim">│   └──</span> main/
<span class="t-dim">│       ├──</span> &lt;timestamp&gt;/
<span class="t-dim">│       │   ├──</span> inputs.json
<span class="t-dim">│       │   ├──</span> outputs.json
<span class="t-dim">│       │   ├──</span> output.log
<span class="t-dim">│       │   └──</span> calls/        <span class="t-dim"># One directory per task call</span>
<span class="t-dim">│       └──</span> <span class="t-str">_latest</span> -> &lt;timestamp&gt;/
<span class="t-dim">└──</span> index/                   <span class="t-dim"># Optional output indexing</span></pre>
              </div>
              <div class="window window--small">
                <div class="window__bar">
                  <span class="window__title">sprocket.toml</span>
                </div>
                <pre class="window__code" v-html="cacheHtml"></pre>
              </div>
            </div>
          </li>

          <!-- Extend -->
          <li class="stage">
            <div class="stage__text">
              <h3 class="stage__name"><span class="stage__node" aria-hidden="true"></span>Extend</h3>
              <p class="stage__lead">Use our supporting tools, or build your own.</p>
              <p class="typo-body2 stage__body">
                Lint every pull request with the Sprocket GitHub Action. To build your own tooling, analyze WDL
                from Python with <code>sprocket-bio</code>, use the <code>wdl</code> crate in Rust, or submit runs
                to the experimental Sprocket server over its REST API.
              </p>
              <a href="/python-bindings" class="typo-btn stage__link">Start with the Python bindings <span
                  aria-hidden="true">→</span></a>
            </div>
            <div class="stage__artifact window">
              <div class="window__bar window__bar--tabs">
                <span class="window__title">{{ extensions.find((item) => item.id === extensionTabs.active.value).title }}</span>
                <div class="tabs" role="tablist" aria-label="Tools">
                  <button v-for="(item, index) in extensions" :id="`extension-tab-${item.id}`" :key="item.id"
                    :ref="(el) => (extensionTabs.refs.value[index] = el)" type="button" role="tab" class="tabs__tab"
                    :aria-selected="extensionTabs.active.value === item.id" :aria-controls="`extension-panel-${item.id}`"
                    :tabindex="extensionTabs.active.value === item.id ? 0 : -1" @click="extensionTabs.select(index)"
                    @keydown="extensionTabs.onKeydown($event, index)">
                    {{ item.label }}
                  </button>
                </div>
              </div>
              <div v-for="item in extensions" v-show="extensionTabs.active.value === item.id"
                :id="`extension-panel-${item.id}`" :key="item.id" role="tabpanel"
                :aria-labelledby="`extension-tab-${item.id}`" tabindex="0" class="window__panel">
                <pre class="window__code" v-html="item.html"></pre>
                <p v-if="item.experimental" class="window__note">The Sprocket server is experimental and may change.</p>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pipeline {
  --gutter: 2.25rem;
  --node: 0.875rem;

  padding: 5rem 0 3rem;
  color: var(--sp-text-1);
  border-top: 1px solid var(--sp-home-section-border);
}

.pipeline__header {
  display: grid;
  gap: 1.25rem;
}

.pipeline__title {
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: clamp(2.25rem, 1.25rem + 3.2vw, 4.25rem);
  line-height: 1;
  letter-spacing: -0.03em;
  text-wrap: balance;
  max-width: 13ch;
}

.pipeline__intro {
  max-width: 32rem;
  color: var(--sp-text-2);
}

/* ========================================
  The drive line
  ======================================== */
.pipeline__track {
  --rail-start: 0px;
  --rail-end: 100%;
  --progress: 0;

  position: relative;
  margin-top: 3.5rem;
}

.pipeline__rail {
  position: absolute;
  top: 0;
  left: calc(var(--node) / 2 - 1px);
  width: 2px;
  height: var(--rail-end);
  background: linear-gradient(to bottom, var(--sp-home-transparent), var(--sp-rail) 3rem);
}

.pipeline__rail-fill {
  position: absolute;
  top: var(--rail-start);
  left: 0;
  width: 100%;
  height: calc(var(--rail-end) - var(--rail-start));
  background: linear-gradient(to bottom,
      var(--sp-rail-fill-start),
      var(--sp-rail-fill-middle) 50%,
      var(--sp-rail-fill-end));
  transform: scaleY(var(--progress));
  transform-origin: top;
}

.pipeline__stages {
  list-style: none;
  margin: 0;
  padding: 0;
}

.stage {
  position: relative;
  padding: 2.5rem 0 2.5rem var(--gutter);
}

.stage__name {
  position: relative;
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: clamp(1.75rem, 1.25rem + 1.4vw, 2.5rem);
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--sp-text-strong);
}

.stage__node {
  position: absolute;
  top: 50%;
  left: calc(-1 * var(--gutter));
  width: var(--node);
  height: var(--node);
  margin-top: calc(var(--node) / -2);
  border: 2px solid var(--sp-stage-node-border);
  border-radius: 50%;
  background: var(--sp-stage-node-bg);
  transition: border-color 0.3s, background-color 0.3s, box-shadow 0.3s;
}

.stage__node.is-reached {
  border-color: var(--sp-stage-node-reached-border);
  background: var(--sp-stage-node-reached-bg);
  box-shadow: 0 0 0 5px var(--sp-stage-node-reached-shadow);
}

.stage__lead {
  margin-top: 1rem;
  font-family: var(--sp-font-body);
  font-weight: 500;
  font-size: 1.1875rem;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--sp-text-1);
  text-wrap: balance;
}

.stage__body {
  margin-top: 0.75rem;
  max-width: 34rem;
  color: var(--sp-text-2);
  text-wrap: pretty;
}

.stage__body code {
  font-family: var(--sp-font-mono);
  font-size: 0.875em;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  color: var(--sp-home-link);
  background: var(--sp-code-inline-bg);
}

.stage__chips {
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem 0.375rem 0.5rem;
  border: 1px solid var(--sp-chip-border);
  border-radius: 2rem;
  background: var(--sp-chip-bg);
  font-size: 0.8125rem;
  color: var(--sp-text-1);
}

.chip__icon {
  width: 1rem;
  height: 1rem;
  object-fit: contain;
}

.stage__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  color: var(--sp-home-link);
  text-decoration: underline;
  text-decoration-color: var(--sp-home-link-underline);
  text-underline-offset: 0.3em;
  transition: color 0.2s, text-decoration-color 0.2s;
}

.stage__link:hover {
  color: var(--sp-home-link-hover);
  text-decoration-color: currentColor;
}

.stage__link:focus-visible {
  outline: 2px solid var(--sp-focus);
  outline-offset: 4px;
  border-radius: 2px;
}

/* ========================================
  Artifacts: real output, framed like a window
  ======================================== */
.stage__artifact {
  margin: 1.75rem 0 0;
  min-width: 0;
}

.stage__artifact--stack {
  display: grid;
  gap: 1rem;
}

.window {
  overflow: hidden;
  border: 1px solid var(--sp-term-border);
  border-radius: 12px;
  background: var(--sp-term-bg);
  box-shadow: var(--sp-home-window-shadow);
}

.window__bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 2.5rem;
  padding: 0 1rem;
  border-bottom: 1px solid var(--sp-term-border);
  background: var(--sp-term-bar);
}

.window__bar--tabs {
  flex-wrap: wrap;
  row-gap: 0;
  padding-right: 0.375rem;
}

.window__title {
  font-family: var(--sp-font-mono);
  font-size: 0.75rem;
  color: var(--sp-term-text-3);
}

/* A model of the VS Code Problems panel */
.problems {
  --indent: 1.125rem;

  font-size: 0.8125rem;
  line-height: 1.5;
}

.problems__bar {
  gap: 0.375rem;
  padding-left: 0.5rem;
}

.problems__heading {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-term-text);
}

.problems__filter {
  display: none;
  flex: 1 1 auto;
  max-width: 18rem;
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  overflow: hidden;
  border: 1px solid var(--sp-term-border);
  border-radius: 4px;
  background: var(--sp-term-bg);
  font-size: 0.75rem;
  color: var(--sp-term-text-3);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.problems__chevron {
  flex: 0 0 1rem;
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: var(--sp-term-text-3);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.problems__body {
  padding: 0.375rem 0 0.625rem;
}

.problems__file,
.problem__row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
  padding: 0.1875rem 0.75rem 0.1875rem 0.5rem;
  white-space: nowrap;
}

.problems__filename {
  color: var(--sp-term-text);
}

.problems__path {
  color: var(--sp-term-text-3);
}

.problems__count {
  min-width: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 1rem;
  background: var(--sp-term-count-bg);
  font-size: 0.6875rem;
  line-height: 1.25rem;
  text-align: center;
  color: var(--sp-term-text);
}

.problems__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.problem__row {
  padding-left: calc(0.5rem + var(--indent));
}

.problem.is-selected .problem__row {
  background: var(--sp-term-problem-selected-bg);
  box-shadow: inset 0 0 0 1px var(--sp-term-problem-selected-ring);
}

.problem__icon {
  flex: 0 0 1rem;
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.problem__icon--warning {
  stroke: var(--sp-term-token-warn);
}

.problem__icon--info {
  stroke: var(--sp-term-token-note);
}

.problem__message {
  flex: 0 1 auto;
  min-width: 3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--sp-term-text);
}

.problem__source,
.problem__position {
  flex: 0 0 auto;
  color: var(--sp-term-text-3);
}

.problem__source {
  margin-left: 0.25rem;
}

.problem__fix {
  margin: 0;
  padding: 0.1875rem 0.75rem 0.1875rem calc(0.5rem + var(--indent) * 2 + 1.375rem);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--sp-term-text-3);
}

@media (max-width: 639px) {
  .problem__source {
    display: none;
  }
}

@media (min-width: 1280px) {
  .problems__filter {
    display: block;
  }
}

.window__meta {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--sp-term-text-2);
}

.window__meta::before {
  content: '';
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 50%;
  background: var(--sp-term-accent);
  box-shadow: 0 0 0 3px var(--sp-term-accent-ring);
}

.window__code {
  margin: 0;
  padding: 1.25rem;
  overflow-x: auto;
  font-family: var(--sp-font-mono);
  font-size: 0.8125rem;
  line-height: 1.7;
  white-space: pre;
  color: var(--sp-term-text);
  scrollbar-width: thin;
  scrollbar-color: var(--sp-term-count-bg) var(--sp-term-transparent);
}

.window__code:focus-visible,
.window__panel:focus-visible {
  outline: 2px solid var(--sp-term-focus);
  outline-offset: -2px;
}

.window__note {
  margin: 0;
  padding: 0.625rem 1.25rem;
  border-top: 1px solid var(--sp-term-border);
  font-size: 0.8125rem;
  color: var(--sp-term-text-3);
}

.t-prompt { color: var(--sp-term-token-prompt); user-select: none; }
.t-cmd { color: var(--sp-term-token-command); }
.t-dim { color: var(--sp-term-text-3); }
.t-note { color: var(--sp-term-token-note); }
.t-warn { color: var(--sp-term-token-warn); }
.t-fix { color: var(--sp-term-token-fix); }
.t-key { color: var(--sp-term-token-key); }
.t-str { color: var(--sp-term-token-string); }

.window__code :deep(.tk-comment) { color: var(--sp-term-text-3); }
.window__code :deep(.tk-section) { color: var(--sp-term-token-note); }
.window__code :deep(.tk-key) { color: var(--sp-term-token-key); }
.window__code :deep(.tk-string) { color: var(--sp-term-token-string); }
.window__code :deep(.tk-number) { color: var(--sp-term-token-warn); }
.window__code :deep(.tk-prompt) { color: var(--sp-term-token-prompt); user-select: none; }
.window__code :deep(.tk-command) { color: var(--sp-term-token-command); }

.tabs {
  display: flex;
  margin-left: auto;
}

.tabs__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2.5rem;
  padding: 0 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--sp-term-text-3);
  cursor: pointer;
  transition: color 0.2s;
}

.tabs__icon {
  width: 0.875rem;
  height: 0.875rem;
  object-fit: contain;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.tabs__tab:hover,
.tabs__tab[aria-selected='true'] {
  color: var(--sp-term-text-strong);
}

.tabs__tab[aria-selected='true'] .tabs__icon {
  opacity: 1;
}

.tabs__tab[aria-selected='true']::after {
  content: '';
  position: absolute;
  left: 0.625rem;
  right: 0.625rem;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, var(--sp-term-token-warn), var(--sp-term-token-note));
}

.tabs__tab:focus-visible {
  outline: 2px solid var(--sp-term-focus);
  outline-offset: -4px;
  border-radius: 6px;
}

@media (min-width: 1024px) {
  .pipeline {
    --gutter: 4rem;

    padding: 7rem 0 4rem;
  }

  .pipeline__header {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: end;
    gap: 4rem;
  }

  .pipeline__track {
    margin-top: 4.5rem;
  }

  .stage {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: 3.5rem;
    align-items: start;
    padding-top: 4rem;
    padding-bottom: 4rem;
  }

  .stage + .stage::before {
    content: '';
    position: absolute;
    top: 0;
    left: var(--gutter);
    right: 0;
    height: 1px;
    background: var(--sp-home-section-border);
  }

  .stage__artifact {
    margin-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage__node,
  .tabs__tab,
  .tabs__icon {
    transition: none;
  }
}
</style>
