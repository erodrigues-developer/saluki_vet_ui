<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Atendimento</p>
        <h1>Agendamentos</h1>
      </div>
      <n-button type="primary" size="large" @click="openCreate">
        <template #icon>
          <span style="font-size: 1.2em">➕</span>
        </template>
        Novo Agendamento
      </n-button>
    </div>

    <!-- Filtros -->
    <n-card :bordered="false" size="small" style="margin-bottom: 16px;">
      <n-form inline :show-feedback="false">
        <n-form-item label="Período">
          <!-- Temporary simple date pickers for filtering, could be a range picker -->
          <n-date-picker v-model:value="filters.date" type="date" clearable @update:value="handleFilter" placeholder="Filtrar por data" />
        </n-form-item>
        <n-form-item label="Veterinário(a)">
          <n-select v-model:value="filters.veterinarianId" :options="veterinarianOptions" placeholder="Todos" clearable style="width: 180px" @update:value="handleFilter" />
        </n-form-item>
        <n-form-item label="Status">
          <n-select v-model:value="filters.statusId" :options="statusOptions" placeholder="Todos" clearable style="width: 150px" @update:value="handleFilter" />
        </n-form-item>
        <n-form-item>
          <n-button @click="handleFilter" type="info" secondary>Atualizar</n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="appointments"
      :pagination="pagination"
      :bordered="false"
      :row-props="rowProps"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      remote
    />

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      style="width: 650px"
    >
      <template #header>
        <p class="eyebrow" style="margin: 0">{{ editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento' }}</p>
      </template>
      <AppointmentForm
        :value="editingAppointment"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import { NButton, NTag, useMessage, useDialog } from 'naive-ui'
import AppointmentForm, { type AppointmentPayload } from '~/components/appointments/AppointmentForm.vue'
import { format } from 'date-fns'

const message = useMessage()
const dialog = useDialog()

const appointments = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingAppointment = ref<AppointmentPayload | null>(null)

// Quick map for related names
const statusesMap = ref<Record<number, { name: string, code: string }>>({})
const typesMap = ref<Record<number, string>>({})
const usersMap = ref<Record<number, string>>({})
const clientNameMap = ref<Record<number, string>>({})
const petNameMap = ref<Record<number, string>>({})

const filters = reactive({
  date: null as number | null,
  veterinarianId: null,
  statusId: null
})

const veterinarianOptions = ref<{label: string, value: number}[]>([])
const statusOptions = ref<{label: string, value: number}[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const getStatusType = (code: string) => {
  switch (code) {
    case 'SCHEDULED': return 'info'
    case 'CONFIRMED': return 'success'
    case 'IN_PROGRESS': return 'warning'
    case 'COMPLETED': return 'default'
    case 'CANCELED': return 'error'
    case 'NO_SHOW': return 'error'
    default: return 'default'
  }
}

const columns = [
  {
    title: 'Data/Hora',
    key: 'startsAt',
    width: 150,
    render: (row: any) => format(new Date(row.startsAt), 'dd/MM/yyyy HH:mm')
  },
  {
    title: 'Cliente / Pet',
    key: 'clientPet',
    render: (row: any) => {
      const cName = clientNameMap.value[row.clientId] || 'Carregando...'
      const pName = petNameMap.value[row.petId] || 'Carregando...'
      return h('div', [
        h('div', { style: 'font-weight: 500' }, cName),
        h('div', { style: 'font-size: 12px; color: #6b7280' }, `Pet: ${pName}`)
      ])
    }
  },
  {
    title: 'Tipo / Vet',
    key: 'typeVet',
    render: (row: any) => {
      const tName = row.appointmentType?.name || typesMap.value[row.appointmentTypeId] || '-'
      const vName = row.veterinarianId ? usersMap.value[row.veterinarianId] : 'Não atribuído'
      return h('div', [
        h('div', tName),
        h('div', { style: 'font-size: 12px; color: #6b7280' }, vName)
      ])
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: any) => {
      const statusObj = row.status || statusesMap.value[row.statusId] || { name: '-', code: '' }
      return h(NTag, { type: getStatusType(statusObj.code), bordered: false, size: 'small' }, { default: () => statusObj.name })
    }
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 100,
    render: (row: any) =>
      h('div', { class: 'actions', style: 'justify-content: flex-end;' }, [
        h(NButton, {
          size: 'small',
          tertiary: true,
          type: 'error',
          onClick: (e) => {
            e.stopPropagation()
            confirmDelete(row)
          }
        }, { default: () => 'Excluir' })
      ])
  }
]

const loadLookups = async () => {
  try {
    const [statusesRes, typesRes, usersRes, clientsRes, petsRes] = await Promise.all([
      $fetch<any>('/api/v1/appointment-statuses?limit=100'),
      $fetch<any>('/api/v1/appointment-types?limit=100'),
      $fetch<any>('/api/v1/users?limit=100'),
      $fetch<any>('/api/v1/clients?limit=500'),
      $fetch<any>('/api/v1/pets?limit=1000')
    ])

    statusesRes.data.forEach((s: any) => { statusesMap.value[s.id] = s })
    typesRes.data.forEach((t: any) => { typesMap.value[t.id] = t.name })
    usersRes.data.forEach((u: any) => { usersMap.value[u.id] = u.name })
    clientsRes.data.forEach((c: any) => { clientNameMap.value[c.id] = c.name })
    petsRes.data.forEach((p: any) => { petNameMap.value[p.id] = p.name })

    statusOptions.value = statusesRes.data.map((s: any) => ({ label: s.name, value: Number(s.id) }))
    veterinarianOptions.value = usersRes.data.map((u: any) => ({ label: u.name, value: Number(u.id) }))
  } catch (err) {
    console.error('Failed to load lookups', err)
  }
}

const fetchAppointments = async () => {
  loading.value = true
  try {
    const queryParams: any = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (filters.veterinarianId) queryParams.veterinarianId = filters.veterinarianId
    if (filters.statusId) queryParams.statusId = filters.statusId
    // If we have date filter, we might need a backend date range query.
    // Skipping exact date filter implementation for basic layout unless API supports `startsAt` filtering specifically.

    const res = await $fetch<any>('/api/v1/appointments', {
      query: queryParams
    })
    appointments.value = res.data
    pagination.itemCount = res.meta.total
  } catch (err) {
    message.error('Erro ao buscar agendamentos')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  pagination.page = 1
  fetchAppointments()
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
  try {
    if (payload.id) {
      await $fetch(`/api/v1/appointments/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Agendamento atualizado')
    } else {
      await $fetch('/api/v1/appointments', {
        method: 'POST',
        body: payload
      })
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

const confirmDelete = (appointment: any) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir este agendamento?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      try {
        await $fetch(`/api/v1/appointments/${appointment.id}`, { method: 'DELETE' })
        message.success('Agendamento excluído')
        fetchAppointments()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir agendamento')
      }
    }
  })
}

const openCreate = () => {
  editingAppointment.value = null
  showModal.value = true
}

const openEdit = (appointment: any) => {
  editingAppointment.value = appointment
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: any) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(async () => {
  await loadLookups()
  fetchAppointments()
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: center; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 4px 0 0; font-size: 24px; }
.actions { display: flex; gap: 8px; }
</style>
