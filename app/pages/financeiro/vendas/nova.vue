<template>
  <SaleEditorPage v-if="canCreateSale" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import SaleEditorPage from '~/components/sales/SaleEditorPage.vue';
import { PERMISSIONS } from '~/constants/permissions';

const api = useApi();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const canCreateSale = ref(false);

onMounted(async () => {
  if (!authStore.hasPermission(PERMISSIONS.cashRegistersCurrent)) {
    canCreateSale.value = true;
    return;
  }

  try {
    const sessions = await api<any[]>('/api/v1/cash-registers/sessions/current');
    if (!Array.isArray(sessions) || sessions.length === 0) {
      message.warning('Abra um caixa antes de iniciar uma venda.');
      router.replace('/financeiro/caixa');
      return;
    }
    canCreateSale.value = true;
  } catch (_error) {
    message.error('Erro ao verificar caixa aberto');
    router.replace('/financeiro/caixa');
  }
});
</script>
