<template>
  <div class="blank-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Blank layout simply renders the page without sidebars or headers
</script>

<style scoped>
.blank-layout {
  min-height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;
}
</style>
