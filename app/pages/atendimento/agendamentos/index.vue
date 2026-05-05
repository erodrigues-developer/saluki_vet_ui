<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">Atendimento</p>
        <h1>Agendamentos</h1>
        <p class="subhead">{{ isMobile ? 'Gerencie check-ins e triagens da clínica.' : 'Gerencie os horários, check-ins e triagens da clínica.' }}</p>
      </div>
      <n-space class="head-actions">
        <n-button type="primary" size="large" @click="openCreate">Novo Agendamento</n-button>
        <n-button secondary size="large" @click="openQuickCreate">Cadastro Rápido</n-button>
      </n-space>
    </div>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-icon">📅</p>
        <p class="summary-label">Hoje</p>
        <strong class="summary-value">{{ summary.today }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-icon">🕒</p>
        <p class="summary-label">Check-ins pendentes</p>
        <strong class="summary-value">{{ summary.awaitingCheckIn }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-alert">
        <p class="summary-icon">⚠️</p>
        <p class="summary-label">Em atraso</p>
        <strong class="summary-value">{{ summary.overdue }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card summary-card-danger">
        <p class="summary-icon">🚨</p>
        <p class="summary-label">Urgentes</p>
        <strong class="summary-value">{{ summary.urgent }}</strong>
      </n-card>
    </div>

    <div v-if="isMobile" class="summary-grid-mobile">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Hoje</p>
        <strong class="summary-value-mobile">{{ summary.today }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Check-ins</p>
        <strong class="summary-value-mobile">{{ summary.awaitingCheckIn }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" :class="['summary-card', 'mobile-card', summary.overdue > 0 ? 'summary-card-alert' : 'summary-card-neutral']">
        <p class="summary-label">Em atraso</p>
        <strong class="summary-value-mobile">{{ summary.overdue }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" :class="['summary-card', 'mobile-card', summary.urgent > 0 ? 'summary-card-danger' : 'summary-card-neutral']">
        <p class="summary-label">Urgentes</p>
        <strong class="summary-value-mobile">{{ summary.urgent }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.search" placeholder="Buscar tutor, pet ou telefone" clearable />
        <n-select v-model:value="filters.period" :options="periodOptions" placeholder="Período" clearable />
        <n-date-picker v-if="filters.period === 'CUSTOM'" v-model:value="filters.date" type="date" clearable placeholder="Data personalizada" />
        <n-select v-model:value="filters.veterinarianId" :options="veterinarianOptions" placeholder="Veterinário(a)" clearable />
        <n-select v-model:value="filters.statusId" :options="statusOptions" placeholder="Status" clearable />
        <n-select v-model:value="filters.triageRisk" :options="triageOptions" placeholder="Triagem" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="handleFilter">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.search" placeholder="Buscar tutor, pet ou telefone" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true">🔎 Filtros</n-button>
      </div>
      <div v-if="activeFilterChips.length" class="mobile-filter-chips">
        <button v-for="chip in activeFilterChips" :key="chip.key" class="chip-btn" type="button" @click="removeFilterChip(chip.key)">
          {{ chip.label }} ×
        </button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <n-spin v-if="loading" size="small">
        <div class="mobile-state">Carregando agendamentos...</div>
      </n-spin>
      <div v-else-if="loadError" class="mobile-state mobile-state-error">
        <p>Erro ao carregar agendamentos.</p>
        <n-button tertiary type="primary" @click="fetchAppointments">Tentar novamente</n-button>
      </div>
      <div v-else-if="appointments.length === 0" class="mobile-state">
        Nenhum agendamento cadastrado.
      </div>
      <div v-else-if="displayAppointments.length === 0" class="mobile-state">
        Nenhum resultado encontrado para os filtros aplicados.
      </div>
      <template v-else>
        <div v-for="row in displayAppointments" :key="row.id" class="entity-card">
          <div class="card-top">
            <p class="card-time">{{ format(new Date(row.startsAt), 'HH:mm') }}</p>
            <p class="card-type">{{ row.appointmentType?.name || typesMap[row.appointmentTypeId] || '-' }}</p>
          </div>
          <p class="card-date">{{ format(new Date(row.startsAt), 'dd/MM/yyyy') }}</p>

          <div class="card-content">
            <p class="card-title">{{ clientNameMap[row.clientId] || 'Cliente' }}</p>
            <p class="card-subtitle">Pet: {{ petNameMap[row.petId] || 'Não informado' }}</p>
            <p class="card-subtitle">Vet: {{ row.veterinarianId ? usersMap[row.veterinarianId] : 'Não atribuído' }}</p>
          </div>

          <div class="card-badges">
            <span :class="['status-pill', getStatusMeta(row.status || statusesMap[row.statusId] || null).className]">
              {{ getStatusMeta(row.status || statusesMap[row.statusId] || null).label }}
            </span>
            <span :class="['triage-pill', getTriageMeta(row.triageRisk || null).className]">
              <span class="triage-dot" />
              <span>{{ getTriageMeta(row.triageRisk || null).label }}</span>
            </span>
          </div>

          <div class="card-actions">
            <n-button size="small" secondary type="primary" :disabled="row.status?.code === 'ARRIVED'" @click.stop="openCheckIn(row)">Check-in</n-button>
            <n-dropdown trigger="click" :options="actionOptionsFor()" @select="(key: string) => handleActionSelect(key, row)">
              <n-button size="small" quaternary class="menu-button">•••</n-button>
            </n-dropdown>
          </div>
        </div>
      </template>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="displayAppointments"
      :pagination="pagination"
      :bordered="false"
      :row-props="rowProps"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      remote
    />

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="72%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select v-model:value="filters.period" :options="periodOptions" placeholder="Período" clearable />
          <n-date-picker v-if="filters.period === 'CUSTOM'" v-model:value="filters.date" type="date" clearable placeholder="Data personalizada" />
          <n-select v-model:value="filters.veterinarianId" :options="veterinarianOptions" placeholder="Veterinário(a)" clearable />
          <n-select v-model:value="filters.statusId" :options="statusOptions" placeholder="Status" clearable />
          <n-select v-model:value="filters.triageRisk" :options="triageOptions" placeholder="Triagem" clearable />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Aplicar filtros</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showModal" :mask-closable="false" preset="card" class="appointment-modal" style="width: 760px;">
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingAppointment ? 'Editar agendamento' : 'Novo agendamento' }}</h3>
          <p class="modal-subtitle">
            {{ editingAppointment ? 'Atualize os dados do atendimento, horário e observações.' : 'Preencha os dados para criar um novo atendimento na agenda.' }}
          </p>
        </div>
      </template>
      <AppointmentForm
        ref="appointmentFormRef"
        :value="editingAppointment"
        :loading="saving"
        @submit="handleSubmit"
        @quick-create="openQuickCreate"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitAppointmentForm">
            {{ editingAppointment ? 'Salvar alterações' : 'Agendar' }}
          </n-button>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showQuickModal"
      :mask-closable="false"
      preset="card"
      class="appointment-modal quick-create-modal"
      style="width: 760px;"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">Cadastro rápido</h3>
          <p class="modal-subtitle">Crie tutor, pet e agendamento em um único fluxo.</p>
        </div>
      </template>
      <n-form :model="quickForm" label-placement="top" :disabled="quickSaving">
        <div class="quick-sections">
          <section class="quick-section">
            <h4 class="quick-section-title">Tutor</h4>
            <div class="quick-grid">
              <n-form-item label="Nome do tutor" required>
                <n-input v-model:value="quickForm.client.name" placeholder="Ex.: Ana Lima" />
              </n-form-item>
              <n-form-item label="Celular" required>
                <n-input
                  v-model:value="quickForm.client.mobilePhone"
                  placeholder="(11) 99999-9999"
                  :input-props="{ maxlength: 15 }"
                  @update:value="onQuickMobilePhoneInput"
                />
              </n-form-item>
              <n-form-item label="CPF">
                <n-input v-model:value="quickForm.client.document" placeholder="Opcional" />
              </n-form-item>
              <n-form-item label="E-mail">
                <n-input v-model:value="quickForm.client.email" placeholder="Opcional" />
              </n-form-item>
            </div>
          </section>

          <section class="quick-section">
            <h4 class="quick-section-title">Pet</h4>
            <div class="quick-grid">
              <n-form-item label="Nome do pet" required>
                <n-input v-model:value="quickForm.pet.name" placeholder="Ex.: Odin" />
              </n-form-item>
              <n-form-item label="Espécie" required>
                <n-select v-model:value="quickForm.pet.speciesId" :options="speciesOptions" placeholder="Selecione a espécie" filterable />
              </n-form-item>
              <n-form-item label="Raça">
                <n-select v-model:value="quickForm.pet.breedId" :options="breedOptions" placeholder="Selecione a raça" clearable filterable />
              </n-form-item>
              <n-form-item label="Sexo">
                <n-select v-model:value="quickForm.pet.sex" :options="sexOptions" placeholder="Selecione o sexo" clearable />
              </n-form-item>
            </div>
          </section>

          <section class="quick-section">
            <h4 class="quick-section-title">Agendamento</h4>
            <div class="quick-grid">
              <n-form-item label="Tipo de atendimento" required>
                <n-select v-model:value="quickForm.appointment.appointmentTypeId" :options="appointmentTypeOptions" placeholder="Selecione o atendimento" />
              </n-form-item>
              <n-form-item label="Data e hora" required>
                <n-date-picker
                  v-model:value="quickForm.appointment.startsAt"
                  type="datetime"
                  format="dd/MM/yyyy HH:mm"
                  placeholder="Selecione data e hora"
                  style="width: 100%"
                />
              </n-form-item>
              <n-form-item label="Veterinário(a)" class="full-row">
                <n-select
                  v-model:value="quickForm.appointment.veterinarianId"
                  :options="veterinarianOptions"
                  placeholder="Selecione o veterinário"
                  clearable
                  filterable
                />
              </n-form-item>
              <n-form-item label="Motivo / Queixa" class="full-row">
                <n-input v-model:value="quickForm.appointment.reason" placeholder="Ex.: vômito, apatia, vacina anual..." />
              </n-form-item>
            </div>
          </section>
        </div>
      </n-form>
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="quickSaving" @click="showQuickModal = false">Cancelar</n-button>
          <n-button type="primary" :loading="quickSaving" @click="handleQuickSubmit">Criar ficha e agendar</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showCheckInModal" preset="card" style="width: 520px">
      <template #header><p class="eyebrow" style="margin: 0">Check-in</p></template>
      <n-form :model="checkInForm" label-placement="top" :disabled="checkInSaving">
        <n-form-item label="Motivo / Queixa" required>
          <n-input v-model:value="checkInForm.reason" type="textarea" :rows="4" placeholder="Ex: Cachorro vomitando há dois dias" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="checkInSaving" @click="showCheckInModal = false">Cancelar</n-button>
          <n-button type="primary" :loading="checkInSaving" @click="handleCheckIn">Registrar chegada</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NSpace, useDialog, useMessage } from 'naive-ui'
import AppointmentForm, { type AppointmentPayload } from '~/components/appointments/AppointmentForm.vue'
import { format } from 'date-fns'
import { formatBrazilPhone } from '~/composables/useBrazilPhone'

const message = useMessage()
const dialog = useDialog()

const appointments = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showQuickModal = ref(false)
const showCheckInModal = ref(false)
const showMobileFilters = ref(false)
const editingAppointment = ref<AppointmentPayload | null>(null)
const appointmentFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const quickSaving = ref(false)
const checkInSaving = ref(false)
const checkInTarget = ref<any | null>(null)
const loadError = ref(false)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const statusesMap = ref<Record<number, { id?: number, name: string, code: string }>>({})
const typesMap = ref<Record<number, string>>({})
const usersMap = ref<Record<number, string>>({})
const clientNameMap = ref<Record<number, string>>({})
const petNameMap = ref<Record<number, string>>({})
const toArray = <T = any>(response: any): T[] => {
  if (Array.isArray(response?.data)) return response.data as T[]
  if (Array.isArray(response?.items)) return response.items as T[]
  if (Array.isArray(response)) return response as T[]
  return []
}

const filters = reactive({
  search: '',
  period: null as 'TODAY' | 'TOMORROW' | 'WEEK' | 'CUSTOM' | null,
  date: null as number | null,
  veterinarianId: null,
  statusId: null,
  triageRisk: null as 'VERDE' | 'AMARELA' | 'VERMELHA' | 'PENDING' | null
})

const veterinarianOptions = ref<{label: string, value: number}[]>([])
const statusOptions = ref<{label: string, value: number}[]>([])
const speciesOptions = ref<{label: string, value: number}[]>([])
const breedOptions = ref<{label: string, value: number}[]>([])
const appointmentTypeOptions = ref<{label: string, value: number}[]>([])

const triageOptions = [
  { label: 'Verde', value: 'VERDE' },
  { label: 'Amarela', value: 'AMARELA' },
  { label: 'Vermelha', value: 'VERMELHA' },
  { label: 'Pendente', value: 'PENDING' }
]

const periodOptions = [
  { label: 'Hoje', value: 'TODAY' },
  { label: 'Amanhã', value: 'TOMORROW' },
  { label: 'Semana', value: 'WEEK' },
  { label: 'Personalizado', value: 'CUSTOM' }
]

const sexOptions = [
  { label: 'Macho', value: 'M' },
  { label: 'Fêmea', value: 'F' },
  { label: 'Não informado', value: 'N' }
]

const quickForm = reactive({
  client: { name: '', document: '', mobilePhone: '', email: '' },
  pet: { name: '', speciesId: null as number | null, breedId: null as number | null, sex: null as string | null },
  appointment: { appointmentTypeId: null as number | null, veterinarianId: null as number | null, startsAt: Date.now(), reason: '' }
})

const checkInForm = reactive({ reason: '' })

const onQuickMobilePhoneInput = (value: string) => {
  quickForm.client.mobilePhone = formatBrazilPhone(value)
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const getStatusMeta = (status?: { code?: string, name?: string } | null) => {
  const code = status?.code || ''
  const name = (status?.name || '').trim()
  if (code === 'ARRIVED' || name.toLowerCase() === 'chegou') return { label: 'Chegou', className: 'status-arrived' }
  if (code === 'SCHEDULED' || name.toLowerCase() === 'agendado') return { label: 'Agendado', className: 'status-scheduled' }
  if (code === 'IN_PROGRESS' || name.toLowerCase() === 'em atendimento') return { label: 'Em atendimento', className: 'status-in-progress' }
  if (code === 'COMPLETED' || name.toLowerCase() === 'finalizado') return { label: 'Finalizado', className: 'status-completed' }
  if (code === 'CANCELED' || name.toLowerCase() === 'cancelado') return { label: 'Cancelado', className: 'status-canceled' }
  return { label: name || 'Pendente', className: 'status-default' }
}

const getTriageMeta = (risk?: string | null) => {
  if (risk === 'AMARELA') return { label: 'AMARELA', className: 'triage-yellow' }
  if (risk === 'VERDE') return { label: 'VERDE', className: 'triage-green' }
  if (risk === 'VERMELHA') return { label: 'VERMELHA', className: 'triage-red' }
  return { label: 'Pendente', className: 'triage-pending' }
}

const matchesPeriodFilter = (startsAt: string) => {
  if (!filters.period) return true
  const date = new Date(startsAt)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const weekEnd = new Date(todayStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  if (filters.period === 'TODAY') return date >= todayStart && date < tomorrowStart
  if (filters.period === 'TOMORROW') {
    const dayAfter = new Date(tomorrowStart)
    dayAfter.setDate(dayAfter.getDate() + 1)
    return date >= tomorrowStart && date < dayAfter
  }
  if (filters.period === 'WEEK') return date >= todayStart && date < weekEnd
  if (filters.period === 'CUSTOM' && filters.date) {
    const custom = new Date(filters.date)
    const customStart = new Date(custom.getFullYear(), custom.getMonth(), custom.getDate())
    const customEnd = new Date(customStart)
    customEnd.setDate(customEnd.getDate() + 1)
    return date >= customStart && date < customEnd
  }
  return true
}

const displayAppointments = computed(() => {
  const term = filters.search.trim().toLowerCase()
  return appointments.value.filter((row: any) => {
    const client = clientNameMap.value[row.clientId] || ''
    const pet = petNameMap.value[row.petId] || ''
    const phone = row.client?.mobilePhone || row.client?.phone || ''
    const triage = row.triageRisk || 'PENDING'

    const matchesSearch = !term || `${client} ${pet} ${phone}`.toLowerCase().includes(term)
    const matchesTriage = !filters.triageRisk || triage === filters.triageRisk
    const matchesStatus = !filters.statusId || Number(row.statusId) === Number(filters.statusId)
    return matchesSearch && matchesTriage && matchesStatus && matchesPeriodFilter(row.startsAt)
  })
})

const statusLabelById = computed(() => {
  const map: Record<string, string> = {}
  statusOptions.value.forEach((item) => { map[String(item.value)] = item.label })
  return map
})

const veterinarianLabelById = computed(() => {
  const map: Record<string, string> = {}
  veterinarianOptions.value.forEach((item) => { map[String(item.value)] = item.label })
  return map
})

const activeFilterChips = computed(() => {
  const chips: Array<{ key: string, label: string }> = []
  if (filters.period) {
    const period = periodOptions.find((p) => p.value === filters.period)
    chips.push({ key: 'period', label: period?.label || 'Período' })
  }
  if (filters.veterinarianId) chips.push({ key: 'veterinarianId', label: veterinarianLabelById.value[String(filters.veterinarianId)] || 'Veterinário' })
  if (filters.statusId) chips.push({ key: 'statusId', label: statusLabelById.value[String(filters.statusId)] || 'Status' })
  if (filters.triageRisk) chips.push({ key: 'triageRisk', label: `Triagem ${getTriageMeta(filters.triageRisk).label}` })
  return chips
})

const summary = computed(() => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const source = displayAppointments.value
  const today = source.filter((row: any) => {
    const d = new Date(row.startsAt)
    return d >= todayStart && d < tomorrowStart
  })
  const awaitingCheckIn = source.filter((row: any) => ['SCHEDULED', 'CONFIRMED'].includes((row.status || statusesMap.value[row.statusId])?.code)).length
  const overdue = source.filter((row: any) => new Date(row.startsAt) < now && ['SCHEDULED', 'CONFIRMED'].includes((row.status || statusesMap.value[row.statusId])?.code)).length
  const urgent = source.filter((row: any) => row.triageRisk === 'VERMELHA').length
  return { today: today.length, awaitingCheckIn, overdue, urgent }
})

const actionOptionsFor = () => [
  { label: 'Ver detalhes', key: 'view' },
  { label: 'Editar', key: 'edit' },
  { label: 'Reagendar', key: 'reschedule' },
  { label: 'Cancelar agendamento', key: 'cancel' },
  { label: 'Excluir', key: 'delete' }
]

const columns = [
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Horário / Data'),
    key: 'startsAt',
    width: 160,
    render: (row: any) => h('div', [
      h('div', { class: 'cell-strong' }, format(new Date(row.startsAt), 'HH:mm')),
      h('div', { class: 'cell-muted' }, format(new Date(row.startsAt), 'dd/MM/yyyy'))
    ])
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Cliente / Pet'),
    key: 'clientPet',
    width: 280,
    render: (row: any) => h('div', [
      h('div', { class: 'cell-strong' }, clientNameMap.value[row.clientId] || 'Carregando...'),
      h('div', { class: 'cell-muted' }, `Pet: ${petNameMap.value[row.petId] || 'Carregando...'}`)
    ])
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Atendimento'),
    key: 'type',
    width: 220,
    render: (row: any) => h('span', { class: 'cell-nowrap' }, row.appointmentType?.name || typesMap.value[row.appointmentTypeId] || '-')
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Veterinário'),
    key: 'vet',
    width: 190,
    render: (row: any) => h('span', { class: 'cell-nowrap' }, row.veterinarianId ? usersMap.value[row.veterinarianId] : 'Não atribuído')
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Status'),
    key: 'status',
    width: 150,
    render: (row: any) => {
      const statusMeta = getStatusMeta(row.status || statusesMap.value[row.statusId] || null)
      return h('span', { class: ['status-pill', statusMeta.className] }, statusMeta.label)
    }
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Triagem'),
    key: 'triageRisk',
    width: 140,
    render: (row: any) => {
      const triageMeta = getTriageMeta(row.triageRisk || null)
      return h('span', { class: ['triage-pill', triageMeta.className] }, [h('span', { class: 'triage-dot' }), h('span', triageMeta.label)])
    }
  },
  {
    title: () => h('span', { class: 'th-nowrap' }, 'Ações'),
    key: 'actions',
    width: 170,
    render: (row: any) => h('div', { class: 'actions', style: 'justify-content: flex-end;' }, [
      h(NButton, {
        size: 'small',
        secondary: true,
        type: 'primary',
        disabled: row.status?.code === 'ARRIVED',
        onClick: (e) => {
          e.stopPropagation()
          openCheckIn(row)
        }
      }, { default: () => 'Check-in' }),
      h(NDropdown, {
        trigger: 'click',
        options: actionOptionsFor(),
        onSelect: (key: string) => handleActionSelect(key, row)
      }, {
        default: () => h(NButton, {
          size: 'small',
          quaternary: true,
          class: 'menu-button',
          onClick: (e) => e.stopPropagation()
        }, { default: () => '•••' })
      })
    ])
  }
]

const loadLookups = async () => {
  const api = useApi()
  try {
    const [statusesRes, typesRes, usersRes, clientsRes, petsRes, speciesRes, breedsRes] = await Promise.all([
      api<any>('/api/v1/appointment-statuses?limit=100'),
      api<any>('/api/v1/appointment-types?limit=100'),
      api<any>('/api/v1/users?limit=100'),
      api<any>('/api/v1/clients?limit=500'),
      api<any>('/api/v1/pets?limit=1000'),
      api<any>('/api/v1/species?limit=100'),
      api<any>('/api/v1/breeds?limit=500')
    ])

    const statuses = toArray(statusesRes)
    const types = toArray(typesRes)
    const users = toArray(usersRes)
    const clients = toArray(clientsRes)
    const pets = toArray(petsRes)
    const species = toArray(speciesRes)
    const breeds = toArray(breedsRes)

    statusesMap.value = {}
    typesMap.value = {}
    usersMap.value = {}
    clientNameMap.value = {}
    petNameMap.value = {}

    statuses.forEach((s: any) => { statusesMap.value[s.id] = s })
    types.forEach((t: any) => { typesMap.value[t.id] = t.name })
    users.forEach((u: any) => { usersMap.value[u.id] = u.name })
    clients.forEach((c: any) => { clientNameMap.value[c.id] = c.name })
    pets.forEach((p: any) => { petNameMap.value[p.id] = p.name })

    statusOptions.value = statuses.map((s: any) => ({ label: s.name, value: Number(s.id) }))
    appointmentTypeOptions.value = types.map((t: any) => ({ label: t.name, value: Number(t.id) }))
    veterinarianOptions.value = users.map((u: any) => ({ label: u.name, value: Number(u.id) }))
    speciesOptions.value = species.map((s: any) => ({ label: s.name, value: Number(s.id) }))
    breedOptions.value = breeds.map((b: any) => ({ label: b.name, value: Number(b.id) }))
  } catch (err) {
    console.error('Failed to load lookups', err)
  }
}

const fetchAppointments = async () => {
  loading.value = true
  loadError.value = false
  try {
    const queryParams: any = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (filters.veterinarianId) queryParams.veterinarianId = filters.veterinarianId
    if (filters.statusId) queryParams.statusId = filters.statusId

    const api = useApi()
    const res = await api<any>('/api/v1/appointments', { query: queryParams })
    const items = toArray(res)
    appointments.value = [...items].sort((a: any, b: any) => triageWeight(b.triageRisk) - triageWeight(a.triageRisk))
    pagination.itemCount = Number(res?.meta?.total ?? items.length)
  } catch (_err) {
    loadError.value = true
    message.error('Erro ao buscar agendamentos')
  } finally {
    loading.value = false
  }
}

const triageWeight = (risk?: string | null) => {
  if (risk === 'VERMELHA') return 3
  if (risk === 'AMARELA') return 2
  if (risk === 'VERDE') return 1
  return 0
}

const clearFilters = () => {
  filters.search = ''
  filters.period = null
  filters.date = null
  filters.veterinarianId = null
  filters.statusId = null
  filters.triageRisk = null
  pagination.page = 1
  fetchAppointments()
}

const handleFilter = () => {
  pagination.page = 1
  fetchAppointments()
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
  if (key === 'statusId') filters.statusId = null
  if (key === 'triageRisk') filters.triageRisk = null
  handleFilter()
}

const handlePageChange = (p: number) => {
  pagination.page = p
  fetchAppointments()
}

const handlePageSizeChange = (s: number) => {
  pagination.pageSize = s
  pagination.page = 1
  fetchAppointments()
}

const handleSubmit = async (payload: AppointmentPayload) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/appointments/${payload.id}`, { method: 'PATCH', body: payload })
      message.success('Agendamento atualizado')
    } else {
      await api('/api/v1/appointments', { method: 'POST', body: payload })
      message.success('Agendamento criado')
    }
    closeModal()
    fetchAppointments()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar agendamento')
  } finally {
    saving.value = false
  }
}

const cancelAppointment = async (appointment: any) => {
  const canceledStatus = Object.values(statusesMap.value).find((s) => s.code === 'CANCELED')
  if (!canceledStatus?.id) {
    message.error('Status CANCELED não disponível para cancelamento.')
    return
  }
  const api = useApi()
  await api(`/api/v1/appointments/${appointment.id}`, {
    method: 'PATCH',
    body: { statusId: Number(canceledStatus.id) }
  })
  message.success('Agendamento cancelado')
  fetchAppointments()
}

const confirmDelete = (appointment: any) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: 'Deseja excluir este agendamento?',
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/appointments/${appointment.id}`, { method: 'DELETE' })
        message.success('Agendamento excluído')
        fetchAppointments()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir agendamento')
      }
    }
  })
}

const handleActionSelect = (key: string, row: any) => {
  if (key === 'view' || key === 'edit' || key === 'reschedule') {
    if (key === 'reschedule') message.info('Abra o formulário para reagendar o horário.')
    openEdit(row)
    return
  }
  if (key === 'cancel') {
    dialog.warning({
      title: 'Cancelar agendamento',
      content: 'Deseja cancelar este agendamento?',
      positiveText: 'Cancelar agendamento',
      negativeText: 'Voltar',
      onPositiveClick: async () => {
        try {
          await cancelAppointment(row)
        } catch (err: any) {
          message.error(err?.data?.message || 'Erro ao cancelar agendamento')
        }
      }
    })
    return
  }
  if (key === 'delete') confirmDelete(row)
}

const openCreate = () => {
  editingAppointment.value = null
  showModal.value = true
}

const openQuickCreate = () => {
  Object.assign(quickForm.client, { name: '', document: '', mobilePhone: '', email: '' })
  Object.assign(quickForm.pet, { name: '', speciesId: null, breedId: null, sex: null })
  Object.assign(quickForm.appointment, { appointmentTypeId: appointmentTypeOptions.value[0]?.value ?? null, veterinarianId: null, startsAt: Date.now(), reason: '' })
  showQuickModal.value = true
}

const handleQuickSubmit = async () => {
  if (!quickForm.client.name || !quickForm.client.mobilePhone || !quickForm.pet.name || !quickForm.pet.speciesId || !quickForm.appointment.appointmentTypeId || !quickForm.appointment.startsAt) {
    message.warning('Preencha os campos obrigatórios: tutor, celular, pet, espécie, tipo e data/hora.')
    return
  }

  quickSaving.value = true
  try {
    const api = useApi()
    await api('/api/v1/appointments/quick-create', {
      method: 'POST',
      body: {
        client: quickForm.client,
        pet: quickForm.pet,
        appointment: {
          ...quickForm.appointment,
          startsAt: quickForm.appointment.startsAt ? new Date(quickForm.appointment.startsAt).toISOString() : undefined
        }
      }
    })
    message.success('Ficha criada e agendamento marcado')
    showQuickModal.value = false
    await loadLookups()
    fetchAppointments()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro no cadastro rápido')
  } finally {
    quickSaving.value = false
  }
}

const openCheckIn = (appointment: any) => {
  checkInTarget.value = appointment
  checkInForm.reason = appointment.reason || ''
  showCheckInModal.value = true
}

const handleCheckIn = async () => {
  if (!checkInTarget.value || !checkInForm.reason.trim()) {
    message.warning('Informe o motivo da vinda.')
    return
  }
  checkInSaving.value = true
  try {
    const api = useApi()
    await api(`/api/v1/appointments/${checkInTarget.value.id}/check-in`, {
      method: 'POST',
      body: { reason: checkInForm.reason }
    })
    message.success('Check-in registrado')
    showCheckInModal.value = false
    await loadLookups()
    fetchAppointments()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao registrar check-in')
  } finally {
    checkInSaving.value = false
  }
}

const openEdit = (appointment: any) => {
  editingAppointment.value = appointment
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitAppointmentForm = async () => {
  await appointmentFormRef.value?.submit()
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
  fetchAppointments()
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
h1 { margin: 0; font-size: 34px; line-height: 1.1; }
.subhead { margin: 0; color: #4b5563; font-size: 14px; }
.head-actions { align-items: center; }

.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
.summary-card-alert { border-color: #facc15; background: #fffbeb; }
.summary-card-danger { border-color: #fca5a5; background: #fef2f2; }
.summary-card-neutral { border-color: #e5e7eb; background: #fff; }
.summary-icon { margin: 0; font-size: 14px; }
.summary-label { margin: 0; color: #6b7280; font-size: 12px; }
.summary-value { font-size: 32px; line-height: 1.1; }
.summary-grid-mobile { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.summary-value-mobile { font-size: 24px; line-height: 1.1; color: #1f2937; }
.mobile-card { padding-top: 6px; padding-bottom: 6px; }

.filters-card { background: #fff; border: 1px solid #e5e7eb; }
.mobile-filters-card { padding: 10px; }
.filters-grid { display: grid; grid-template-columns: 2fr repeat(5, minmax(0, 1fr)) auto; gap: 12px; align-items: end; }
.filter-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
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
.btn-clear { color: #475569; }
.btn-filter { width: 112px; }
:deep(.btn-filter.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
}
:deep(.btn-filter.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

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

:deep(.status-pill) { display: inline-flex; align-items: center; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
:deep(.status-scheduled) { color: #1d4ed8; background: #dbeafe; }
:deep(.status-arrived) { color: #b45309; background: #fef3c7; }
:deep(.status-in-progress) { color: #6d28d9; background: #ede9fe; }
:deep(.status-completed) { color: #166534; background: #dcfce7; }
:deep(.status-canceled) { color: #991b1b; background: #fee2e2; }
:deep(.status-default) { color: #334155; background: #e2e8f0; }

:deep(.triage-pill) { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
:deep(.triage-dot) { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
:deep(.triage-green) { color: #15803d; background: #dcfce7; }
:deep(.triage-yellow) { color: #a16207; background: #fef3c7; }
:deep(.triage-red) { color: #b91c1c; background: #fee2e2; }
:deep(.triage-pending) { color: #334155; background: #e2e8f0; }

.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.menu-button { min-width: 34px; height: 32px; padding-inline: 10px; }
.quick-sections { display: flex; flex-direction: column; gap: 10px; }
.quick-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
}
.quick-section-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  color: #334155;
}
.quick-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.full-row { grid-column: 1 / -1; }
.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }

.mobile-filters-panel { display: flex; flex-direction: column; gap: 12px; }
.mobile-filter-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.mobile-state {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 16px;
  color: #475569;
  text-align: center;
}
.mobile-state-error p { margin: 0 0 10px; }

@media (max-width: 1100px) {
  .filters-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .filter-actions { justify-content: flex-start; }
}

@media (max-width: 768px) {
  .page { gap: 12px; }
  .page-head { align-items: flex-start; flex-direction: column; gap: 8px; }
  .head-copy { gap: 2px; }
  h1 { font-size: 26px; }
  .subhead { font-size: 13px; }
  .head-actions { width: 100%; display: grid; grid-template-columns: 1fr; gap: 8px; }
  .head-actions :deep(.n-button) { width: 100%; min-height: 44px; }
  .quick-grid { grid-template-columns: 1fr; }
  .quick-section { padding: 10px; }
  .quick-section-title { font-size: 15px; margin-bottom: 6px; }
  .card-list { display: flex; flex-direction: column; gap: 12px; }
  .entity-card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; background: #fff; display: flex; flex-direction: column; gap: 10px; }
  .card-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
  .card-time { margin: 0; font-size: 22px; line-height: 1; font-weight: 700; color: #0f172a; }
  .card-type { margin: 0; font-size: 14px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-date { margin: -6px 0 0; font-size: 12px; color: #64748b; }
  .card-content { display: flex; flex-direction: column; gap: 4px; }
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
  .card-badges { display: flex; gap: 8px; flex-wrap: wrap; }
  .mobile-filters-card { padding: 8px; }
  .mobile-filter-top { gap: 8px; }
  .mobile-filter-top :deep(.n-input) { width: 100%; }
  .card-actions { margin-top: 2px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: nowrap; }
  .card-actions :deep(.n-button) { min-height: 36px; }
  .menu-button { min-width: 40px; height: 36px; display: inline-flex; align-items: center; justify-content: center; }
}
</style>

<style>
:root .n-modal-container:has(.appointment-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.appointment-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.appointment-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.appointment-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.appointment-modal.n-card {
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

.appointment-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.appointment-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 16px;
}

.appointment-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .appointment-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
    margin: 0 auto !important;
  }

  .appointment-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .appointment-modal.n-card .n-card__content {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none !important;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 10px 12px 12px;
    -webkit-overflow-scrolling: touch;
  }

  .appointment-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .appointment-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .appointment-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
