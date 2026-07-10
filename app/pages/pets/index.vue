<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">PETS</p>
        <h1>Cadastro de pets</h1>
        <p class="subhead">Gerencie pacientes, tutores, espécies, raças e identificações da clínica.</p>
      </div>
      <n-button type="primary" size="large" class="head-cta" @click="openCreate">
        Novo pet
      </n-button>
    </div>

    <div v-if="!isMobile" class="summary-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Pets cadastrados</p>
        <strong class="summary-value">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Cães</p>
        <strong class="summary-value">{{ summary.dogs }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Gatos</p>
        <strong class="summary-value">{{ summary.cats }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Com microchip</p>
        <strong class="summary-value">{{ summary.microchip }}</strong>
      </n-card>
    </div>

    <div v-else class="summary-grid-mobile">
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Pets cadastrados</p>
        <strong class="summary-value-mobile">{{ summary.total }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Cães</p>
        <strong class="summary-value-mobile">{{ summary.dogs }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Gatos</p>
        <strong class="summary-value-mobile">{{ summary.cats }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card mobile-card">
        <p class="summary-label">Com microchip</p>
        <strong class="summary-value-mobile">{{ summary.microchip }}</strong>
      </n-card>
    </div>

    <n-card v-if="!isMobile" :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="filters.name" placeholder="Buscar pet" clearable />
        <n-select
          v-model:value="filters.clientId"
          :options="clientOptions"
          placeholder="Tutor"
          filterable
          remote
          clearable
          :loading="clientLoading"
          @search="onClientSearch"
          @focus="ensureClientsLoaded"
        />
        <n-select
          v-model:value="filters.speciesId"
          :options="speciesOptions"
          placeholder="Espécie"
          clearable
          filterable
          :loading="speciesLoading"
          @focus="ensureSpeciesLoaded"
        />
        <n-input v-model:value="filters.microchipCode" placeholder="Buscar microchip" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="fetchPets">Filtrar</n-button>
        </div>
      </div>
    </n-card>
    <n-card v-else :bordered="false" size="small" class="filters-card mobile-filters-card">
      <div class="mobile-filter-top">
        <n-input v-model:value="filters.name" placeholder="Buscar pet ou microchip" clearable />
        <n-button secondary strong class="mobile-filter-trigger" @click="showMobileFilters = true"><span class="inline-icon-label"><AppIcon name="search" :size="16" :stroke-width="2" /><span>Filtros</span></span></n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="pet in pets"
        :key="pet.id"
        class="entity-card"
        @click="openEdit(pet)"
      >
        <div class="card-head">
          <div class="card-copy">
            <p class="card-title" :title="pet.name">{{ pet.name }}</p>
            <p class="card-subtitle" :title="pet.client?.name || '-'">Tutor: {{ displayValue(pet.client?.name) }}</p>
          </div>
          <n-tag :bordered="false" class="species-chip">
            {{ displaySpeciesLabel(pet.species?.name) }}
          </n-tag>
        </div>
        <div class="card-meta">
          <p class="card-line"><span class="card-line-label">Raça:</span> <span class="card-line-value" :title="displayValue(pet.breed?.name)">{{ displayValue(pet.breed?.name) }}</span></p>
          <p class="card-line"><span class="card-line-label">Microchip:</span> <span class="card-line-value" :title="displayValue(pet.microchipCode)">{{ displayValue(pet.microchipCode) }}</span></p>
          <p class="card-line"><span class="card-line-label">Atualizado:</span> <span class="card-line-value">{{ formatDate(pet.updatedAt || '') || '—' }}</span></p>
        </div>
        <div class="card-actions" @click.stop>
          <n-button size="small" secondary type="primary" @click="openEdit(pet)">Ver ficha</n-button>
          <n-dropdown trigger="click" :options="actionOptions" @select="(key: string) => handleActionSelect(key, pet)">
            <n-button size="small" quaternary class="menu-button"><AppIcon name="ellipsis" :size="16" :stroke-width="2" /></n-button>
          </n-dropdown>
        </div>
      </div>
    </div>

    <n-data-table
      v-else
      :loading="loading"
      :columns="columns"
      :data="pets"
      :pagination="pagination"
      :bordered="false"
      :sorter="sorter"
      :row-props="rowProps"
      @update:sorter="onSorterChange"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
      remote
    />

    <div v-if="isMobile" class="pagination">
      <n-pagination
        :page="pagination.page"
        :page-size="pagination.pageSize"
        :item-count="pagination.itemCount"
        show-size-picker
        :page-sizes="pagination.pageSizes"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </div>

    <n-drawer v-model:show="showMobileFilters" placement="bottom" height="52%" :trap-focus="false">
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select
            v-model:value="filters.clientId"
            :options="clientOptions"
            placeholder="Tutor"
            filterable
            remote
            clearable
            :loading="clientLoading"
            @search="onClientSearch"
            @focus="ensureClientsLoaded"
          />
          <n-select
            v-model:value="filters.speciesId"
            :options="speciesOptions"
            placeholder="Espécie"
            clearable
            filterable
            :loading="speciesLoading"
            @focus="ensureSpeciesLoaded"
          />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters">Limpar filtros</n-button>
            <n-button type="primary" @click="applyMobileFilters">Filtrar</n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      class="pet-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">{{ editingPet ? 'Editar pet' : 'Novo pet' }}</h3>
          <p class="modal-subtitle">
            {{ editingPet ? 'Atualize os dados cadastrais e clínicos do paciente.' : 'Cadastre os dados do paciente e vincule ao tutor responsável.' }}
          </p>
        </div>
      </template>
      <n-tabs
        v-if="editingPet?.id"
        v-model:value="activePetTab"
        type="line"
        animated
        class="detail-tabs"
        @update:value="handlePetTabChange"
      >
        <n-tab-pane name="details" tab="Cadastro">
          <PetForm
            ref="petFormRef"
            :value="editingPet"
            :loading="saving"
            @submit="handleSubmit"
          />
        </n-tab-pane>
        <n-tab-pane name="history" tab="Histórico">
          <div class="history-panel">
            <div class="history-summary-grid">
              <n-card size="small" :bordered="false" class="history-summary-card">
                <p class="summary-label">Atendimentos</p>
                <strong class="summary-value">{{ petHistorySummary.appointments }}</strong>
              </n-card>
              <n-card size="small" :bordered="false" class="history-summary-card">
                <p class="summary-label">Consultas</p>
                <strong class="summary-value">{{ petHistorySummary.consultations }}</strong>
              </n-card>
              <n-card size="small" :bordered="false" class="history-summary-card">
                <p class="summary-label">Serviços</p>
                <strong class="summary-value">{{ petHistorySummary.services }}</strong>
              </n-card>
              <n-card size="small" :bordered="false" class="history-summary-card">
                <p class="summary-label">Compras</p>
                <strong class="summary-value">{{ petHistorySummary.purchases }}</strong>
              </n-card>
            </div>

            <n-spin :show="petHistoryLoading">
              <div v-if="!petHistoryData.length && !petHistoryLoading" class="history-empty">
                Nenhum histórico encontrado para este pet.
              </div>
              <div v-else-if="isMobile" class="history-card-list">
                <div
                  v-for="item in petHistoryData"
                  :key="item.id"
                  :class="['history-card', { 'history-card-clickable': resolvePetHistoryTarget(item) }]"
                  @click="handlePetHistoryRecordClick(item)"
                >
                  <div class="history-card-head">
                    <p class="history-card-title">{{ historyTypeLabel(item.type) }}</p>
                    <n-tag :bordered="false" :class="['history-chip', historyTypeClass(item.type)]">
                      {{ historyTypeLabel(item.type) }}
                    </n-tag>
                  </div>
                  <p class="history-card-line" :title="item.title">{{ truncateHistoryText(item.title) }}</p>
                  <p class="history-card-line" :title="item.description || 'Sem descrição adicional.'">
                    {{ truncateHistoryText(item.description || 'Sem descrição adicional.') }}
                  </p>
                  <p class="history-card-line">Data: {{ formatDate(item.occurredAt) }}</p>
                  <p v-if="item.amount !== null && item.amount !== undefined" class="history-card-line">
                    Valor: {{ formatCurrency(item.amount) }}
                  </p>
                  <p v-if="item.scope === 'CLIENT'" class="history-card-scope">Compra vinculada ao tutor do paciente.</p>
                </div>
              </div>
              <n-data-table
                v-else
                class="history-table"
                :columns="petHistoryColumns"
                :data="petHistoryData"
                :row-props="petHistoryRowProps"
                :bordered="false"
              />
            </n-spin>
          </div>
        </n-tab-pane>
      </n-tabs>
      <PetForm
        v-else
        ref="petFormRef"
        :value="editingPet"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div v-if="activePetTab === 'details' || !editingPet?.id" class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal">Cancelar</n-button>
          <n-button type="primary" :loading="saving" @click="submitPetForm">
            {{ editingPet ? 'Salvar alterações' : 'Criar pet' }}
          </n-button>
        </div>
        <div v-else class="modal-actions">
          <n-button tertiary @click="closeModal">Fechar</n-button>
          <n-button type="primary" secondary @click="activePetTab = 'details'">Editar cadastro</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { NButton, NDropdown, NTag, useDialog, useMessage, type SelectOption } from 'naive-ui'
import PetForm, { type Pet } from '~/components/pets/PetForm.vue'

interface PetsResponse {
  data: Pet[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

interface ClientsResponse {
  data: { id: number; name: string }[]
}

interface SpeciesResponse {
  data: { id: number; name: string }[]
}

interface PetHistoryItem {
  id: string
  entityId?: number | null
  relatedEntityId?: number | null
  type: 'APPOINTMENT' | 'CONSULTATION' | 'SERVICE' | 'PURCHASE' | string
  title: string
  description?: string | null
  occurredAt: string
  status?: string | null
  amount?: number | null
  scope?: 'PET' | 'CLIENT' | string
}

interface PetHistoryResponse {
  summary: {
    appointments: number
    consultations: number
    services: number
    purchases: number
    total: number
  }
  data: PetHistoryItem[]
}

const message = useMessage()
const dialog = useDialog()

const filters = reactive({
  name: '',
  clientId: null as number | null,
  speciesId: null as number | null,
  microchipCode: ''
})

const pets = ref<Pet[]>([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showMobileFilters = ref(false)
const editingPet = ref<Pet | null>(null)
const petFormRef = ref<{ submit: () => Promise<void> } | null>(null)
const activePetTab = ref<'details' | 'history'>('details')
const petHistoryLoading = ref(false)
const petHistoryData = ref<PetHistoryItem[]>([])
const petHistorySummary = reactive({
  appointments: 0,
  consultations: 0,
  services: 0,
  purchases: 0,
  total: 0
})
const activeRequestId = ref(0)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const sorter = ref<{ columnKey: string; order: 'ascend' | 'descend' | false }>({
  columnKey: 'updatedAt',
  order: 'descend'
})

const clientOptions = ref<SelectOption[]>([])
const clientLoading = ref(false)
const speciesOptions = ref<SelectOption[]>([])
const speciesLoading = ref(false)

const actionOptions = [
  { label: 'Editar', key: 'edit' },
  { label: 'Vincular tutor', key: 'linkClient' },
  { label: 'Histórico clínico', key: 'history' },
  { type: 'divider', key: 'divider' },
  { label: 'Excluir', key: 'delete' }
]

const truncateHistoryText = (value?: string | null) => (value || '').slice(0, 40)

const petHistoryColumns = [
  {
    title: 'Tipo',
    key: 'type',
    render: (row: PetHistoryItem) =>
      h(
        NTag,
        {
          bordered: false,
          class: ['history-chip', historyTypeClass(row.type)]
        },
        { default: () => historyTypeLabel(row.type) }
      )
  },
  {
    title: 'Evento',
    key: 'title',
    width: 240,
    render: (row: PetHistoryItem) =>
      h('div', { class: 'history-table-cell' }, [
        h('strong', { class: 'history-table-title', title: row.title }, truncateHistoryText(row.title)),
        h(
          'p',
          {
            class: 'history-table-description',
            title: row.description || 'Sem descrição adicional.'
          },
          truncateHistoryText(row.description || 'Sem descrição adicional.')
        )
      ])
  },
  {
    title: 'Data',
    key: 'occurredAt',
    render: (row: PetHistoryItem) => formatDate(row.occurredAt)
  },
  {
    title: 'Valor',
    key: 'amount',
    render: (row: PetHistoryItem) =>
      row.amount === null || row.amount === undefined ? '—' : formatCurrency(row.amount)
  }
]

const summary = computed(() => {
  const rows = pets.value
  const normalize = (value?: string | null) => (value || '').trim().toLowerCase()

  const dogs = rows.filter((pet) => {
    const species = normalize(pet.species?.name)
    return species.includes('cão') || species.includes('cao') || species.includes('cachorro')
  }).length

  const cats = rows.filter((pet) => {
    const species = normalize(pet.species?.name)
    return species.includes('gato')
  }).length

  const microchip = rows.filter((pet) => Boolean((pet.microchipCode || '').trim())).length

  return {
    total: pagination.itemCount,
    dogs,
    cats,
    microchip
  }
})

const handleActionSelect = (key: string, pet: Pet) => {
  if (key === 'edit') {
    openEdit(pet)
    return
  }

  if (key === 'linkClient') {
    message.info('Abra a ficha do pet para vincular ou trocar o tutor.')
    openEdit(pet)
    return
  }

  if (key === 'history') {
    openEdit(pet, 'history')
    return
  }

  if (key === 'delete') {
    confirmDelete(pet)
  }
}

const speciesChipClass = (speciesName?: string | null) => {
  const name = (speciesName || '').trim().toLowerCase()
  if (name.includes('cão') || name.includes('cao') || name.includes('cachorro')) return 'chip-dog'
  if (name.includes('gato')) return 'chip-cat'
  if (name.includes('peixe')) return 'chip-fish'
  if (name.includes('ovino')) return 'chip-sheep'
  return 'chip-default'
}

const columns = [
  {
    title: 'Pet / Tutor',
    key: 'name',
    sorter: true,
    render: (row: Pet) =>
      h('div', { class: 'pet-tutor-cell' }, [
        h('p', { class: 'pet-name ellipsis', title: row.name }, row.name),
        h('p', { class: 'pet-tutor ellipsis', title: `Tutor: ${displayValue(row.client?.name)}` }, `Tutor: ${displayValue(row.client?.name)}`)
      ])
  },
  {
    title: 'Espécie',
    key: 'speciesId',
    render: (row: Pet) =>
      h(
        NTag,
        {
          bordered: false,
          class: ['species-chip', speciesChipClass(row.species?.name)]
        },
        { default: () => displaySpeciesLabel(row.species?.name) }
      )
  },
  {
    title: 'Raça',
    key: 'breedId',
    render: (row: Pet) => h('span', { class: ['ellipsis', valueClass(row.breed?.name)], title: displayValue(row.breed?.name) }, displayValue(row.breed?.name))
  },
  {
    title: 'Microchip',
    key: 'microchipCode',
    sorter: true,
    render: (row: Pet) => h('span', { class: ['ellipsis', valueClass(row.microchipCode)], title: displayValue(row.microchipCode) }, displayValue(row.microchipCode))
  },
  {
    title: 'Atualizado em',
    key: 'updatedAt',
    sorter: true,
    render: (row: Pet) => formatDate(row.updatedAt || '')
  },
  {
    title: 'Ações',
    key: 'actions',
    width: 180,
    render: (row: Pet) =>
      h('div', { class: 'actions' }, [
        h(
          NButton,
          {
            size: 'small',
            secondary: true,
            type: 'primary',
            class: 'action-primary',
            onClick: (e) => {
              e.stopPropagation()
              openEdit(row)
            }
          },
          { default: () => 'Ver ficha' }
        ),
        h(
          NDropdown,
          {
            trigger: 'click',
            options: actionOptions,
            onSelect: (key: string) => handleActionSelect(key, row)
          },
          {
            default: () =>
              h(
                NButton,
                {
                  size: 'small',
                  quaternary: true,
                  class: 'menu-button',
                  onClick: (e) => e.stopPropagation()
                },
                { default: () => '⋯' }
              )
          }
        )
      ])
  }
]

const buildQuery = () => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.pageSize
  }
  if (filters.name) params.name = filters.name
  if (filters.clientId !== null) params.clientId = filters.clientId
  if (filters.speciesId !== null) params.speciesId = filters.speciesId
  if (filters.microchipCode) params.microchipCode = filters.microchipCode
  if (sorter.value.columnKey) params.sortBy = sorter.value.columnKey
  if (sorter.value.order) params.sortDirection = sorter.value.order === 'ascend' ? 'asc' : 'desc'
  return params
}

const fetchPets = async () => {
  const requestId = ++activeRequestId.value
  loading.value = true
  try {
    const api = useApi()
    const { data, meta } = await api<PetsResponse>('/api/v1/pets', {
      query: buildQuery()
    })
    if (requestId !== activeRequestId.value) return
    pets.value = data
    pagination.itemCount = meta.total
    pagination.page = meta.page
    pagination.pageSize = meta.limit
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar pets')
  } finally {
    if (requestId === activeRequestId.value) {
      loading.value = false
    }
  }
}

const handleSubmit = async (payload: Pet) => {
  saving.value = true
  const api = useApi()
  try {
    const { id, client, species, breed, createdAt, updatedAt, deletedAt, ...body } = payload
    if (payload.id) {
      await api(`/api/v1/pets/${payload.id}`, {
        method: 'PATCH',
        body
      })
      message.success('Pet atualizado')
    } else {
      await api('/api/v1/pets', {
        method: 'POST',
        body
      })
      message.success('Pet criado')
    }
    closeModal()
    await fetchPets()
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao salvar pet')
  } finally {
    saving.value = false
  }
}

const submitPetForm = async () => {
  await petFormRef.value?.submit()
}

const resetPetHistory = () => {
  petHistoryData.value = []
  petHistorySummary.appointments = 0
  petHistorySummary.consultations = 0
  petHistorySummary.services = 0
  petHistorySummary.purchases = 0
  petHistorySummary.total = 0
}

const loadPetHistory = async (petId?: number) => {
  if (!petId) return
  petHistoryLoading.value = true
  const api = useApi()
  try {
    const response = await api<PetHistoryResponse>(`/api/v1/pets/${petId}/history`)
    petHistoryData.value = response.data || []
    Object.assign(petHistorySummary, response.summary || {
      appointments: 0,
      consultations: 0,
      services: 0,
      purchases: 0,
      total: 0
    })
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar histórico do pet')
  } finally {
    petHistoryLoading.value = false
  }
}

const handlePetTabChange = (tab: 'details' | 'history') => {
  activePetTab.value = tab
  if (tab === 'history') {
    void loadPetHistory(editingPet.value?.id)
  }
}

const confirmDelete = (pet: Pet) => {
  dialog.warning({
    title: 'Confirmar exclusão',
    content: `Deseja excluir ${pet.name}?`,
    positiveText: 'Excluir',
    negativeText: 'Cancelar',
    onPositiveClick: async () => {
      const api = useApi()
      try {
        await api(`/api/v1/pets/${pet.id}`, {
          method: 'DELETE'
        })
        message.success('Pet excluído')
        await fetchPets()
      } catch (err: any) {
        message.error(err?.data?.message || 'Erro ao excluir pet')
      }
    }
  })
}

const openCreate = () => {
  editingPet.value = null
  activePetTab.value = 'details'
  resetPetHistory()
  showModal.value = true
}

const openEdit = (pet: Pet, tab: 'details' | 'history' = 'details') => {
  editingPet.value = pet
  activePetTab.value = tab
  showModal.value = true
  if (tab === 'history') {
    void loadPetHistory(pet.id)
  }
}

const closeModal = () => {
  showModal.value = false
  activePetTab.value = 'details'
  resetPetHistory()
}

const resolvePetHistoryTarget = (item: PetHistoryItem) => {
  const entityId = Number(item.entityId || 0)
  const relatedEntityId = Number(item.relatedEntityId || 0)

  if (item.type === 'PURCHASE' && entityId > 0) {
    return `/financeiro/vendas/${entityId}`
  }

  if (item.type === 'CONSULTATION' && entityId > 0) {
    return {
      path: '/consultas/novo-atendimento',
      query: { id: String(entityId) }
    }
  }

  if (item.type === 'SERVICE' && relatedEntityId > 0) {
    return {
      path: '/consultas/novo-atendimento',
      query: { id: String(relatedEntityId) }
    }
  }

  if (item.type === 'APPOINTMENT' && entityId > 0) {
    return {
      path: '/atendimento/agendamentos',
      query: { appointmentId: String(entityId) }
    }
  }

  return null
}

const openPetHistoryRecord = async (item: PetHistoryItem) => {
  const target = resolvePetHistoryTarget(item)
  if (!target) {
    message.info('Registro sem destino disponível no momento.')
    return
  }

  closeModal()
  await navigateTo(target)
}

const handlePetHistoryRecordClick = (item: PetHistoryItem) => {
  if (!resolvePetHistoryTarget(item)) return
  void openPetHistoryRecord(item)
}

const petHistoryRowProps = (row: PetHistoryItem) => {
  if (!resolvePetHistoryTarget(row)) return { style: 'cursor: pointer;' }

  return {
    class: 'history-row-clickable',
    style: 'cursor: pointer;',
    onClick: () => openPetHistoryRecord(row)
  }
}

const handleClearFilters = () => {
  filters.name = ''
  filters.clientId = null
  filters.speciesId = null
  filters.microchipCode = ''
  sorter.value = { columnKey: 'updatedAt', order: 'descend' }
  pagination.page = 1
  fetchPets()
}

const onPageChange = (page: number) => {
  pagination.page = page
  fetchPets()
}

const onPageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchPets()
}

const applyMobileFilters = () => {
  showMobileFilters.value = false
  pagination.page = 1
  fetchPets()
}

const onSorterChange = (state: { columnKey?: string | number; order?: 'ascend' | 'descend' | false }) => {
  sorter.value = {
    columnKey: (state.columnKey as string) || 'updatedAt',
    order: state.order || 'descend'
  }
  pagination.page = 1
  fetchPets()
}

const rowProps = (row: Pet) => ({
  style: { cursor: 'pointer' },
  onClick: () => openEdit(row)
})

const fetchClientOptions = async (search?: string) => {
  clientLoading.value = true
  const api = useApi()
  try {
    const { data } = await api<ClientsResponse>('/api/v1/clients', {
      query: {
        limit: 20,
        ...(search ? { name: search } : {})
      }
    })
    clientOptions.value = data.map((item) => ({ label: item.name, value: item.id }))
    if (filters.clientId !== null) {
      const exists = clientOptions.value.some((opt) => opt.value === filters.clientId)
      if (!exists) {
        clientOptions.value = [
          { label: `ID ${filters.clientId}`, value: filters.clientId },
          ...clientOptions.value
        ]
      }
    }
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar clientes')
  } finally {
    clientLoading.value = false
  }
}

const fetchSpeciesOptions = async () => {
  speciesLoading.value = true
  const api = useApi()
  try {
    const { data } = await api<SpeciesResponse>('/api/v1/species', { query: { limit: 100 } })
    speciesOptions.value = data.map((item) => ({ label: item.name, value: item.id }))
  } catch (err: any) {
    message.error(err?.data?.message || 'Erro ao carregar espécies')
  } finally {
    speciesLoading.value = false
  }
}

const onClientSearch = (val: string) => {
  fetchClientOptions(val || undefined)
}

const ensureClientsLoaded = () => {
  if (!clientOptions.value.length && !clientLoading.value) {
    fetchClientOptions()
  }
}

const ensureSpeciesLoaded = () => {
  if (!speciesOptions.value.length && !speciesLoading.value) {
    fetchSpeciesOptions()
  }
}

onMounted(() => {
  fetchPets()
  fetchSpeciesOptions()
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 768px)')
    updateIsMobile()
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateIsMobile)
    } else {
      mediaQuery.addListener(updateIsMobile)
    }
  }
})

onBeforeUnmount(() => {
  if (!mediaQuery) return
  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener('change', updateIsMobile)
  } else {
    mediaQuery.removeListener(updateIsMobile)
  }
})

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(iso))
}

const displayValue = (value?: string | null) => {
  const text = (value ?? '').trim()
  return text ? text : '—'
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))

const historyTypeLabel = (type: string) => {
  if (type === 'APPOINTMENT') return 'Atendimento'
  if (type === 'CONSULTATION') return 'Consulta'
  if (type === 'SERVICE') return 'Serviço'
  if (type === 'PURCHASE') return 'Compra'
  return type
}

const historyTypeClass = (type: string) => {
  if (type === 'APPOINTMENT') return 'history-chip-info'
  if (type === 'CONSULTATION') return 'history-chip-success'
  if (type === 'SERVICE') return 'history-chip-warning'
  if (type === 'PURCHASE') return 'history-chip-neutral'
  return 'history-chip-neutral'
}

const displaySpeciesLabel = (value?: string | null) => {
  const text = displayValue(value)
  if (text === '—') return 'Não informado'
  return text
}

const valueClass = (value?: string | null) => {
  const text = (value ?? '').trim()
  return text ? 'value-strong' : 'value-empty'
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.head-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #4b5563;
  margin: 0;
}

h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
}

.subhead {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-grid-mobile {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mobile-card {
  min-height: 88px;
  height: 88px;
  padding-top: 6px;
  padding-bottom: 6px;
}

.mobile-card :deep(.n-card__content) {
  padding: 10px 12px !important;
  height: 100%;
  box-sizing: border-box;
}

.summary-value-mobile {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  min-height: 112px;
}

.summary-card :deep(.n-card__content) {
  padding: 14px 16px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.summary-label {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  font-weight: 500;
}

.summary-grid-mobile .summary-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-value {
  display: block;
  margin-top: 10px;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.filters-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
}

.filters-card :deep(.n-card__content) {
  padding: 14px 16px !important;
}

.filters-grid :deep(.n-input),
.filters-grid :deep(.n-base-selection) {
  min-height: 40px;
}

.filters-grid :deep(.n-input .n-input-wrapper),
.filters-grid :deep(.n-base-selection .n-base-selection-label) {
  min-height: 40px;
  height: 40px;
}

.mobile-filters-card {
  padding: 10px;
}

.mobile-filter-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-filter-trigger {
  height: 44px;
}

:deep(.mobile-filter-trigger.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
  background: #ffffff;
}

:deep(.mobile-filter-trigger.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

.filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.btn-clear {
  color: #6b7280;
  font-weight: 500;
}

.btn-filter {
  width: 112px;
}

:deep(.btn-filter.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
}

:deep(.btn-filter.n-button:hover) {
  border-color: #0f172a;
  color: #0f172a;
}

.pet-tutor-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pet-name {
  margin: 0;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.1;
  color: #111827;
}

.pet-tutor {
  margin: 0;
  font-size: 10px;
  color: #9ca3af;
  line-height: 1.1;
}

.ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.actions :deep(.n-button) {
  min-height: 30px;
}

.action-primary {
  --n-height: 30px !important;
  --n-padding: 0 10px !important;
  --n-border-radius: 8px !important;
  font-weight: 600;
}

.menu-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  border-radius: 8px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.species-chip {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  line-height: 1.15;
  border: 1px solid transparent;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
}

.chip-default {
  background: #f8fafc;
  color: #475569;
  border-color: #e2e8f0;
}

.chip-dog {
  background: #edf7ef;
  color: #28663b;
  border-color: #d5eadb;
}

.chip-cat {
  background: #fff5e8;
  color: #8a561a;
  border-color: #f5dec0;
}

.chip-fish {
  background: #ecf4ff;
  color: #2a527f;
  border-color: #d7e6fb;
}

.chip-sheep {
  background: #f7f2e9;
  color: #755332;
  border-color: #e9dcc7;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

:deep(.n-data-table) {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.n-data-table-th) {
  font-weight: 600;
  color: #374151;
}

:deep(.n-data-table-tr:hover td) {
  background: #f8fafc;
}

:deep(.n-data-table-td) {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  line-height: 1.2;
}

:deep(.n-data-table-th),
:deep(.n-data-table-td) {
  white-space: nowrap;
  word-break: normal;
}

:deep(.n-data-table .n-data-table__pagination),
:deep(.n-data-table .n-data-table-pagination) {
  min-height: 40px;
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entity-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card-copy {
  min-width: 0;
}

.card-title {
  font-weight: 700;
  font-size: 15px;
  margin: 0 0 2px;
  color: #0f172a;
}

.card-subtitle {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-line {
  margin: 0;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-line-label {
  color: #64748b;
  font-weight: 500;
}

.card-line-value {
  color: #0f172a;
  font-weight: 600;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  gap: 8px;
}

.mobile-filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.value-strong {
  color: #1f2937;
}

.value-empty {
  color: #64748b;
}

@media (max-width: 1200px) {
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: span 3;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .page {
    gap: 12px;
  }

  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .head-copy {
    gap: 2px;
  }

  h1 {
    font-size: 19px;
    line-height: 1.1;
  }

  .subhead {
    font-size: 13px;
  }

  .head-cta {
    width: 100%;
  }

  .mobile-filters-card {
    padding: 8px;
  }

  .mobile-filter-top {
    gap: 8px;
  }

  .mobile-filter-top :deep(.n-input) {
    width: 100%;
  }

  .card-actions {
    margin-top: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
  }

  .card-actions :deep(.n-button) {
    min-height: 36px;
  }

  .menu-button {
    min-width: 40px;
    width: 40px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>

<style>
:root .n-modal-container:has(.pet-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.pet-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.pet-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.pet-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.pet-modal.n-card {
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

.pet-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.pet-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.pet-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.pet-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pet-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.pet-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.pet-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pet-modal .detail-tabs :deep(.n-tabs-nav) {
  margin-bottom: 14px;
}

.history-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.history-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.history-summary-card {
  border-radius: 14px;
  background: #f8fafc;
}

.history-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  padding: 24px 16px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
}

.history-card-list {
  display: grid;
  gap: 10px;
}

.history-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.history-card-clickable {
  cursor: pointer;
}

.history-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.history-card-title,
.history-card-line,
.history-card-scope {
  margin: 0;
}

.history-card-title {
  font-weight: 700;
  color: #0f172a;
}

.history-card-line {
  color: #475569;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.history-card-scope {
  margin-top: 8px;
  color: #64748b;
  font-size: 12px;
}

.history-chip-info {
  background: #dbeafe;
  color: #1d4ed8;
}

.history-chip-success {
  background: #dcfce7;
  color: #15803d;
}

.history-chip-warning {
  background: #fef3c7;
  color: #b45309;
}

.history-chip-neutral {
  background: #e2e8f0;
  color: #334155;
}

.history-table-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
}

.history-table-title,
.history-table-description {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-table-title {
  color: #0f172a;
}

.history-table-description {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

:deep(.history-row-clickable),
:deep(.history-row-clickable td),
.history-table :deep(.n-data-table-tr),
.history-table :deep(.n-data-table-td) {
  cursor: pointer;
}

@media (max-width: 768px) {
  .history-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pet-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .pet-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .pet-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .pet-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .pet-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .pet-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
