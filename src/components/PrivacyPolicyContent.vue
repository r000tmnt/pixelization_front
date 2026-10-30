<template>
  <article class="policy-content">
    <p class="effective-date">{{ t('privacy-effective-date') }}</p>
    <p>{{ t('privacy-intro') }}</p>

    <section>
      <h3>{{ t('privacy-images-title') }}</h3>
      <p>{{ t('privacy-images-body') }}</p>
    </section>

    <section>
      <h3>{{ t('privacy-local-title') }}</h3>
      <p>{{ t('privacy-local-body') }}</p>
    </section>

    <section>
      <h3>{{ t('privacy-logs-title') }}</h3>
      <p>{{ t('privacy-logs-body') }}</p>
    </section>

    <section>
      <h3>{{ t('privacy-cookie-title') }}</h3>
      <p>{{ t('privacy-cookie-body') }}</p>
      <p>
        {{ t('privacy-ads-settings-copy') }}
        <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">{{ t('privacy-google-settings-link') }}</a>
        {{ t('privacy-aboutads-copy') }}
        <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">{{ t('privacy-aboutads-link') }}</a>
        {{ t('privacy-after-aboutads-copy') }}
      </p>
      <p>
        {{ t('privacy-google-data-copy') }}
        <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">{{ t('privacy-google-data-link') }}</a>.
      </p>
    </section>

    <section>
      <h3>{{ t('privacy-third-party-title') }}</h3>
      <p>{{ t('privacy-third-party-body') }}</p>
    </section>

    <section>
      <h3>{{ t('privacy-updates-title') }}</h3>
      <p>
        {{ t('privacy-updates-body') }}
        <a href="mailto:rick.t.ryahoocomtw653@gmail.com">rick.t.ryahoocomtw653@gmail.com</a>.
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.policy-content p { margin: 10px 0 14px; color: var(--px-text-muted); font-size: 0.92rem; line-height: 1.7; }
.policy-content .effective-date { font-size: 0.82rem; }
.policy-content h3 { margin: 24px 0 6px; font-size: 1rem; }
.policy-content a { color: var(--px-azure-bright); }
</style>
