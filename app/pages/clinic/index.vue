<template>
  <div style="padding: 24px;">
    <h1>Painel da Clínica</h1>
    <p>Bem vindo à tela inicial do usuário de clínica.</p>
    <n-button @click="handleLogout">Sair</n-button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const handleLogout = () => {
    authStore.logout();
};
</script>
