<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">RELATÓRIOS</p>
        <h1>Relatórios gerenciais</h1>
        <p class="subhead">Gere planilhas em XLSX e acompanhe o histórico de geração por usuário e filtros aplicados.</p>
      </div>
    </div>

    <div :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Relatórios do catálogo</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ cards.length }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Gerados por mim</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ history.length }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Hoje</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{ generatedToday }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Última geração</p>
        <strong :class="isMobile ? 'summary-value-mobile summary-value-wrap' : 'summary-value summary-value-wrap'">{{ lastGeneratedLabel }}</strong>
      </n-card>
    </div>

    <n-tabs v-model:value="activeTab" type="segment" animated class="reports-tabs">
      <n-tab-pane name="catalog" tab="Relatórios">
        <div class="reports-grid">
          <n-card v-for="card in cards" :key="card.type" :bordered="false" size="small" class="report-card">
            <div class="report-card-head">
              <div>
                <p class="report-card-kicker">MVP</p>
                <h3>{{ card.label }}</h3>
              </div>
            </div>
            <p class="report-card-text">{{ card.description }}</p>
            <p class="report-card-meta">Última geração: {{ resolveLastGeneration(card.type) }}</p>
            <div class="report-card-actions">
              <n-button secondary @click="openGenerateModal(card.type)">Configurar</n-button>
              <n-button type="primary" :loading="generatingType === card.type" @click="generate(card.type)">Gerar</n-button>
            </div>
          </n-card>
        </div>
      </n-tab-pane>

      <n-tab-pane name="history" tab="Histórico">
        <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
          <div class="filters-grid filters-grid-reports">
            <n-input v-model:value="historyFilters.search" placeholder="Buscar por nome do arquivo" clearable />
            <n-select v-model:value="historyFilters.reportType" :options="reportTypeOptions" placeholder="Tipo de relatório" clearable />
            <n-date-picker
              v-model:value="historyFilters.period"
              type="daterange"
              format="dd/MM/yyyy"
              clearable
              start-placeholder="Período da geração"
              end-placeholder="Período da geração"
            />
            <div class="filter-actions">
              <n-button text class="btn-clear" @click="clearHistoryFilters">Limpar filtros</n-button>
              <n-button secondary strong class="btn-filter" @click="fetchHistory">Filtrar</n-button>
            </div>
          </div>
        </n-card>

        <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
          <div class="mobile-filter-top">
            <n-input v-model:value="historyFilters.search" placeholder="Buscar histórico" clearable />
            <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">Filtros</n-button>
          </div>
        </n-card>

        <div v-if="isMobile" class="card-list">
          <div v-for="item in history" :key="item.id" class="entity-card">
            <div class="card-top">
              <p class="card-title">{{ typeLabel(item.reportType) }}</p>
              <span class="history-status">{{ item.status }}</span>
            </div>
            <p class="card-subtitle">Arquivo: {{ item.originalName }}</p>
            <p class="card-subtitle">Gerado em: {{ formatDateTime(item.generatedAt) }}</p>
            <p class="card-subtitle">Linhas: {{ item.rowCount || 0 }} · Tamanho: {{ formatFileSize(item.fileSize) }}</p>
            <p class="card-subtitle filters-preview">{{ summarizeFilters(item.filtersJson) }}</p>
            <div class="card-actions">
              <n-button size="small" secondary @click="downloadReport(item)">Baixar</n-button>
            </div>
          </div>
        </div>

        <div v-else class="data-table-card">
          <n-data-table
            :columns="columns"
            :data="history"
            :loading="loadingHistory"
            :bordered="false"
          />
        </div>
      </n-tab-pane>
    </n-tabs>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="42%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="historyFilters.reportType" :options="reportTypeOptions" placeholder="Tipo de relatório" clearable />
          <n-date-picker
            v-model:value="historyFilters.period"
            type="daterange"
            format="dd/MM/yyyy"
            clearable
            start-placeholder="Período da geração"
            end-placeholder="Período da geração"
          />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="clearHistoryFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showGenerateModal"
      :mask-closable="false"
      preset="card"
      class="reports-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ currentCard?.label || 'Gerar relatório' }}</h3>
          <p class="modal-subtitle">{{ currentCard?.description || 'Defina os filtros e gere o arquivo em XLSX.' }}</p>
        </div>
      </template>

      <n-form label-placement="top" :show-require-mark="false">
        <div class="sections">
          <section class="form-section">
            <div class="section-head">
              <h4 class="section-title">Filtros</h4>
            </div>
            <div class="section-grid">
              <n-form-item label="Período">
                <n-date-picker
                  v-model:value="generateForm.period"
                  type="daterange"
                  format="dd/MM/yyyy"
                  clearable
                  style="width: 100%"
                />
              </n-form-item>

              <n-form-item v-if="showField('status')" label="Status">
                <n-select v-model:value="generateForm.status" :options="statusOptionsForCurrent" placeholder="Selecione" clearable />
              </n-form-item>

              <n-form-item v-if="showField('originType')" label="Origem">
                <n-select v-model:value="generateForm.originType" :options="originOptions" placeholder="Selecione" clearable />
              </n-form-item>

              <n-form-item v-if="showField('category')" label="Categoria">
                <n-input v-model:value="generateForm.category" placeholder="Ex: Custos Fixos" clearable />
              </n-form-item>

              <n-form-item v-if="showField('movementType')" label="Tipo de movimentação">
                <n-select v-model:value="generateForm.movementType" :options="movementTypeOptions" placeholder="Selecione" clearable />
              </n-form-item>

              <n-form-item v-if="showField('expirationStatus')" label="Validade">
                <n-select v-model:value="generateForm.expirationStatus" :options="expirationStatusOptions" placeholder="Selecione" clearable />
              </n-form-item>

              <n-form-item v-if="showField('appointmentStatusCode')" label="Status do agendamento">
                <n-input v-model:value="generateForm.appointmentStatusCode" placeholder="Ex: SCHEDULED" clearable />
              </n-form-item>

              <n-form-item v-if="showField('veterinarianId')" label="ID do veterinário">
                <n-input v-model:value="generateForm.veterinarianId" placeholder="Ex: 12" clearable />
              </n-form-item>
            </div>
          </section>
        </div>
      </n-form>

      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="Boolean(generatingType)" @click="showGenerateModal = false">Cancelar</n-button>
          <n-button type="primary" :loading="Boolean(generatingType)" @click="confirmGenerate">Gerar relatório</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, useMessage } from 'naive-ui'

type CatalogItem = {
  type: string
  label: string
  description: string
}

type ReportHistoryItem = {
  id: number
  reportType: string
  originalName: string
  fileUrl: string
  mimeType: string
  fileSize: number | string
  rowCount?: number | null
  status: string
  generatedAt: string
  filtersJson: Record<string, unknown>
}

const message = useMessage()
const loadingCatalog = ref(false)
const loadingHistory = ref(false)
const generatingType = ref<string | null>(null)
const showGenerateModal = ref(false)
const showMobileFilters = ref(false)
const selectedType = ref<string | null>(null)
const activeTab = ref<'catalog' | 'history'>('catalog')
const cards = ref<CatalogItem[]>([])
const history = ref<ReportHistoryItem[]>([])
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const historyFilters = reactive({
  search: '',
  reportType: null as string | null,
  period: null as [number, number] | null,
})

const generateForm = reactive({
  period: null as [number, number] | null,
  status: null as string | null,
  originType: null as string | null,
  category: '',
  movementType: null as string | null,
  expirationStatus: null as string | null,
  appointmentStatusCode: '',
  veterinarianId: '',
})

const reportTypeOptions = computed(() =>
  cards.value.map((item) => ({ label: item.label, value: item.type })),
)

const currentCard = computed(() =>
  cards.value.find((item) => item.type === selectedType.value) || null,
)

const generatedToday = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return history.value.filter((item) => String(item.generatedAt).slice(0, 10) === today).length
})

const lastGeneratedLabel = computed(() => {
  if (!history.value.length) return 'Ainda não gerado'
  return formatDateTime(history.value[0].generatedAt)
})

const statusOptionsForCurrent = computed(() => {
  switch (selectedType.value) {
    case 'REVENUE_BY_PERIOD':
      return [
        { label: 'Aberta', value: 'OPEN' },
        { label: 'Paga', value: 'PAID' },
        { label: 'Cancelada', value: 'CANCELED' },
      ]
    case 'OPEN_ACCOUNTS_RECEIVABLE':
    case 'ACCOUNTS_PAYABLE_BY_DUE_DATE':
      return [
        { label: 'Pendente', value: 'PENDING' },
        { label: 'Pago', value: 'PAID' },
        { label: 'Vencido', value: 'OVERDUE' },
      ]
    default:
      return []
  }
})

const originOptions = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Venda', value: 'SALE' },
  { label: 'Comissão', value: 'COMMISSION_PAYOUT' },
]

const movementTypeOptions = [
  { label: 'Entrada', value: 'IN' },
  { label: 'Saída', value: 'OUT' },
  { label: 'Ajuste positivo', value: 'ADJUSTMENT_IN' },
  { label: 'Ajuste negativo', value: 'ADJUSTMENT_OUT' },
]

const expirationStatusOptions = [
  { label: 'Válido', value: 'VALID' },
  { label: 'Próximo do vencimento', value: 'EXPIRING' },
  { label: 'Vencido', value: 'EXPIRED' },
]

const fieldMap: Record<string, string[]> = {
  REVENUE_BY_PERIOD: ['status'],
  OPEN_ACCOUNTS_RECEIVABLE: ['status', 'originType'],
  ACCOUNTS_PAYABLE_BY_DUE_DATE: ['status', 'category'],
  APPOINTMENTS_AND_CONSULTATIONS_BY_PERIOD: ['appointmentStatusCode', 'veterinarianId'],
  STOCK_MOVEMENT_AND_POSITION: ['movementType', 'expirationStatus'],
}

const columns = [
  {
    title: 'Relatório',
    key: 'reportType',
    render: (row: ReportHistoryItem) => typeLabel(row.reportType),
  },
  {
    title: 'Arquivo',
    key: 'originalName',
  },
  {
    title: 'Filtros',
    key: 'filtersJson',
    render: (row: ReportHistoryItem) => summarizeFilters(row.filtersJson),
  },
  {
    title: 'Gerado em',
    key: 'generatedAt',
    render: (row: ReportHistoryItem) => formatDateTime(row.generatedAt),
  },
  {
    title: 'Linhas',
    key: 'rowCount',
    render: (row: ReportHistoryItem) => row.rowCount || 0,
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 120,
    render: (row: ReportHistoryItem) =>
      h(
        NButton,
        {
          size: 'small',
          secondary: true,
          onClick: () => downloadReport(row),
        },
        { default: () => 'Baixar' },
      ),
  },
]

const showField = (field: string) => {
  if (!selectedType.value) return false
  return (fieldMap[selectedType.value] || []).includes(field)
}

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const openGenerateModal = (type?: string | null) => {
  if (!type) return
  selectedType.value = type
  resetGenerateForm()
  showGenerateModal.value = true
}

const resetGenerateForm = () => {
  generateForm.period = null
  generateForm.status = null
  generateForm.originType = null
  generateForm.category = ''
  generateForm.movementType = null
  generateForm.expirationStatus = null
  generateForm.appointmentStatusCode = ''
  generateForm.veterinarianId = ''
}

const buildGenerateQuery = () => {
  const query: Record<string, string> = {}

  if (generateForm.period?.[0]) {
    query.startDate = toDateOnly(generateForm.period[0])
  }
  if (generateForm.period?.[1]) {
    query.endDate = toDateOnly(generateForm.period[1])
  }
  if (generateForm.status) {
    query.status = generateForm.status
  }
  if (generateForm.originType) {
    query.originType = generateForm.originType
  }
  if (generateForm.category.trim()) {
    query.category = generateForm.category.trim()
  }
  if (generateForm.movementType) {
    query.movementType = generateForm.movementType
  }
  if (generateForm.expirationStatus) {
    query.expirationStatus = generateForm.expirationStatus
  }
  if (generateForm.appointmentStatusCode.trim()) {
    query.appointmentStatusCode = generateForm.appointmentStatusCode.trim()
  }
  if (generateForm.veterinarianId.trim()) {
    query.veterinarianId = generateForm.veterinarianId.trim()
  }

  return query
}

const fetchCatalog = async () => {
  loadingCatalog.value = true
  const api = useApi()

  try {
    const response = await api<{ data: CatalogItem[] }>('/api/v1/reports/catalog')
    cards.value = response.data || []
  } catch (_error) {
    message.error('Erro ao carregar catálogo de relatórios')
  } finally {
    loadingCatalog.value = false
  }
}

const fetchHistory = async () => {
  loadingHistory.value = true
  const api = useApi()

  try {
    const query: Record<string, string> = {}
    if (historyFilters.search.trim()) {
      query.search = historyFilters.search.trim()
    }
    if (historyFilters.reportType) {
      query.reportType = historyFilters.reportType
    }
    if (historyFilters.period?.[0]) {
      query.startDate = new Date(historyFilters.period[0]).toISOString()
    }
    if (historyFilters.period?.[1]) {
      query.endDate = new Date(historyFilters.period[1]).toISOString()
    }

    const response = await api<{ data: ReportHistoryItem[] }>('/api/v1/reports/history', {
      query,
    })

    history.value = response.data || []
  } catch (_error) {
    message.error('Erro ao carregar histórico de relatórios')
  } finally {
    loadingHistory.value = false
  }
}

const generate = async (type: string) => {
  generatingType.value = type
  const api = useApi()

  try {
    const response = await api<ReportHistoryItem>(`/api/v1/reports/${type}/generate`, {
      method: 'POST',
      query: selectedType.value === type ? buildGenerateQuery() : {},
    })

    message.success('Relatório gerado com sucesso')
    showGenerateModal.value = false
    await fetchHistory()
    downloadReport(response)
  } catch (_error) {
    message.error('Erro ao gerar relatório')
  } finally {
    generatingType.value = null
  }
}

const confirmGenerate = async () => {
  if (!selectedType.value) return
  await generate(selectedType.value)
}

const downloadReport = (item: ReportHistoryItem) => {
  if (!item.fileUrl) {
    message.error('Arquivo indisponível para download')
    return
  }

  if (process.client) {
    window.open(item.fileUrl, '_blank', 'noopener')
  }
}

const clearHistoryFilters = () => {
  historyFilters.search = ''
  historyFilters.reportType = null
  historyFilters.period = null
  fetchHistory()
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  fetchHistory()
}

const resolveLastGeneration = (type: string) => {
  const item = history.value.find((entry) => entry.reportType === type)
  return item ? formatDateTime(item.generatedAt) : 'Ainda não gerado'
}

const typeLabel = (type: string) => {
  return cards.value.find((item) => item.type === type)?.label || type
}

const summarizeFilters = (filters: Record<string, unknown>) => {
  const entries = Object.entries(filters || {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)

  return entries.length ? entries.join(' · ') : 'Sem filtros adicionais'
}

const toDateOnly = (value: number) => {
  return new Date(value).toISOString().slice(0, 10)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const formatFileSize = (value?: string | number | null) => {
  const size = Number(value || 0)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 900px)')
    updateIsMobile()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile)
    } else {
      mediaQuery.addListener(updateIsMobile)
    }
  }

  await Promise.all([fetchCatalog(), fetchHistory()])
})

onBeforeUnmount(() => {
  if (!mediaQuery) return
  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener('change', updateIsMobile)
  } else {
    mediaQuery.removeListener(updateIsMobile)
  }
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.head-copy h1 {
  margin: 6px 0 8px;
  font-size: 32px;
  line-height: 1.1;
  color: #142013;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #5d7a61;
}

.subhead {
  margin: 0;
  max-width: 760px;
  color: #5e6d60;
  line-height: 1.5;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-grid-mobile {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-card,
.filters-card,
.data-table-card {
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(31, 45, 33, 0.08);
}

.report-card {
  border-radius: 18px;
  box-shadow: none;
}

.summary-card :deep(.n-card__content),
.report-card :deep(.n-card__content),
.filters-card :deep(.n-card__content) {
  padding: 18px 20px;
}

.summary-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7b8b7f;
}

.summary-value,
.summary-value-mobile {
  color: #18251a;
  font-size: 24px;
  line-height: 1.15;
}

.summary-value-mobile {
  font-size: 20px;
}

.summary-value-wrap {
  display: inline-block;
  font-size: 16px;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 12px 0;
}

.reports-tabs :deep(.n-tabs-nav) {
  margin-bottom: 20px;
}

.report-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.report-card-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #6d846f;
}

.report-card h3 {
  margin: 0;
  font-size: 18px;
  color: #1a261b;
}

.report-card-text,
.report-card-meta {
  color: #5e6d60;
}

.report-card-meta {
  font-size: 13px;
}

.history-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 5px 10px;
  background: #edf5ee;
  color: #2f6840;
  font-size: 12px;
  font-weight: 700;
}

.report-card-actions,
.filter-actions,
.mobile-filter-actions,
.card-actions,
.modal-actions {
  display: flex;
  gap: 10px;
}

.filters-grid {
  display: grid;
  gap: 16px;
}

.filters-grid-reports {
  grid-template-columns: 1.4fr 1fr 1.2fr auto;
}

.mobile-filter-top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.card-list {
  display: grid;
  gap: 12px;
}

.entity-card {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(31, 45, 33, 0.08);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1b281d;
}

.card-subtitle {
  margin: 8px 0 0;
  color: #5e6d60;
}

.filters-preview {
  line-height: 1.45;
}

.modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #334155;
}

.section-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
  }

  .summary-grid,
  .section-grid,
  .filters-grid-reports {
    grid-template-columns: 1fr;
  }

  .report-card-actions,
  .modal-actions {
    flex-direction: column;
  }
}
</style>

<style>
:root .n-modal-container:has(.reports-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.reports-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.reports-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.reports-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.reports-modal.n-card {
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

.reports-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.reports-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.reports-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.reports-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reports-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.reports-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.reports-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .reports-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .reports-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .reports-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .reports-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .reports-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .reports-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
