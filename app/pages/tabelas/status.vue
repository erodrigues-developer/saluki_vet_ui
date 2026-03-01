<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Tabelas</p>
        <h1>Status de Agendamento</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo Status
      </n-button>
    </div>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="statuses"
      :pagination="false"
      :bordered="false"
      :row-props="rowProps"
    />

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      style="width: 500px"
    >
      <template #header>
        <p class="eyebrow" style="margin: 0">{{ editingStatus ? 'Visualizar Status' : 'Novo Status' }}</p>
      </template>
      <AppointmentStatusForm
        :value="editingStatus"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { NButton, NTag, useMessage, useDialog } from 'naive-ui'
import AppointmentStatusForm, { type AppointmentStatus } from '~/components/appointment-statuses/AppointmentStatusForm.vue'

const message = useMessage()
const dialog = useDialog()

const statuses = ref<AppointmentStatus[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingStatus = ref<AppointmentStatus | null>(null)

const columns = [
  { title: 'Nome', key: 'name' },
  { title: 'Código', key: 'code', render: (row: AppointmentStatus) => h('code', {}, row.code) },
  {
    title: 'Sistema',
    key: 'isSystem',
    render: (row: AppointmentStatus) =>
      h(NTag, { type: row.isSystem ? 'warning' : 'info', bordered: false, size: 'small' }, { default: () => (row.isSystem ? 'Sim (Imutável)' : 'Personalizado') })
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: AppointmentStatus) =>
      h('div', { class: 'actions' }, [
        h(NButton, {
          size: 'small',
          tertiary: true,
          type: 'error',
          disabled: row.isSystem,
          onClick: (e) => {
            e.stopPropagation()
            confirmDelete(row)
          }
        }, { default: () => 'Excluir' })
      ])
  }
]

const fetchStatuses = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<AppointmentStatus[]>('/api/v1/appointment-statuses')
    statuses.value = res
  } catch (err) {
    message.error('Erro ao buscar status de agendamento')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: AppointmentStatus) => {
  saving.value = true
  try {
    // Note: Edit is not supported by API yet, only create/delete
    const api = useApi()
    if (!payload.id) {
      await api('/api/v1/appointment-statuses', {
        method: 'POST',
        body: payload
      })
      message.success('Status criado')
    }
    closeModal()
    fetchStatuses()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar status')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (status: AppointmentStatus) => {
  if (status.isSystem) {
    message.error('Não é possível excluir um status do sistema')
    return
  }
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o status ${status.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/appointment-statuses/${status.id}`, { method: 'DELETE' })
        message.success('Status excluído')
        fetchStatuses()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir status')
      }
    }
  })
}

const openCreate = () => {
  editingStatus.value = null
  showModal.value = true
}

const openEdit = (status: AppointmentStatus) => {
  editingStatus.value = status
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: AppointmentStatus) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  fetchStatuses()
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: center; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 4px 0 0; font-size: 24px; }
.actions { display: flex; gap: 8px; }
</style>
