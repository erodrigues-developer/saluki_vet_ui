export type InsightSeverity = 'critical' | 'attention' | 'opportunity' | 'info'

export type AiAction = {
  label: string
  route?: string
  disabled?: boolean
}

export type AiInsightResponse = {
  id: string
  title: string
  severity: InsightSeverity
  summary: string
  attentionPoints?: string[]
  possibleCauses?: string[]
  recommendedActions?: string[]
  actions?: AiAction[]
}

export type AiMessage = {
  id: string
  role: 'user' | 'assistant'
  content?: string
  response?: AiInsightResponse
  createdAt: Date
}
