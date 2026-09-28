<template>
  <section class="community" aria-labelledby="community-title">
    <div class="container community__content">
      <h2 id="community-title" class="community__title">Join Our Community</h2>
      <p class="typo-body1 community__subtitle">Connect with fellow researchers and developers, stay updated on the
        latest features, and share ideas to push the boundaries of bioinformatics.</p>
      <a href="https://join.slack.com/t/openwdl/shared_invite/zt-ctmj4mhf-cFBNxIiZYs6SY9HgM9UAVw"
        class="typo-btn community__btn">
        <span class="community__slack-icon" aria-hidden="true"></span> Join us on Slack
      </a>
    </div>
  </section>
</template>

<style scoped>
/* ========================================
  Community
  ======================================== */
.community {
  padding: 4rem 0 7rem;
  color: var(--sp-text-1);
  background: radial-gradient(ellipse 50% 60% at 50% 100%, var(--sp-community-glow) 0%, var(--sp-community-glow-end) 100%);
}

.community__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}

.community__title {
  font-family: var(--sp-font-display);
  font-weight: 700;
  font-size: clamp(2rem, 1.25rem + 2.4vw, 3.25rem);
  line-height: 1.04;
  letter-spacing: -0.025em;
}

.community__subtitle {
  max-width: 38rem;
  color: var(--sp-text-2);
}

.community__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3rem;
  margin-top: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: var(--sp-community-button-bg);
  color: var(--sp-text-strong);
  border: 1px solid var(--sp-community-button-border);
  border-radius: 2rem;
  text-decoration: none;
  transition: background-color 0.2s, border-color 0.2s;
}

.community__btn:hover {
  border-color: var(--sp-community-button-hover-border);
  background: var(--sp-community-button-hover-bg);
}

.community__btn:focus-visible {
  outline: 2px solid var(--sp-focus);
  outline-offset: 3px;
}

.community__slack-icon {
  display: inline-block;
  width: 1.2em;
  height: 1.2em;
  background: url("https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png") no-repeat center/contain;
}
</style>
