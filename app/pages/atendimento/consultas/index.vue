<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">Atendimento</p>
        <h1>Consultório Clínico</h1>
        <p class="subhead">Gerencie consultas, diagnósticos, prescrições e encaminhamentos clínicos.</p>
      </div>
      <n-button v-if="canCreateConsultations" type="primary" size="large" class="head-cta" @click="openCreate">Nova consulta</n-button>
    </div>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Hoje</p>
        <strong class="summary-value">{{ summary.today }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-alert">
        <p class="summary-label">Pendentes</p>
        <strong class="summary-value">{{ summary.pending }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Com prescrição</p>
        <strong class="summary-value">{{ summary.withPrescription }}</strong>
      </n-card>
      <n-card
        size="small"
        :bordered="false"
        :class="['summary-card', summary.inpatient > 0 ? 'summary-card-danger' : 'summary-card-neutral']"
      >
        <p class="summary-label">Internações</p>
        <strong class="summary-value">{{ summary.inpatient }}</strong>
      </n-card>
    </div>

    <div v-if="isMobile" class="summary-grid-mobile">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Hoje</p>
        <strong class="summary-value-mobile">{{ summary.today }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" :class="['summary-card', 'mobile-card', summary.pending > 0 ? 'summary-card-alert' : 'summary-card-neutral']">
        <p class="summary-label">Pendentes</p>
        <strong class="summary-value-mobile">{{ summary.pending }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" :class="['summary-card', 'mobile-card', summary.withPrescription > 0 ? 'summary-card-alert' : 'summary-card-neutral']">
        <p class="summary-label">Com prescrição</p>
        <strong class="summary-value-mobile">{{ summary.withPrescription }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" :class="['summary-card', 'mobile-card', summary.inpatient > 0 ? 'summary-card-danger' : 'summary-card-neutral']">
        <p class="summary-label">Internações</p>
        <strong class="summary-value-mobile">{{ summary.inpatient }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.search" placeholder="Buscar tutor, pet ou diagnóstico" clearable />
        <n-select v-model:value="filters.period" :options="periodOptions" placeholder="Período" clearable />
        <n-date-picker
          v-if="filters.period === 'CUSTOM'"
          v-model:value="filters.date"
          type="date"
          clearable
          placeholder="Data personalizada"
        />
        <n-select
          v-model:value="filters.veterinarianId"
          :options="veterinarianOptions"
          placeholder="Veterinário responsável"
          clearable
        />
        <n-select
          v-model:value="filters.status"
          :options="statusOptions"
          placeholder="Status"
          clearable
        />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar tutor, pet ou diagnóstico" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
      <div v-if="activeFilterChips.length" class="mobile-filter-chips">
        <button v-for="chip in activeFilterChips" :key="chip.key" class="chip-btn" type="button" @click="removeFilterChip(chip.key)">
          {{ chip.label }} ×
        </button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <n-spin v-if="loading" size="small">
        <div class="mobile-state">Carregando consultas...</div>
      </n-spin>
      <div v-else-if="loadError" class="mobile-state mobile-state-error">
        <p>Erro ao carregar consultas.</p>
        <n-button tertiary type="primary" @click="fetchConsultations">Tentar novamente</n-button>
      </div>
      <div v-else-if="consultations.length === 0" class="mobile-state">
        Nenhuma consulta cadastrada.
      </div>
      <div v-else-if="displayConsultations.length === 0" class="mobile-state">
        Nenhum resultado encontrado para os filtros aplicados.
      </div>
      <template v-else>
        <div v-for="row in displayConsultations" :key="row.id" class="entity-card">
          <div class="card-top">
            <p class="card-time">{{ format(new Date(row.visitDate), 'HH:mm') }}</p>
            <span :class="['status-pill', getStatusMeta(row).className]">{{ getStatusMeta(row).label }}</span>
          </div>
          <p class="card-date">{{ format(new Date(row.visitDate), 'dd/MM/yyyy') }}</p>
          <p class="card-title">{{ clientNameMap[row.clientId] || 'Cliente' }}</p>
          <p class="card-subtitle">Pet: {{ petNameMap[row.petId] || 'Pet' }}</p>
          <p class="card-subtitle">Vet: {{ usersMap[row.veterinarianId] || '-' }}</p>
          <p class="card-summary" :title="row.diagnosis || row.clinicalFindings || row.notes || row.mainComplaint || 'Ainda não registrado'">
            {{ row.diagnosis || row.clinicalFindings || row.notes || row.mainComplaint || 'Ainda não registrado' }}
          </p>
          <div class="card-actions">
            <n-button size="small" secondary type="primary" @click.stop="openEdit(row)">Abrir consulta</n-button>
            <n-dropdown v-if="actionOptionsFor(row).length > 1" trigger="click" :options="actionOptionsFor(row)" @select="(key: string) => handleActionSelect(key, row)">
              <n-button size="small" quaternary class="menu-button" @click.stop><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
            </n-dropdown>
          </div>
        </div>
      </template>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="displayConsultations"
      :pagination="pagination"
      :bordered="false"
      :row-props="rowProps"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      remote
    />

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="68%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.period" :options="periodOptions" placeholder="Período" clearable />
          <n-date-picker
            v-if="filters.period === 'CUSTOM'"
            v-model:value="filters.date"
            type="date"
            clearable
            placeholder="Data personalizada"
          />
          <n-select
            v-model:value="filters.veterinarianId"
            :options="veterinarianOptions"
            placeholder="Veterinário responsável"
            clearable
          />
          <n-select
            v-model:value="filters.status"
            :options="statusOptions"
            placeholder="Status"
            clearable
          />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Aplicar filtros</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NSpace, useMessage } from 'naive-ui'
import { format } from 'date-fns'
import { PERMISSIONS } from '~/constants/permissions'
import { useAuthStore } from '~/stores/auth'

const message = useMessage()
const authStore = useAuthStore()
const canCreateConsultations = computed(() => authStore.hasPermission(PERMISSIONS.consultationsCreate))
const canUpdateConsultations = computed(() => authStore.hasPermission(PERMISSIONS.consultationsUpdate))
const canCreatePrescriptions = computed(() => authStore.hasPermission(PERMISSIONS.prescriptionsCreate))
const canPrintPrescriptions = computed(() => authStore.hasPermission(PERMISSIONS.prescriptionsPrint))
const canCreateInpatient = computed(() => authStore.hasPermission(PERMISSIONS.inpatientCreate))
const canViewInpatient = computed(() => authStore.hasPermission(PERMISSIONS.inpatientView))

const consultations = ref<any[]>([])
const loading = ref(false)
const loadError = ref(false)
const showMobileFilters = ref(false)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const usersMap = ref<Record<number, string>>({})
const clientNameMap = ref<Record<number, string>>({})
const petNameMap = ref<Record<number, string>>({})
const inpatientConsultationIds = ref<Set<number>>(new Set())

const filters = reactive({
  search: '',
  period: null as 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | null,
  date: null as number | null,
  veterinarianId: null as number | null,
  status: null as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INPATIENT' | 'WITH_PRESCRIPTION' | null
})

const veterinarianOptions = ref<{ label: string; value: number }[]>([])
const statusOptions = [
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Em atendimento', value: 'IN_PROGRESS' },
  { label: 'Concluída', value: 'COMPLETED' },
  { label: 'Internada', value: 'INPATIENT' },
  { label: 'Com prescrição', value: 'WITH_PRESCRIPTION' }
]
const periodOptions = [
  { label: 'Hoje', value: 'TODAY' },
  { label: 'Semana', value: 'WEEK' },
  { label: 'Mês', value: 'MONTH' },
  { label: 'Personalizado', value: 'CUSTOM' }
]

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0
const hasPrescription = (row: any) => hasText(row.treatmentPlan)
const isInpatient = (row: any) => inpatientConsultationIds.value.has(Number(row.id))

const getStatusMeta = (row: any) => {
  if (isInpatient(row)) return { key: 'INPATIENT', label: 'Internada', className: 'status-inpatient' }
  if (hasPrescription(row)) return { key: 'WITH_PRESCRIPTION', label: 'Com prescrição', className: 'status-prescription' }
  if (hasText(row.diagnosis)) return { key: 'COMPLETED', label: 'Concluída', className: 'status-completed' }

  const hasClinicalProgress = [row.mainComplaint, row.clinicalFindings, row.notes].some(hasText)
    || Number(row.weightKg || 0) > 0
    || Number(row.temperatureC || 0) > 0

  if (hasClinicalProgress) return { key: 'IN_PROGRESS', label: 'Em atendimento', className: 'status-in-progress' }
  return { key: 'PENDING', label: 'Pendente', className: 'status-pending' }
}

const matchesPeriodFilter = (visitDate: string | Date) => {
  if (!filters.period) return true
  const date = new Date(visitDate)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  if (filters.period === 'TODAY') return date >= todayStart && date < tomorrowStart
  if (filters.period === 'WEEK') {
    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return date >= todayStart && date < weekEnd
  }
  if (filters.period === 'MONTH') {
    const monthEnd = new Date(todayStart)
    monthEnd.setMonth(monthEnd.getMonth() + 1)
    return date >= todayStart && date < monthEnd
  }
  if (filters.period === 'CUSTOM' && filters.date) {
    const custom = new Date(filters.date)
    const customStart = new Date(custom.getFullYear(), custom.getMonth(), custom.getDate())
    const customEnd = new Date(customStart)
    customEnd.setDate(customEnd.getDate() + 1)
    return date >= customStart && date < customEnd
  }
  return true
}

const displayConsultations = computed(() => {
  const term = filters.search.trim().toLowerCase()
  return consultations.value.filter((row: any) => {
    const status = getStatusMeta(row)
    const client = clientNameMap.value[row.clientId] || ''
    const pet = petNameMap.value[row.petId] || ''
    const diagnosis = row.diagnosis || ''
    const matchesSearch = !term || `${client} ${pet} ${diagnosis}`.toLowerCase().includes(term)
    const matchesStatus = !filters.status || status.key === filters.status
    return matchesSearch && matchesStatus && matchesPeriodFilter(row.visitDate)
  })
})

const veterinarianLabelById = computed(() => {
  const map: Record<string, string> = {}
  veterinarianOptions.value.forEach((item) => { map[String(item.value)] = item.label })
  return map
})

const statusLabelByValue = computed(() => {
  const map: Record<string, string> = {}
  statusOptions.forEach((item) => { map[String(item.value)] = item.label })
  return map
})

const activeFilterChips = computed(() => {
  const chips: Array<{ key: string, label: string }> = []
  if (filters.period) {
    const period = periodOptions.find((p) => p.value === filters.period)
    chips.push({ key: 'period', label: period?.label || 'Período' })
  }
  if (filters.veterinarianId) {
    chips.push({ key: 'veterinarianId', label: veterinarianLabelById.value[String(filters.veterinarianId)] || 'Veterinário' })
  }
  if (filters.status) {
    chips.push({ key: 'status', label: statusLabelByValue.value[String(filters.status)] || 'Status' })
  }
  return chips
})

const summary = computed(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const source = displayConsultations.value
  const today = source.filter((row: any) => {
    const d = new Date(row.visitDate)
    return d >= todayStart && d < tomorrowStart
  }).length

  const pending = source.filter((row: any) => getStatusMeta(row).key === 'PENDING').length
  const withPrescription = source.filter((row: any) => getStatusMeta(row).key === 'WITH_PRESCRIPTION').length
  const inpatient = source.filter((row: any) => getStatusMeta(row).key === 'INPATIENT').length

  return { today, pending, withPrescription, inpatient }
})

const actionOptionsFor = (row: any) => {
  const options = [
    { label: 'Prontuário', key: 'open' },
    ...(canCreatePrescriptions.value ? [{ label: 'Prescrição', key: 'prescription' }] : []),
    ...(canPrintPrescriptions.value ? [{ label: 'Imprimir prescrição', key: 'print-prescription' }] : []),
    ...(canUpdateConsultations.value ? [{ label: 'Editar', key: 'edit' }] : []),
    { label: 'Ver histórico', key: 'history' }
  ]

  if (!isInpatient(row) && canCreateInpatient.value) {
    options.push({ label: 'Internar', key: 'admit' })
  }

  return options
}

const handleActionSelect = (key: string, row: any) => {
  if (key === 'open') {
    openEdit(row)
    return
  }
  if (key === 'edit') {
    if (!canUpdateConsultations.value) return
    openEdit(row)
    return
  }
  if (key === 'history') {
    message.info('Abra a consulta para visualizar o histórico completo.')
    openEdit(row)
    return
  }

  if (key === 'prescription') {
    if (!canCreatePrescriptions.value) return
    navigateTo({
      path: '/atendimento/internacao',
      query: {
        action: 'prescription',
        consultationId: String(row.id),
        petId: String(row.petId)
      }
    })
    return
  }

  if (key === 'print-prescription') {
    if (!canPrintPrescriptions.value) return
    navigateTo(`/atendimento/consultas/${row.id}/prescricao/imprimir`)
    return
  }

  if (key === 'admit') {
    if (!canCreateInpatient.value) return
    navigateTo({
      path: '/atendimento/internacao',
      query: {
        action: 'admit',
        consultationId: String(row.id),
        petId: String(row.petId)
      }
    })
  }
}

const renderSummary = (row: any) => {
  const fullText = row.diagnosis || row.clinicalFindings || row.notes || row.mainComplaint || 'Ainda não registrado'
  const isFallback = !(row.diagnosis || row.clinicalFindings || row.notes || row.mainComplaint)
  return h('span', { class: ['cell-truncate', isFallback ? 'cell-muted' : null], title: fullText }, fullText)
}

const columns = [
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Data / Hora'),
    key: 'visitDate',
    width: 160,
    render: (row: any) => h('div', [
      h('div', { class: 'cell-strong' }, format(new Date(row.visitDate), 'HH:mm')),
      h('div', { class: 'cell-muted' }, format(new Date(row.visitDate), 'dd/MM/yyyy'))
    ])
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Cliente / Pet'),
    key: 'clientPet',
    width: 250,
    render: (row: any) => h('div', [
      h('div', { class: 'cell-strong' }, clientNameMap.value[row.clientId] || 'Carregando...'),
      h('div', { class: 'cell-muted' }, `Pet: ${petNameMap.value[row.petId] || 'Carregando...'}`)
    ])
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Veterinário responsável'),
    key: 'veterinarian',
    width: 220,
    render: (row: any) => h('span', { class: 'cell-nowrap' }, usersMap.value[row.veterinarianId] || '-')
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Status'),
    key: 'status',
    width: 170,
    render: (row: any) => {
      const status = getStatusMeta(row)
      return h('span', { class: ['status-pill', status.className] }, status.label)
    }
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Diagnóstico / Resumo'),
    key: 'summary',
    ellipsis: { tooltip: true },
    render: (row: any) => renderSummary(row)
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Ações'),
    key: 'actions',
    width: 180,
    render: (row: any) => h('div', { class: 'actions' }, {
      default: () => [
        h(NButton, {
          size: 'small',
          type: 'primary',
          secondary: true,
          onClick: (event: MouseEvent) => {
            event.stopPropagation()
            openEdit(row)
          }
        }, { default: () => 'Abrir consulta' }),
        actionOptionsFor(row).length > 1
          ? h(NDropdown, {
              trigger: 'click',
              options: actionOptionsFor(row),
              onSelect: (key: string) => handleActionSelect(key, row)
            }, {
              default: () => h(NButton, {
                size: 'small',
                quaternary: true,
                class: 'menu-button',
                onClick: (event: MouseEvent) => event.stopPropagation()
              }, { default: () => '⋯' })
            })
          : null
      ]
    })
  }
]

const loadLookups = async () => {
  const api = useApi()
  try {
    const [usersRes, clientsRes, petsRes] = await Promise.all([
      api<any>('/api/v1/users?limit=100'),
      api<any>('/api/v1/clients?limit=500'),
      api<any>('/api/v1/pets?limit=1000')
    ])

    usersMap.value = {}
    clientNameMap.value = {}
    petNameMap.value = {}

    usersRes.data.forEach((u: any) => { usersMap.value[u.id] = u.name })
    clientsRes.data.forEach((c: any) => { clientNameMap.value[c.id] = c.name })
    petsRes.data.forEach((p: any) => { petNameMap.value[p.id] = p.name })

    veterinarianOptions.value = usersRes.data.map((u: any) => ({
      label: u.name,
      value: Number(u.id)
    }))
  } catch (err) {
    console.error('Failed to load lookups for consultations', err)
  }
}

const loadInpatientMap = async () => {
  if (!canViewInpatient.value) {
    inpatientConsultationIds.value = new Set()
    return
  }

  const api = useApi()
  try {
    const limit = 100
    let page = 1
    let total = 0
    const records: any[] = []

    do {
      const res = await api<any>('/api/v1/inpatient-records', {
        query: {
          status: 'ACTIVE',
          page,
          limit
        }
      })

      const pageData = Array.isArray(res?.data) ? res.data : []
      records.push(...pageData)

      total = Number(res?.meta?.total || pageData.length)
      page += 1
    } while (records.length < total)

    const ids = records
      .map((record: any) => Number(record.consultationId))
      .filter((id: number) => Number.isFinite(id) && id > 0)

    inpatientConsultationIds.value = new Set(ids)
  } catch (_err) {
    inpatientConsultationIds.value = new Set()
  }
}

const fetchConsultations = async () => {
  loading.value = true
  loadError.value = false
  try {
    const queryParams: any = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (filters.veterinarianId) queryParams.veterinarianId = filters.veterinarianId

    const api = useApi()
    const res = await api<any>('/api/v1/consultations', { query: queryParams })
    consultations.value = res.data
    pagination.itemCount = res.meta.total

    await loadInpatientMap()
  } catch (_err) {
    loadError.value = true
    message.error('Erro ao buscar consultas')
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  filters.search = ''
  filters.period = null
  filters.date = null
  filters.veterinarianId = null
  filters.status = null
  pagination.page = 1
  fetchConsultations()
}

const handleFilter = () => {
  pagination.page = 1
  fetchConsultations()
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  handleFilter()
}

const removeFilterChip = (key: string) => {
  if (key === 'period') {
    filters.period = null
    filters.date = null
  }
  if (key === 'veterinarianId') filters.veterinarianId = null
  if (key === 'status') filters.status = null
  handleFilter()
}

const handlePageChange = (p: number) => {
  pagination.page = p
  fetchConsultations()
}

const handlePageSizeChange = (s: number) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchConsultations()
}

const openCreate = () => {
  if (!canCreateConsultations.value) return
  navigateTo('/consultas/novo-atendimento')
}

const resolveInitialStep = (consultation: any) => {
  if (!hasText(consultation?.mainComplaint)) return 2
  if (hasText(consultation?.mainComplaint) && !hasText(consultation?.clinicalFindings)) return 3
  if (hasText(consultation?.clinicalFindings) && !hasText(consultation?.diagnosis) && !hasText(consultation?.treatmentPlan)) return 4
  if (String(consultation?.recordStatus || '').toUpperCase() === 'FINALIZED') return 6
  if (hasText(consultation?.diagnosis) || hasText(consultation?.treatmentPlan)) return 5
  return 0
}

const openEdit = (consultation: any) => {
  navigateTo({
    path: '/consultas/novo-atendimento',
    query: {
      id: String(consultation.id),
      step: String(resolveInitialStep(consultation) + 1)
    }
  })
}

const rowProps = (row: any) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  await loadLookups()
  await fetchConsultations()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.head-copy { display: flex; flex-direction: column; gap: 4px; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 0; font-size: 22px; line-height: 1.1; }
.subhead { margin: 0; color: #4b5563; font-size: 14px; }

.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
.summary-card-neutral { border-color: #e5e7eb; background: #fff; }
.summary-card-alert { border-color: #bfdbfe; background: #eff6ff; }
.summary-card-danger { border-color: #fecaca; background: #fef2f2; }
.summary-label { margin: 0; color: #6b7280; font-size: 12px; }
.summary-value { font-size: 32px; line-height: 1.1; }
.summary-grid-mobile { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.summary-value-mobile { font-size: 24px; line-height: 1.1; color: #1f2937; }
.mobile-card { padding-top: 6px; padding-bottom: 6px; }

.filters-card { background: #fff; border: 1px solid #e5e7eb; }
.filters-grid { display: grid; grid-template-columns: 2fr repeat(3, minmax(0, 1fr)) auto; gap: 12px; align-items: end; }
.filter-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
.btn-clear { color: #475569; }
.btn-filter { width: 112px; }
:deep(.btn-filter.n-button) { border: 1px solid #334155; color: #1e293b; }
:deep(.btn-filter.n-button:hover) { border-color: #0f172a; color: #0f172a; }

:deep(.n-data-table) { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
:deep(.n-data-table-th) { font-weight: 600; color: #374151; }
:deep(.n-data-table-tr:hover td) { background: #f8fafc; }
:deep(.n-data-table-td) { padding-top: 12px; padding-bottom: 12px; }
:deep(.n-data-table-th),
:deep(.n-data-table-td) { white-space: nowrap; word-break: normal; }
:deep(.n-input),
:deep(.n-base-selection),
:deep(.n-date-picker) { min-height: 40px; }

.cell-strong { font-weight: 600; color: #111827; }
.cell-muted { font-size: 12px; color: #64748b; }
.cell-nowrap { white-space: nowrap; }
.th-nowrap { white-space: nowrap; display: inline-block; }
.cell-truncate {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
}

:deep(.status-pill) { display: inline-flex; align-items: center; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
:deep(.status-pending) { color: #334155; background: #eaf1f8; }
:deep(.status-in-progress) { color: #b45309; background: #fef3c7; }
:deep(.status-completed) { color: #166534; background: #dcfce7; }
:deep(.status-inpatient) { color: #991b1b; background: #fee2e2; }
:deep(.status-prescription) { color: #4338ca; background: #e0e7ff; }

.menu-button { min-width: 34px; height: 32px; padding-inline: 10px; }
.actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
  flex-wrap: nowrap;
}

.mobile-filters-card { padding: 10px; }
.mobile-filter-top { display: flex; flex-direction: column; gap: 10px; }
.mobile-filter-trigger { height: 44px; }
:deep(.mobile-filter-trigger.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
  background: #ffffff;
}
:deep(.mobile-filter-trigger.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}
.mobile-filter-chips { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
.chip-btn {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  padding: 6px 10px;
}
.mobile-filters-panel { display: flex; flex-direction: column; gap: 12px; }
.mobile-filter-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.mobile-state { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; color: #64748b; background: #fff; }
.mobile-state-error { border-color: #fca5a5; color: #991b1b; }
.card-summary {
  margin: 10px 0 0;
  color: #475569;
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .page { gap: 12px; }
  .page-head { align-items: flex-start; flex-direction: column; gap: 8px; }
  .head-copy { gap: 2px; }
  .head-cta { width: 100%; }
  h1 { font-size: 19px; }
  .subhead { font-size: 13px; }

  .card-list { display: flex; flex-direction: column; gap: 12px; }
  .entity-card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; background: #fff; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; min-width: 0; }
  .card-time { margin: 0; font-size: 22px; line-height: 1; font-weight: 700; color: #0f172a; }
  .card-top :deep(.status-pill) {
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
  }
  .card-date { margin: -6px 0 0; font-size: 12px; color: #64748b; }
  .card-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-subtitle { margin: 0; font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-summary { margin-top: 0; }
  .mobile-filters-card { padding: 8px; }
  .mobile-filter-top { gap: 8px; }
  .mobile-filter-top :deep(.n-input) { width: 100%; }
  .card-actions { margin-top: 2px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: nowrap; min-width: 0; }
  .card-actions :deep(.n-button) { min-height: 36px; }
  .menu-button { min-width: 40px; height: 36px; display: inline-flex; align-items: center; justify-content: center; }
}
</style>
