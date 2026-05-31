import { computed, ref } from 'vue'

export type PersistedAiMessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'ACTION' | 'TOOL'

export interface PersistedAiMessage {
  id: number | string
  role: PersistedAiMessageRole
  content: string
  metadata?: Record<string, any> | null
  createdAt?: string | Date
}

interface UseAiConversationOptions {
  contextType: string
  contextId: () => string | number | null | undefined
  title: string
  initialAssistantMessage?: string
  metadata?: () => Record<string, any>
  contextSnapshot?: () => Record<string, any>
}

export const useAiConversation = (options: UseAiConversationOptions) => {
  const conversationId = ref<number | null>(null)
  const messages = ref<PersistedAiMessage[]>([])
  const loading = ref(false)
  const ready = ref(false)
  let ensureConversationPromise: Promise<number> | null = null
  const assistantMessagePromises = new Map<
    string,
    Promise<PersistedAiMessage | null>
  >()

  const normalizedContextId = computed(() => String(options.contextId() || 'current'))
  const unwrapResponse = (response: any) => response?.data ?? response
  const normalizeMessage = (message: any): PersistedAiMessage | null => {
    if (!message) return null
    const role = String(message.role || 'ASSISTANT').toUpperCase()
    const normalizedRole = ['USER', 'ASSISTANT', 'SYSTEM', 'ACTION', 'TOOL'].includes(role)
      ? role as PersistedAiMessageRole
      : 'ASSISTANT'
    const content = String(message.content || message.response?.summary || '').trim()
    if (!content) return null
    return {
      id: message.id ?? `local-${Date.now()}-${Math.random()}`,
      role: normalizedRole,
      content,
      metadata: message.metadata || null,
      createdAt: message.createdAt || new Date(),
    }
  }
  const normalizeMessages = (items: any[]) =>
    (Array.isArray(items) ? items : [])
      .map(normalizeMessage)
      .filter(Boolean) as PersistedAiMessage[]

  const ensureConversation = async () => {
    if (conversationId.value) return conversationId.value
    if (ensureConversationPromise) return ensureConversationPromise

    ensureConversationPromise = (async () => {
      const api = useApi()
      const rawResponse = await api<any>(
        `/api/v1/ai/conversations/context/${encodeURIComponent(options.contextType)}/${encodeURIComponent(normalizedContextId.value)}`,
        {
          method: 'POST',
          body: {
            title: options.title,
            metadata: options.metadata?.() || null,
            initialAssistantMessage: options.initialAssistantMessage,
          },
        },
      )
      const response = unwrapResponse(rawResponse)
      conversationId.value = Number(response.conversation?.id)
      messages.value = normalizeMessages(response.messages || [])
      ready.value = true
      return conversationId.value
    })()

    try {
      return await ensureConversationPromise
    } finally {
      ensureConversationPromise = null
    }
  }

  const reloadMessages = async () => {
    if (!conversationId.value) return
    const api = useApi()
    const response = await api<any[]>(`/api/v1/ai/conversations/${conversationId.value}/messages`)
    messages.value = normalizeMessages(unwrapResponse(response))
  }

  const sendUserMessage = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || loading.value) return null
    const id = await ensureConversation()
    const optimistic: PersistedAiMessage = {
      id: `local-${Date.now()}`,
      role: 'USER',
      content: trimmed,
      createdAt: new Date(),
    }
    messages.value.push(optimistic)
    loading.value = true
    try {
      const api = useApi()
      const rawResponse = await api<any>(`/api/v1/ai/conversations/${id}/messages`, {
        method: 'POST',
        body: {
          role: 'USER',
          content: trimmed,
          contextSnapshot: options.contextSnapshot?.() || null,
        },
      })
      const response = unwrapResponse(rawResponse)
      messages.value = messages.value.filter((item) => item.id !== optimistic.id)
      const userMessage = normalizeMessage(response.message)
      const assistantMessage = normalizeMessage(response.assistantMessage)
      if (userMessage) messages.value.push(userMessage)
      if (assistantMessage) messages.value.push(assistantMessage)
      return response
    } finally {
      loading.value = false
    }
  }

  const addAssistantMessage = async (content: string, metadata?: Record<string, any>) => {
    const trimmed = content.trim()
    if (!trimmed) return null
    const idempotencyKey = String(metadata?.idempotencyKey || '').trim()
    const existingMessage = idempotencyKey
      ? messages.value.find(
          (item) => item.metadata?.idempotencyKey === idempotencyKey,
        )
      : null
    if (existingMessage) return existingMessage

    const pendingKey = idempotencyKey || `${metadata?.source || 'assistant'}:${trimmed}`
    const pendingMessage = assistantMessagePromises.get(pendingKey)
    if (pendingMessage) return pendingMessage

    const promise = (async () => {
      const id = await ensureConversation()
      const api = useApi()
      const rawResponse = await api<any>(`/api/v1/ai/conversations/${id}/messages`, {
        method: 'POST',
        body: {
          role: 'ASSISTANT',
          content: trimmed,
          metadata,
          generateAssistantResponse: false,
        },
      })
      const response = unwrapResponse(rawResponse)
      const message = normalizeMessage(response.message)
      if (message && !messages.value.some((item) => String(item.id) === String(message.id))) {
        messages.value.push(message)
      }
      return message
    })()

    assistantMessagePromises.set(pendingKey, promise)
    try {
      return await promise
    } finally {
      assistantMessagePromises.delete(pendingKey)
    }
  }

  const registerAction = async (actionKey: string, label: string, payload?: Record<string, any>) => {
    const id = await ensureConversation()
    const api = useApi()
    const rawResponse = await api<any>(`/api/v1/ai/conversations/${id}/actions`, {
      method: 'POST',
      body: { actionKey, label, payload },
    })
    const response = unwrapResponse(rawResponse)
    const message = normalizeMessage(response.message)
    if (message) messages.value.push(message)
    return message
  }

  return {
    conversationId,
    messages,
    loading,
    ready,
    ensureConversation,
    reloadMessages,
    sendUserMessage,
    addAssistantMessage,
    registerAction,
  }
}
