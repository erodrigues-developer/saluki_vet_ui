<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CONFIGURAÇÕES</p>
        <h1>Escalas e Disponibilidade</h1>
        <p class="subhead">Configure horários de atendimento, bloqueios e ausências dos veterinários da clínica.</p>
      </div>
    </div>

    <n-card :bordered="false" class="settings-card">
      <div class="professional-card">
        <div class="professional-main">
          <p class="section-kicker">Configuração do profissional</p>
          <n-form-item label="Veterinário" class="vet-select-item">
            <n-select
              v-model:value="selectedVeterinarianId"
              :options="veterinarianOptions"
              placeholder="Selecione um veterinário"
              filterable
              clearable
            />
          </n-form-item>
          <p class="helper-text">Essas configurações definem quais horários estarão disponíveis na tela de Agendamentos.</p>
          <p class="helper-text">Alterações de escala e disponibilidade impactam diretamente os horários livres da Agenda.</p>
        </div>

        <div class="professional-summary">
          <div class="summary-item">
            <p class="summary-label">DIAS DISPONÍVEIS</p>
            <p class="summary-value">{{ summary.availableDays }}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">BLOQUEIOS ATIVOS</p>
            <p class="summary-value">{{ summary.activeBlocks }}</p>
          </div>
          <div class="summary-item">
            <p class="summary-label">AUSÊNCIAS ATIVAS</p>
            <p class="summary-value">{{ summary.activeAbsences }}</p>
          </div>
        </div>
      </div>

      <n-empty
        v-if="!selectedVeterinarianId"
        description="Selecione um veterinário para configurar escalas e disponibilidade."
        class="empty-state"
      />

      <template v-else>
        <n-tabs v-model:value="activeTab" type="segment" animated class="premium-tabs">
          <n-tab-pane name="weekly" tab="Escala semanal">
            <section class="content-section">
              <header class="section-head">
                <div>
                  <h3>Escala semanal</h3>
                  <p>Defina os dias e horários recorrentes de atendimento do veterinário.</p>
                  <div v-if="summary.availableDays === 0" class="section-warning">
                    Nenhum dia disponível configurado para este veterinário.
                  </div>
                </div>
                <n-button v-if="canManage" type="primary" size="small" :disabled="!hasWeeklyChanges" @click="saveWeeklySchedule">Salvar escala</n-button>
              </header>

              <div class="weekly-list">
                <article v-for="day in weeklySchedule" :key="day.weekday" class="weekly-row">
                  <div class="day-main">
                    <p class="day-label">{{ weekdayLabel(day.weekday) }}</p>
                    <n-tag
                      size="small"
                      round
                      :bordered="false"
                      :class="['status-tag', day.isAvailable ? 'status-available' : 'status-unavailable']"
                    >
                      {{ day.isAvailable ? 'Disponível' : 'Indisponível' }}
                    </n-tag>
                  </div>

                  <div class="day-periods">
                    <template v-if="day.isAvailable && day.periods.length">
                      <div class="period-chip-wrap">
                        <n-tag
                          v-for="(period, idx) in day.periods"
                          :key="`${day.weekday}-${idx}`"
                          size="small"
                          round
                          :bordered="false"
                          class="period-chip"
                          @click="openPeriodModal(day, true, idx)"
                        >
                          {{ period.startTime }}–{{ period.endTime }}
                        </n-tag>
                      </div>
                    </template>
                    <p v-else-if="day.isAvailable" class="secondary-text">Adicione pelo menos um período de atendimento.</p>
                    <p v-else class="secondary-text">Nenhum período configurado.</p>
                  </div>

                  <div class="day-controls">
                    <div class="toggle-group">
                      <span class="toggle-label">Ativar dia</span>
                      <n-switch v-model:value="day.isAvailable" :disabled="!canManage" />
                    </div>
                    <div class="row-actions">
                      <n-button
                        v-if="canManage && day.isAvailable"
                        tertiary
                        size="small"
                        @click="openPeriodModal(day)"
                      >
                        + Adicionar período
                      </n-button>
                      <n-button
                        v-if="canManage && day.isAvailable && day.periods.length"
                        quaternary
                        size="small"
                        @click="openPeriodModal(day, true, 0)"
                      >
                        Editar
                      </n-button>
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </n-tab-pane>

          <n-tab-pane name="blocks" tab="Bloqueios pontuais">
            <section class="content-section">
              <header class="section-head">
                <div>
                  <h3>Bloqueios pontuais</h3>
                  <p>Cadastre bloqueios específicos por data e horário.</p>
                </div>
                <n-button v-if="canManage" type="primary" size="small" @click="openBlockModal()">Novo bloqueio</n-button>
              </header>

              <n-empty v-if="!blocks.length" description="Nenhum bloqueio pontual cadastrado.">
                <template #extra>
                  <p class="empty-subtext">Use bloqueios para impedir agendamentos em horários específicos, como reuniões ou compromissos externos.</p>
                  <n-button v-if="canManage" type="primary" size="small" @click="openBlockModal()">Novo bloqueio</n-button>
                </template>
              </n-empty>

              <div v-else class="list-cards">
                <div v-for="item in blocks" :key="item.id" class="list-card">
                  <div class="list-card-head">
                    <p class="list-primary">{{ formatDate(item.date) }} · {{ item.startTime }}–{{ item.endTime }}</p>
                    <n-tag size="small" round :bordered="false" :type="item.active ? 'success' : 'default'">{{ item.active ? 'Ativo' : 'Inativo' }}</n-tag>
                  </div>
                  <p class="list-secondary">{{ item.reason }}</p>
                  <n-space>
                    <n-button v-if="canManage" size="small" @click="openBlockModal(item)">Editar</n-button>
                    <n-button v-if="canManage" size="small" tertiary @click="deleteBlock(item)">Excluir</n-button>
                  </n-space>
                </div>
              </div>
            </section>
          </n-tab-pane>

          <n-tab-pane name="absences" tab="Ausências/Férias">
            <section class="content-section">
              <header class="section-head">
                <div>
                  <h3>Ausências/Férias</h3>
                  <p>Cadastre períodos em que o veterinário ficará indisponível.</p>
                </div>
                <n-button v-if="canManage" type="primary" size="small" @click="openAbsenceModal()">Nova ausência</n-button>
              </header>

              <n-empty v-if="!absences.length" description="Nenhuma ausência cadastrada.">
                <template #extra>
                  <p class="empty-subtext">Use ausências para bloquear períodos maiores, como férias, folgas ou afastamentos.</p>
                  <n-button v-if="canManage" type="primary" size="small" @click="openAbsenceModal()">Nova ausência</n-button>
                </template>
              </n-empty>

              <div v-else class="list-cards">
                <div v-for="item in absences" :key="item.id" class="list-card">
                  <div class="list-card-head">
                    <p class="list-primary">{{ formatDate(item.startDate) }} a {{ formatDate(item.endDate) }}</p>
                    <n-tag size="small" round :bordered="false" :type="item.active ? 'success' : 'default'">{{ item.active ? 'Ativo' : 'Inativo' }}</n-tag>
                  </div>
                  <p class="list-secondary">{{ item.reason }}</p>
                  <n-space>
                    <n-button v-if="canManage" size="small" @click="openAbsenceModal(item)">Editar</n-button>
                    <n-button v-if="canManage" size="small" tertiary @click="deleteAbsence(item)">Excluir</n-button>
                  </n-space>
                </div>
              </div>
            </section>
          </n-tab-pane>
        </n-tabs>
      </template>
    </n-card>

    <n-modal v-model:show="showPeriodModal" preset="card" class="availability-modal availability-modal-small">
      <template #header>
        <div class="modal-head">
          <h3>{{ periodModalTitle }}</h3>
          <p>Defina o intervalo de atendimento para este dia da semana.</p>
        </div>
      </template>
      <div class="modal-form-panel">
        <n-form label-placement="top">
          <n-form-item label="Dia da semana">
            <n-input :value="periodEditor.dayLabel" disabled />
          </n-form-item>
          <n-grid :cols="2" :x-gap="12" responsive="screen">
            <n-form-item-gi label="Hora inicial">
              <n-time-picker v-model:formatted-value="periodEditor.startTime" value-format="HH:mm" format="HH:mm" :actions="null" />
            </n-form-item-gi>
            <n-form-item-gi label="Hora final">
              <n-time-picker v-model:formatted-value="periodEditor.endTime" value-format="HH:mm" format="HH:mm" :actions="null" />
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </div>
      <template #footer>
        <div class="modal-footer split">
          <n-button v-if="canManage && periodEditor.editingIndex !== null" tertiary @click="removeEditingPeriod">Remover período</n-button>
          <div class="modal-actions">
            <n-button @click="showPeriodModal = false">Cancelar</n-button>
            <n-button v-if="canManage" type="primary" @click="savePeriod">Salvar período</n-button>
          </div>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showBlockModal" preset="card" class="availability-modal availability-modal-medium">
      <template #header>
        <div class="modal-head">
          <h3>Bloqueio pontual</h3>
          <p>Bloqueie um horário específico na agenda do veterinário.</p>
        </div>
      </template>
      <div class="modal-form-panel">
        <n-form label-placement="top">
          <n-grid :cols="12" :x-gap="12" responsive="screen">
            <n-form-item-gi :span="4" label="Data"><n-date-picker v-model:value="blockForm.date" type="date" clearable /></n-form-item-gi>
            <n-form-item-gi :span="8" label="Motivo"><n-input v-model:value="blockForm.reason" placeholder="Ex.: Reunião, procedimento reservado, compromisso externo" /></n-form-item-gi>
            <n-form-item-gi :span="6" label="Hora inicial"><n-time-picker v-model:formatted-value="blockForm.startTime" value-format="HH:mm" format="HH:mm" :actions="null" /></n-form-item-gi>
            <n-form-item-gi :span="6" label="Hora final"><n-time-picker v-model:formatted-value="blockForm.endTime" value-format="HH:mm" format="HH:mm" :actions="null" /></n-form-item-gi>
            <n-form-item-gi :span="12" label="Observações"><n-input v-model:value="blockForm.notes" type="textarea" :rows="3" /></n-form-item-gi>
            <n-form-item-gi :span="12" label="Status"><n-switch v-model:value="blockForm.active" /></n-form-item-gi>
          </n-grid>
        </n-form>
      </div>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="showBlockModal = false">Cancelar</n-button>
          <n-button v-if="canManage" type="primary" @click="saveBlock">{{ blockForm.id ? 'Salvar alterações' : 'Criar bloqueio' }}</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal v-model:show="showAbsenceModal" preset="card" class="availability-modal availability-modal-medium">
      <template #header>
        <div class="modal-head">
          <h3>Ausência/Férias</h3>
          <p>Cadastre um período em que o veterinário ficará indisponível.</p>
        </div>
      </template>
      <div class="modal-form-panel">
        <n-form label-placement="top">
          <n-grid :cols="12" :x-gap="12" responsive="screen">
            <n-form-item-gi :span="6" label="Data inicial"><n-date-picker v-model:value="absenceForm.startDate" type="date" clearable /></n-form-item-gi>
            <n-form-item-gi :span="6" label="Data final"><n-date-picker v-model:value="absenceForm.endDate" type="date" clearable /></n-form-item-gi>
            <n-form-item-gi :span="12" label="Tipo/Motivo">
              <n-select v-model:value="absenceForm.reason" :options="absenceReasonOptions" tag filterable placeholder="Selecione um motivo" />
            </n-form-item-gi>
            <n-form-item-gi :span="12" label="Observações"><n-input v-model:value="absenceForm.notes" type="textarea" :rows="3" /></n-form-item-gi>
            <n-form-item-gi :span="12" label="Status"><n-switch v-model:value="absenceForm.active" /></n-form-item-gi>
          </n-grid>
        </n-form>
      </div>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="showAbsenceModal = false">Cancelar</n-button>
          <n-button v-if="canManage" type="primary" @click="saveAbsence">{{ absenceForm.id ? 'Salvar alterações' : 'Criar ausência' }}</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { format } from 'date-fns'
import { useMessage } from 'naive-ui'
import { PERMISSIONS } from '~/constants/permissions'
import { useAuthStore } from '~/stores/auth'

const message = useMessage()
const authStore = useAuthStore()
const canManage = computed(() => authStore.hasPermission(PERMISSIONS.availabilityUpdate))

const activeTab = ref('weekly')
const selectedVeterinarianId = ref<number | null>(null)
const veterinarianOptions = ref<{ label: string; value: number }[]>([])

const weeklySchedule = ref<any[]>([])
const blocks = ref<any[]>([])
const absences = ref<any[]>([])
const weeklyScheduleBaseline = ref<string>('[]')

const showPeriodModal = ref(false)
const periodEditor = ref<any>({ weekday: null, dayLabel: '', startTime: '08:00', endTime: '12:00', editingIndex: null })
const showBlockModal = ref(false)
const showAbsenceModal = ref(false)
const blockForm = ref<any>({ id: null, date: null, startTime: null, endTime: null, reason: '', notes: '', active: true })
const absenceForm = ref<any>({ id: null, startDate: null, endDate: null, reason: '', notes: '', active: true })

const absenceReasonOptions = [
  'Férias',
  'Atestado',
  'Folga',
  'Congresso/Curso',
  'Compromisso externo',
  'Outro',
].map((label) => ({ label, value: label }))

const weekdayLabel = (day: number) => ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][day] || `Dia ${day}`

const formatDate = (value: string) => {
  if (!value) return '-'
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

const toApiDate = (value: number | null) => {
  if (!value) return null
  return format(new Date(value), 'yyyy-MM-dd')
}

const periodModalTitle = computed(() => periodEditor.value.editingIndex !== null ? 'Editar período' : 'Adicionar período')

const normalizeWeeklySchedule = (rows: any[]) =>
  rows.map((day) => ({
    weekday: Number(day.weekday),
    isAvailable: Boolean(day.isAvailable),
    periods: (day.periods || [])
      .map((period: any) => ({ startTime: String(period.startTime || ''), endTime: String(period.endTime || '') }))
      .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)),
  }))

const hasWeeklyChanges = computed(() => JSON.stringify(normalizeWeeklySchedule(weeklySchedule.value)) !== weeklyScheduleBaseline.value)

const summary = computed(() => ({
  availableDays: weeklySchedule.value.filter((day) => day.isAvailable).length,
  activeBlocks: blocks.value.filter((item) => item.active !== false).length,
  activeAbsences: absences.value.filter((item) => item.active !== false).length,
}))

const resetWeeklySchedule = () => {
  weeklySchedule.value = Array.from({ length: 7 }, (_v, day) => ({ weekday: day, isAvailable: false, periods: [] }))
  weeklyScheduleBaseline.value = JSON.stringify(normalizeWeeklySchedule(weeklySchedule.value))
}

const parseTimeToMinutes = (time: string) => {
  const match = String(time || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

const validatePeriod = (weekday: number, startTime: string, endTime: string, editingIndex: number | null) => {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (start === null || end === null) {
    message.warning('Preencha horários válidos no formato HH:mm.')
    return false
  }
  if (start >= end) {
    message.warning('Hora inicial deve ser menor que hora final.')
    return false
  }
  const day = weeklySchedule.value.find((row) => Number(row.weekday) === Number(weekday))
  if (!day) return false
  const conflict = (day.periods || []).some((period: any, idx: number) => {
    if (editingIndex !== null && idx === editingIndex) return false
    const pStart = parseTimeToMinutes(period.startTime)
    const pEnd = parseTimeToMinutes(period.endTime)
    if (pStart === null || pEnd === null) return false
    return start < pEnd && end > pStart
  })
  if (conflict) {
    message.warning('Períodos do mesmo dia não podem se sobrepor.')
    return false
  }
  return true
}

const openPeriodModal = (day: any, editMode = false, index = 0) => {
  if (!canManage.value) return
  const editingIndex = editMode ? index : null
  periodEditor.value = {
    weekday: Number(day.weekday),
    dayLabel: weekdayLabel(Number(day.weekday)),
    startTime: editMode && day.periods?.[index]?.startTime ? day.periods[index].startTime : '08:00',
    endTime: editMode && day.periods?.[index]?.endTime ? day.periods[index].endTime : '12:00',
    editingIndex,
  }
  showPeriodModal.value = true
}

const savePeriod = () => {
  if (!canManage.value) return
  const { weekday, startTime, endTime, editingIndex } = periodEditor.value
  if (!validatePeriod(weekday, startTime, endTime, editingIndex)) return
  const day = weeklySchedule.value.find((row) => Number(row.weekday) === Number(weekday))
  if (!day) return
  if (!day.isAvailable) day.isAvailable = true
  if (editingIndex !== null) {
    day.periods[editingIndex] = { startTime, endTime }
  } else {
    day.periods.push({ startTime, endTime })
  }
  day.periods.sort((a: any, b: any) => String(a.startTime).localeCompare(String(b.startTime)))
  showPeriodModal.value = false
}

const removeEditingPeriod = () => {
  if (!canManage.value) return
  const { weekday, editingIndex } = periodEditor.value
  if (editingIndex === null) return
  const day = weeklySchedule.value.find((row) => Number(row.weekday) === Number(weekday))
  if (!day) return
  day.periods.splice(editingIndex, 1)
  showPeriodModal.value = false
}

const loadLookups = async () => {
  const api = useApi()
  const usersRes = await api<any>('/api/v1/users', { query: { page: 1, limit: 200 } })
  const users = Array.isArray(usersRes?.data) ? usersRes.data : []
  const veterinarians = users.filter((u: any) =>
    Array.isArray(u?.roles) && u.roles.some((role: any) => String(role?.code || '').toUpperCase() === 'VET'),
  )
  veterinarianOptions.value = veterinarians.map((u: any) => ({ label: u.name, value: Number(u.id) }))
}

const loadAvailability = async () => {
  if (!selectedVeterinarianId.value) return
  const api = useApi()
  const res = await api<any>('/api/v1/veterinarian-availability', { query: { veterinarianId: selectedVeterinarianId.value } })
  weeklySchedule.value = Array.isArray(res?.weeklySchedule) ? res.weeklySchedule : []
  blocks.value = Array.isArray(res?.oneTimeBlocks) ? res.oneTimeBlocks : []
  absences.value = Array.isArray(res?.absences) ? res.absences : []
  weeklyScheduleBaseline.value = JSON.stringify(normalizeWeeklySchedule(weeklySchedule.value))
}

const saveWeeklySchedule = async () => {
  if (!canManage.value) return
  if (!selectedVeterinarianId.value || !hasWeeklyChanges.value) return

  const hasInvalidAvailableDay = weeklySchedule.value.some((day) => day.isAvailable && (!Array.isArray(day.periods) || !day.periods.length))
  if (hasInvalidAvailableDay) {
    message.warning('Existem dias ativos sem período configurado. Adicione ao menos um período antes de salvar.')
    return
  }

  const api = useApi()
  await api(`/api/v1/veterinarian-availability/${selectedVeterinarianId.value}/weekly-schedule`, {
    method: 'PATCH',
    body: {
      days: weeklySchedule.value.map((day) => ({
        weekday: Number(day.weekday),
        isAvailable: Boolean(day.isAvailable),
        periods: day.isAvailable
          ? (day.periods || []).map((period: any) => ({ startTime: period.startTime, endTime: period.endTime }))
          : [],
      })),
    },
  })
  message.success('Escala semanal salva')
  await loadAvailability()
}

const openBlockModal = (item?: any) => {
  if (!canManage.value) return
  if (!item) {
    blockForm.value = { id: null, date: null, startTime: null, endTime: null, reason: '', notes: '', active: true }
  } else {
    blockForm.value = {
      id: item.id,
      date: new Date(`${item.date}T12:00:00`).getTime(),
      startTime: item.startTime,
      endTime: item.endTime,
      reason: item.reason,
      notes: item.notes || '',
      active: item.active !== false,
    }
  }
  showBlockModal.value = true
}

const saveBlock = async () => {
  if (!canManage.value) return
  if (!selectedVeterinarianId.value) return
  if (!blockForm.value.date) {
    message.warning('Informe a data do bloqueio.')
    return
  }
  if (!String(blockForm.value.reason || '').trim()) {
    message.warning('Informe o motivo do bloqueio.')
    return
  }
  const start = parseTimeToMinutes(blockForm.value.startTime)
  const end = parseTimeToMinutes(blockForm.value.endTime)
  if (start === null || end === null) {
    message.warning('Informe hora inicial e hora final válidas.')
    return
  }
  if (start >= end) {
    message.warning('Hora inicial deve ser menor que hora final.')
    return
  }
  const api = useApi()
  const payload = {
    date: toApiDate(blockForm.value.date),
    startTime: blockForm.value.startTime,
    endTime: blockForm.value.endTime,
    reason: blockForm.value.reason,
    notes: blockForm.value.notes || null,
    active: blockForm.value.active,
  }
  if (blockForm.value.id) {
    await api(`/api/v1/veterinarian-availability/${selectedVeterinarianId.value}/blocks/${blockForm.value.id}`, { method: 'PATCH', body: payload })
  } else {
    await api(`/api/v1/veterinarian-availability/${selectedVeterinarianId.value}/blocks`, { method: 'POST', body: payload })
  }
  showBlockModal.value = false
  await loadAvailability()
}

const deleteBlock = async (item: any) => {
  if (!canManage.value) return
  if (!selectedVeterinarianId.value) return
  const api = useApi()
  await api(`/api/v1/veterinarian-availability/${selectedVeterinarianId.value}/blocks/${item.id}`, { method: 'DELETE' })
  await loadAvailability()
}

const openAbsenceModal = (item?: any) => {
  if (!canManage.value) return
  if (!item) {
    absenceForm.value = { id: null, startDate: null, endDate: null, reason: '', notes: '', active: true }
  } else {
    absenceForm.value = {
      id: item.id,
      startDate: new Date(`${item.startDate}T12:00:00`).getTime(),
      endDate: new Date(`${item.endDate}T12:00:00`).getTime(),
      reason: item.reason,
      notes: item.notes || '',
      active: item.active !== false,
    }
  }
  showAbsenceModal.value = true
}

const saveAbsence = async () => {
  if (!canManage.value) return
  if (!selectedVeterinarianId.value) return
  if (!absenceForm.value.startDate || !absenceForm.value.endDate) {
    message.warning('Informe data inicial e data final.')
    return
  }
  if (absenceForm.value.startDate > absenceForm.value.endDate) {
    message.warning('Data inicial deve ser menor ou igual à data final.')
    return
  }
  if (!String(absenceForm.value.reason || '').trim()) {
    message.warning('Informe o motivo da ausência.')
    return
  }
  const api = useApi()
  const payload = {
    startDate: toApiDate(absenceForm.value.startDate),
    endDate: toApiDate(absenceForm.value.endDate),
    reason: absenceForm.value.reason,
    notes: absenceForm.value.notes || null,
    active: absenceForm.value.active,
  }
  if (absenceForm.value.id) {
    await api(`/api/v1/veterinarian-availability/${selectedVeterinarianId.value}/absences/${absenceForm.value.id}`, { method: 'PATCH', body: payload })
  } else {
    await api(`/api/v1/veterinarian-availability/${selectedVeterinarianId.value}/absences`, { method: 'POST', body: payload })
  }
  showAbsenceModal.value = false
  await loadAvailability()
}

const deleteAbsence = async (item: any) => {
  if (!canManage.value) return
  if (!selectedVeterinarianId.value) return
  const api = useApi()
  await api(`/api/v1/veterinarian-availability/${selectedVeterinarianId.value}/absences/${item.id}`, { method: 'DELETE' })
  await loadAvailability()
}

onMounted(async () => {
  try {
    await loadLookups()
    if (veterinarianOptions.value.length) {
      selectedVeterinarianId.value = veterinarianOptions.value[0].value
      await loadAvailability()
    }
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar tela de disponibilidade')
    resetWeeklySchedule()
  }
})

watch(selectedVeterinarianId, async () => {
  if (!selectedVeterinarianId.value) return
  await loadAvailability()
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.page {
  max-width: 1360px;
  margin: 0 auto;
  width: 100%;
}
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.head-copy { display: flex; flex-direction: column; gap: 4px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; color: #4b5563; margin: 0; }
h1 { margin: 0; font-size: 22px; line-height: 1.15; color: #0f172a; }
.subhead { margin: 0; color: #6b7280; font-size: 14px; }
.settings-card {
  border: 1px solid #dfe5ee;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.settings-card :deep(.n-card__content) {
  padding: 14px !important;
}

.professional-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid #dfe5ee;
  border-radius: 10px;
  background: #fbfdff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.75);
  margin-bottom: 10px;
}
.section-kicker { margin: 0 0 5px; font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
.vet-select-item { margin-bottom: 0; max-width: 360px; }
.vet-select-item :deep(.n-form-item-label) {
  min-height: 18px;
  padding-bottom: 2px;
  font-size: 12px;
}
.vet-select-item :deep(.n-base-selection) {
  --n-height: 34px !important;
}
.helper-text { margin: 3px 0 0; font-size: 11.5px; color: #64748b; line-height: 1.25; }
.professional-summary { display: flex; gap: 7px; align-items: center; }
.summary-item {
  min-width: 108px;
  min-height: 48px;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
  padding: 6px 8px;
  background: #fff;
  box-shadow: 0 1px 1px rgba(15, 23, 42, 0.025);
}
.summary-label { margin: 0; font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: .05em; line-height: 1.15; }
.summary-value { margin: 4px 0 0; font-size: 17px; font-weight: 750; color: #111827; line-height: 1; }

.empty-state { padding: 24px 0; }
.premium-tabs :deep(.n-tabs-nav) {
  display: inline-flex;
  width: auto;
  padding: 1px;
  border: 1px solid #e7ebf1;
  border-radius: 9px;
  background: #f6f8fb;
}
.premium-tabs :deep(.n-tabs-nav-scroll-wrapper) {
  flex: 0 0 auto;
}
.premium-tabs :deep(.n-tabs-tab) {
  min-height: 28px;
  padding: 0 13px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}
.premium-tabs :deep(.n-tabs-tab--active) {
  background: #fff;
  color: #111827;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(15,23,42,.12);
  border: 1px solid #e2e8f0;
}
.premium-tabs :deep(.n-tabs-tab-pad),
.premium-tabs :deep(.n-tabs-bar) {
  display: none;
}

.content-section {
  margin-top: 7px;
  border: 1px solid #dfe5ee;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.035);
}
.section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }
.section-head h3 { margin: 0; font-size: 17px; color: #0f172a; }
.section-head p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
.section-head :deep(.n-button[disabled]) {
  opacity: .46;
}
.section-warning {
  display: inline-flex;
  margin: 6px 0 0;
  padding: 4px 8px;
  border: 1px solid #e7ebf1;
  border-radius: 7px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11.5px;
  line-height: 1.2;
}

.weekly-list { display: grid; gap: 6px; }
.weekly-row {
  display: grid;
  grid-template-columns: 205px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  border: 1px solid #e5eaf1;
  border-radius: 8px;
  padding: 7px 8px;
  background: #fff;
}
.day-main { display: flex; align-items: center; gap: 8px; min-width: 0; }
.day-label { margin: 0; font-weight: 750; color: #0f172a; white-space: nowrap; font-size: 13px; }
.status-tag {
  height: 21px;
  padding: 0 8px;
  font-weight: 650;
  border-radius: 7px;
}
.status-tag:deep(.n-tag__content) { font-size: 11px; }
.status-available {
  background: #dcfce7;
  color: #166534;
}
.status-unavailable {
  background: #f1f5f9;
  color: #475569;
}
.period-chip {
  height: 22px;
  padding: 0 8px;
  border: 1px solid #dfe7f0;
  background: #f8fafc;
  color: #334155;
}
.day-periods { display: grid; gap: 6px; min-width: 0; }
.period-chip-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
.period-chip:deep(.n-tag__content) {
  font-size: 11px;
  font-weight: 650;
}
.secondary-text { margin: 0; color: #94a3b8; font-size: 11.5px; }
.day-controls { display: flex; align-items: center; gap: 7px; }
.toggle-group { display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.toggle-label { font-size: 11.5px; color: #64748b; }
.row-actions { display: flex; align-items: center; gap: 6px; }

.list-cards { display: grid; gap: 8px; }
.list-card {
  border: 1px solid #dfe5ee;
  border-radius: 9px;
  padding: 11px 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15,23,42,.03);
}
.list-card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.list-primary { margin: 0; font-weight: 700; color: #0f172a; font-size: 13px; }
.list-secondary { margin: 6px 0 9px; color: #475569; font-size: 12px; }
.empty-subtext { margin: 0 0 10px; color: #64748b; font-size: 12px; max-width: 520px; }

.modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-head h3 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}
.modal-head p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}
.modal-form-panel {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 12px;
}
.modal-form-panel :deep(.n-form-item) {
  margin-bottom: 10px;
}
.modal-form-panel :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}
.modal-form-panel :deep(.n-date-picker),
.modal-form-panel :deep(.n-time-picker),
.modal-form-panel :deep(.n-input),
.modal-form-panel :deep(.n-base-selection) {
  width: 100%;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.modal-footer.split {
  justify-content: space-between;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1000px) {
  .professional-card { grid-template-columns: 1fr; }
  .professional-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 900px) {
  .weekly-row { grid-template-columns: 1fr; gap: 8px; }
  .day-main { justify-content: space-between; }
  .day-controls { justify-content: space-between; flex-wrap: wrap; }
  .section-head { flex-direction: column; align-items: stretch; }
  .section-head :deep(.n-button) { width: 100%; }
  .professional-summary { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 560px) {
  .professional-summary { grid-template-columns: 1fr; }
  .row-actions { width: 100%; }
  .row-actions :deep(.n-button) { flex: 1; }
  .modal-form-panel {
    padding: 10px;
  }
  .modal-form-panel :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
  .modal-form-panel :deep(.n-gi) {
    grid-column: auto / span 1 !important;
  }
  .modal-footer,
  .modal-actions {
    width: 100%;
  }
  .modal-footer.split {
    align-items: stretch;
  }
  .modal-footer :deep(.n-button),
  .modal-actions :deep(.n-button) {
    width: 100%;
  }
}
</style>

<style>
:root .n-modal-container:has(.availability-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.availability-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.availability-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.availability-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.availability-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
  width: 720px !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 48px) !important;
  max-height: calc(100dvh - 48px) !important;
  margin: 0 auto !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.availability-modal-small.n-card {
  width: 640px !important;
}

.availability-modal-medium.n-card {
  width: 720px !important;
}

.availability-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.availability-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.availability-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .availability-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .availability-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .availability-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .availability-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .modal-actions :deep(.n-button) {
    min-height: 44px;
    width: 100%;
  }
}
</style>
