<template>
  <div class="kofi-widget-container">
    <a
      class="kofi-button"
      href="https://ko-fi.com/N7C22AE80X"
      target="_blank"
      rel="noopener noreferrer"
      title="Support me on Ko-fi"
    >
      <span class="kofitext">
        <img
          src="https://storage.ko-fi.com/cdn/cup-border.png"
          alt="Ko-fi donations"
          class="kofiimg"
          loading="lazy"
        />
        <span>{{ $t('support-kofi') }}</span>
      </span>
    </a>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.kofi-widget-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.kofi-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: var(--radius-sm, 6px);
  background-color: #38bdf8;
  color: #0b0a13;
  font-family: var(--font-body, system-ui, sans-serif);
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 8px rgb(56 189 248 / 25%);
  transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.kofi-button:hover {
  opacity: 0.92;
  color: #0b0a13;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgb(56 189 248 / 40%);
}

.kofitext {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  line-height: 1;
}

.kofiimg {
  width: 20px;
  height: 14px;
  object-fit: contain;
  display: inline-block;
  animation: kofi-wiggle 3s infinite;
}

@keyframes kofi-wiggle {
  0% { transform: rotate(0) scale(1); }
  60% { transform: rotate(0) scale(1); }
  75% { transform: rotate(0) scale(1.12); }
  80% { transform: rotate(0) scale(1.1); }
  84% { transform: rotate(-10deg) scale(1.1); }
  88% { transform: rotate(10deg) scale(1.1); }
  92% { transform: rotate(-10deg) scale(1.1); }
  96% { transform: rotate(10deg) scale(1.1); }
  100% { transform: rotate(0) scale(1); }
}
</style>

