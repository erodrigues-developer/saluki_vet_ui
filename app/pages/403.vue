<template>
  <div class="page forbidden-page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">ACESSO RESTRITO</p>
        <h1>Sem permissão</h1>
        <p class="subhead">Seu usuário não possui permissão para acessar esta área.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="goHome">Voltar ao dashboard</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
const goHome = () => navigateTo('/')
</script>

<style scoped>
.forbidden-page {
  min-height: calc(100vh - 96px);
}
</style>
