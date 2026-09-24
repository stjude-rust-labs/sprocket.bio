<script setup>
import Hero from './Hero/Hero.vue'
import Pipeline from './Pipeline.vue'
import Engine from './Engine.vue'
import Community from './Community.vue'

const links = [
  { text: 'Documentation', href: '/overview' },
  { text: 'Installation', href: '/installation' },
  { text: 'Changelog', href: 'https://github.com/stjude-rust-labs/sprocket/blob/main/CHANGELOG.md' },
  { text: 'GitHub', href: 'https://github.com/stjude-rust-labs/sprocket' },
  { text: 'Slack', href: 'https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw' }
]
</script>

<template>
  <main id="main" class="homepage">
    <Hero />
    <Pipeline />
    <Engine />
    <Community />
  </main>
  <footer class="homepage-footer">
    <div class="container homepage-footer__inner">
      <a href="/" class="homepage-footer__logo">
        <img src="/sprocket-logo-dark.png" alt="Sprocket home"
          class="homepage-footer__logo-img homepage-footer__logo-img--dark" height="35">
        <img src="/sprocket-logo.png" alt="Sprocket home"
          class="homepage-footer__logo-img homepage-footer__logo-img--light" height="35">
      </a>
      <nav class="homepage-footer__nav" aria-label="Footer">
        <ul class="homepage-footer__links">
          <li v-for="link in links" :key="link.text"><a :href="link.href">{{ link.text }}</a></li>
        </ul>
      </nav>
      <p class="typo-caption1 homepage-footer__credit">
        Built by <a href="https://github.com/stjude-rust-labs">St. Jude Rust Labs</a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.homepage {
  background: var(--sp-bg);
}

.homepage-footer {
  background: var(--sp-bg);
  border-top: 1px solid var(--sp-footer-border);
}

.homepage-footer__inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.homepage-footer__logo-img {
  display: block;
  height: 35px;
  width: auto;
}

.homepage-footer__logo-img--light {
  display: none;
}

:global(html:not(.dark) .homepage-footer__logo-img--dark) {
  display: none;
}

:global(html:not(.dark) .homepage-footer__logo-img--light) {
  display: block;
}

.homepage-footer__links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.homepage-footer__links a,
.homepage-footer__credit a {
  color: var(--sp-text-2);
  text-decoration: none;
  transition: color 0.2s;
}

.homepage-footer__links a {
  display: inline-block;
  padding: 0.25rem 0;
  font-size: 0.9375rem;
}

.homepage-footer__links a:hover,
.homepage-footer__credit a:hover {
  color: var(--sp-text-strong);
}

.homepage-footer a:focus-visible {
  outline: 2px solid var(--sp-focus);
  outline-offset: 3px;
  border-radius: 2px;
}

.homepage-footer__credit {
  color: var(--sp-text-3);
}

.homepage-footer__credit a {
  color: var(--sp-text-1);
}

@media (min-width: 900px) {
  .homepage-footer__inner {
    flex-direction: row;
    align-items: center;
  }

  .homepage-footer__nav {
    margin-left: auto;
  }
}
</style>
