<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Cadastros</p>
        <h1>Tipos de Agendamento</h1>
      </div>
      <n-button type="primary" @click="openCreate">
        Novo Tipo
      </n-button>
    </div>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="types"
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
        <p class="eyebrow" style="margin: 0">{{ editingType ? 'Editar Tipo' : 'Novo Tipo' }}</p>
      </template>
      <AppointmentTypeForm
        :value="editingType"
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
import AppointmentTypeForm, { type AppointmentType } from '~/components/appointment-types/AppointmentTypeForm.vue'

const message = useMessage()
const dialog = useDialog()

const types = ref<AppointmentType[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingType = ref<AppointmentType | null>(null)

const columns = [
  { title: 'Nome', key: 'name' },
  { title: 'Descrição', key: 'description' },
  { title: 'Duração (min)', key: 'defaultDurationMinutes' },
  {
    title: 'Status',
    key: 'isActive',
    render: (row: AppointmentType) =>
      h(NTag, { type: row.isActive ? 'success' : 'error', bordered: false }, { default: () => (row.isActive ? 'Ativo' : 'Inativo') })
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (row: AppointmentType) =>
      h('div', { class: 'actions' }, [
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

const fetchTypes = async () => {
  loading.value = true
  try {
    const api = useApi()
    const res = await api<AppointmentType[]>('/api/v1/appointment-types')
    types.value = res
  } catch (err) {
    message.error('Erro ao buscar tipos de agendamento')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: AppointmentType) => {
  saving.value = true
  const api = useApi()
  try {
    if (payload.id) {
      await api(`/api/v1/appointment-types/${payload.id}`, {
        method: 'PATCH',
        body: payload
      })
      message.success('Tipo atualizado')
    } else {
      await api('/api/v1/appointment-types', {
        method: 'POST',
        body: payload
      })
      message.success('Tipo criado')
    }
    closeModal()
    fetchTypes()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar tipo')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (type: AppointmentType) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir o tipo ${type.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/appointment-types/${type.id}`, { method: 'DELETE' })
        message.success('Tipo excluído')
        fetchTypes()
      } catch (err) {
        message.error('Erro ao excluir tipo')
      }
    }
  })
}

const openCreate = () => {
  editingType.value = null
  showModal.value = true
}

const openEdit = (type: AppointmentType) => {
  editingType.value = type
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const rowProps = (row: AppointmentType) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

onMounted(() => {
  fetchTypes()
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: center; }
.eyebrow { font-size: 12px; color: #6b7280; text-transform: uppercase; margin: 0; }
h1 { margin: 4px 0 0; font-size: 24px; }
.actions { display: flex; gap: 8px; }
</style>
