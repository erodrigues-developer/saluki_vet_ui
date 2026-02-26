<template>
  <div style="padding: 24px;">
    <h1>Painel do Administrador</h1>
    <p>Área restrita à administração.</p>
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
