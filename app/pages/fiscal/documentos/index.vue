<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">FISCAL</p>
        <h1>Documentos fiscais</h1>
        <p class="subhead">Acompanhe NFC-e, status, numeração e origem da venda.</p>
      </div>
      <n-button secondary :loading="loading" @click="loadDocuments">Atualizar</n-button>
    </div>

    <n-card :bordered="false" class="filters-card">
      <div class="filters-grid">
        <n-select v-model:value="filters.status" :options="statusOptions" placeholder="Status" clearable />
        <n-select v-model:value="filters.environment" :options="environmentOptions" placeholder="Ambiente" clearable />
        <n-input v-model:value="filters.saleId" placeholder="Venda" clearable />
        <n-button type="primary" @click="loadDocuments">Filtrar</n-button>
      </div>
    </n-card>

    <n-card :bordered="false">
      <n-data-table
        :columns="columns"
        :data="documents"
        :loading="loading"
        :pagination="false"
        :row-key="(row: any) => row.id"
      />
      <div class="pagination">
        <n-pagination
          :page="pagination.page"
          :page-size="pagination.limit"
          :item-count="pagination.total"
          @update:page="onPageChange"
        />
      </div>
    </n-card>

    <n-modal
      v-model:show="logModalVisible"
      :mask-closable="false"
      preset="card"
      class="log-modal"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">Log fiscal</h3>
          <p class="modal-subtitle">Veja o motivo da falha, a pendência atual e os eventos recentes do documento.</p>
        </div>
      </template>
      <div v-if="selectedLogDocument" class="log-content">
        <div class="log-summary">
          <div>
            <span>Documento</span>
            <strong>#{{ selectedLogDocument.id }}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{{ selectedLogDocument.status || "-" }}</strong>
          </div>
          <div>
            <span>Venda</span>
            <strong>{{ selectedLogDocument.saleId ? `#${selectedLogDocument.saleId}` : "-" }}</strong>
          </div>
          <div>
            <span>Pendência</span>
            <strong>{{ selectedLogDocument.latestIssueRequest?.status || "-" }}</strong>
          </div>
        </div>

        <div class="log-section">
          <h3>Motivo da falha</h3>
          <p>{{ failureReason(selectedLogDocument) || "Sem falha registrada." }}</p>
        </div>

        <div class="log-section">
          <h3>Última pendência</h3>
          <pre>{{ formatJson(selectedLogDocument.latestIssueRequest || {}) }}</pre>
        </div>

        <div class="log-section">
          <h3>Eventos recentes</h3>
          <n-empty v-if="!selectedLogDocument.recentEvents?.length" description="Nenhum evento registrado." />
          <div v-for="event in selectedLogDocument.recentEvents || []" :key="event.id" class="event-log">
            <div class="event-log-head">
              <strong>{{ event.eventType }}</strong>
              <span>{{ formatDate(event.occurredAt || event.createdAt) }}</span>
            </div>
            <p>Status: {{ event.status || "-" }}</p>
            <p v-if="event.justification">Justificativa: {{ event.justification }}</p>
            <details v-if="event.payloadJson">
              <summary>Payload</summary>
              <pre>{{ formatJson(event.payloadJson) }}</pre>
            </details>
            <details v-if="event.responseJson">
              <summary>Resposta</summary>
              <pre>{{ formatJson(event.responseJson) }}</pre>
            </details>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary @click="logModalVisible = false">Fechar</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from "vue";
import { NButton, NDropdown, NEmpty, NTag, useMessage } from "naive-ui";
import { PERMISSIONS } from "~/constants/permissions";

const loading = ref(false);
const reprocessingIds = ref<Set<number>>(new Set());
const downloadingFileIds = ref<Set<number>>(new Set());
const documents = ref<any[]>([]);
const logModalVisible = ref(false);
const selectedLogDocument = ref<any | null>(null);
const pagination = reactive({ page: 1, limit: 20, total: 0 });
const filters = reactive({ status: null as string | null, environment: null as string | null, saleId: "" });
const message = useMessage();
const authStore = useAuthStore();
const canDownloadFiscalDocument = computed(() => authStore.hasPermission(PERMISSIONS.fiscalDocumentsDownload));
const canResolveFiscalPending = computed(() => authStore.hasPermission(PERMISSIONS.fiscalPendingResolve));

const statusOptions = [
  "PENDING_ISSUE",
  "PROCESSING",
  "AUTHORIZED",
  "REJECTED",
  "CONTINGENCY_ISSUED",
  "CONTINGENCY_PENDING_TRANSMISSION",
  "CONTINGENCY_AUTHORIZED",
  "RETRY_SCHEDULED",
  "CANCELED",
  "INUTILIZED",
].map((value) => ({ label: value, value }));

const environmentOptions = [
  { label: "Homologação", value: "HOMOLOG" },
  { label: "Produção", value: "PROD" },
];

const columns = [
  { title: "Tipo", key: "documentType", width: 90 },
  {
    title: "Status",
    key: "status",
    render(row: any) {
      const type =
        row.status === "AUTHORIZED" || row.status === "CONTINGENCY_AUTHORIZED"
          ? "success"
          : row.status === "REJECTED"
            ? "error"
            : row.status?.includes("CONTINGENCY")
              ? "warning"
              : "info";
      return h(NTag, { bordered: false, type }, { default: () => row.status });
    },
  },
  {
    title: "Número",
    key: "number",
    render(row: any) {
      return `${row.series || "-"} / ${row.number || "-"}`;
    },
  },
  { title: "Ambiente", key: "environment", width: 120 },
  {
    title: "Venda",
    key: "saleId",
    render(row: any) {
      return row.saleId ? `#${row.saleId}` : "-";
    },
  },
  {
    title: "Cliente",
    key: "client",
    render(row: any) {
      return row.client?.name || "Consumidor não identificado";
    },
  },
  {
    title: "Total",
    key: "totalAmount",
    render(row: any) {
      return formatCurrency(row.totalAmount);
    },
  },
  {
    title: "Motivo",
    key: "errorMessage",
    ellipsis: { tooltip: true },
    render(row: any) {
      return failureReason(row) || "-";
    },
  },
  {
    title: "Criado em",
    key: "createdAt",
    render(row: any) {
      return formatDate(row.createdAt);
    },
  },
  {
    title: "Ações",
    key: "actions",
    width: 90,
    render(row: any) {
      return h(
        "div",
        { class: "actions" },
        [
          h(
            NDropdown,
            {
              trigger: "click",
              options: buildActionOptions(row),
              onSelect: (key: string) => handleActionSelect(key, row),
            },
            {
              default: () =>
                h(
                  NButton,
                  {
                    size: "small",
                    quaternary: true,
                    class: "menu-button",
                    onClick: (event: MouseEvent) => event.stopPropagation(),
                  },
                  { default: () => "⋯" },
                ),
            },
          ),
        ],
      );
    },
  },
];

const buildActionOptions = (row: any) => {
  const { xmlFile, danfeFile } = fiscalArtifacts(row);
  const issueRequest = row.latestIssueRequest;
  const issueRequestId = Number(issueRequest?.id || 0);
  const canReprocess =
    issueRequestId > 0 &&
    ["ISSUE_FAILED", "PENDING_ISSUE", "CONTINGENCY"].includes(row.status) &&
    ["FAILED", "PENDING_ISSUE"].includes(issueRequest?.status);

  return [
    canDownloadFiscalDocument.value ? { label: "Baixar XML", key: "download_xml", disabled: !xmlFile } : null,
    canDownloadFiscalDocument.value ? { label: "Baixar DANFE", key: "download_danfe", disabled: !danfeFile } : null,
    canDownloadFiscalDocument.value ? { type: "divider", key: "downloads_divider" } : null,
    { label: "Ver log", key: "log" },
    canResolveFiscalPending.value ? { label: "Reprocessar", key: "reprocess", disabled: !canReprocess } : null,
  ].filter(Boolean);
};

const handleActionSelect = (key: string, row: any) => {
  const { xmlFile, danfeFile } = fiscalArtifacts(row);
  if (key === "download_xml" && xmlFile) {
    if (!canDownloadFiscalDocument.value) return;
    downloadArtifact(xmlFile, row);
    return;
  }
  if (key === "download_danfe" && danfeFile) {
    if (!canDownloadFiscalDocument.value) return;
    downloadArtifact(danfeFile, row);
    return;
  }
  if (key === "log") {
    openLog(row);
    return;
  }
  if (key === "reprocess") {
    if (!canResolveFiscalPending.value) return;
    const issueRequestId = Number(row.latestIssueRequest?.id || 0);
    reprocessIssueRequest(issueRequestId);
  }
};

const fiscalArtifacts = (row: any) => {
  const files = Array.isArray(row.files) ? row.files : [];
  return {
    xmlFile: files.find((file: any) => String(file.fileType || "").includes("XML")),
    danfeFile: files.find((file: any) => String(file.fileType || "").includes("DANFE")),
  };
};

const formatCurrency = (value: unknown) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";

const failureReason = (row: any) =>
  row?.errorMessage ||
  row?.latestIssueRequest?.lastError ||
  row?.recentEvents?.find((event: any) => event?.responseJson?.message)?.responseJson?.message ||
  "";

const formatJson = (value: unknown) => JSON.stringify(value || {}, null, 2);

const openLog = (document: any) => {
  selectedLogDocument.value = document;
  logModalVisible.value = true;
};

const loadDocuments = async () => {
  const api = useApi();
  loading.value = true;
  try {
    const query = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
    });
    if (filters.status) query.set("status", filters.status);
    if (filters.environment) query.set("environment", filters.environment);
    if (filters.saleId) query.set("saleId", filters.saleId);
    const response = await api<any>(`/api/v1/fiscal/documents?${query.toString()}`);
    documents.value = response.data || [];
    pagination.total = Number(response.meta?.total || 0);
  } finally {
    loading.value = false;
  }
};

const onPageChange = (page: number) => {
  pagination.page = page;
  loadDocuments();
};

const reprocessIssueRequest = async (issueRequestId: number) => {
  if (!issueRequestId || reprocessingIds.value.has(issueRequestId)) return;
  const api = useApi();
  reprocessingIds.value = new Set([...reprocessingIds.value, issueRequestId]);
  try {
    const response = await api<any>(`/api/v1/fiscal/issue-requests/${issueRequestId}/process`, {
      method: "POST",
    });
    message.success(`Retentativa fiscal concluída: ${response?.status || "processada"}`);
    await loadDocuments();
  } catch (error: any) {
    message.error(error?.data?.message || error?.message || "Não foi possível reprocessar o documento fiscal.");
  } finally {
    const next = new Set(reprocessingIds.value);
    next.delete(issueRequestId);
    reprocessingIds.value = next;
  }
};

const downloadArtifact = async (file: any, row: any) => {
  const fileId = Number(file?.id || 0);
  if (!fileId || downloadingFileIds.value.has(fileId)) return;
  const api = useApi();
  downloadingFileIds.value = new Set([...downloadingFileIds.value, fileId]);
  try {
    const blob = await api<Blob>(`/api/v1/fiscal/documents/files/${fileId}/download`, {
      responseType: "blob",
    });
    const extension = file.extension || (String(file.fileType || "").includes("XML") ? "xml" : "pdf");
    const label = file.label || (extension === "xml" ? "XML" : "DANFE");
    const fileName = `${row.documentType || "FISCAL"}-${row.series || 0}-${row.number || row.id}-${String(label).toLowerCase()}.${extension}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error: any) {
    message.error(error?.data?.message || error?.message || "Não foi possível baixar o artefato fiscal.");
  } finally {
    const next = new Set(downloadingFileIds.value);
    next.delete(fileId);
    downloadingFileIds.value = next;
  }
};

onMounted(loadDocuments);
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head,
.filters-grid {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.filters-grid {
  align-items: center;
  justify-content: flex-start;
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

.subhead {
  margin: 4px 0 0;
  color: #64748b;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.menu-button {
  min-width: 32px;
  font-size: 18px;
  line-height: 1;
}

.log-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.log-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.log-summary div {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
}

.log-summary span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.log-summary strong {
  display: block;
  margin-top: 4px;
}

.log-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-section h3 {
  margin: 0;
  font-size: 15px;
}

.log-section p {
  margin: 0;
  color: #334155;
}

.event-log {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
}

.event-log + .event-log {
  margin-top: 10px;
}

.event-log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.event-log-head span {
  color: #64748b;
  font-size: 12px;
}

summary {
  cursor: pointer;
  margin-top: 8px;
  color: #0f766e;
  font-weight: 600;
}

pre {
  max-height: 260px;
  overflow: auto;
  margin: 8px 0 0;
  border-radius: 6px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .page-head,
  .filters-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .log-summary {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
:root .n-modal-container:has(.log-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.log-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.log-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.log-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.log-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
  width: 760px !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 48px) !important;
  max-height: calc(100dvh - 48px) !important;
  margin: 0 auto !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.log-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.log-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.log-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.log-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.log-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .log-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .log-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .log-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .log-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .log-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .log-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
