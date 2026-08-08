<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">FISCAL</p>
        <h1>Pendências fiscais</h1>
        <p class="subhead">Fila lógica de emissão, retry e transmissão posterior.</p>
      </div>
      <n-button secondary :loading="loading" @click="loadRequests">Atualizar</n-button>
    </div>

    <div class="summary-grid">
      <n-card v-for="card in summaryCards" :key="card.label" :bordered="false" size="small">
        <p class="summary-label">{{ card.label }}</p>
        <strong class="summary-value">{{ card.value }}</strong>
      </n-card>
    </div>

    <n-card :bordered="false">
      <n-data-table
        :columns="columns"
        :data="requests"
        :loading="loading"
        :pagination="false"
        :row-key="(row: any) => row.id"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from "vue";
import { NTag } from "naive-ui";
import { PERMISSIONS } from "~/constants/permissions";

const authStore = useAuthStore();
const loading = ref(false);
const requests = ref<any[]>([]);
const counters = ref<any>({});
const canViewFiscalSettings = computed(() =>
  authStore.hasPermission(PERMISSIONS.fiscalSettingsView),
);

const summaryCards = computed(() => [
  { label: "Emissão pendente", value: counters.value.documentsPending || 0 },
  { label: "Contingência", value: counters.value.contingencyPending || 0 },
  { label: "Rejeitadas", value: counters.value.rejected || 0 },
]);

const columns = [
  { title: "ID", key: "id", width: 80 },
  { title: "Tipo", key: "documentType", width: 90 },
  { title: "Solicitação", key: "requestType", width: 120 },
  {
    title: "Status",
    key: "status",
    render(row: any) {
      const type =
        row.status === "REJECTED"
          ? "error"
          : row.status?.includes("CONTINGENCY")
            ? "warning"
            : "info";
      return h(NTag, { bordered: false, type }, { default: () => row.status });
    },
  },
  {
    title: "Venda",
    key: "saleId",
    render(row: any) {
      return row.saleId ? `#${row.saleId}` : "-";
    },
  },
  {
    title: "Documento",
    key: "fiscalDocumentId",
    render(row: any) {
      return row.fiscalDocumentId ? `#${row.fiscalDocumentId}` : "-";
    },
  },
  { title: "Tentativas", key: "attemptCount", width: 110 },
  {
    title: "Próximo retry",
    key: "nextRetryAt",
    render(row: any) {
      return row.nextRetryAt ? new Date(row.nextRetryAt).toLocaleString("pt-BR") : "-";
    },
  },
  {
    title: "Criado em",
    key: "createdAt",
    render(row: any) {
      return row.createdAt ? new Date(row.createdAt).toLocaleString("pt-BR") : "-";
    },
  },
];

const loadRequests = async () => {
  const api = useApi();
  loading.value = true;
  try {
    const [settings, response] = await Promise.all([
      canViewFiscalSettings.value
        ? api<any>("/api/v1/fiscal/settings")
        : Promise.resolve({ counters: {} }),
      api<any>("/api/v1/fiscal/issue-requests?limit=50"),
    ]);
    requests.value = response.data || [];
    counters.value = canViewFiscalSettings.value
      ? settings.counters || {}
      : {
          documentsPending: requests.value.filter((item) =>
            String(item.status || "").includes("PENDING"),
          ).length,
          contingencyPending: requests.value.filter((item) =>
            String(item.status || "").includes("CONTINGENCY"),
          ).length,
          rejected: requests.value.filter((item) => item.status === "REJECTED")
            .length,
        };
  } finally {
    loading.value = false;
  }
};

onMounted(loadRequests);
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

h1 {
  margin: 0;
}

.subhead,
.summary-label {
  margin: 4px 0 0;
  color: #64748b;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-value {
  display: block;
  margin-top: 4px;
  font-size: 24px;
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
