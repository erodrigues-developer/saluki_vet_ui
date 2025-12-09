<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="micro-title">Painel geral</p>
        <p class="eyebrow">Painel da clínica - {{ todayLabel }}</p>
        <h1>Visão rápida do dia</h1>
        <p class="lede">
          KPIs essenciais para recepção e veterinários monitorarem atendimentos, vendas e operação.
        </p>
      </div>
      <div class="hero-tags">
        <span class="badge success">Aberto - até 20h</span>
        <span class="badge neutral">Equipe - 5 vets - 3 recep</span>
      </div>
    </header>

    <section class="kpi-grid">
      <div class="card kpi-card">
        <div class="card-head">
          <div>
            <p class="label">Atendimentos hoje</p>
            <div class="kpi-title">
              <h2>{{ totalAppointments }}</h2>
              <small class="kpi-sub">agendados</small>
            </div>
          </div>
          <span class="pill positive">🔼 +8 vs ontem</span>
        </div>
        <div class="donut-wrapper">
          <EChartBase :option="appointmentOption" height="132px" class="donut-chart" />
          <ul class="legend small">
            <li v-for="item in todayAppointments" :key="item.label">
              <span class="swatch" :style="{ backgroundColor: item.color }"></span>
              {{ item.label }} - {{ item.value }}
            </li>
          </ul>
        </div>
      </div>

      <div class="card kpi-card sales">
        <div class="card-head">
          <div>
            <p class="label">Vendas hoje</p>
            <div class="kpi-title">
              <h2>{{ formatCurrency(salesToday) }}</h2>
              <small class="kpi-sub">faturado</small>
            </div>
          </div>
          <span class="pill positive">🔼 Meta 82%</span>
        </div>
        <div class="sparkline">
          <EChartBase :option="salesOption" height="70px" class="spark-chart" />
          <p class="micro">Últimos 14 dias</p>
        </div>
      </div>

      <div class="card kpi-card">
        <div class="card-head">
          <div>
            <p class="label">Vacinas pendentes</p>
            <div class="kpi-title">
              <h2>{{ vaccinesSummary.today }}</h2>
              <small class="kpi-sub">para aplicar hoje</small>
            </div>
          </div>
          <span class="pill accent">🕒 +{{ vaccinesSummary.overdue }} atrasadas</span>
        </div>
        <div class="split">
          <div class="big-number">{{ vaccinesSummary.upcoming }}</div>
          <div>
            <p class="label">Próximos 7 dias</p>
            <p class="micro">Organize agenda e lembretes.</p>
          </div>
        </div>
        <div class="progress">
          <div
            v-for="item in vaccineBars"
            :key="item.label"
            class="progress-bar"
            :style="{ width: item.percent + '%', backgroundColor: item.color }"
            :title="item.label"
          ></div>
        </div>
        <ul class="mini-list">
          <li v-for="item in vaccinesList" :key="item.name">
            <div class="list-main">
              <span class="icon">{{ item.icon }}</span>
              <span>{{ item.name }}</span>
            </div>
            <span class="micro">{{ item.when }}</span>
          </li>
        </ul>
      </div>

      <div class="card kpi-card warning">
        <div class="card-head">
          <div>
            <p class="label">Estoque crítico</p>
            <div class="kpi-title">
              <h2>{{ criticalStock.length }} itens</h2>
              <small class="kpi-sub">abaixo do mínimo</small>
            </div>
          </div>
          <span class="pill alert">⚠️ Repor hoje</span>
        </div>
        <ul class="mini-list alert-list">
          <li v-for="item in criticalStock" :key="item.name">
            <div class="list-main">
              <span class="icon">{{ item.icon }}</span>
              <span>{{ item.name }}</span>
              <p class="micro">Dias restantes: {{ item.daysLeft }}</p>
            </div>
            <span class="qty">{{ item.qty }} un</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="chart-grid">
      <div class="card wide">
        <div class="card-head">
          <div>
            <p class="label">Consultas realizadas - últimos 14 dias</p>
            <h3>Atividade do dia</h3>
            <p class="subhead">{{ consultationsTotal }} atendimentos</p>
          </div>
          <span class="pill neutral">🔼 Tendência estável</span>
        </div>
        <div class="line-chart">
          <EChartBase :option="consultationsOption" height="220px" class="tall-chart" />
        </div>
      </div>

      <div class="card wide">
        <div class="card-head">
          <div>
            <p class="label">Faturamento do mês</p>
            <h3>Operações da clínica</h3>
            <p class="subhead">{{ formatCurrency(monthRevenue) }}</p>
          </div>
          <span class="pill positive">🔼 +12% vs mês passado</span>
        </div>
        <div class="bar-chart">
          <EChartBase :option="revenueOption" height="220px" class="tall-chart" />
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <p class="label">Taxa de comparecimento - semana</p>
            <h3>Taxa de presença</h3>
            <p class="subhead">Confirmado vs cancelado/falta</p>
          </div>
          <span class="pill neutral">Monitorar faltas</span>
        </div>
        <div class="stacked-bars">
          <EChartBase :option="attendanceOption" height="220px" class="tall-chart" />
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <p class="label">Distribuição de procedimentos - 30 dias</p>
            <h3>Mix de procedimentos</h3>
            <p class="subhead">{{ proceduresTotal }} registros</p>
          </div>
          <span class="pill neutral">Mix equilibrado</span>
        </div>
        <div class="donut-wrapper small">
          <EChartBase :option="proceduresOption" height="132px" class="donut-chart" />
          <ul class="legend">
            <li v-for="item in procedures" :key="item.label">
              <span class="swatch" :style="{ backgroundColor: item.color }"></span>
              {{ item.label }} - {{ item.value }}
            </li>
          </ul>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <p class="label">Vacinas pendentes (7d)</p>
            <h3>Vacinas em agenda</h3>
            <p class="subhead">Hoje - {{ vaccinesSummary.today }}</p>
          </div>
          <span class="pill accent">🕒 {{ vaccinesSummary.overdue }} atrasadas</span>
        </div>
        <div class="vaccine-bars">
          <div v-for="item in vaccineBars" :key="item.label" class="vaccine-col">
            <div class="vaccine-bar" :style="{ height: item.percent + '%', backgroundColor: item.color }"></div>
            <p class="micro">{{ item.label }}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <p class="label">Produtos com estoque crítico</p>
            <h3>Alerta de insumos</h3>
            <p class="subhead">{{ criticalStock.length }} itens</p>
          </div>
          <span class="pill alert">⚠️ Priorizar pedido</span>
        </div>
        <ul class="mini-list alert-list">
          <li v-for="item in criticalStock" :key="item.name">
            <div class="list-main">
              <span class="icon">{{ item.icon }}</span>
              <span>{{ item.name }}</span>
              <p class="micro">Dias restantes: {{ item.daysLeft }}</p>
            </div>
            <span class="qty">{{ item.qty }} un</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const palette = {
  primary: '#0E3A56',
  primary600: '#0B3046',
  primary700: '#092A3D',
  secondary: '#2CB67D',
  accent: '#33B8C4',
  neutral100: '#E6E9EF',
  neutral300: '#CBD2D9',
  neutral500: '#4B5563',
  neutral900: '#1F2937',
  statusSuccess: '#2CB67D',
  statusWarning: '#F7B731',
  statusError: '#E63946',
  statusInfo: '#3A86FF',
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

const consultations = [
  { label: 'Seg', short: 'S', value: 18 },
  { label: 'Ter', short: 'T', value: 21 },
  { label: 'Qua', short: 'Q', value: 17 },
  { label: 'Qui', short: 'Q', value: 22 },
  { label: 'Sex', short: 'S', value: 26 },
  { label: 'Sáb', short: 'S', value: 15 },
  { label: 'Dom', short: 'D', value: 11 },
  { label: 'Seg', short: 'S', value: 20 },
  { label: 'Ter', short: 'T', value: 23 },
  { label: 'Qua', short: 'Q', value: 19 },
  { label: 'Qui', short: 'Q', value: 24 },
  { label: 'Sex', short: 'S', value: 27 },
  { label: 'Sáb', short: 'S', value: 16 },
  { label: 'Dom', short: 'D', value: 12 }
]

const salesTrend = [8.5, 9.2, 7.4, 9.8, 10.1, 11.4, 9.6, 12.2, 11.8, 12.5, 13.2, 11.7, 12.9, 14.4]
const salesToday = 12450

const criticalStock = [
  { icon: '💊', name: 'Antibiótico felino 80mg', qty: 6, daysLeft: 2 },
  { icon: '💧', name: 'Soro hidratante 500ml', qty: 9, daysLeft: 3 },
  { icon: '💉', name: 'Vacina V8', qty: 14, daysLeft: 4 }
]

const vaccinesSummary = { today: 14, overdue: 3, upcoming: 22 }
const vaccinesList = [
  { icon: '💉', name: 'Bella - Leptospirose', when: '08h30 - sala 2' },
  { icon: '💉', name: 'Thor - V10 reforço', when: '10h15 - sala 1' },
  { icon: '💉', name: 'Mia - Raiva', when: '14h00 - sala 3' }
]

const revenueData = [
  { day: 3, value: 12400 },
  { day: 6, value: 14200 },
  { day: 9, value: 15600, trend: true },
  { day: 12, value: 14900 },
  { day: 15, value: 16800 },
  { day: 18, value: 17400, trend: true },
  { day: 21, value: 18100, trend: true },
  { day: 24, value: 16300 },
  { day: 27, value: 17700, trend: true }
]

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
const consultationsTotal = computed(() => consultations.reduce((sum, item) => sum + item.value, 0))
const monthRevenue = computed(() => revenueData.reduce((sum, item) => sum + item.value, 0))
const proceduresTotal = computed(() => procedures.reduce((sum, item) => sum + item.value, 0))

const vaccineBars = computed(() => [
  { label: 'Hoje', percent: 76, color: palette.primary },
  { label: 'Atrasadas', percent: 32, color: palette.statusWarning },
  { label: 'Próx 7d', percent: 94, color: palette.secondary }
])

const appointmentOption = computed(() => ({
  color: todayAppointments.map((item) => item.color),
  tooltip: { trigger: 'item' },
  legend: { show: false },
  series: [
    {
      name: 'Agendamentos',
      type: 'pie',
      radius: ['60%', '78%'],
      avoidLabelOverlap: true,
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
  legend: { show: false },
  series: [
    {
      name: 'Procedimentos',
      type: 'pie',
      radius: ['58%', '78%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: procedures.map((item) => ({ value: item.value, name: item.label }))
    }
  ]
}))

const salesOption = computed(() => ({
  color: [palette.accent],
  tooltip: { trigger: 'axis' },
  grid: { left: 0, right: 0, top: 8, bottom: 0 },
  xAxis: { type: 'category', boundaryGap: false, show: false, data: salesTrend.map((_, idx) => idx + 1) },
  yAxis: { type: 'value', show: false },
  series: [
    {
      type: 'line',
      data: salesTrend,
      smooth: true,
      symbol: 'none',
      areaStyle: { opacity: 0.12 },
      lineStyle: { width: 2 }
    }
  ]
}))

const consultationsOption = computed(() => ({
  color: [palette.chartBlue],
  tooltip: { trigger: 'axis' },
  grid: { left: '4%', right: '4%', top: 20, bottom: 28, containLabel: true },
  xAxis: {
    type: 'category',
    data: consultations.map((item) => item.label),
    name: 'Dia',
    nameLocation: 'middle',
    nameGap: 24,
    nameTextStyle: { color: palette.neutral500 },
    axisLabel: { color: palette.neutral500 },
    axisLine: { lineStyle: { color: palette.neutral300 } }
  },
  yAxis: {
    type: 'value',
    name: 'Atendimentos',
    nameLocation: 'middle',
    nameGap: 42,
    nameTextStyle: { color: palette.neutral500 },
    axisLabel: { color: palette.neutral500 },
    splitLine: { lineStyle: { color: 'rgba(203,210,217,0.5)' } }
  },
  series: [
    {
      name: 'Consultas',
      type: 'line',
      data: consultations.map((item) => item.value),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: { opacity: 0.14 },
      lineStyle: { width: 3 }
    }
  ]
}))

const revenueOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '5%', right: '5%', top: 20, bottom: 28, containLabel: true },
  xAxis: {
    type: 'category',
    data: revenueData.map((item) => `Dia ${item.day}`),
    name: 'Dia',
    nameLocation: 'middle',
    nameGap: 24,
    nameTextStyle: { color: palette.neutral500 },
    axisLabel: { color: palette.neutral500 },
    axisLine: { lineStyle: { color: palette.neutral300 } }
  },
  yAxis: {
    type: 'value',
    name: 'Valor (R$)',
    nameLocation: 'middle',
    nameGap: 50,
    nameTextStyle: { color: palette.neutral500 },
    axisLabel: { color: palette.neutral500 },
    splitLine: { lineStyle: { color: 'rgba(203,210,217,0.5)' } }
  },
  series: [
    {
      name: 'Faturamento',
      type: 'bar',
      barWidth: '45%',
      data: revenueData.map((item) => ({
        value: item.value,
        itemStyle: { color: item.trend ? palette.statusWarning : palette.chartBlue }
      }))
    }
  ]
}))

const attendanceOption = computed(() => ({
  color: [palette.statusSuccess, palette.statusWarning, palette.statusError],
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '6%', right: '6%', top: 16, bottom: 28, containLabel: true },
  legend: { show: false },
  xAxis: {
    type: 'category',
    data: attendance.map((item) => item.label),
    name: 'Dia',
    nameLocation: 'middle',
    nameGap: 20,
    nameTextStyle: { color: palette.neutral500 },
    axisLabel: { color: palette.neutral500 },
    axisLine: { lineStyle: { color: palette.neutral300 } }
  },
  yAxis: {
    type: 'value',
    name: 'Quantidade',
    nameLocation: 'middle',
    nameGap: 46,
    nameTextStyle: { color: palette.neutral500 },
    axisLabel: { color: palette.neutral500 },
    splitLine: { lineStyle: { color: 'rgba(203,210,217,0.5)' } }
  },
  series: [
    { name: 'Confirmado', type: 'bar', stack: 'attendance', data: attendance.map((item) => item.confirmed), barWidth: '55%' },
    { name: 'Cancelado', type: 'bar', stack: 'attendance', data: attendance.map((item) => item.canceled) },
    { name: 'Faltou', type: 'bar', stack: 'attendance', data: attendance.map((item) => item.missed) }
  ]
}))

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --color-primary: #0E3A56;
  --color-primary-600: #0B3046;
  --color-primary-700: #092A3D;
  --color-secondary: #2CB67D;
  --color-accent: #33B8C4;
  --color-neutral-50: #F7F9FB;
  --color-neutral-100: #E6E9EF;
  --color-neutral-300: #CBD2D9;
  --color-neutral-500: #4B5563;
  --color-neutral-900: #1F2937;
  --color-status-success: #2CB67D;
  --color-status-warning: #F7B731;
  --color-status-error: #E63946;
  --color-status-info: #3A86FF;
  --color-chart-blue: #4F8CC9;
  --color-chart-green: #67D4A3;
  --color-chart-purple: #A98DF0;
  --color-chart-orange: #FF8F5E;
  --color-chart-gray: #8795A1;
}

:global(body) {
  margin: 0;
  font-family: 'Space Grotesk', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at 12% 20%, rgba(51, 184, 196, 0.12), transparent 30%),
    radial-gradient(circle at 85% 12%, rgba(44, 182, 125, 0.12), transparent 28%),
    radial-gradient(circle at 82% 72%, rgba(79, 140, 201, 0.1), transparent 32%),
    linear-gradient(135deg, rgba(247, 249, 251, 0.9), rgba(230, 233, 239, 0.9));
  color: var(--color-neutral-900);
}

.page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.micro-title {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 12px;
  color: var(--color-neutral-500);
  margin: 0 0 4px;
}

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
  color: var(--color-primary);
  margin: 0 0 8px;
}

h1 {
  margin: 0;
  font-size: 32px;
  color: var(--color-primary-700);
}

h3 {
  margin: 0;
  font-size: 20px;
  color: var(--color-primary-700);
}

.lede {
  margin: 8px 0 0;
  color: var(--color-neutral-500);
  max-width: 720px;
  line-height: 1.5;
}

.hero-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(230, 233, 239, 0.92));
  border: 1px solid var(--color-neutral-100);
  border-radius: 12px;
  padding: 18px;
  min-height: 240px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 6px rgba(0, 0, 0, 0.06);
  color: var(--color-neutral-900);
}

.kpi-card h2 {
  margin: 4px 0 0;
  font-size: 34px;
  color: var(--color-primary-700);
}

.kpi-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.kpi-sub {
  color: var(--color-neutral-500);
  font-size: 13px;
}

.label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: var(--color-neutral-500);
  margin: 0 0 4px;
}

.subhead {
  margin: 2px 0 0;
  color: var(--color-neutral-500);
  font-size: 14px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--color-neutral-300);
  color: var(--color-neutral-900);
  background: var(--color-neutral-100);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pill.positive {
  background: rgba(44, 182, 125, 0.15);
  border-color: rgba(44, 182, 125, 0.25);
  color: var(--color-status-success);
}

.pill.accent {
  background: rgba(51, 184, 196, 0.18);
  border-color: rgba(51, 184, 196, 0.24);
  color: var(--color-accent);
}

.pill.neutral {
  background: var(--color-neutral-100);
  border-color: var(--color-neutral-300);
  color: var(--color-neutral-500);
}

.pill.alert {
  background: rgba(230, 57, 70, 0.12);
  border-color: rgba(230, 57, 70, 0.2);
  color: var(--color-status-error);
}

.badge {
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 13px;
  border: 1px solid var(--color-neutral-300);
  background: #fff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge.success {
  border-color: rgba(44, 182, 125, 0.35);
  color: var(--color-status-success);
}

.badge.neutral {
  border-color: var(--color-neutral-300);
  color: var(--color-neutral-500);
}

.donut-wrapper {
  display: flex;
  gap: 16px;
  align-items: center;
}

.donut-wrapper.small {
  align-items: flex-start;
}

.legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
  font-size: 13px;
  color: var(--color-neutral-500);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
}

.legend.small {
  font-size: 12px;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.sparkline {
  margin-top: 6px;
}

.echart-base {
  width: 100%;
  height: 100%;
}

.donut-chart {
  width: 132px;
  height: 132px;
  min-height: 132px;
}

.spark-chart {
  height: 70px;
  min-height: 70px;
}

.tall-chart {
  height: 220px;
  min-height: 220px;
}

.micro {
  color: var(--color-neutral-500);
  font-size: 12px;
  margin: 4px 0 0;
}

.split {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
}

.big-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-secondary);
}

.progress {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin: 10px 0;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--color-neutral-100);
}

.progress-bar {
  height: 6px;
  border-radius: 999px;
}

.mini-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.mini-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-neutral-100);
  gap: 10px;
}

.mini-list li + li {
  border-top: 1px solid var(--color-neutral-100);
}

.mini-list.alert-list li {
  border: 1px solid var(--color-neutral-100);
}

.list-main {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 4px 8px;
  color: var(--color-neutral-900);
}

.icon {
  line-height: 1;
}

.qty {
  font-weight: 600;
  color: var(--color-primary-700);
}

.warning {
  border-color: rgba(230, 57, 70, 0.2);
}

.wide {
  grid-column: span 2;
}

.line-chart,
.bar-chart,
.stacked-bars {
  height: 220px;
  margin-top: 6px;
}

.vaccine-bars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-items: end;
  height: 160px;
}

.vaccine-col {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 8px;
  justify-items: center;
}

.vaccine-bar {
  width: 80%;
  border-radius: 12px 12px 4px 4px;
  filter: saturate(0.9);
}

.alert-list .micro {
  color: var(--color-status-error);
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    gap: 8px;
  }

  .wide {
    grid-column: span 1;
  }
}
</style>
