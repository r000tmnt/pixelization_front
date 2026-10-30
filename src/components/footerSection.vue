<template>
  <footer>
    <nav :aria-label="$t('footer-navigation')">
      <a href="/help.html" @click.prevent="emit('show-help')">{{ $t('footer-help') }}</a>
      <span aria-hidden="true"> · </span>
      <a href="/privacy.html" @click.prevent="emit('show-privacy')">{{ $t('footer-privacy') }}</a>
    </nav>
    <div>©2026 ParkCorner All Rights Reserved.</div>
    <a href="mailto:rick.t.ryahoocomtw653@gmail.com"><span>&#9993;</span></a>
  </footer>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'show-help': []
  'show-privacy': []
}>()
</script>

<style scoped>
  footer {
    color: var(--px-text-muted);
    font-size: 12px;
    text-align: center;
    /* padding: 30px 0; */
  }
  nav { margin-bottom: 8px; }
  nav a { color: inherit; }
  nav a:hover { color: var(--px-text); }
</style>
