<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Financeiro</p>
        <h1>Carteira de Comissões</h1>
      </div>
    </div>

    <div class="summary-grid">
      <n-card size="small" :bordered="false">
        <p class="card-label">Pendente</p>
        <strong class="card-value">{{ formatCurrency(summary.pendingTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false">
        <p class="card-label">Pago</p>
        <strong class="card-value">{{ formatCurrency(summary.paidTotal) }}</strong>
      </n-card>
      <n-card size="small" :bordered="false">
        <p class="card-label">Pendências</p>
        <strong class="card-value">{{ summary.countByStatus.PENDING || 0 }}</strong>
      </n-card>
      <n-card size="small" :bordered="false">
        <p class="card-label">Liquidadas</p>
        <strong class="card-value">{{ summary.countByStatus.PAID || 0 }}</strong>
      </n-card>
    </div>

    <n-card :bordered="false">
      <n-space>
        <n-select
          v-model:value="filters.status"
          :options="statusOptions"
          placeholder="Status"
          clearable
          style="width: 180px"
          @update:value="handleSearch"
        />
        <n-select
          v-model:value="filters.userId"
          :options="userOptions"
          placeholder="Profissional"
          clearable
          filterable
          style="width: 260px"
          @update:value="handleSearch"
        />
        <n-date-picker
          v-model:value="dateRange"
          type="daterange"
          clearable
          placeholder="Período"
          @update:value="handleSearch"
        />
      </n-space>
    </n-card>

    <n-data-table
      remote
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      :bordered="false"
      @update:page="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref, resolveComponent } from 'vue'
import { NTag, useMessage } from 'naive-ui'
import { format } from 'date-fns'

type CommissionRow = {
  id: number
  status: string
  amount: number | string
  baseAmount?: number | string | null
  ratePercent?: number | string | null
  calculatedAt: string
  saleId?: number | null
  procedure?: { name?: string | null } | null
  user?: { name?: string | null } | null
}

const message = useMessage()
const loading = ref(false)
const rows = ref<CommissionRow[]>([])
const userOptions = ref<Array<{ label: string; value: number }>>([])
const dateRange = ref<[number, number] | null>(null)

const filters = reactive({
  status: null as string | null,
  userId: null as number | null
})

const summary = reactive({
  pendingTotal: 0,
  paidTotal: 0,
  countByStatus: {} as Record<string, number>
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0
})

const statusOptions = [
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Paga', value: 'PAID' }
]

const formatCurrency = (value: number | string | null | undefined) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

const getFiltersQuery = () => {
  const query: Record<string, string | number> = {
    page: pagination.page,
    limit: pagination.pageSize
  }

  if (filters.status) query.status = filters.status
  if (filters.userId) query.userId = filters.userId

  if (dateRange.value) {
    query.startDate = new Date(dateRange.value[0]).toISOString()
    query.endDate = new Date(dateRange.value[1]).toISOString()
  }

  return query
}

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: 'Profissional',
    key: 'user',
    render: (row: CommissionRow) => row.user?.name || '-'
  },
  {
    title: 'Procedimento',
    key: 'procedure',
    render: (row: CommissionRow) => row.procedure?.name || 'Origem não identificada'
  },
  {
    title: 'Origem',
    key: 'saleId',
    render: (row: CommissionRow) => row.saleId ? `Venda #${row.saleId}` : '-'
  },
  {
    title: 'Base',
    key: 'baseAmount',
    render: (row: CommissionRow) => formatCurrency(row.baseAmount)
  },
  {
    title: 'Taxa',
    key: 'ratePercent',
    render: (row: CommissionRow) => `${Number(row.ratePercent || 0).toFixed(2)}%`
  },
  {
    title: 'Comissão',
    key: 'amount',
    render: (row: CommissionRow) => formatCurrency(row.amount)
  },
  {
    title: 'Status',
    key: 'status',
    render: (row: CommissionRow) => {
      const typeMap: Record<string, string> = {
        PENDING: 'warning',
        PAID: 'success'
      }
      const labelMap: Record<string, string> = {
        PENDING: 'Pendente',
        PAID: 'Paga'
      }

      return h(resolveComponent('NTag'), {
        type: typeMap[row.status] || 'default',
        bordered: false
      }, {
        default: () => labelMap[row.status] || row.status
      })
    }
  },
  {
    title: 'Calculada em',
    key: 'calculatedAt',
    render: (row: CommissionRow) => format(new Date(row.calculatedAt), 'dd/MM/yyyy HH:mm')
  }
]

const fetchUsers = async () => {
  const api = useApi()
  const response = await api<any>('/api/v1/users', {
    query: {
      page: 1,
      limit: 200
    }
  })

  userOptions.value = (response.data || []).map((user: any) => ({
    label: user.name,
    value: Number(user.id)
  }))
}

const fetchCommissions = async () => {
  loading.value = true
  try {
    const api = useApi()
    const query = getFiltersQuery()
    const [listResponse, summaryResponse] = await Promise.all([
      api<any>('/api/v1/commissions', { query }),
      api<any>('/api/v1/commissions/summary', {
        query: {
          status: filters.status || undefined,
          userId: filters.userId || undefined,
          startDate: query.startDate,
          endDate: query.endDate
        }
      })
    ])

    rows.value = listResponse.data || []
    pagination.itemCount = Number(listResponse.meta?.total || 0)
    summary.pendingTotal = Number(summaryResponse.pendingTotal || 0)
    summary.paidTotal = Number(summaryResponse.paidTotal || 0)
    summary.countByStatus = summaryResponse.countByStatus || {}
  } catch (_error) {
    message.error('Erro ao carregar carteira de comissões')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchCommissions()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchCommissions()
}

onMounted(async () => {
  await fetchUsers()
  await fetchCommissions()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  color: #6b7280;
}

h1 {
  margin: 4px 0 0;
  font-size: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.card-label {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  color: #6b7280;
}

.card-value {
  font-size: 24px;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
