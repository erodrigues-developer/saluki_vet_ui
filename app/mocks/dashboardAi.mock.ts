import type { AiInsightResponse } from '~/types/aiInsight.types'

export const mockDashboardAiContext = {
  clinic: {
    status: 'Aberta',
    openUntil: '20h',
    team: { vets: 5, receptionists: 3 }
  },
  today: {
    appointments: {
      total: 33,
      consultations: 18,
      vaccines: 9,
      returns: 6,
      comparison: '+8% vs ontem'
    },
    sales: { sold: 12450, received: 10740, averageTicket: 294, goalPercentage: 82 },
    vaccines: { today: 14, next7Days: 22, overdue: 3 },
    stock: {
      criticalItems: 3,
      items: [
        { name: 'Antibiótico felino 80mg', quantity: 6, daysLeft: 2 },
        { name: 'Soro hidratante 500ml', quantity: 9, daysLeft: 3 },
        { name: 'Vacina V8', quantity: 14, daysLeft: 4 }
      ]
    }
  },
  finance: {
    pending: 3550,
    paid: 5000,
    forecast: 8550,
    overdue: 3550,
    expensesTotal: 8550,
    topExpenseCategory: { name: 'Fornecedores', percentage: 58 }
  },
  operation: {
    attendanceRate: 81,
    procedures: {
      total: 610,
      mix: [
        { name: 'Consultas', quantity: 230, percentage: 38 },
        { name: 'Vacinas', quantity: 140, percentage: 23 },
        { name: 'Curativos', quantity: 95, percentage: 16 },
        { name: 'Exames', quantity: 80, percentage: 13 },
        { name: 'Banho/Tosa', quantity: 65, percentage: 11 }
      ]
    }
  }
}

export const suggestedQuestions = [
  'Como está a performance da clínica hoje?',
  'Quais pontos exigem atenção imediata?',
  'O que devo priorizar agora?',
  'O estoque está saudável?',
  'As vacinas estão sob controle?',
  'Há risco financeiro no mês?',
  'Como posso aumentar o faturamento?',
  'Quais indicadores parecem piores?'
]

export const dashboardAutoAnalysis: AiInsightResponse = {
  id: 'analysis-general',
  title: 'Análise geral da clínica',
  severity: 'attention',
  summary:
    'A clínica está com boa movimentação hoje, com 33 atendimentos e R$ 12.450 em vendas. A performance é positiva, mas há pontos que exigem ação: estoque crítico, vacinas atrasadas e contas vencidas.',
  attentionPoints: [
    '3 itens estão abaixo do estoque mínimo.',
    '3 vacinas estão atrasadas.',
    'R$ 3.550 em contas estão vencidas.',
    'A taxa de presença está em 81%.'
  ],
  possibleCauses: [
    'Reposição de estoque abaixo do ritmo de consumo.',
    'Falta de acionamento preventivo de tutores.',
    'Concentração de vencimentos financeiros no período.',
    'Cancelamentos e faltas afetando a agenda.'
  ],
  recommendedActions: [
    'Repor produtos críticos ainda hoje.',
    'Entrar em contato com tutores das vacinas atrasadas.',
    'Revisar contas vencidas.',
    'Criar rotina de confirmação automática de consultas.'
  ],
  actions: [
    { label: 'Ver estoque crítico', route: '/cadastros/produtos' },
    { label: 'Ver vacinas', route: '/atendimento/agendamentos' },
    { label: 'Ver contas a pagar', route: '/financeiro/contas-a-pagar' },
    { label: 'Ver agenda', route: '/atendimento/agendamentos' }
  ]
}

export const mockAiResponses: Record<string, AiInsightResponse> = {
  'Como está a performance da clínica hoje?': {
    id: 'q-performance',
    title: 'Performance geral do dia',
    severity: 'attention',
    summary:
      'A performance do dia está positiva. A clínica tem 33 atendimentos agendados e R$ 12.450 em vendas, com 82% da meta atingida. O principal ponto de atenção é que parte das vendas ainda não foi recebida e existem alertas operacionais em estoque e vacinas.',
    actions: [
      { label: 'Ver vendas', route: '/financeiro/vendas' },
      { label: 'Ver agenda', route: '/atendimento/agendamentos' },
      { label: 'Ver estoque crítico', route: '/cadastros/produtos' }
    ]
  },
  'Quais pontos exigem atenção imediata?': {
    id: 'q-priorities',
    title: 'Prioridades imediatas',
    severity: 'critical',
    summary:
      'Os pontos mais urgentes são: estoque crítico com 3 itens abaixo do mínimo, 3 vacinas atrasadas e R$ 3.550 em contas vencidas. A recomendação é tratar primeiro o estoque, depois vacinas e por fim as pendências financeiras do dia.',
    actions: [
      { label: 'Ver estoque crítico', route: '/cadastros/produtos' },
      { label: 'Ver vacinas atrasadas', route: '/atendimento/agendamentos' },
      { label: 'Ver contas a pagar', route: '/financeiro/contas-a-pagar' }
    ]
  },
  'O estoque está saudável?': {
    id: 'q-stock',
    title: 'Saúde do estoque',
    severity: 'critical',
    summary:
      'O estoque exige atenção. Existem 3 itens abaixo do mínimo, incluindo produtos com previsão de duração de 2 a 4 dias. Isso pode afetar atendimentos e vendas se a reposição não for feita rapidamente.',
    actions: [
      { label: 'Ver estoque crítico', route: '/cadastros/produtos' },
      { label: 'Repor estoque', route: '/cadastros/produtos' }
    ]
  },
  'As vacinas estão sob controle?': {
    id: 'q-vaccines',
    title: 'Situação de vacinas',
    severity: 'attention',
    summary:
      'As vacinas estão parcialmente sob controle. Existem 14 aplicações previstas para hoje, 22 nos próximos 7 dias e 3 atrasadas. O volume futuro é administrável, mas as atrasadas precisam de ação imediata.',
    actions: [
      { label: 'Ver agenda de vacinas', route: '/atendimento/agendamentos' },
      { label: 'Ver vacinas atrasadas', route: '/atendimento/agendamentos' }
    ]
  },
  'Há risco financeiro no mês?': {
    id: 'q-financial-risk',
    title: 'Risco financeiro mensal',
    severity: 'attention',
    summary:
      'O risco financeiro é moderado. Há R$ 3.550 em contas atrasadas e R$ 8.550 previstos no mês. Como o faturamento está ativo, o ponto principal é controlar vencimentos e garantir baixa dos recebimentos pendentes.',
    actions: [
      { label: 'Ver contas a pagar', route: '/financeiro/contas-a-pagar' },
      { label: 'Ver relatório financeiro', route: '/financeiro/vendas' }
    ]
  },
  'Como posso aumentar o faturamento?': {
    id: 'q-revenue',
    title: 'Oportunidades de faturamento',
    severity: 'opportunity',
    summary:
      'As melhores oportunidades são aumentar o ticket médio e aproveitar os atendimentos do dia para oferecer serviços complementares. Vacinas, check-ups e produtos recorrentes podem ser ofertados durante consultas e retornos.',
    actions: [
      { label: 'Ver vendas', route: '/financeiro/vendas' },
      { label: 'Ver procedimentos', route: '/cadastros/procedimentos' },
      { label: 'Ver produtos', route: '/cadastros/produtos' }
    ]
  }
}

export const genericQuestionResponse: AiInsightResponse = {
  id: 'generic-response',
  title: 'Leitura rápida dos indicadores',
  severity: 'info',
  summary:
    'Com base nos indicadores atuais, a clínica tem boa movimentação, mas deve priorizar alertas operacionais antes que impactem receita ou atendimento. Os principais pontos para acompanhar são estoque crítico, vacinas atrasadas, contas pendentes e taxa de presença.',
  actions: [
    { label: 'Ver dashboard', route: '/' },
    { label: 'Ver alertas', route: '/#alertas' },
    { label: 'Ver financeiro', route: '/financeiro/contas-a-pagar' }
  ]
}
