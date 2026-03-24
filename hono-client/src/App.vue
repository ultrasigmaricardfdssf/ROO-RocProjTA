<script setup>
  import { RouterLink, RouterView } from 'vue-router'
  import Header from './components/Header.vue'
  import { ref } from 'vue'
</script>

<style scoped>

</style>

<template>
  <header>
    <Header/>
  </header>

  <RouterView />
</template>
