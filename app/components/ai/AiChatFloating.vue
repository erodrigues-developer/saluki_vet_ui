<template>
  <Teleport to="body">
    <div v-if="show || launcher" class="ai-chat-root" :style="rootStyle">
      <button
        v-if="!show && launcher"
        class="ai-chat-launcher"
        type="button"
        :title="launcherTitle"
        :aria-label="launcherTitle"
        @click="$emit('open')"
      >
        <AppIcon name="sparkles" :size="20" :stroke-width="2" />
      </button>

      <button v-else-if="minimized" class="ai-chat-minimized" type="button" @click="minimized = false">
        <span class="ai-chat-mark"><AppIcon name="sparkles" :size="14" :stroke-width="2" /></span>
        <span>{{ title }}</span>
      </button>

      <section v-else-if="show" class="ai-chat-window" :style="windowStyle" :aria-label="title">
        <header class="ai-chat-header">
          <div class="ai-chat-title-wrap">
            <span class="ai-chat-mark"><AppIcon name="sparkles" :size="16" :stroke-width="2" /></span>
            <div>
              <h3>{{ title }}</h3>
              <p>{{ subtitle }}</p>
            </div>
          </div>
          <div class="ai-chat-header-actions">
            <button type="button" class="ai-chat-icon-btn" aria-label="Minimizar chat" @click="minimized = true">
              <AppIcon name="minus" :size="16" :stroke-width="2" />
            </button>
            <button type="button" class="ai-chat-icon-btn" aria-label="Fechar chat" @click="closeChat">
              <AppIcon name="x" :size="16" :stroke-width="2" />
            </button>
          </div>
        </header>

        <div ref="messagesEl" class="ai-chat-body">
          <details v-if="contextLine || contextChips.length" class="ai-chat-context" open>
            <summary>
              <span>Contexto atual</span>
              <AppIcon name="chevron-down" :size="14" :stroke-width="2" />
            </summary>
            <p v-if="contextLine">{{ contextLine }}</p>
            <div v-if="contextChips.length" class="ai-chat-chips">
              <span v-for="chip in contextChips" :key="chip">{{ chip }}</span>
            </div>
          </details>

          <div v-if="primaryAction" class="ai-chat-actions">
            <button class="ai-chat-primary-action" type="button" :disabled="primaryAction.disabled || loading" @click="$emit('primaryAction')">
              {{ primaryAction.label }}
            </button>
          </div>

          <div v-if="suggestedQuestions.length" class="ai-chat-quick-replies">
            <button v-for="question in suggestedQuestions" :key="question" type="button" @click="$emit('selectQuestion', question)">
              {{ question }}
            </button>
          </div>

          <div v-for="message in normalizedMessages" :key="message.id" class="ai-chat-message" :class="messageRoleClass(message.role)">
            <span v-if="message.role !== 'USER'" class="ai-chat-mark small"><AppIcon name="sparkles" :size="12" :stroke-width="2" /></span>
            <div class="ai-chat-bubble" :class="{ action: message.role === 'ACTION' }">
              <div v-if="message.metadata?.html" v-html="message.content" />
              <div v-else-if="shouldRenderMarkdown(message.role)" class="ai-chat-markdown" v-html="renderMarkdown(message.content)" />
              <p v-else>{{ message.content }}</p>
            </div>
          </div>

          <p v-if="loading" class="ai-chat-thinking">
            <span class="ai-chat-mark small"><AppIcon name="sparkles" :size="12" :stroke-width="2" /></span>
            Respondendo...
          </p>
        </div>

        <footer class="ai-chat-composer">
          <textarea
            :value="question"
            rows="2"
            :placeholder="placeholder"
            @input="$emit('update:question', ($event.target as HTMLTextAreaElement).value)"
            @keydown.enter.exact.prevent="$emit('send')"
          />
          <button type="button" :disabled="!question.trim() || loading" @click="$emit('send')">Enviar</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, unref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import type { PersistedAiMessage } from '~/composables/useAiConversation'

const props = withDefaults(defineProps<{
  show: boolean
  launcher?: boolean
  isMobile: boolean
  title: string
  subtitle: string
  launcherTitle?: string
  contextLine?: string
  contextChips?: string[]
  messages: PersistedAiMessage[]
  loading: boolean
  question: string
  placeholder?: string
  suggestedQuestions?: string[]
  primaryAction?: { label: string; disabled?: boolean } | null
}>(), {
  launcher: false,
  launcherTitle: 'Abrir assistente',
  contextLine: '',
  contextChips: () => [],
  placeholder: 'Pergunte algo para a IA...',
  suggestedQuestions: () => [],
  primaryAction: null,
})

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
  (e: 'send'): void
  (e: 'update:question', value: string): void
  (e: 'selectQuestion', question: string): void
  (e: 'primaryAction'): void
}>()

const minimized = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
  breaks: true,
})
const rootStyle = computed(() => ({
  left: props.isMobile ? '10px' : 'auto',
  right: props.isMobile ? '10px' : '20px',
  bottom: props.isMobile ? '10px' : '20px',
}))
const windowStyle = computed(() => ({
  width: props.isMobile ? '100%' : 'clamp(380px, 30vw, 440px)',
  height: props.isMobile ? 'calc(100dvh - 20px)' : 'min(640px, 80vh)',
}))
const rawMessages = computed(() => {
  const value = unref(props.messages as any)
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.messages)) return value.messages
  return []
})
const normalizedMessages = computed(() =>
  rawMessages.value
    .filter(Boolean)
    .map((message: any) => ({
      ...message,
      id: message.id ?? `message-${Math.random()}`,
      role: normalizeRole(message.role),
      content: String(message.content || ''),
      metadata: message.metadata || null,
    }))
    .filter((message) => message.content.trim().length > 0),
)

const normalizeRole = (role: unknown) => {
  const normalized = String(role || 'ASSISTANT').toUpperCase()
  if (['USER', 'ASSISTANT', 'SYSTEM', 'ACTION', 'TOOL'].includes(normalized)) return normalized
  return 'ASSISTANT'
}
const messageRoleClass = (role: unknown) => normalizeRole(role).toLowerCase()
const shouldRenderMarkdown = (role: unknown) => ['USER', 'ASSISTANT', 'SYSTEM', 'TOOL'].includes(normalizeRole(role))
const renderMarkdown = (content: string) => markdown.render(String(content || ''))
const closeChat = () => {
  minimized.value = false
  emit('close')
}

watch(() => props.show, (show) => {
  if (show) minimized.value = false
})

watch(
  () => [normalizedMessages.value.length, props.loading],
  async () => {
    await nextTick()
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  },
)
</script>

<style>
.ai-chat-root {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
}
.ai-chat-root * { box-sizing: border-box; }
.ai-chat-launcher,
.ai-chat-minimized,
.ai-chat-window { pointer-events: auto; }
.ai-chat-launcher {
  width: 52px;
  height: 52px;
  margin-left: auto;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #0e3a56;
  box-shadow: 0 14px 34px rgba(14, 58, 86, 0.28);
  cursor: pointer;
}
.ai-chat-minimized {
  width: min(360px, calc(100vw - 32px));
  min-height: 48px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.18);
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  cursor: pointer;
  color: #0f172a;
  font-weight: 700;
}
.ai-chat-window {
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
}
.ai-chat-header {
  min-height: 64px;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ai-chat-title-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.ai-chat-title-wrap h3 { margin: 0; color: #0f172a; font-size: 15px; line-height: 1.1; }
.ai-chat-title-wrap p { margin: 3px 0 0; color: #64748b; font-size: 12px; line-height: 1.25; }
.ai-chat-header-actions { display: flex; gap: 4px; }
.ai-chat-icon-btn {
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.ai-chat-icon-btn:hover { background: #f1f5f9; border-color: #e2e8f0; }
.ai-chat-mark {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #eef6ff;
  color: #0e3a56;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
}
.ai-chat-mark.small { width: 22px; height: 22px; margin-top: 3px; }
.ai-chat-body {
  min-height: 0;
  overflow: auto;
  padding: 12px;
  background: #fbfdff;
}
.ai-chat-context {
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #fff;
  padding: 8px 10px;
  margin-bottom: 10px;
}
.ai-chat-context summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
}
.ai-chat-context p { margin: 6px 0; color: #475569; font-size: 12px; }
.ai-chat-chips,
.ai-chat-quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ai-chat-chips span,
.ai-chat-quick-replies button {
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  background: #fff;
  color: #334155;
  font-size: 11px;
  line-height: 1;
  padding: 6px 8px;
}
.ai-chat-quick-replies { margin: 10px 0; }
.ai-chat-quick-replies button { cursor: pointer; }
.ai-chat-actions { margin: 10px 0; }
.ai-chat-primary-action {
  width: 100%;
  border: 1px solid #b9d2e4;
  border-radius: 10px;
  background: #eef6ff;
  color: #0e3a56;
  min-height: 38px;
  font-weight: 700;
  cursor: pointer;
}
.ai-chat-message {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.ai-chat-message.user { justify-content: flex-end; }
.ai-chat-message.action { justify-content: center; }
.ai-chat-bubble {
  max-width: 88%;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: #1f2937;
  padding: 9px 10px;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}
.ai-chat-markdown {
  white-space: normal;
}
.ai-chat-markdown :deep(p) {
  margin: 0 0 8px;
}
.ai-chat-markdown :deep(p:last-child) {
  margin-bottom: 0;
}
.ai-chat-markdown :deep(ul),
.ai-chat-markdown :deep(ol) {
  margin: 6px 0 8px;
  padding-left: 18px;
}
.ai-chat-markdown :deep(li) {
  margin: 0 0 4px;
}
.ai-chat-markdown :deep(strong) {
  color: #0f172a;
  font-weight: 700;
}
.ai-chat-markdown :deep(code) {
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: #f8fafc;
  padding: 1px 4px;
  font-family: "Fira Code", monospace;
  font-size: 12px;
}
.ai-chat-markdown :deep(a) {
  color: #0e3a56;
  font-weight: 700;
  text-decoration: underline;
}
.ai-chat-message.user .ai-chat-bubble {
  background: #e8f1f8;
  border-color: #c6d8e7;
}
.ai-chat-bubble.action {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
  font-size: 12px;
}
.ai-chat-bubble p { margin: 0; }
.ai-chat-thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #64748b;
  font-size: 12px;
}
.ai-chat-composer {
  border-top: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: end;
}
.ai-chat-composer textarea {
  width: 100%;
  min-height: 40px;
  max-height: 96px;
  resize: vertical;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 9px 10px;
  color: #0f172a;
  font: inherit;
  font-size: 13px;
}
.ai-chat-composer button {
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  background: #0e3a56;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.ai-chat-composer button:disabled,
.ai-chat-primary-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .ai-chat-minimized { width: 100%; }
  .ai-chat-window { border-radius: 12px; }
}
</style>
