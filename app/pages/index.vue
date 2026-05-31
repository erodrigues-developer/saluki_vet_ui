<template>
  <div class="page">
    <header class="hero">
      <div class="hero-copy">
        <p class="micro-title">Painel geral</p>
        <p class="eyebrow">Painel da clínica · {{ todayLabel }}</p>
        <h1>Visão rápida do dia</h1>
        <p class="lede">
          KPIs essenciais para recepção, veterinários e gestão acompanharem a operação da clínica.
        </p>
      </div>
      <div class="hero-tags">
        <span class="badge success">Aberto até 20h</span>
        <span class="badge neutral">Equipe: 5 vets · 3 recep</span>
        <DashboardAiTrigger :is-mobile="isMobile" @open="openAiAssistant" />
      </div>
    </header>

    <section class="section-block section-hoje">
      <div class="section-head">
        <h2>Hoje</h2>
      </div>
      <div class="kpi-grid">
        <article class="card kpi-card is-primary" role="button" tabindex="0" @click="goTo('/atendimento/agendamentos')" @keydown.enter="goTo('/atendimento/agendamentos')">
          <template v-if="bootLoading">
            <div class="skeleton h16 w40"></div>
            <div class="skeleton h34 w30"></div>
            <div class="skeleton h120 w100"></div>
          </template>
          <template v-else>
            <div class="kpi-body">
            <div class="card-head">
              <div>
                <p class="label">Atendimentos hoje</p>
                <div class="kpi-title">
                  <h3>{{ totalAppointments }}</h3>
                  <small class="kpi-sub">agendados</small>
                </div>
              </div>
              <span class="pill info">+8% vs ontem</span>
            </div>
            <div v-if="totalAppointments" class="donut-wrapper">
              <EChartBase :option="appointmentOption" height="128px" class="donut-chart" />
              <ul class="legend small">
                <li v-for="item in todayAppointments" :key="item.label">
                  <span class="swatch" :style="{ backgroundColor: item.color }"></span>
                  {{ item.label }} · {{ item.value }}
                </li>
              </ul>
            </div>
            <p v-else class="empty-state">Nenhum atendimento agendado para hoje.</p>
            </div>
            <button class="action-link" @click.stop="goTo('/atendimento/agendamentos')">Ver agenda</button>
          </template>
        </article>

        <article class="card kpi-card is-primary" role="button" tabindex="0" @click="goTo('/financeiro/vendas')" @keydown.enter="goTo('/financeiro/vendas')">
          <template v-if="bootLoading">
            <div class="skeleton h16 w36"></div>
            <div class="skeleton h34 w42"></div>
            <div class="skeleton h70 w100"></div>
          </template>
          <template v-else>
            <div class="kpi-body">
            <div class="card-head">
              <div>
                <p class="label">Vendas hoje</p>
                <div class="kpi-title">
                  <h3>{{ formatCurrency(salesToday) }}</h3>
                  <small class="kpi-sub">valor vendido</small>
                </div>
              </div>
              <span class="pill positive">Meta 82%</span>
            </div>
            <div v-if="salesToday" class="sales-extra">
              <p class="micro sales-meta">Recebido: {{ formatCurrency(receivedToday) }} · Ticket médio: {{ formatCurrency(avgTicket) }}</p>
              <EChartBase :option="salesOption" height="70px" class="spark-chart" />
            </div>
            <p v-else class="empty-state">Nenhuma venda registrada hoje.</p>
            </div>
            <button class="action-link" @click.stop="goTo('/financeiro/vendas')">Ver vendas</button>
          </template>
        </article>

        <article class="card kpi-card is-primary" role="button" tabindex="0" @click="goTo('/atendimento/agendamentos')" @keydown.enter="goTo('/atendimento/agendamentos')">
          <template v-if="bootLoading">
            <div class="skeleton h16 w44"></div>
            <div class="skeleton h34 w35"></div>
            <div class="skeleton h72 w100"></div>
          </template>
          <template v-else>
            <div class="kpi-body">
            <div class="card-head">
              <div>
                <p class="label">Vacinas pendentes</p>
                <div class="kpi-title">
                  <h3>{{ vaccinesSummary.today }}</h3>
                  <small class="kpi-sub">para aplicar hoje</small>
                </div>
              </div>
              <span class="pill warn">{{ vaccinesSummary.overdue }} atrasadas</span>
            </div>
            <div v-if="vaccinesSummary.today || vaccinesSummary.upcoming" class="split-detail">
              <p><strong>{{ vaccinesSummary.today }}</strong> para aplicar hoje</p>
              <p><strong>{{ vaccinesSummary.upcoming }}</strong> nos próximos 7 dias</p>
            </div>
            <ul class="mini-list" v-if="vaccinesList.length">
              <li v-for="item in vaccinesList.slice(0, 3)" :key="item.name">
                <span class="truncate">{{ item.name }}</span>
                <span class="micro align-right">{{ item.when }}</span>
              </li>
            </ul>
            <p v-else class="empty-state">Nenhuma vacina pendente.</p>
            </div>
            <button class="action-link" @click.stop="goTo('/atendimento/agendamentos')">Ver agenda de vacinas</button>
          </template>
        </article>

        <article class="card kpi-card is-primary" role="button" tabindex="0" @click="goTo('/cadastros/produtos')" @keydown.enter="goTo('/cadastros/produtos')">
          <template v-if="bootLoading">
            <div class="skeleton h16 w36"></div>
            <div class="skeleton h34 w30"></div>
            <div class="skeleton h100 w100"></div>
          </template>
          <template v-else>
            <div class="kpi-body">
            <div class="card-head">
              <div>
                <p class="label">Estoque crítico</p>
                <div class="kpi-title">
                  <h3>{{ criticalStock.length }}</h3>
                  <small class="kpi-sub">itens abaixo do mínimo</small>
                </div>
              </div>
              <span class="pill alert">Ação hoje</span>
            </div>
            <ul v-if="criticalStock.length" class="mini-list compact">
              <li v-for="item in criticalStock.slice(0, 3)" :key="item.name">
                <span class="truncate">{{ item.name }}</span>
                <span class="micro align-right">{{ item.daysLeft }} dias</span>
              </li>
            </ul>
            <p v-else class="empty-state">Nenhum item crítico no estoque.</p>
            </div>
            <button class="action-link" @click.stop="goTo('/cadastros/produtos')">Ver estoque crítico</button>
          </template>
        </article>
      </div>
    </section>

    <section class="section-block section-financeiro">
      <div class="section-head">
        <h2>Financeiro</h2>
      </div>
      <div class="mid-grid">
        <article class="card section-card finance-card">
          <div class="card-head">
            <div>
              <p class="label">Resumo financeiro</p>
              <h3>Contas a pagar · mês atual</h3>
            </div>
            <span class="pill neutral">Atualização diária</span>
          </div>
          <div v-if="financeError" class="error-state">
            <p>Não foi possível carregar este indicador.</p>
            <button class="action-link" @click="fetchPayablesDash">Tentar novamente</button>
          </div>
          <template v-else-if="financeLoading">
            <div class="kpi-row">
              <div class="skeleton h66 w100"></div>
              <div class="skeleton h66 w100"></div>
              <div class="skeleton h66 w100"></div>
              <div class="skeleton h66 w100"></div>
            </div>
          </template>
          <template v-else>
            <div v-if="hasFinanceData" class="kpi-row">
              <div class="mini-kpi mini-kpi-warning"><span>Pendente</span><strong>{{ formatCurrency(financeKpis.totalPending) }}</strong></div>
              <div class="mini-kpi mini-kpi-success"><span>Pago</span><strong>{{ formatCurrency(financeKpis.totalPaid) }}</strong></div>
              <div class="mini-kpi mini-kpi-neutral"><span>Previsão</span><strong>{{ formatCurrency(financeKpis.expectedTotal) }}</strong></div>
              <div class="mini-kpi mini-kpi-danger"><span>Atrasado</span><strong>{{ formatCurrency(financeKpis.totalOverdue) }}</strong></div>
            </div>
            <p v-else class="empty-state">Nenhuma pendência financeira no período.</p>
          </template>
          <button class="action-link" @click="goTo('/financeiro/contas-a-pagar')">Ver contas a pagar</button>
        </article>

        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Atendimentos</p>
              <h3>Consultas — últimos 14 dias</h3>
            </div>
            <span class="pill neutral pill-strong">{{ consultationsTotal }} atendimentos</span>
          </div>
          <div v-if="chartsLoading" class="skeleton h220 w100"></div>
          <EChartBase v-else :option="consultationsOption" height="220px" class="tall-chart" />
          <button class="action-link" @click="goTo('/atendimento/consultas')">Ver atendimentos</button>
        </article>

        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Faturamento do mês</p>
              <h3>Receita diária consolidada</h3>
            </div>
            <span class="pill positive">+12% vs mês passado</span>
          </div>
          <div v-if="chartsLoading" class="skeleton h220 w100"></div>
          <EChartBase v-else :option="revenueOption" height="220px" class="tall-chart" />
          <button class="action-link" @click="goTo('/financeiro/vendas')">Ver relatório financeiro</button>
        </article>

        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Distribuição de custos</p>
              <h3>Despesas por categoria</h3>
            </div>
          </div>
          <div class="cost-summary" v-if="hasExpenseSummary">
            <p>Total: <strong>{{ formatCurrency(totalExpenses) }}</strong></p>
            <p>Maior categoria: <strong>{{ topExpenseCategory.name }} · {{ topExpenseCategory.percentage }}%</strong></p>
          </div>
          <div v-if="chartsLoading" class="skeleton h220 w100"></div>
          <EChartBase v-else :option="pieChartOptions" height="220px" class="tall-chart" />
          <button class="action-link" @click="goTo('/financeiro/contas-a-pagar')">Ver despesas</button>
        </article>
      </div>
    </section>

    <section class="section-block section-alertas">
      <div class="section-head">
        <h2>Alertas</h2>
      </div>
      <div class="alert-grid">
        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Produtos com estoque crítico</p>
              <h3>Lista detalhada</h3>
            </div>
            <span class="pill alert">Prioridade alta</span>
          </div>
          <ul v-if="criticalStock.length" class="mini-list">
            <li v-for="item in criticalStock.slice(0, 3)" :key="item.name">
              <span class="truncate">{{ item.name }} · {{ item.qty }} un</span>
              <span class="micro align-right">{{ item.daysLeft }} dias</span>
            </li>
          </ul>
          <p v-else class="empty-state">Nenhum item crítico no estoque.</p>
          <button class="action-link" @click="goTo('/cadastros/produtos')">Repor estoque</button>
        </article>

        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Vacinas em agenda</p>
              <h3>Próximas aplicações</h3>
            </div>
            <span class="pill warn">7 dias</span>
          </div>
          <ul v-if="vaccinesList.length" class="mini-list">
            <li v-for="item in vaccinesList.slice(0, 3)" :key="`agenda-${item.name}`">
              <span class="truncate">{{ item.name }}</span>
              <span class="micro align-right">{{ item.when }}</span>
            </li>
          </ul>
          <p v-else class="empty-state">Nenhuma vacina pendente.</p>
          <button class="action-link" @click="goTo('/atendimento/agendamentos')">Ver vacinas</button>
        </article>

        <article class="card section-card alert-priority">
          <div class="card-head">
            <div>
              <p class="label">Previsão de pagamentos</p>
              <h3>Pago, pendente e atrasado</h3>
            </div>
          </div>
          <div v-if="alertsLoading" class="skeleton h180 w100"></div>
          <EChartBase v-else :option="barChartOptions" height="180px" class="tall-chart" />
          <button class="action-link" @click="goTo('/financeiro/contas-a-pagar')">Ver contas</button>
        </article>

        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Taxa de presença</p>
              <h3>{{ attendanceRate }}%</h3>
            </div>
            <span class="pill info">Semanal</span>
          </div>
          <p class="subhead">Confirmados vs cancelamentos/faltas na semana</p>
          <div v-if="chartsLoading" class="skeleton h140 w100"></div>
          <EChartBase v-else :option="attendanceOption" height="140px" class="tall-chart" />
        </article>

        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Mix de procedimentos</p>
              <h3>{{ proceduresTotal }} registros</h3>
            </div>
          </div>
          <div class="donut-wrapper small">
            <EChartBase :option="proceduresOption" height="132px" class="donut-chart" />
            <ul class="legend">
              <li v-for="item in proceduresWithPercentage" :key="item.label">
                <span class="swatch" :style="{ backgroundColor: item.color }"></span>
                {{ item.label }} · {{ item.value }} · {{ item.percentage }}%
              </li>
            </ul>
          </div>
          <button class="action-link" @click="goTo('/cadastros/procedimentos')">Ver procedimentos</button>
        </article>

        <article class="card section-card">
          <div class="card-head">
            <div>
              <p class="label">Recebimentos pendentes</p>
              <h3>Vendas abertas</h3>
            </div>
            <span class="pill warn">{{ openSalesCount }} abertas</span>
          </div>
          <template v-if="openSalesCount">
            <p class="open-sales-total">{{ formatCurrency(openSalesTotalPending) }}</p>
            <p class="subhead open-sales-sub">{{ openSalesCount }} vendas aguardando recebimento</p>
            <ul class="mini-list">
              <li v-for="sale in openSales.slice(0, 3)" :key="sale.id">
                <span class="truncate">Venda #{{ sale.id }}</span>
                <span class="micro align-right">{{ formatCurrency(sale.amount) }}</span>
              </li>
            </ul>
          </template>
          <p v-else class="empty-state">Nenhuma venda aberta.</p>
          <button class="action-link" @click="goTo('/financeiro/vendas?status=aberta')">Ver vendas abertas</button>
        </article>
      </div>
    </section>

    <AiChatFloating
      :show="aiOpen"
      launcher
      :is-mobile="isMobile"
      title="Assistente inteligente"
      subtitle="Insights operacionais do dashboard atual."
      launcher-title="Analisar com IA"
      context-line="Dashboard operacional · Clínica aberta até 20h"
      :context-chips="['Hoje', 'Financeiro', 'Estoque', 'Vacinas', 'Atendimentos']"
      :messages="aiMessages"
      :loading="aiLoading"
      :question="aiQuestion"
      placeholder="Pergunte algo sobre os indicadores da clínica..."
      :suggested-questions="suggestedQuestions"
      :primary-action="{ label: aiLoading ? 'Analisando indicadores...' : 'Gerar análise do dashboard', disabled: aiLoading }"
      @open="openAiAssistant"
      @close="aiOpen = false"
      @primary-action="handleGenerateAnalysis"
      @select-question="handleSuggestedQuestion"
      @update:question="aiQuestion = $event"
      @send="handleSendQuestion"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import DashboardAiTrigger from '~/components/dashboard-ai/DashboardAiTrigger.vue'
import AiChatFloating from '~/components/ai/AiChatFloating.vue'
import { suggestedQuestions } from '~/mocks/dashboardAi.mock'
import { useAiConversation } from '~/composables/useAiConversation'

const router = useRouter()
const dashboardData = ref(null)
const financeLoading = ref(false)
const financeError = ref(false)
const bootLoading = ref(true)
const chartsLoading = ref(true)
const alertsLoading = ref(true)
const currentMonth = new Date().getMonth() + 1
const currentYear = new Date().getFullYear()
const isMobile = ref(false)
const aiOpen = ref(false)
const aiQuestion = ref('')
let mediaQuery = null
let mediaQueryListener = null

const dashboardContextSnapshot = () => ({
  screen: 'dashboard',
  clinicStatus: 'Aberto até 20h',
  appointmentsToday: totalAppointments.value,
  salesToday,
  receivedToday,
  avgTicket,
  criticalStockCount: criticalStock.length,
  criticalStock: criticalStock.slice(0, 5),
  vaccines: vaccinesSummary,
  finance: financeKpis.value,
  openSalesCount: openSalesCount.value,
  openSalesTotalPending: openSalesTotalPending.value
})

const dashboardConversation = useAiConversation({
  contextType: 'dashboard.operational',
  contextId: () => 'current',
  title: 'Assistente inteligente',
  initialAssistantMessage: 'Olá! Posso analisar os indicadores do dashboard e ajudar você a identificar riscos, oportunidades e prioridades operacionais.',
  metadata: () => ({ screen: 'dashboard' }),
  contextSnapshot: dashboardContextSnapshot,
})
const aiMessages = dashboardConversation.messages
const aiLoading = dashboardConversation.loading

const fetchPayablesDash = async () => {
  financeLoading.value = true
  financeError.value = false
  try {
    const query = new URLSearchParams({ month: String(currentMonth), year: String(currentYear) })
    const api = useApi()
    const dashRes = await api(`/api/v1/accounts-payable/dashboard?${query.toString()}`)
    dashboardData.value = dashRes?.data || dashRes || null
  } catch (err) {
    financeError.value = true
    dashboardData.value = null
  } finally {
    financeLoading.value = false
  }
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 900px)')
    isMobile.value = mediaQuery.matches
    mediaQueryListener = (event) => { isMobile.value = event.matches }
    mediaQuery.addEventListener?.('change', mediaQueryListener)
    mediaQuery.addListener?.(mediaQueryListener)
  }
  await Promise.all([fetchPayablesDash(), new Promise((resolve) => setTimeout(resolve, 500))])
  bootLoading.value = false
  chartsLoading.value = false
  alertsLoading.value = false
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener?.('change', mediaQueryListener)
  mediaQuery?.removeListener?.(mediaQueryListener)
})

const openAiAssistant = async () => {
  await dashboardConversation.ensureConversation()
  aiOpen.value = true
}

const handleGenerateAnalysis = async () => {
  await dashboardConversation.sendUserMessage('Gerar análise do dashboard')
}

const handleSuggestedQuestion = async (question) => {
  await dashboardConversation.sendUserMessage(question)
}

const handleSendQuestion = async () => {
  const question = aiQuestion.value.trim()
  if (!question || aiLoading.value) return
  aiQuestion.value = ''
  await dashboardConversation.sendUserMessage(question)
}

const palette = {
  primary: '#0E3A56',
  primary700: '#092A3D',
  secondary: '#2CB67D',
  accent: '#33B8C4',
  neutral300: '#CBD2D9',
  neutral500: '#4B5563',
  neutral900: '#1F2937',
  statusSuccess: '#2CB67D',
  statusWarning: '#F7B731',
  statusError: '#E63946',
  chartBlue: '#4F8CC9',
  chartGreen: '#67D4A3',
  chartPurple: '#A98DF0',
  chartOrange: '#FF8F5E',
  chartGray: '#8795A1'
}

const todayAppointments = [
  { label: 'Consultas', value: 18, color: palette.chartBlue },
  { label: 'Vacinas', value: 9, color: palette.chartGreen },
  { label: 'Retornos', value: 6, color: palette.chartOrange }
]

const attendance = [
  { label: 'Seg', confirmed: 22, canceled: 3, missed: 2 },
  { label: 'Ter', confirmed: 19, canceled: 4, missed: 1 },
  { label: 'Qua', confirmed: 21, canceled: 2, missed: 3 },
  { label: 'Qui', confirmed: 18, canceled: 5, missed: 2 },
  { label: 'Sex', confirmed: 24, canceled: 2, missed: 1 },
  { label: 'Sáb', confirmed: 12, canceled: 1, missed: 1 }
]

const consultations = [18, 21, 17, 22, 26, 15, 11, 20, 23, 19, 24, 27, 16, 12]
const salesTrend = [8.5, 9.2, 7.4, 9.8, 10.1, 11.4, 9.6, 12.2, 11.8, 12.5, 13.2, 11.7, 12.9, 14.4]
const salesToday = 12450
const receivedToday = 10740
const avgTicket = 294

const criticalStock = [
  { name: 'Antibiótico felino 80mg', qty: 6, daysLeft: 2 },
  { name: 'Soro hidratante 500ml', qty: 9, daysLeft: 3 },
  { name: 'Vacina V8', qty: 14, daysLeft: 4 }
]

const vaccinesSummary = { today: 14, overdue: 3, upcoming: 22 }
const vaccinesList = [
  { name: 'Bella · Leptospirose', when: '08h30 · sala 2' },
  { name: 'Thor · V10 reforço', when: '10h15 · sala 1' },
  { name: 'Mia · Raiva', when: '14h00 · sala 3' }
]
const openSales = [
  { id: 6, amount: 233 },
  { id: 5, amount: 645 },
  { id: 2, amount: 832 }
]

const revenueData = [12400, 14200, 15600, 14900, 16800, 17400, 18100, 16300, 17700]

const procedures = [
  { label: 'Consultas', value: 230, color: palette.chartBlue },
  { label: 'Vacinas', value: 140, color: palette.chartGreen },
  { label: 'Curativos', value: 95, color: palette.chartOrange },
  { label: 'Exames', value: 80, color: palette.chartPurple },
  { label: 'Banho/Tosa', value: 65, color: palette.chartGray }
]

const todayLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())
)

const totalAppointments = computed(() => todayAppointments.reduce((sum, item) => sum + item.value, 0))
const consultationsTotal = computed(() => consultations.reduce((sum, item) => sum + item, 0))
const proceduresTotal = computed(() => procedures.reduce((sum, item) => sum + item.value, 0))
const proceduresWithPercentage = computed(() =>
  procedures.map((item) => ({
    ...item,
    percentage: proceduresTotal.value ? Math.round((item.value / proceduresTotal.value) * 100) : 0
  }))
)
const attendanceRate = computed(() => {
  const totals = attendance.reduce(
    (acc, day) => {
      acc.confirmed += day.confirmed
      acc.total += day.confirmed + day.canceled + day.missed
      return acc
    },
    { confirmed: 0, total: 0 }
  )
  return totals.total ? Math.round((totals.confirmed / totals.total) * 100) : 0
})
const openSalesTotalPending = computed(() =>
  openSales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0)
)
const openSalesCount = computed(() => openSales.length)

const financeKpis = computed(() => ({
  totalPending: dashboardData.value?.kpis?.totalPending || 0,
  totalPaid: dashboardData.value?.kpis?.totalPaid || 0,
  expectedTotal: dashboardData.value?.kpis?.expectedTotal || 0,
  totalOverdue: dashboardData.value?.kpis?.totalOverdue || 0
}))

const hasFinanceData = computed(() => Object.values(financeKpis.value).some((value) => value > 0))
const expenseCategories = computed(() => dashboardData.value?.charts?.categoryPie || [])
const totalExpenses = computed(() =>
  expenseCategories.value.reduce((sum, item) => sum + Number(item?.value || 0), 0)
)
const topExpenseCategory = computed(() => {
  if (!expenseCategories.value.length || !totalExpenses.value) {
    return { name: '—', percentage: 0 }
  }
  const top = expenseCategories.value.reduce((max, item) =>
    Number(item.value) > Number(max.value) ? item : max
  )
  return {
    name: top.name || '—',
    percentage: Math.round((Number(top.value || 0) / totalExpenses.value) * 100)
  }
})
const hasExpenseSummary = computed(() => totalExpenses.value > 0)

const appointmentOption = computed(() => ({
  color: todayAppointments.map((item) => item.color),
  tooltip: { trigger: 'item' },
  legend: { show: false },
  series: [
    {
      name: 'Agendamentos',
      type: 'pie',
      radius: ['60%', '78%'],
      label: {
        show: true,
        position: 'center',
        formatter: () => `{value|${totalAppointments.value}}\n{sub|agendados}`,
        rich: {
          value: { fontSize: 20, fontWeight: 700, color: palette.primary700, lineHeight: 28 },
          sub: { fontSize: 12, color: palette.neutral900 }
        }
      },
      labelLine: { show: false },
      data: todayAppointments.map((item) => ({ value: item.value, name: item.label }))
    }
  ]
}))

const proceduresOption = computed(() => ({
  color: procedures.map((item) => item.color),
  tooltip: { trigger: 'item' },
  series: [{ type: 'pie', radius: ['58%', '78%'], label: { show: false }, data: procedures.map((item) => ({ value: item.value, name: item.label })) }]
}))

const salesOption = computed(() => ({
  color: [palette.accent],
  tooltip: { trigger: 'axis' },
  grid: { left: 0, right: 0, top: 8, bottom: 0 },
  xAxis: { type: 'category', boundaryGap: false, show: false, data: salesTrend.map((_, idx) => idx + 1) },
  yAxis: { type: 'value', show: false },
  series: [{ type: 'line', data: salesTrend, smooth: true, symbol: 'none', areaStyle: { opacity: 0.12 }, lineStyle: { width: 2 } }]
}))

const consultationsOption = computed(() => ({
  color: [palette.chartBlue],
  tooltip: { trigger: 'axis' },
  grid: { left: '4%', right: '4%', top: 20, bottom: 28, containLabel: true },
  xAxis: { type: 'category', data: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D14'] },
  yAxis: { type: 'value' },
  series: [{ name: 'Consultas', type: 'line', data: consultations, smooth: true, symbol: 'circle', symbolSize: 6, areaStyle: { opacity: 0.14 }, lineStyle: { width: 3 } }]
}))

const revenueOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '5%', right: '5%', top: 20, bottom: 28, containLabel: true },
  xAxis: { type: 'category', data: ['1', '4', '7', '10', '13', '16', '19', '22', '25'] },
  yAxis: { type: 'value' },
  series: [{ name: 'Faturamento', type: 'bar', barWidth: '45%', data: revenueData, itemStyle: { color: palette.chartBlue } }]
}))

const pieChartOptions = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: R$ {c} ({d}%)' },
  series: [{ name: 'Categoria', type: 'pie', radius: '52%', data: dashboardData.value?.charts?.categoryPie || [] }]
}))

const barChartOptions = computed(() => {
  const data = dashboardData.value?.charts?.flowBar || []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Pago', 'Pendente', 'Atrasado'] },
    xAxis: { type: 'category', data: data.map((d) => `Dia ${d.day}`) },
    yAxis: { type: 'value' },
    series: [
      { name: 'Pago', type: 'bar', stack: 'total', itemStyle: { color: '#18a058' }, data: data.map((d) => d.paid) },
      { name: 'Pendente', type: 'bar', stack: 'total', itemStyle: { color: '#f0a020' }, data: data.map((d) => d.pending) },
      { name: 'Atrasado', type: 'bar', stack: 'total', itemStyle: { color: '#d03050' }, data: data.map((d) => d.overdue) }
    ]
  }
})

const attendanceOption = computed(() => ({
  color: [palette.statusSuccess, palette.statusWarning, palette.statusError],
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '6%', right: '6%', top: 16, bottom: 28, containLabel: true },
  legend: { show: false },
  xAxis: { type: 'category', data: attendance.map((item) => item.label) },
  yAxis: { type: 'value' },
  series: [
    { name: 'Confirmado', type: 'bar', stack: 'attendance', data: attendance.map((item) => item.confirmed), barWidth: '55%' },
    { name: 'Cancelado', type: 'bar', stack: 'attendance', data: attendance.map((item) => item.canceled) },
    { name: 'Faltou', type: 'bar', stack: 'attendance', data: attendance.map((item) => item.missed) }
  ]
}))

const goTo = (path) => router.push(path)

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

:global(body) {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  background: linear-gradient(155deg, #f8fbfd, #eef2f7);
  color: #1f2937;
}

.page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 28px 22px 64px;
  min-width: 0;
  overflow-x: clip;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  min-width: 0;
}

h1 {
  margin: 0;
  font-size: 22px;
  color: #092a3d;
}

h2 {
  margin: 0;
  font-size: 18px;
  color: #0b3046;
}

h3 {
  margin: 0;
  font-size: 22px;
  color: #092a3d;
}

.hero-copy { max-width: 760px; }
.micro-title, .eyebrow, .label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #4b5563;
  margin: 0;
}

.eyebrow { margin-top: 2px; }
.lede { margin: 8px 0 0; color: #4b5563; line-height: 1.45; }

.hero-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.badge { padding: 9px 12px; border-radius: 999px; font-size: 12px; border: 1px solid #cbd2d9; background: #fff; }
.badge.success { color: #1f8c5a; border-color: #b5e4cc; }
.badge.neutral { color: #4b5563; }

.section-block { margin-top: 28px; }
.section-head { margin-bottom: 12px; }

.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.mid-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.alert-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }

.card {
  background: #fff;
  border: 1px solid #e6e9ef;
  border-radius: 14px;
  padding: 16px;
  min-height: 210px;
  min-width: 0;
}

.section-card {
  display: flex;
  flex-direction: column;
}

.kpi-card {
  min-height: 330px;
  display: flex;
  flex-direction: column;
}

.kpi-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
}

.card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.kpi-title { display: flex; align-items: baseline; gap: 8px; }
.kpi-sub, .micro { color: #4b5563; font-size: 12px; margin: 0; }

.is-primary { border-color: #d9e5ef; box-shadow: 0 8px 22px rgba(14, 58, 86, 0.06); cursor: pointer; }
.is-primary:hover { transform: translateY(-1px); transition: transform 120ms ease; }

.pill { padding: 5px 9px; border-radius: 999px; min-height: 24px; font-size: 11px; border: 1px solid #d9e0e7; color: #334155; background: #f8fafc; display: inline-flex; align-items: center; }
.pill.positive { background: #ecfdf5; color: #157347; border-color: #c6f4dc; }
.pill.warn { background: #fff9e8; color: #a0660d; border-color: #f7dfaa; }
.pill.alert { background: #fff1f3; color: #b4233a; border-color: #f9c8d1; }
.pill.info { background: #eff6ff; color: #1d4ed8; border-color: #c7ddff; }
.pill.neutral { background: #f6f7f9; color: #4b5563; }
.pill-strong { color: #334155; border-color: #cbd5e1; background: #f1f5f9; }

.donut-wrapper { display: flex; gap: 12px; align-items: center; min-width: 0; }
.legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; font-size: 12px; color: #4b5563; }
.legend li { display: flex; align-items: center; gap: 7px; min-width: 0; }
.swatch { width: 10px; height: 10px; border-radius: 3px; }

.spark-chart, .donut-chart, .tall-chart, .echart-base { width: 100%; max-width: 100%; }

.mini-list { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
.mini-list li { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 9px 10px; border: 1px solid #edf0f4; border-radius: 10px; background: #fbfcfd; }
.mini-list.compact li { padding: 8px 10px; }
.mini-list li span:last-child { flex-shrink: 0; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.align-right { text-align: right; }

.split-detail { display: grid; gap: 4px; margin-top: 6px; font-size: 13px; color: #334155; }
.split-detail p { margin: 0; }
.sales-extra { margin-top: 6px; }
.sales-meta { font-size: 13px; color: #334155; }
.subhead { margin: 6px 0 0; color: #4b5563; font-size: 12px; }
.open-sales-total {
  margin: 2px 0 0;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  color: #092a3d;
}
.open-sales-sub {
  margin: 4px 0 2px;
}
.cost-summary { margin-bottom: 8px; font-size: 13px; color: #334155; }
.cost-summary p { margin: 0 0 4px; }

.kpi-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 8px 0 10px; }
.mini-kpi { border: 1px solid #edf0f4; border-radius: 10px; padding: 10px; background: #fbfcfd; }
.mini-kpi span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #4b5563; display: block; margin-bottom: 4px; }
.mini-kpi strong { font-size: 18px; color: #092a3d; }
.mini-kpi-warning { border-color: #fdecc8; background: #fffdf6; }
.mini-kpi-success { border-color: #d1fae5; background: #f7fef9; }
.mini-kpi-danger { border-color: #fecaca; background: #fff8f8; }
.mini-kpi-neutral { border-color: #e5e7eb; background: #ffffff; }

.action-link {
  margin-top: auto;
  border: 0;
  background: transparent;
  color: #0b4c75;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
  padding: 0;
  cursor: pointer;
  text-decoration: none;
  transition: color 120ms ease;
}
.action-link:hover { color: #083856; }

.empty-state { color: #6b7280; font-size: 13px; margin: 10px 0 0; }
.error-state { border: 1px solid #f9c8d1; background: #fff5f6; border-radius: 10px; padding: 10px; color: #9f1239; }

.skeleton {
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f3f7 20%, #e6ebf2 45%, #f0f3f7 75%);
  background-size: 300% 100%;
  animation: pulse 1.2s ease-in-out infinite;
  margin-bottom: 8px;
}
.h16 { height: 16px; }
.h34 { height: 34px; }
.h66 { height: 66px; }
.h70 { height: 70px; }
.h72 { height: 72px; }
.h100 { height: 100px; }
.h120 { height: 120px; }
.h140 { height: 140px; }
.h180 { height: 180px; }
.h220 { height: 220px; }
.w30 { width: 30%; }
.w36 { width: 36%; }
.w40 { width: 40%; }
.w42 { width: 42%; }
.w44 { width: 44%; }
.w100 { width: 100%; }

@keyframes pulse {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .alert-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 860px) {
  .hero { flex-direction: column; gap: 10px; }
  .mid-grid, .kpi-grid, .alert-grid { grid-template-columns: 1fr; }
  h1 { font-size: 19px; }
  .page { padding: 24px 16px 52px; }
  .donut-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }
  .donut-wrapper .donut-chart {
    width: 100%;
  }
  .legend {
    width: 100%;
  }
  .section-hoje { order: 1; }
  .section-alertas { order: 2; }
  .section-financeiro { order: 3; }
  .page { display: flex; flex-direction: column; }
  .alert-grid > :nth-child(1) { order: 1; }
  .alert-grid > :nth-child(2) { order: 2; }
  .alert-grid > :nth-child(3) { order: 3; }
  .alert-grid > :nth-child(4) { order: 4; }
  .alert-grid > :nth-child(5) { order: 5; }
}
</style>
