<template>
  <router-view />
</template>

<script lang="ts">
  import { useDefaultStore } from './stores/default';

  // const defaultStore = useDefaultStore()

  const onScroll = () => {
    console.log('scroll', window.scrollY)

    const { setScrollTop } = useDefaultStore()

    setScrollTop(window.scrollY)
  }

  addEventListener('scroll', onScroll)
</script>
