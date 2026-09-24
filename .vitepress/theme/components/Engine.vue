<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const videoRef = ref(null)
const playing = ref(false)
let observer = null
let userPaused = false
let reducedMotion = false

const syncPlaying = () => {
  playing.value = !!videoRef.value && !videoRef.value.paused
}

const play = () => {
  videoRef.value?.play().catch(() => syncPlaying())
}

const togglePlayback = () => {
  const video = videoRef.value
  if (!video) return
  if (video.paused) {
    userPaused = false
    play()
  } else {
    userPaused = true
    video.pause()
  }
}

onMounted(() => {
  const video = videoRef.value
  if (!video) return

  video.addEventListener('play', syncPlaying)
  video.addEventListener('pause', syncPlaying)
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!('IntersectionObserver' in window)) return

  // Play only while on screen, and never override an explicit pause or a
  // reduced-motion preference.
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (!userPaused && !reducedMotion) play()
      } else if (!video.paused) {
        video.pause()
      }
    },
    { threshold: 0.35 }
  )
  observer.observe(video)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  videoRef.value?.removeEventListener('play', syncPlaying)
  videoRef.value?.removeEventListener('pause', syncPlaying)
})
</script>

<template>
  <section class="engine" aria-labelledby="engine-title">
    <div class="container">
      <div class="engine__header">
        <h2 id="engine-title" class="engine__title">How Sprocket Powers Your Workflows</h2>
        <div class="engine__intro">
          <p class="typo-body1 engine__subtitle">Sprocket is built for speed and efficiency, orchestrating complex
            WDL-based workflows with the power of high-performance computing.</p>
          <a href="/overview" class="typo-btn engine__link">
            Explore documentation <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <figure class="engine__figure">
        <div class="engine__frame">
          <video ref="videoRef" src="/Sprocket_Video.mp4" poster="/sprocket-video-poster.webp" width="1920"
            height="1080" loop muted playsinline preload="metadata" aria-describedby="engine-caption"></video>
          <span class="engine__mark engine__mark--tl" aria-hidden="true"></span>
          <span class="engine__mark engine__mark--tr" aria-hidden="true"></span>
          <span class="engine__mark engine__mark--bl" aria-hidden="true"></span>
          <span class="engine__mark engine__mark--br" aria-hidden="true"></span>
          <button type="button" class="engine__toggle" @click="togglePlayback">
            <svg v-if="playing" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
              <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
            </svg>
            <svg v-else viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M4.5 2.9v10.2a.6.6 0 0 0 .9.5l8.1-5.1a.6.6 0 0 0 0-1L5.4 2.4a.6.6 0 0 0-.9.5Z" />
            </svg>
            <span>{{ playing ? 'Pause' : 'Play' }} animation</span>
          </button>
        </div>
        <figcaption id="engine-caption" class="typo-caption1 engine__caption">
          In the animation, Sprocket, a workflow engine built on WDL, is the head unit. Below it sits Crankshaft, a
          language-agnostic execution engine that handles the submission, execution, and reporting of tasks. Head
          units for other languages, such as CWL, Nextflow, and Snakemake, can drive it too.
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
/* ========================================
  Engine: the page's centerpiece
  ======================================== */
.engine {
  padding: 5rem 0 4rem;
  color: var(--sp-text-1);
  border-top: 1px solid var(--sp-home-section-border);
}

.engine__header {
  display: grid;
  gap: 1.5rem;
}

.engine__title {
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: clamp(2.25rem, 1.25rem + 3.2vw, 4.25rem);
  line-height: 1;
  letter-spacing: -0.03em;
  text-wrap: balance;
  max-width: 12ch;
}

.engine__subtitle {
  max-width: 34rem;
  color: var(--sp-text-2);
}

.engine__link {
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

.engine__link:hover {
  color: var(--sp-home-link-hover);
  text-decoration-color: currentColor;
}

.engine__link:focus-visible {
  outline: 2px solid var(--sp-focus);
  outline-offset: 4px;
  border-radius: 2px;
}

.engine__figure {
  margin: 3rem 0 0;
}

.engine__frame {
  position: relative;
  border: 1px solid var(--sp-engine-frame-border);
  box-shadow: var(--sp-home-window-shadow);
}

.engine__frame video {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  background: var(--sp-engine-video-bg);
}

/* Registration marks, as on an engineering drawing */
.engine__mark {
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  border-color: var(--sp-engine-mark-start);
  border-style: solid;
  border-width: 0;
}

.engine__mark--tl { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; }
.engine__mark--tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; border-color: var(--sp-engine-mark-middle); }
.engine__mark--bl { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; border-color: var(--sp-engine-mark-middle); }
.engine__mark--br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; border-color: var(--sp-engine-mark-end); }

.engine__toggle {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.375rem 0.875rem 0.375rem 0.625rem;
  border: 1px solid var(--sp-engine-toggle-border);
  border-radius: 2rem;
  background: var(--sp-engine-toggle-bg);
  color: var(--sp-engine-toggle-text);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.engine__toggle svg {
  width: 0.875rem;
  height: 0.875rem;
  fill: currentColor;
}

.engine__toggle:hover {
  border-color: var(--sp-engine-toggle-hover-border);
  background: var(--sp-engine-toggle-hover-bg);
}

.engine__toggle:focus-visible {
  outline: 2px solid var(--sp-focus);
  outline-offset: 2px;
}

.engine__caption {
  margin-top: 0.875rem;
  max-width: 60ch;
  color: var(--sp-text-3);
}

@media (max-width: 639px) {
  .engine__toggle {
    right: 0.75rem;
    bottom: 0.75rem;
    padding: 0.375rem;
    min-width: 2.25rem;
    justify-content: center;
  }

  .engine__toggle span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}

@media (min-width: 1024px) {
  .engine {
    padding: 7rem 0 5rem;
  }

  .engine__header {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    align-items: end;
    gap: 4rem;
  }

  .engine__figure {
    margin-top: 4rem;
  }
}
</style>
