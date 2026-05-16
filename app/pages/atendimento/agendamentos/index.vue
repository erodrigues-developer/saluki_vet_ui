<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">ATENDIMENTO</p>
        <h1>Agendamentos</h1>
        <p class="subhead">Gerencie a agenda da clínica, horários disponíveis, veterinários, check-ins e próximos atendimentos.</p>
      </div>
      <n-space class="head-actions">
        <n-button type="primary" size="large" @click="openCreate">Novo agendamento</n-button>
        <n-button secondary size="large" @click="openQuickCreate">Cadastro rápido</n-button>
      </n-space>
    </div>

    <div class="view-tabs" role="tablist" aria-label="Modos de visualização">
      <button v-for="item in viewTabs" :key="item.value" class="tab-btn" :class="{ active: mode === item.value }" type="button" @click="mode = item.value">
        {{ item.label }}
      </button>
    </div>

    <template v-if="mode === 'agenda'">
      <div class="agenda-workspace">
        <n-card :bordered="false" class="agenda-filters-card">
          <div class="agenda-filters-scroll">
            <div class="agenda-sidebar-period">
              <div class="period-controls">
                <n-radio-group v-model:value="agendaInnerMode" size="small">
                  <n-radio-button value="day">Diária</n-radio-button>
                  <n-radio-button value="seven">Semanal</n-radio-button>
                </n-radio-group>
              </div>
              <div class="period-navigation">
                <n-button aria-label="Hoje" @click="goToToday">Hoje</n-button>
                <n-button aria-label="Período anterior" quaternary circle class="period-icon-button" @click="goPrevious">
                  <AppIcon name="chevron-left" :size="16" :stroke-width="2" />
                </n-button>
                <n-button aria-label="Próximo período" quaternary circle class="period-icon-button" @click="goNext">
                  <AppIcon name="chevron-right" :size="16" :stroke-width="2" />
                </n-button>
                <p class="period-label">{{ agendaPeriodLabel }}</p>
              </div>
              <n-calendar v-model:value="agendaSelectedDate" @update:value="handleAgendaDateSelect" />
            </div>
            <div class="filters-section">
              <p class="filters-section-title">Filtros principais</p>
              <div class="agenda-filters-grid">
                <n-select
                  v-model:value="agendaFilters.veterinarianIds"
                  multiple
                  clearable
                  filterable
                  :options="agendaVeterinarianOptions"
                  placeholder="Veterinário"
                />
                <n-select v-model:value="agendaFilters.statusIds" multiple clearable :options="statusOptions" placeholder="Status" />
                <n-select v-model:value="agendaFilters.triageRisk" multiple clearable :options="triageOptions" placeholder="Triagem/Prioridade" />
                <n-select v-model:value="agendaFilters.appointmentTypeIds" multiple clearable :options="appointmentTypeOptions" placeholder="Tipo de atendimento" />
                <n-input v-model:value="agendaFilters.search" clearable placeholder="Buscar tutor, pet, telefone ou CPF..." />
              </div>
            </div>

            <div class="filters-section quick-filters-section">
              <p class="filters-section-title">Atalhos rápidos</p>
              <div class="quick-actions-grid">
                <button
                  v-for="chip in quickFilterChips"
                  :key="chip.key"
                  type="button"
                  class="quick-action-btn"
                  :class="{ active: activeQuickChip === chip.key, wide: chip.wide }"
                  @click="toggleQuickChip(chip.key)"
                >
                  {{ chip.label }}
                </button>
              </div>
            </div>
          </div>
        </n-card>

        <n-card :bordered="false" class="agenda-board-card">
          <div v-if="isMobile" class="mobile-day-list">
            <div class="mobile-day-nav">
              <button v-for="day in visibleDays" :key="day.toISOString()" type="button" class="mobile-day-chip" :class="{ active: isSameCalendarDay(day, agendaStartDate) }" @click="openDay(day)">
                {{ format(day, 'dd/MM') }}
              </button>
            </div>
            <div v-for="slot in timeSlots" :key="`m-${slot}`" class="mobile-slot-row">
              <p class="slot-hour">{{ slot }}</p>
              <div v-if="mobileSlotEvents(slot).length" class="mobile-slot-events">
                <button v-for="event in mobileSlotEvents(slot)" :key="event.id" type="button" class="event-block" :class="eventClass(event)" @click="openDetail(event)">
                  <strong>{{ petNameMap[event.petId] || event.pet?.name || 'Pet' }}</strong>
                  <span>{{ eventTypeLabel(event) }}</span>
                  <small>{{ clientNameMap[event.clientId] || event.client?.name || 'Tutor' }} · {{ statusLabel(event) }}</small>
                </button>
              </div>
              <button v-else type="button" class="free-slot" @click="openCreateFromSlot(agendaStartDate, slot, selectedVetIdSingle)">+ Agendar</button>
            </div>
          </div>

          <div v-else ref="agendaGridWrapRef" class="agenda-grid-wrap">
            <div class="agenda-grid" :class="{ weekly: agendaInnerMode === 'seven' }" :style="gridStyle">
              <div class="sticky-cell corner" />
              <div v-for="header in gridHeaders" :key="header.key" class="sticky-cell header-cell">
                <p class="header-title">{{ header.label }}</p>
                <p class="header-subtitle">{{ header.subLabel }}</p>
                <p class="header-meta">{{ header.meta }}</p>
              </div>

              <div class="time-track">
                <div v-for="slot in timeSlots" :key="`time-${slot}`" class="time-cell">{{ slot }}</div>
              </div>

              <div v-for="header in gridHeaders" :key="`col-${header.key}`" class="agenda-column">
                <button
                  v-for="slot in timeSlots"
                  :key="`${header.key}-${slot}`"
                  type="button"
                  class="slot-cell"
                  :class="{ covered: isSlotCovered(header, slot), 'outside-hours': isOutsideOperatingHours(slot, header.date) }"
                  @click="handleSlotClick(header, slot)"
                >
                  <span v-if="slotEvents(header, slot).length === 0 && !isSlotCovered(header, slot)" class="slot-hover-label">+ Agendar</span>
                </button>

                <button
                  v-for="event in getHeaderEventsWithLayout(header)"
                  :key="event.id"
                  type="button"
                  class="event-block calendar-event"
                  :class="eventClass(event)"
                  :style="eventPositionStyle(event)"
                  @click.stop="openDetail(event)"
                >
                  <span class="event-title-row">
                    <strong>{{ petNameMap[event.petId] || event.pet?.name || 'Pet' }}</strong>
                    <span :class="['event-triage-dot', getTriageMeta(event.triageRisk || null).className]" :title="triageLabel(event.triageRisk)" />
                  </span>
                  <span>{{ eventTypeLabel(event) }}</span>
                  <small>{{ clientNameMap[event.clientId] || event.client?.name || 'Tutor' }} · {{ eventTimeRange(event) }}</small>
                </button>
              </div>

              <div v-if="showNowLine" class="now-line-layer" :style="nowLineLayerStyle">
                <span class="now-line" :style="nowLineStyle" />
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <n-drawer v-model:show="showDetailDrawer" placement="right" width="420" :trap-focus="false">
        <n-drawer-content title="Detalhes do agendamento" closable>
          <div v-if="selectedAppointment" class="detail-content">
            <h3>{{ petNameMap[selectedAppointment.petId] || selectedAppointment.pet?.name || 'Pet' }}</h3>
            <p>{{ eventTypeLabel(selectedAppointment) }}</p>
            <p>Tutor: {{ clientNameMap[selectedAppointment.clientId] || selectedAppointment.client?.name || '-' }}</p>
            <p>Telefone: {{ selectedAppointment.client?.mobilePhone || selectedAppointment.client?.phone || '-' }}</p>
            <p>Veterinário: {{ selectedAppointment.veterinarianId ? usersMap[selectedAppointment.veterinarianId] : 'Não atribuído' }}</p>
            <p>Data: {{ format(new Date(selectedAppointment.startsAt), 'dd/MM/yyyy') }}</p>
            <p>Horário: {{ eventTimeRange(selectedAppointment) }}</p>
            <p>Status: {{ statusLabel(selectedAppointment) }}</p>
            <p>Triagem: {{ triageLabel(selectedAppointment.triageRisk) }}</p>
            <p>Motivo: {{ selectedAppointment.reason || '-' }}</p>
            <p>Observações: {{ selectedAppointment.notes || '-' }}</p>
            <div class="detail-actions">
              <n-button type="primary" @click="runPrimaryAction(selectedAppointment)">{{ primaryActionLabel(selectedAppointment) }}</n-button>
              <n-button @click="openEdit(selectedAppointment)">Reagendar/Editar</n-button>
              <n-button tertiary @click="showDetailDrawer = false">Fechar</n-button>
            </div>
          </div>
        </n-drawer-content>
      </n-drawer>
    </template>

    <template v-else-if="mode === 'list'">
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

      <n-data-table
        v-if="!isMobile"
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

      <div v-else class="card-list">
        <n-spin v-if="loading" size="small">
          <div class="mobile-state">Carregando agendamentos...</div>
        </n-spin>
        <div v-else-if="loadError" class="mobile-state mobile-state-error">
          <p>Erro ao carregar agendamentos.</p>
          <n-button tertiary type="primary" @click="fetchAppointments">Tentar novamente</n-button>
        </div>
        <div v-else-if="displayAppointments.length === 0" class="mobile-state">Nenhum resultado encontrado para os filtros aplicados.</div>
      </div>
    </template>

    <template v-else>
      <n-card :bordered="false" class="flow-placeholder">
        <p class="eyebrow">Em breve</p>
        <h3>Fluxo de atendimento</h3>
        <p>Esta visualização será definida posteriormente para acompanhar a jornada operacional dos atendimentos.</p>
      </n-card>
    </template>

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
          <n-button type="primary" :loading="saving" @click="submitAppointmentForm">{{ editingAppointment ? 'Salvar alterações' : 'Agendar' }}</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showQuickModal" :mask-closable="false" preset="card" class="appointment-modal quick-create-modal" style="width: 760px;">
      <template #header><div class="modal-head"><h3 class="modal-title">Cadastro rápido</h3><p class="modal-subtitle">Crie tutor, pet e agendamento em um único fluxo.</p></div></template>
      <n-form :model="quickForm" label-placement="top" :disabled="quickSaving">
        <div class="quick-sections">
          <section class="quick-section"><h4 class="quick-section-title">Tutor</h4><div class="quick-grid">
            <n-form-item label="Nome do tutor" required><n-input v-model:value="quickForm.client.name" /></n-form-item>
            <n-form-item label="Celular" required><n-input v-model:value="quickForm.client.mobilePhone" @update:value="onQuickMobilePhoneInput" /></n-form-item>
            <n-form-item label="CPF"><n-input v-model:value="quickForm.client.document" @update:value="onQuickDocumentInput" /></n-form-item>
            <n-form-item label="E-mail"><n-input v-model:value="quickForm.client.email" /></n-form-item>
          </div></section>
          <section class="quick-section"><h4 class="quick-section-title">Pet</h4><div class="quick-grid">
            <n-form-item label="Nome do pet" required><n-input v-model:value="quickForm.pet.name" /></n-form-item>
            <n-form-item label="Espécie" required><n-select v-model:value="quickForm.pet.speciesId" :options="speciesOptions" /></n-form-item>
            <n-form-item label="Raça"><n-select v-model:value="quickForm.pet.breedId" :options="breedOptions" clearable /></n-form-item>
            <n-form-item label="Sexo"><n-select v-model:value="quickForm.pet.sex" :options="sexOptions" clearable /></n-form-item>
          </div></section>
          <section class="quick-section"><h4 class="quick-section-title">Agendamento</h4><div class="quick-grid">
            <n-form-item label="Tipo de atendimento" required><n-select v-model:value="quickForm.appointment.appointmentTypeId" :options="appointmentTypeOptions" /></n-form-item>
            <n-form-item label="Data e hora" required><n-date-picker v-model:value="quickForm.appointment.startsAt" type="datetime" format="dd/MM/yyyy HH:mm" style="width: 100%" /></n-form-item>
            <n-form-item label="Veterinário(a)" class="full-row"><n-select v-model:value="quickForm.appointment.veterinarianId" :options="veterinarianOptions" clearable /></n-form-item>
            <n-form-item label="Motivo / Queixa" class="full-row"><n-input v-model:value="quickForm.appointment.reason" /></n-form-item>
          </div></section>
        </div>
      </n-form>
      <template #footer><div class="modal-actions"><n-button tertiary :disabled="quickSaving" @click="showQuickModal = false">Cancelar</n-button><n-button type="primary" :loading="quickSaving" @click="handleQuickSubmit">Criar ficha e agendar</n-button></div></template>
    </n-modal>

    <n-modal v-model:show="showCheckInModal" preset="card" style="width: 520px">
      <template #header><p class="eyebrow" style="margin: 0">Check-in</p></template>
      <n-form :model="checkInForm" label-placement="top" :disabled="checkInSaving"><n-form-item label="Motivo / Queixa" required><n-input v-model:value="checkInForm.reason" type="textarea" :rows="4" /></n-form-item></n-form>
      <template #footer><div class="modal-actions"><n-button tertiary :disabled="checkInSaving" @click="showCheckInModal = false">Cancelar</n-button><n-button type="primary" :loading="checkInSaving" @click="handleCheckIn">Registrar chegada</n-button></div></template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { NButton, NDropdown, NSpace, useDialog, useMessage } from 'naive-ui'
import { addDays, format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AppointmentForm, { type AppointmentPayload } from '~/components/appointments/AppointmentForm.vue'
import { formatBrazilPhone } from '~/composables/useBrazilPhone'

const message = useMessage()
const dialog = useDialog()

const mode = ref<'agenda' | 'list' | 'flow'>('agenda')
const viewTabs = [
  { label: 'Agenda', value: 'agenda' },
  { label: 'Lista', value: 'list' },
  { label: 'Fluxo', value: 'flow' }
]
const agendaInnerMode = ref<'seven' | 'day'>('day')
const agendaStartDate = ref(new Date())
const agendaSelectedDate = ref<number | null>(Date.now())
const activeQuickChip = ref<string | null>(null)

const appointments = ref<any[]>([])
const agendaAppointments = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showQuickModal = ref(false)
const showCheckInModal = ref(false)
const editingAppointment = ref<AppointmentPayload | null>(null)
const appointmentFormRef = ref<{
  submit: () => Promise<void>
  setStartsAtConflictError: (msg: string) => void
  clearStartsAtConflictError: () => void
} | null>(null)
const quickSaving = ref(false)
const checkInSaving = ref(false)
const checkInTarget = ref<any | null>(null)
const loadError = ref(false)
const isMobile = ref(false)
const showDetailDrawer = ref(false)
const selectedAppointment = ref<any | null>(null)
const agendaGridWrapRef = ref<HTMLElement | null>(null)
const clinicBusinessHoursJson = ref<string | null>(null)
const nowTs = ref(Date.now())
let nowTickTimer: ReturnType<typeof setInterval> | null = null
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
  if (isMobile.value) agendaInnerMode.value = 'day'
}

const statusesMap = ref<Record<number, { id?: number, name: string, code: string }>>({})
const typesMap = ref<Record<number, string>>({})
const usersMap = ref<Record<number, string>>({})
const clientNameMap = ref<Record<number, string>>({})
const petNameMap = ref<Record<number, string>>({})

const filters = reactive({
  search: '',
  period: null as 'TODAY' | 'TOMORROW' | 'WEEK' | 'CUSTOM' | null,
  date: null as number | null,
  veterinarianId: null,
  statusId: null,
  triageRisk: null as 'VERDE' | 'AMARELA' | 'VERMELHA' | 'PENDING' | null
})

const agendaFilters = reactive({
  search: '',
  veterinarianIds: [] as number[],
  statusIds: [] as number[],
  triageRisk: [] as string[],
  appointmentTypeIds: [] as number[]
})

const veterinarianOptions = ref<{ label: string, value: number }[]>([])
const statusOptions = ref<{ label: string, value: number }[]>([])
const speciesOptions = ref<{ label: string, value: number }[]>([])
const breedOptions = ref<{ label: string, value: number }[]>([])
const appointmentTypeOptions = ref<{ label: string, value: number }[]>([])

const triageOptions = [
  { label: 'Não triado', value: 'PENDING' },
  { label: 'Verde', value: 'VERDE' },
  { label: 'Amarela', value: 'AMARELA' },
  { label: 'Vermelha', value: 'VERMELHA' },
  { label: 'Emergência', value: 'EMERGENCY' }
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

const quickFilterChips = [
  { key: 'late', label: 'Atrasados', wide: true },
  { key: 'urgent', label: 'Urgentes', wide: true },
  { key: 'novet', label: 'Sem veterinário', wide: true },
  { key: 'noconfirm', label: 'Sem confirmação', wide: true },
  { key: 'checkin', label: 'Check-ins pendentes', wide: true }
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
const onQuickDocumentInput = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14)
  quickForm.client.document = digits
}

const pagination = reactive({ page: 1, pageSize: 10, itemCount: 0, showSizePicker: true, pageSizes: [10, 20, 50] })

const toArray = <T = any>(response: any): T[] => {
  if (Array.isArray(response?.data)) return response.data as T[]
  if (Array.isArray(response?.items)) return response.items as T[]
  if (Array.isArray(response)) return response as T[]
  return []
}

const getStatusMeta = (status?: { code?: string, name?: string } | null) => {
  const code = status?.code || ''
  const name = (status?.name || '').trim()
  if (code === 'ARRIVED' || name.toLowerCase() === 'chegou') return { label: 'Chegou', className: 'status-arrived' }
  if (code === 'SCHEDULED' || name.toLowerCase() === 'agendado') return { label: 'Agendado', className: 'status-scheduled' }
  if (code === 'CONFIRMED') return { label: 'Confirmado', className: 'status-confirmed' }
  if (code === 'IN_PROGRESS' || name.toLowerCase() === 'em atendimento') return { label: 'Em atendimento', className: 'status-in-progress' }
  if (code === 'COMPLETED' || name.toLowerCase() === 'finalizado') return { label: 'Finalizado', className: 'status-completed' }
  if (code === 'CANCELED' || name.toLowerCase() === 'cancelado') return { label: 'Cancelado', className: 'status-canceled' }
  if (code === 'NO_SHOW') return { label: 'Não compareceu', className: 'status-canceled' }
  return { label: name || 'Pendente', className: 'status-default' }
}
const triageLabel = (risk?: string | null) => {
  if (risk === 'VERDE' || risk === 'GREEN') return 'Verde'
  if (risk === 'AMARELA' || risk === 'YELLOW') return 'Amarela'
  if (risk === 'VERMELHA' || risk === 'RED') return 'Vermelha'
  if (risk === 'EMERGENCY') return 'Emergência'
  return 'Não triado'
}

const getTriageMeta = (risk?: string | null) => {
  const label = triageLabel(risk)
  if (label === 'Amarela') return { label, className: 'triage-yellow' }
  if (label === 'Verde') return { label, className: 'triage-green' }
  if (label === 'Vermelha') return { label, className: 'triage-red' }
  if (label === 'Emergência') return { label, className: 'triage-emergency' }
  return { label, className: 'triage-pending' }
}

const selectedVetIdSingle = computed(() => agendaFilters.veterinarianIds.length === 1 ? agendaFilters.veterinarianIds[0] : null)
const vetSelectionScope = computed<'all' | 'single' | 'multi'>(() => {
  if (!agendaFilters.veterinarianIds.length) return 'all'
  if (agendaFilters.veterinarianIds.length === 1) return 'single'
  return 'multi'
})

const visibleDays = computed(() => {
  if (agendaInnerMode.value === 'day') return [agendaStartDate.value]
  return Array.from({ length: 7 }, (_v, i) => addDays(agendaStartDate.value, i))
})

const agendaPeriodLabel = computed(() => {
  const start = visibleDays.value[0]
  const end = visibleDays.value[visibleDays.value.length - 1]
  if (!start || !end) return ''
  if (agendaInnerMode.value === 'day') return format(start, 'dd/MM/yyyy')
  return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`
})

const agendaVeterinarianOptions = computed(() => veterinarianOptions.value)

const agendaFilteredAppointments = computed(() => {
  const term = agendaFilters.search.trim().toLowerCase()
  const start = new Date(visibleDays.value[0]); start.setHours(0, 0, 0, 0)
  const end = new Date(visibleDays.value[visibleDays.value.length - 1]); end.setHours(23, 59, 59, 999)

  return agendaAppointments.value.filter((row: any) => {
    const d = new Date(row.startsAt)
    if (d < start || d > end) return false
    if (agendaFilters.veterinarianIds.length && !agendaFilters.veterinarianIds.includes(Number(row.veterinarianId))) return false
    if (agendaFilters.statusIds.length && !agendaFilters.statusIds.includes(Number(row.statusId))) return false
    if (agendaFilters.appointmentTypeIds.length && !agendaFilters.appointmentTypeIds.includes(Number(row.appointmentTypeId))) return false
    if (agendaFilters.triageRisk.length && !agendaFilters.triageRisk.includes(row.triageRisk || 'PENDING')) return false
    if (term) {
      const raw = [
        clientNameMap.value[row.clientId] || row.client?.name || '',
        petNameMap.value[row.petId] || row.pet?.name || '',
        row.client?.mobilePhone || row.client?.phone || '',
        row.client?.document || ''
      ].join(' ').toLowerCase()
      if (!raw.includes(term)) return false
    }

    if (activeQuickChip.value === 'today' && !isSameDay(d, new Date())) return false
    if (activeQuickChip.value === 'tomorrow' && !isSameDay(d, addDays(new Date(), 1))) return false
    if (activeQuickChip.value === 'late') {
      const code = (row.status || statusesMap.value[row.statusId])?.code
      if (!(new Date(row.startsAt) < new Date() && ['SCHEDULED', 'CONFIRMED'].includes(code))) return false
    }
    if (activeQuickChip.value === 'urgent' && !['VERMELHA', 'EMERGENCY', 'RED'].includes(row.triageRisk)) return false
    if (activeQuickChip.value === 'novet' && row.veterinarianId) return false
    if (activeQuickChip.value === 'noconfirm') {
      const code = (row.status || statusesMap.value[row.statusId])?.code
      if (code !== 'SCHEDULED') return false
    }
    if (activeQuickChip.value === 'checkin') {
      const code = (row.status || statusesMap.value[row.statusId])?.code
      if (!['SCHEDULED', 'CONFIRMED'].includes(code)) return false
    }
    return true
  })
})

const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 0; h < 24; h += 1) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
})

const dayTotalAppointments = (day: Date) => {
  return agendaFilteredAppointments.value.filter((row: any) => isSameDay(new Date(row.startsAt), day)).length
}

const vetTotalAppointments = (vetId: number) => {
  return agendaFilteredAppointments.value.filter((row: any) => isSameDay(new Date(row.startsAt), agendaStartDate.value) && Number(row.veterinarianId) === Number(vetId)).length
}

const gridHeaders = computed(() => {
  if (agendaInnerMode.value === 'seven') {
    return visibleDays.value.map((d) => ({
      key: d.toISOString(),
      label: isSameDay(d, new Date()) ? 'Hoje' : format(d, 'EEE', { locale: ptBR }),
      subLabel: format(d, 'dd/MM'),
      meta: `${dayTotalAppointments(d)} agendamentos`,
      date: d,
      veterinarianId: selectedVetIdSingle.value
    }))
  }
  const vetIds = vetSelectionScope.value === 'all' ? veterinarianOptions.value.map((v) => v.value) : agendaFilters.veterinarianIds
  return vetIds.map((id) => ({
    key: String(id),
    label: usersMap.value[id] || `Vet ${id}`,
    subLabel: `${format(agendaStartDate.value, 'EEE', { locale: ptBR })} · ${format(agendaStartDate.value, 'dd/MM')}`,
    meta: `${vetTotalAppointments(id)} agendamentos`,
    date: agendaStartDate.value,
    veterinarianId: id
  }))
})

const SLOT_HEIGHT = 72
const DEFAULT_OPERATING_START_MINUTES = 8 * 60
const DEFAULT_OPERATING_END_MINUTES = 18 * 60
const gridStyle = computed(() => ({ '--agenda-columns': String(gridHeaders.value.length) }))
const showNowLine = computed(() => {
  const today = new Date(nowTs.value)
  if (agendaInnerMode.value === 'day') return isSameDay(agendaStartDate.value, today)
  return visibleDays.value.some((d) => isSameDay(d, today))
})
const nowLineTop = computed(() => {
  const now = new Date(nowTs.value)
  const minutes = now.getHours() * 60 + now.getMinutes()
  return (minutes / 30) * SLOT_HEIGHT + 4
})
const nowLineStyle = computed(() => ({
  top: `${nowLineTop.value}px`
}))
const nowLineLayerStyle = computed(() => {
  if (agendaInnerMode.value === 'day') {
    return {
      '--now-col-start': '0',
      '--now-col-span': String(Math.max(1, gridHeaders.value.length))
    } as Record<string, string>
  }
  const today = new Date(nowTs.value)
  const dayIndex = visibleDays.value.findIndex((d) => isSameDay(d, today))
  if (dayIndex < 0) return { display: 'none' } as Record<string, string>
  const col = dayIndex + 1
  return {
    '--now-col-start': String(dayIndex),
    '--now-col-span': '1'
  } as Record<string, string>
})

const slotToMinutes = (slot: string) => {
  const [hh, mm] = slot.split(':').map(Number)
  return hh * 60 + mm
}

const dayAliases: Record<string, number> = {
  dom: 0, domingo: 0, sunday: 0, sun: 0,
  seg: 1, segunda: 1, monday: 1, mon: 1,
  ter: 2, terca: 2, terça: 2, tuesday: 2, tue: 2,
  qua: 3, quarta: 3, wednesday: 3, wed: 3,
  qui: 4, quinta: 4, thursday: 4, thu: 4,
  sex: 5, sexta: 5, friday: 5, fri: 5,
  sab: 6, sabado: 6, sábado: 6, saturday: 6, sat: 6
}

const parseHourToMinutes = (value: string) => {
  const match = value.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

const parsedBusinessHours = computed<Record<number, Array<[number, number]>>>(() => {
  const fallback = { 0: [[DEFAULT_OPERATING_START_MINUTES, DEFAULT_OPERATING_END_MINUTES]], 1: [[DEFAULT_OPERATING_START_MINUTES, DEFAULT_OPERATING_END_MINUTES]], 2: [[DEFAULT_OPERATING_START_MINUTES, DEFAULT_OPERATING_END_MINUTES]], 3: [[DEFAULT_OPERATING_START_MINUTES, DEFAULT_OPERATING_END_MINUTES]], 4: [[DEFAULT_OPERATING_START_MINUTES, DEFAULT_OPERATING_END_MINUTES]], 5: [[DEFAULT_OPERATING_START_MINUTES, DEFAULT_OPERATING_END_MINUTES]], 6: [[DEFAULT_OPERATING_START_MINUTES, DEFAULT_OPERATING_END_MINUTES]] } as Record<number, Array<[number, number]>>
  const raw = clinicBusinessHoursJson.value
  if (!raw || !String(raw).trim()) return fallback

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback
    const mapped: Record<number, Array<[number, number]>> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }

    Object.entries(parsed).forEach(([key, ranges]) => {
      const dayIndex = dayAliases[String(key).toLowerCase()]
      if (dayIndex === undefined || !Array.isArray(ranges)) return
      for (const range of ranges) {
        if (typeof range !== 'string') continue
        const [startRaw, endRaw] = range.split('-')
        const start = parseHourToMinutes(String(startRaw || '').trim())
        const end = parseHourToMinutes(String(endRaw || '').trim())
        if (start === null || end === null || end <= start) continue
        mapped[dayIndex].push([start, end])
      }
    })

    return mapped
  } catch {
    return fallback
  }
})

const isOutsideOperatingHours = (slot: string, date: Date) => {
  const minutes = slotToMinutes(slot)
  const ranges = parsedBusinessHours.value[date.getDay()] || []
  if (!ranges.length) return true
  return !ranges.some(([start, end]) => minutes >= start && minutes < end)
}

const getHeaderEvents = (header: any) => {
  return agendaFilteredAppointments.value.filter((row: any) => {
    const d = new Date(row.startsAt)
    const inDate = isSameDay(d, header.date)
    const vetMatch = header.veterinarianId ? Number(row.veterinarianId) === Number(header.veterinarianId) : true
    return inDate && vetMatch
  })
}

const getHeaderEventsWithLayout = (header: any) => {
  const events = getHeaderEvents(header).map((row: any) => {
    const start = new Date(row.startsAt)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const duration = Math.max(15, getEventDurationMinutes(row))
    return {
      ...row,
      __startMinutes: startMinutes,
      __endMinutes: startMinutes + duration,
      __lane: 0,
      __laneCount: 1
    }
  })

  if (events.length <= 1) return events

  events.sort((a: any, b: any) => a.__startMinutes - b.__startMinutes || b.__endMinutes - a.__endMinutes)

  let clusterStart = 0
  let clusterEnd = -1
  let activeLanes: number[] = []
  let clusterLaneMax = 1

  const commitCluster = (from: number, to: number, laneCount: number) => {
    for (let i = from; i <= to; i += 1) events[i].__laneCount = Math.max(1, laneCount)
  }

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i]

    if (i === 0 || event.__startMinutes >= clusterEnd) {
      if (i > 0) commitCluster(clusterStart, i - 1, clusterLaneMax)
      clusterStart = i
      clusterEnd = event.__endMinutes
      activeLanes = []
      clusterLaneMax = 1
    } else {
      clusterEnd = Math.max(clusterEnd, event.__endMinutes)
    }

    for (let lane = 0; lane < activeLanes.length; lane += 1) {
      if (activeLanes[lane] <= event.__startMinutes) activeLanes[lane] = -1
    }
    let laneIndex = activeLanes.findIndex((end) => end === -1)
    if (laneIndex === -1) {
      laneIndex = activeLanes.length
      activeLanes.push(event.__endMinutes)
    } else {
      activeLanes[laneIndex] = event.__endMinutes
    }

    event.__lane = laneIndex
    clusterLaneMax = Math.max(clusterLaneMax, activeLanes.length)
  }

  commitCluster(clusterStart, events.length - 1, clusterLaneMax)
  return events
}

const slotEvents = (header: any, slot: string) => {
  const slotMinutes = slotToMinutes(slot)
  return getHeaderEvents(header).filter((row: any) => {
    const d = new Date(row.startsAt)
    const startMinutes = d.getHours() * 60 + d.getMinutes()
    return startMinutes === slotMinutes
  })
}

const mobileSlotEvents = (slot: string) => {
  const slotMinutes = slotToMinutes(slot)
  const header = { date: agendaStartDate.value, veterinarianId: selectedVetIdSingle.value }
  return getHeaderEventsWithLayout(header).filter((row: any) => row.__startMinutes === slotMinutes)
}
const isSlotCovered = (header: any, slot: string) => {
  const slotMinutes = slotToMinutes(slot)
  return getHeaderEvents(header).some((row: any) => {
    const d = new Date(row.startsAt)
    const startMinutes = d.getHours() * 60 + d.getMinutes()
    const duration = getEventDurationMinutes(row)
    const endMinutes = startMinutes + duration
    return slotMinutes > startMinutes && slotMinutes < endMinutes
  })
}

const handleSlotClick = (header: any, slot: string) => {
  if (isSlotCovered(header, slot)) return
  if (isOutsideOperatingHours(slot, header.date)) {
    dialog.warning({
      title: 'Horário fora do funcionamento',
      content: 'Este horário está fora do funcionamento da clínica, das 08:00 às 18:00. Deseja continuar mesmo assim?',
      positiveText: 'Continuar',
      negativeText: 'Cancelar',
      onPositiveClick: () => openCreateFromSlot(header.date, slot, header.veterinarianId || null)
    })
    return
  }
  openCreateFromSlot(header.date, slot, header.veterinarianId || null)
}

const isSameCalendarDay = (a: Date, b: Date) => isSameDay(a, b)

const eventTypeLabel = (row: any) => row.appointmentType?.name || typesMap.value[row.appointmentTypeId] || 'Atendimento'
const statusLabel = (row: any) => getStatusMeta(row.status || statusesMap.value[row.statusId] || null).label
const getEventDurationMinutes = (row: any) => {
  const direct = Number(row?.durationMinutes || row?.duration || row?.durationInMinutes || 0)
  if (direct > 0) return direct
  if (row?.startsAt && row?.endsAt) {
    const start = new Date(row.startsAt).getTime()
    const end = new Date(row.endsAt).getTime()
    const diff = Math.round((end - start) / 60000)
    if (diff > 0) return diff
  }
  return 30
}
const eventTimeRange = (row: any) => {
  const start = new Date(row.startsAt)
  const duration = getEventDurationMinutes(row)
  const end = new Date(start.getTime() + duration * 60000)
  return `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`
}
const eventClass = (row: any) => [getStatusMeta(row.status || statusesMap.value[row.statusId] || null).className, getTriageMeta(row.triageRisk || null).className]
const eventStyle = (row: any) => {
  const duration = Math.max(15, getEventDurationMinutes(row))
  const verticalGap = 8
  const span = duration / 30
  const height = Math.max(SLOT_HEIGHT - verticalGap, span * SLOT_HEIGHT - verticalGap)
  return {
    height: `${height}px`,
    minHeight: `${height}px`
  }
}
const eventPositionStyle = (row: any) => {
  const start = new Date(row.startsAt)
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const duration = Math.max(15, getEventDurationMinutes(row))
  const top = (startMinutes / 30) * SLOT_HEIGHT + 4
  const height = (duration / 30) * SLOT_HEIGHT - 8
  const lane = Number(row.__lane || 0)
  const laneCount = Math.max(1, Number(row.__laneCount || 1))
  const widthPercent = 100 / laneCount
  const leftPercent = lane * widthPercent
  const laneGapPx = laneCount > 1 ? 4 : 0
  return {
    top: `${top}px`,
    height: `${Math.max(28, height)}px`,
    minHeight: `${Math.max(28, height)}px`,
    left: `calc(${leftPercent}% + 5px + ${laneGapPx}px)`,
    width: `calc(${widthPercent}% - 12px - ${laneGapPx}px)`,
    right: 'auto'
  }
}

const openDetail = (row: any) => {
  selectedAppointment.value = row
  showDetailDrawer.value = true
}

const primaryActionLabel = (row: any) => {
  const code = (row.status || statusesMap.value[row.statusId])?.code
  if (code === 'SCHEDULED' || code === 'CONFIRMED') return 'Check-in'
  if (code === 'ARRIVED') return 'Iniciar triagem'
  if (code === 'IN_TRIAGE') return 'Iniciar atendimento'
  if (code === 'IN_PROGRESS') return 'Ver atendimento'
  if (code === 'COMPLETED') return 'Ver prontuário'
  return 'Ver detalhes'
}
const runPrimaryAction = (row: any) => {
  const action = primaryActionLabel(row)
  if (action === 'Check-in') openCheckIn(row)
  else message.info('Ação contextual será integrada com o fluxo clínico.')
}

const toggleQuickChip = (key: string) => {
  activeQuickChip.value = activeQuickChip.value === key ? null : key
  if (key === 'today') {
    agendaInnerMode.value = 'day'
    agendaStartDate.value = new Date()
  }
  if (key === 'tomorrow') {
    agendaInnerMode.value = 'day'
    agendaStartDate.value = addDays(new Date(), 1)
  }
}

const matchesPeriodFilter = (startsAt: string) => {
  if (!filters.period) return true
  const date = new Date(startsAt)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7)
  if (filters.period === 'TODAY') return date >= todayStart && date < tomorrowStart
  if (filters.period === 'TOMORROW') {
    const dayAfter = new Date(tomorrowStart); dayAfter.setDate(dayAfter.getDate() + 1)
    return date >= tomorrowStart && date < dayAfter
  }
  if (filters.period === 'WEEK') return date >= todayStart && date < weekEnd
  if (filters.period === 'CUSTOM' && filters.date) {
    const custom = new Date(filters.date)
    const start = new Date(custom.getFullYear(), custom.getMonth(), custom.getDate())
    const end = new Date(start); end.setDate(end.getDate() + 1)
    return date >= start && date < end
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

const actionOptionsFor = () => [
  { label: 'Ver detalhes', key: 'view' },
  { label: 'Editar', key: 'edit' },
  { label: 'Reagendar', key: 'reschedule' },
  { label: 'Cancelar agendamento', key: 'cancel' },
  { label: 'Excluir', key: 'delete' }
]

const columns = [
  { title: () => h('span', { class: 'th-nowrap' }, 'Horário / Data'), key: 'startsAt', width: 160, render: (row: any) => h('div', [h('div', { class: 'cell-strong' }, format(new Date(row.startsAt), 'HH:mm')), h('div', { class: 'cell-muted' }, format(new Date(row.startsAt), 'dd/MM/yyyy'))]) },
  { title: () => h('span', { class: 'th-nowrap' }, 'Cliente / Pet'), key: 'clientPet', width: 280, render: (row: any) => h('div', [h('div', { class: 'cell-strong' }, clientNameMap.value[row.clientId] || 'Carregando...'), h('div', { class: 'cell-muted' }, `Pet: ${petNameMap.value[row.petId] || 'Carregando...'}`)]) },
  { title: () => h('span', { class: 'th-nowrap' }, 'Atendimento'), key: 'type', width: 220, render: (row: any) => h('span', { class: 'cell-nowrap' }, row.appointmentType?.name || typesMap.value[row.appointmentTypeId] || '-') },
  { title: () => h('span', { class: 'th-nowrap' }, 'Veterinário'), key: 'vet', width: 190, render: (row: any) => h('span', { class: 'cell-nowrap' }, row.veterinarianId ? usersMap.value[row.veterinarianId] : 'Não atribuído') },
  { title: () => h('span', { class: 'th-nowrap' }, 'Status'), key: 'status', width: 150, render: (row: any) => h('span', { class: ['status-pill', getStatusMeta(row.status || statusesMap.value[row.statusId] || null).className] }, statusLabel(row)) },
  { title: () => h('span', { class: 'th-nowrap' }, 'Triagem'), key: 'triageRisk', width: 140, render: (row: any) => h('span', { class: ['triage-pill', getTriageMeta(row.triageRisk || null).className] }, [h('span', { class: 'triage-dot' }), h('span', triageLabel(row.triageRisk || null))]) },
  { title: () => h('span', { class: 'th-nowrap' }, 'Ações'), key: 'actions', width: 170, render: (row: any) => h('div', { class: 'actions', style: 'justify-content: flex-end;' }, [h(NButton, { size: 'small', secondary: true, type: 'primary', disabled: row.status?.code === 'ARRIVED', onClick: (e) => { e.stopPropagation(); openCheckIn(row) } }, { default: () => 'Check-in' }), h(NDropdown, { trigger: 'click', options: actionOptionsFor(), onSelect: (key: string) => handleActionSelect(key, row) }, { default: () => h(NButton, { size: 'small', quaternary: true, class: 'menu-button', onClick: (e) => e.stopPropagation() }, { default: () => '⋯' }) })]) }
]

const loadLookups = async () => {
  const api = useApi()
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
}

const loadClinicSettings = async () => {
  try {
    const api = useApi()
    const settings = await api<any>('/api/v1/clinic-settings')
    clinicBusinessHoursJson.value = settings?.businessHoursJson || null
  } catch {
    clinicBusinessHoursJson.value = null
  }
}

const triageWeight = (risk?: string | null) => {
  if (risk === 'VERMELHA' || risk === 'EMERGENCY' || risk === 'RED') return 3
  if (risk === 'AMARELA' || risk === 'YELLOW') return 2
  if (risk === 'VERDE' || risk === 'GREEN') return 1
  return 0
}

const fetchAppointments = async () => {
  loading.value = true
  loadError.value = false
  try {
    const api = useApi()
    const queryParams: any = { page: pagination.page, limit: pagination.pageSize }
    if (filters.veterinarianId) queryParams.veterinarianId = filters.veterinarianId
    if (filters.statusId) queryParams.statusId = filters.statusId
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

const fetchAgendaAppointments = async () => {
  try {
    const api = useApi()
    const res = await api<any>('/api/v1/appointments', { query: { page: 1, limit: 500 } })
    const items = toArray(res)
    agendaAppointments.value = [...items].sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  } catch (_err) {
    message.error('Erro ao carregar agenda operacional')
  }
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
const handleFilter = () => { pagination.page = 1; fetchAppointments() }
const handlePageChange = (p: number) => { pagination.page = p; fetchAppointments() }
const handlePageSizeChange = (s: number) => { pagination.pageSize = s; pagination.page = 1; fetchAppointments() }

const handleSubmit = async (payload: AppointmentPayload) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) await api(`/api/v1/appointments/${payload.id}`, { method: 'PATCH', body: payload })
    else await api('/api/v1/appointments', { method: 'POST', body: payload })
    closeModal()
    await fetchAppointments()
    await fetchAgendaAppointments()
    message.success(payload.id ? 'Agendamento atualizado' : 'Agendamento criado')
  } catch (err: any) {
    const statusCode = Number(err?.statusCode || err?.data?.statusCode || 0)
    if (statusCode === 409) {
      const conflictMessage =
        err?.data?.message ||
        'Conflito de horário: já existe agendamento para este veterinário nesse período.'
      appointmentFormRef.value?.setStartsAtConflictError?.(conflictMessage)
      message.warning(
        conflictMessage,
      )
      return
    }
    message.error(err?.data?.message || 'Erro ao salvar agendamento')
  } finally {
    saving.value = false
  }
}

const cancelAppointment = async (appointment: any) => {
  const canceledStatus = Object.values(statusesMap.value).find((s) => s.code === 'CANCELED')
  if (!canceledStatus?.id) return
  const api = useApi()
  await api(`/api/v1/appointments/${appointment.id}`, { method: 'PATCH', body: { statusId: Number(canceledStatus.id) } })
  await fetchAppointments()
  await fetchAgendaAppointments()
}

const confirmDelete = (appointment: any) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: 'Deseja excluir este agendamento?',
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      await api(`/api/v1/appointments/${appointment.id}`, { method: 'DELETE' })
      await fetchAppointments()
      await fetchAgendaAppointments()
    }
  })
}

const handleActionSelect = (key: string, row: any) => {
  if (key === 'view') return openDetail(row)
  if (key === 'edit' || key === 'reschedule') return openEdit(row)
  if (key === 'cancel') {
    dialog.warning({ title: 'Cancelar agendamento', content: 'Deseja cancelar este agendamento?', positiveText: 'Cancelar agendamento', negativeText: 'Voltar', onPositiveClick: async () => { await cancelAppointment(row) } })
    return
  }
  if (key === 'delete') confirmDelete(row)
}

const openCreate = () => {
  appointmentFormRef.value?.clearStartsAtConflictError?.()
  editingAppointment.value = null
  showModal.value = true
}
const openQuickCreate = () => {
  Object.assign(quickForm.client, { name: '', document: '', mobilePhone: '', email: '' })
  Object.assign(quickForm.pet, { name: '', speciesId: null, breedId: null, sex: null })
  Object.assign(quickForm.appointment, { appointmentTypeId: appointmentTypeOptions.value[0]?.value ?? null, veterinarianId: null, startsAt: Date.now(), reason: '' })
  showQuickModal.value = true
}

const openCreateFromSlot = (day: Date, slot: string, veterinarianId: number | null) => {
  const [hh, mm] = slot.split(':').map(Number)
  const starts = new Date(day)
  starts.setHours(hh, mm, 0, 0)
  openCreate()
  editingAppointment.value = {
    clientId: null as any,
    petId: null as any,
    appointmentTypeId: null as any,
    statusId: null as any,
    startsAt: starts.toISOString(),
    veterinarianId: veterinarianId || null,
    triageRisk: null,
    reason: '',
    notes: ''
  } as any
}

const handleQuickSubmit = async () => {
  if (!quickForm.client.name || !quickForm.client.mobilePhone || !quickForm.pet.name || !quickForm.pet.speciesId || !quickForm.appointment.appointmentTypeId || !quickForm.appointment.startsAt) {
    message.warning('Preencha os campos obrigatórios.')
    return
  }
  quickSaving.value = true
  try {
    const api = useApi()
    await api('/api/v1/appointments/quick-create', { method: 'POST', body: { client: quickForm.client, pet: quickForm.pet, appointment: { ...quickForm.appointment, startsAt: new Date(quickForm.appointment.startsAt).toISOString() } } })
    showQuickModal.value = false
    await loadLookups()
    await fetchAppointments()
    await fetchAgendaAppointments()
  } catch (err: any) {
    const statusCode = Number(err?.statusCode || err?.data?.statusCode || 0)
    if (statusCode === 409) {
      message.warning(
        err?.data?.message ||
          'Conflito de horário: já existe agendamento para este veterinário nesse período.',
      )
      return
    }
    message.error(err?.data?.message || 'Erro ao criar cadastro rápido')
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
  if (!checkInTarget.value || !checkInForm.reason.trim()) return
  checkInSaving.value = true
  try {
    const api = useApi()
    await api(`/api/v1/appointments/${checkInTarget.value.id}/check-in`, { method: 'POST', body: { reason: checkInForm.reason } })
    showCheckInModal.value = false
    await fetchAppointments()
    await fetchAgendaAppointments()
  } finally {
    checkInSaving.value = false
  }
}

const openEdit = (appointment: any) => {
  appointmentFormRef.value?.clearStartsAtConflictError?.()
  editingAppointment.value = appointment
  showModal.value = true
}
const closeModal = () => {
  appointmentFormRef.value?.clearStartsAtConflictError?.()
  showModal.value = false
}
const submitAppointmentForm = async () => { await appointmentFormRef.value?.submit() }
const rowProps = (row: any) => ({ style: { cursor: 'pointer' }, onClick: () => openEdit(row) })

const goToToday = () => {
  agendaStartDate.value = new Date()
  agendaSelectedDate.value = Date.now()
}
const goPrevious = () => {
  agendaStartDate.value = addDays(agendaStartDate.value, agendaInnerMode.value === 'seven' ? -7 : -1)
  agendaSelectedDate.value = agendaStartDate.value.getTime()
}
const goNext = () => {
  agendaStartDate.value = addDays(agendaStartDate.value, agendaInnerMode.value === 'seven' ? 7 : 1)
  agendaSelectedDate.value = agendaStartDate.value.getTime()
}
const handleAgendaDateSelect = (value: number | null) => {
  if (!value) return
  agendaStartDate.value = new Date(value)
}
const openDay = (day: Date) => {
  agendaStartDate.value = day
  agendaSelectedDate.value = day.getTime()
  agendaInnerMode.value = 'day'
}

const scrollAgendaToCurrentTime = async () => {
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  if (isMobile.value) return
  const el = agendaGridWrapRef.value
  if (!el) return

  const now = new Date()
  const slotHeight = 72
  const headerHeight = 56
  const slotIndex = now.getHours() * 2 + Math.floor(now.getMinutes() / 30)
  const target = Math.max(0, headerHeight + slotIndex * slotHeight - el.clientHeight * 0.25)
  el.scrollTop = target
}

watch(mode, async (value) => {
  if (value === 'agenda') await scrollAgendaToCurrentTime()
})

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 768px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  nowTickTimer = setInterval(() => { nowTs.value = Date.now() }, 30 * 1000)
  await Promise.all([loadLookups(), loadClinicSettings()])
  await Promise.all([fetchAppointments(), fetchAgendaAppointments()])
  await scrollAgendaToCurrentTime()
})

onBeforeUnmount(() => {
  if (nowTickTimer) clearInterval(nowTickTimer)
  mediaQuery?.removeEventListener('change', updateIsMobile)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page:has(.agenda-workspace) {
  height: calc(100dvh - 104px);
  min-height: 0;
  overflow: hidden;
}
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.head-copy { display: flex; flex-direction: column; gap: 4px; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 0; font-size: 22px; line-height: 1.15; }
.subhead { margin: 0; color: #4b5563; font-size: 14px; max-width: 760px; }
.head-actions { align-items: center; }

.view-tabs { display: inline-flex; gap: 6px; padding: 4px; border-radius: 12px; background: #f1f5f9; width: fit-content; }
.tab-btn { border: 0; background: transparent; border-radius: 10px; padding: 8px 14px; font-weight: 600; color: #334155; }
.tab-btn.active { background: #fff; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.16); color: #0f172a; }

.period-controls { display: flex; align-items: center; gap: 8px; }
.period-navigation { display: flex; align-items: center; gap: 6px; min-width: 0; }
.period-controls :deep(.n-button),
.period-controls :deep(.n-radio-button),
.period-navigation :deep(.n-button) {
  height: 28px;
}
.period-navigation :deep(.n-button) {
  --n-height: 28px !important;
}
.period-icon-button {
  width: 28px;
  min-width: 28px;
  padding: 0;
}
.period-label { margin: 0; font-weight: 700; color: #0f172a; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agenda-workspace {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 12px;
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
  overflow: hidden;
}
.agenda-filters-card { width: 270px; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%); }
.agenda-filters-card :deep(.n-card__content) {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px !important;
}
.agenda-filters-scroll {
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  scrollbar-gutter: stable;
}
.agenda-sidebar-period {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 0 12px;
  border-bottom: 1px solid #e2e8f0;
  width: 220px;
}
:deep(.agenda-sidebar-period .n-calendar) {
  width: 220px;
  height: 220px !important;
  max-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  font-size: 11px;
}
.agenda-sidebar-period :deep(.n-calendar-header) {
  height: 32px;
  padding: 6px 8px !important;
  box-sizing: border-box;
  font-size: 12px !important;
}
.agenda-sidebar-period :deep(.n-calendar-header__extra) {
  display: none;
}
.agenda-sidebar-period :deep(.n-calendar-dates) {
  height: calc(100% - 32px);
  flex: 0 0 calc(100% - 32px);
  min-height: 0;
  border-radius: 0;
}
.agenda-sidebar-period :deep(.n-calendar-cell) {
  min-width: 0;
  padding: 0 !important;
}
.agenda-sidebar-period :deep(.n-calendar-date) {
  height: 100%;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
.agenda-sidebar-period :deep(.n-calendar-date__day) {
  display: none;
}
.agenda-sidebar-period :deep(.n-calendar-date__date) {
  width: 22px !important;
  height: 22px !important;
  margin-left: 0 !important;
  font-size: 11px;
  line-height: 1;
}
.agenda-sidebar-period :deep(.n-calendar-cell--other-month .n-calendar-date__date) {
  opacity: 0.38;
}
.filters-section {
  width: 220px;
}
.filters-section + .filters-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}
.filters-section-title {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}
.agenda-filters-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
.agenda-filters-grid,
.quick-actions-grid {
  width: 220px;
}
.agenda-filters-grid :deep(.n-input),
.agenda-filters-grid :deep(.n-base-selection) {
  --n-height: 34px !important;
  min-height: 34px;
}
.agenda-board-card { height: 100%; min-height: 0; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.quick-action-btn {
  min-height: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.quick-action-btn.wide {
  grid-column: 1 / -1;
}
.quick-action-btn:hover,
.quick-action-btn:focus-visible {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #334155;
}
.quick-action-btn.active {
  background: #e0f2fe;
  border-color: #38bdf8;
  color: #0c4a6e;
}

.agenda-board-card :deep(.n-card__content) {
  height: 100%;
  min-height: 0;
  padding: 0 !important;
}
.agenda-grid-wrap { overflow: auto; height: 100%; min-height: 0; background: #fff; }
.agenda-grid {
  min-width: 980px;
  display: grid;
  grid-template-columns: 90px repeat(var(--agenda-columns), minmax(180px, 1fr));
  grid-template-rows: 80px auto;
  position: relative;
}
.corner { grid-column: 1; grid-row: 1; background: #f8fafc; border-right: 1px solid #e2e8f0; }
.sticky-cell { position: sticky; z-index: 4; top: 0; background: #fff; border-bottom: 1px solid #e2e8f0; padding: 10px; }
.corner { left: 0; z-index: 6; }
.header-cell { border-right: 1px solid #e2e8f0; }
.header-title { margin: 0; font-weight: 700; color: #0f172a; font-size: 13px; }
.header-subtitle { margin: 1px 0 0; color: #334155; font-size: 12px; }
.header-meta { margin: 2px 0 0; color: #64748b; font-size: 11px; }
.time-track {
  grid-column: 1;
  grid-row: 2;
  position: sticky;
  left: 0;
  z-index: 3;
  background: #f8fafc;
}
.time-cell {
  height: 72px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #f1f5f9;
  padding: 10px;
  box-sizing: border-box;
  font-size: 12px;
  color: #475569;
}
.agenda-column {
  position: relative;
  grid-row: 2;
  min-height: 3456px;
}
.now-line-layer {
  position: absolute;
  top: 80px;
  bottom: 0;
  left: calc(90px + ((100% - 90px) * (var(--now-col-start, 0) / var(--agenda-columns))));
  width: calc((100% - 90px) * (var(--now-col-span, 1) / var(--agenda-columns)));
  pointer-events: none;
  z-index: 5;
}
.now-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #ef4444;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
}
.slot-cell { position: relative; display: block; width: 100%; height: 72px; border: 0; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 4px; background: #fff; text-align: left; box-sizing: border-box; cursor: pointer; }
.slot-cell.covered { background: #fbfdff; cursor: default; }
.slot-cell.outside-hours { background: #f8fafc; }
.slot-cell.outside-hours::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    -45deg,
    rgba(148, 163, 184, 0.08) 0,
    rgba(148, 163, 184, 0.08) 6px,
    transparent 6px,
    transparent 12px
  );
}
.slot-cell.outside-hours:hover,
.slot-cell.outside-hours:focus-visible {
  background: #f1f5f9;
}
.slot-cell:nth-child(odd) { border-bottom-color: #e2e8f0; }
.slot-cell:hover,
.slot-cell:focus-visible {
  background: #f8fafc;
  outline: 1px solid rgba(14, 165, 233, 0.22);
  outline-offset: -1px;
}
.slot-hover-label { display: none; position: absolute; right: 6px; bottom: 5px; border-radius: 999px; padding: 2px 6px; font-size: 10px; font-weight: 600; color: #0369a1; background: #e0f2fe; }
.slot-cell:hover .slot-hover-label,
.slot-cell:focus-visible .slot-hover-label { display: inline-flex; }
.free-slot { width: 100%; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px; color: #64748b; background: #f8fafc; text-align: left; }

.event-block { width: 100%; text-align: left; border: 1px solid #dbe3ee; border-left-width: 4px; border-radius: 7px; padding: 5px 7px; background: #f8fbff; display: flex; flex-direction: column; gap: 1px; margin-bottom: 4px; position: relative; z-index: 2; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
.calendar-event {
  position: absolute;
  left: 5px;
  right: 7px;
  width: auto;
  margin-bottom: 0;
  overflow: hidden;
}
.event-block strong { font-size: 12px; line-height: 1.05; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-block span { font-size: 10.5px; line-height: 1.08; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-block small { font-size: 10px; line-height: 1.08; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.event-title-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
}
.event-title-row strong {
  min-width: 0;
  flex: 0 1 auto;
}
.event-triage-dot { flex: 0 0 auto; width: 7px; height: 7px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9); }
.event-triage-dot.triage-pending { display: none; }
.agenda-grid.weekly .calendar-event {
  padding: 4px 5px;
}
.agenda-grid.weekly .event-title-row {
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}
.agenda-grid.weekly .event-title-row strong {
  flex-basis: auto;
  max-width: 100%;
}
.agenda-grid.weekly .event-block strong { font-size: 11px; }
.agenda-grid.weekly .event-block span { font-size: 10px; }
.agenda-grid.weekly .event-block small { font-size: 9px; }

.mobile-day-list { display: flex; flex-direction: column; gap: 8px; }
.mobile-day-nav { display: flex; gap: 8px; overflow-x: auto; }
.mobile-day-chip { white-space: nowrap; border: 1px solid #cbd5e1; border-radius: 999px; background: #fff; padding: 6px 10px; }
.mobile-day-chip.active { border-color: #0369a1; background: #e0f2fe; }
.mobile-slot-row { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 10px; }
.slot-hour { margin: 0 0 8px; font-size: 12px; color: #64748b; }
.mobile-slot-events { display: flex; flex-direction: column; gap: 6px; }

.detail-content { display: flex; flex-direction: column; gap: 8px; }
.detail-content h3 { margin: 0; }
.detail-content p { margin: 0; color: #334155; font-size: 13px; }
.detail-actions { display: grid; gap: 8px; margin-top: 8px; }

.filters-card { background: #fff; border: 1px solid #e5e7eb; }
.filters-grid { display: grid; grid-template-columns: 2fr repeat(5, minmax(0, 1fr)) auto; gap: 12px; align-items: end; }
.filter-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; }

:deep(.n-data-table) { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.cell-strong { font-weight: 600; color: #111827; }
.cell-muted { font-size: 12px; color: #64748b; }
.cell-nowrap { white-space: nowrap; }
.th-nowrap { white-space: nowrap; display: inline-block; }

:deep(.status-pill) { display: inline-flex; align-items: center; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
:deep(.status-scheduled) { color: #1d4ed8; background: #dbeafe; border-left-color: #1d4ed8; }
:deep(.status-confirmed) { color: #166534; background: #dcfce7; border-left-color: #166534; }
:deep(.status-arrived) { color: #047857; background: #d1fae5; border-left-color: #047857; }
:deep(.status-in-progress) { color: #0c4a6e; background: #e0f2fe; border-left-color: #0284c7; }
:deep(.status-completed) { color: #166534; background: #ecfdf5; border-left-color: #22c55e; }
:deep(.status-canceled) { color: #991b1b; background: #fee2e2; border-left-color: #ef4444; }
:deep(.status-default) { color: #334155; background: #e2e8f0; border-left-color: #64748b; }

:deep(.triage-pill) { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; }
:deep(.triage-dot) { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
:deep(.triage-green) { color: #15803d; background: #dcfce7; }
:deep(.triage-yellow) { color: #a16207; background: #fef3c7; }
:deep(.triage-red) { color: #b91c1c; background: #fee2e2; }
:deep(.triage-emergency) { color: #7f1d1d; background: #fecaca; }
:deep(.triage-pending) { color: #334155; background: #e2e8f0; }

.event-block.status-scheduled,
.event-block.status-scheduled.triage-pending,
.event-block.status-scheduled.triage-green,
.event-block.status-scheduled.triage-yellow,
.event-block.status-scheduled.triage-red,
.event-block.status-scheduled.triage-emergency {
  color: inherit;
  background: #f6f9ff;
  border-left-color: #2563eb;
}
.event-block.status-confirmed {
  color: inherit;
  background: #f3fcf6;
  border-left-color: #16a34a;
}
.event-block.status-arrived {
  color: inherit;
  background: #f0fdfa;
  border-left-color: #0f766e;
}
.event-block.status-in-progress {
  color: inherit;
  background: #effcff;
  border-left-color: #0891b2;
}
.event-block.status-completed {
  color: inherit;
  background: #f8fafc;
  border-left-color: #94a3b8;
}
.event-block.status-canceled {
  color: inherit;
  background: #f8fafc;
  border-left-color: #cbd5e1;
  opacity: 0.78;
}
.event-block.status-default {
  color: inherit;
  background: #f8fafc;
  border-left-color: #64748b;
}
.event-triage-dot.triage-green { background: #22c55e; }
.event-triage-dot.triage-yellow { background: #f59e0b; }
.event-triage-dot.triage-red { background: #ef4444; }
.event-triage-dot.triage-emergency { background: #991b1b; }

.flow-placeholder h3 { margin: 4px 0; }
.flow-placeholder p { margin: 0; color: #475569; }

.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.quick-sections { display: flex; flex-direction: column; gap: 10px; }
.quick-section { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 12px; }
.quick-section-title { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #334155; }
.quick-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.full-row { grid-column: 1 / -1; }
.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }

@media (max-width: 1200px) {
  .agenda-workspace { grid-template-columns: 270px minmax(0, 1fr); }
}

@media (max-width: 768px) {
  .agenda-workspace {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
    overflow: visible;
  }
  .agenda-filters-card,
  .agenda-board-card {
    overflow: visible;
  }
  .agenda-filters-scroll {
    height: auto;
    overflow: visible;
  }
  .page-head { flex-direction: column; }
  h1 { font-size: 19px; }
  .head-actions { width: 100%; }
  .head-actions :deep(.n-button) { width: 100%; }
  .quick-grid { grid-template-columns: 1fr; }
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
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.appointment-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.appointment-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.appointment-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.appointment-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.appointment-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .appointment-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .appointment-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .appointment-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
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
