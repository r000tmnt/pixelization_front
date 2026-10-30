<template>
  <main class="content-page">
    <a class="back-link" href="/">← {{ t('help-page-back') }}</a>
    <h1>{{ t('privacy-title') }}</h1>
    <PrivacyPolicyContent />
    <nav class="page-nav" :aria-label="t('footer-navigation')">
      <a href="/help.html">{{ t('footer-help') }}</a>
      <a href="/">{{ t('help-page-back') }}</a>
    </nav>
    <footer>©2026 ParkCorner All Rights Reserved.</footer>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSeoMeta } from '@unhead/vue'
import PrivacyPolicyContent from '@/components/PrivacyPolicyContent.vue'

const { t } = useI18n()
useSeoMeta({
  title: computed(() => t('privacy-title')),
  description: computed(() => t('privacy-meta-description')),
})
</script>

<style scoped>
.content-page { min-height: 100vh; width: min(100%, 860px); margin: 0 auto; padding: clamp(24px, 6vw, 64px) 20px 28px; color: var(--px-text); }
.back-link { display: inline-block; margin-bottom: 24px; color: var(--px-azure-bright); }
h1 { margin: 0 0 18px; font-size: clamp(1.8rem, 5vw, 2.6rem); }
.page-nav { display: flex; flex-wrap: wrap; gap: 20px; margin: 24px 0 42px; }
.page-nav a { color: var(--px-azure-bright); }
footer { border-top: 1px solid var(--px-grid); padding-top: 18px; color: var(--px-text-muted); font-size: .85rem; text-align: center; }
</style>
