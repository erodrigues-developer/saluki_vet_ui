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
      class="appointment-status-modal"
      style="width: 500px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingStatus ? 'Visualizar status de agendamento' : 'Novo status de agendamento' }}</h3>
          <p class="modal-subtitle">
            {{ editingStatus ? 'Confira os dados do status selecionado.' : 'Cadastre um novo status para o fluxo de agendamentos.' }}
          </p>
        </div>
      </template>
      <AppointmentStatusForm
        ref="appointmentStatusFormRef"
        :value="editingStatus"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary @click="closeModal" :disabled="saving">Cancelar</n-button>
          <n-button
            type="primary"
            :loading="saving"
            :disabled="Boolean(editingStatus?.isSystem)"
            @click="submitAppointmentStatusForm"
          >
            {{ editingStatus ? 'Salvar alterações' : 'Criar status' }}
          </n-button>
        </div>
      </template>
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
const appointmentStatusFormRef = ref<{ submit: () => Promise<void> } | null>(null)

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

const submitAppointmentStatusForm = async () => {
  if (editingStatus.value?.isSystem) return
  await appointmentStatusFormRef.value?.submit()
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

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>

<style>
:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.appointment-status-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.appointment-status-modal.n-card {
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

.appointment-status-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.appointment-status-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.appointment-status-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .appointment-status-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .appointment-status-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .appointment-status-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .appointment-status-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }
}
</style>
