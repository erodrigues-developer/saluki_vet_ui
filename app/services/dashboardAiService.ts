import {
  dashboardAutoAnalysis,
  genericQuestionResponse,
  mockAiResponses
} from '~/mocks/dashboardAi.mock'
import type { AiInsightResponse } from '~/types/aiInsight.types'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const randomDelay = () => 800 + Math.floor(Math.random() * 700)

export const dashboardAiService = {
  async generateAnalysis(): Promise<AiInsightResponse> {
    await wait(randomDelay())
    return dashboardAutoAnalysis
  },
  async askQuestion(question: string): Promise<AiInsightResponse> {
    await wait(randomDelay())
    return mockAiResponses[question] || genericQuestionResponse
  }
}
