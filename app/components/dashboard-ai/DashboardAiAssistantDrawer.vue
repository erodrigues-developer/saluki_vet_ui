<template>
  <Teleport to="body">
  <div class="dashboard-ai-chat-root" aria-live="polite" :style="rootStyle">
    <button
      v-if="!show"
      class="dashboard-ai-launcher"
      :style="launcherStyle"
      type="button"
      aria-label="Analisar com IA"
      title="Analisar com IA"
      @click="$emit('open')"
    >
      <AppIcon name="sparkles" :size="20" :stroke-width="2" />
    </button>

    <div v-else-if="minimized" class="dashboard-ai-minimized" :style="minimizedStyle" role="button" tabindex="0" @click="restore" @keydown.enter="restore">
      <span class="dashboard-ai-minimized-title">
        <span class="dashboard-ai-mark"><AppIcon name="sparkles" :size="14" :stroke-width="2" /></span>
        <span>Assistente inteligente</span>
      </span>
      <span class="dashboard-ai-minimized-actions">
        <button type="button" class="dashboard-ai-icon-btn" aria-label="Abrir assistente" @click.stop="restore">
          <AppIcon name="chevron-up" :size="16" :stroke-width="2" />
        </button>
        <button type="button" class="dashboard-ai-icon-btn" aria-label="Fechar assistente" @click.stop="closeChat">
          <AppIcon name="x" :size="16" :stroke-width="2" />
        </button>
      </span>
    </div>

    <section v-else class="dashboard-ai-chat-window" :style="windowStyle" aria-label="Assistente inteligente">
      <header class="dashboard-ai-chat-header">
        <div class="dashboard-ai-header-main">
          <span class="dashboard-ai-mark"><AppIcon name="sparkles" :size="16" :stroke-width="2" /></span>
          <div>
            <h3 class="dashboard-ai-title">Assistente inteligente</h3>
            <p class="dashboard-ai-subtitle">Insights operacionais do dashboard atual.</p>
          </div>
        </div>
        <div class="dashboard-ai-header-actions">
          <button type="button" class="dashboard-ai-icon-btn" aria-label="Minimizar assistente" @click="minimized = true">
            <AppIcon name="minus" :size="16" :stroke-width="2" />
          </button>
          <button type="button" class="dashboard-ai-icon-btn" aria-label="Fechar assistente" @click="closeChat">
            <AppIcon name="x" :size="16" :stroke-width="2" />
          </button>
        </div>
      </header>

      <div ref="messagesEl" class="dashboard-ai-chat-messages">
        <details class="dashboard-ai-context-card" open>
          <summary>
            <span>Contexto atual</span>
            <AppIcon name="chevron-down" :size="14" :stroke-width="2" />
          </summary>
          <p class="dashboard-ai-context-line">Dashboard operacional · Clínica aberta até 20h</p>
          <div class="dashboard-ai-context-chips">
            <span>Hoje</span>
            <span>Financeiro</span>
            <span>Estoque</span>
            <span>Vacinas</span>
            <span>Atendimentos</span>
          </div>
        </details>

        <button class="dashboard-ai-generate-btn" type="button" :disabled="loading" @click="$emit('generate')">
          <span class="inline-icon-label">
            <AppIcon name="sparkles" :size="14" :stroke-width="2" />
            <span>{{ loading ? 'Analisando indicadores...' : 'Gerar análise do dashboard' }}</span>
          </span>
        </button>

        <DashboardAiSuggestedQuestions :questions="suggestedQuestions" @select="$emit('selectQuestion', $event)" />

        <DashboardAiMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
          @run-action="$emit('runAction', $event)"
        />
        <p v-if="loading" class="dashboard-ai-thinking">
          <span class="dashboard-ai-mark small"><AppIcon name="sparkles" :size="12" :stroke-width="2" /></span>
          Gerando insights...
        </p>
      </div>

      <footer class="dashboard-ai-composer">
        <textarea
          :value="question"
          class="dashboard-ai-question-input"
          rows="2"
          placeholder="Pergunte algo sobre os indicadores da clínica..."
          aria-label="Pergunte algo sobre os indicadores da clínica"
          @input="$emit('update:question', ($event.target as HTMLTextAreaElement).value)"
          @keydown.enter.exact.prevent="$emit('send')"
        />
        <button
          class="dashboard-ai-send-btn"
          type="button"
          :disabled="!canSend"
          aria-label="Enviar pergunta para o assistente"
          @click="$emit('send')"
        >
          Enviar
        </button>
      </footer>
    </section>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import DashboardAiMessage from './DashboardAiMessage.vue'
import DashboardAiSuggestedQuestions from './DashboardAiSuggestedQuestions.vue'
import { suggestedQuestions } from '~/mocks/dashboardAi.mock'
import type { AiAction, AiMessage } from '~/types/aiInsight.types'

const props = defineProps<{
  show: boolean
  isMobile: boolean
  messages: AiMessage[]
  loading: boolean
  question: string
}>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
  (e: 'generate'): void
  (e: 'selectQuestion', question: string): void
  (e: 'update:question', value: string): void
  (e: 'send'): void
  (e: 'runAction', action: AiAction): void
}>()

const minimized = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const canSend = computed(() => Boolean(props.question.trim()) && !props.loading)
const rootStyle = computed(() => ({
  position: 'fixed',
  right: props.isMobile ? '10px' : '20px',
  bottom: props.isMobile ? '10px' : '20px',
  left: props.isMobile ? '10px' : 'auto',
  zIndex: 9999,
  pointerEvents: 'none'
}))
const launcherStyle = {
  marginLeft: 'auto',
  pointerEvents: 'auto'
}
const minimizedStyle = computed(() => ({
  width: props.isMobile ? '100%' : 'min(360px, calc(100vw - 32px))',
  pointerEvents: 'auto'
}))
const windowStyle = computed(() => ({
  width: props.isMobile ? '100%' : 'clamp(380px, 30vw, 440px)',
  height: props.isMobile ? 'calc(100dvh - 20px)' : 'min(640px, 80vh)',
  pointerEvents: 'auto'
}))

const restore = () => {
  minimized.value = false
}

const closeChat = () => {
  minimized.value = false
  emit('close')
}

watch(
  () => props.show,
  (show) => {
    if (show) minimized.value = false
  }
)

watch(
  () => [props.messages.length, props.loading],
  async () => {
    await nextTick()
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
)
</script>

<style>
.dashboard-ai-chat-root {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  pointer-events: none;
}

.dashboard-ai-launcher,
.dashboard-ai-minimized,
.dashboard-ai-chat-window {
  pointer-events: auto;
}

.dashboard-ai-launcher {
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #0e3a56;
  box-shadow: 0 14px 34px rgba(14, 58, 86, 0.28);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.dashboard-ai-launcher:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 42px rgba(14, 58, 86, 0.34);
}

.dashboard-ai-minimized {
  width: min(360px, calc(100vw - 32px));
  min-height: 48px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px 8px 12px;
  cursor: pointer;
}

.dashboard-ai-minimized-title,
.dashboard-ai-header-main {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.dashboard-ai-minimized-title span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.dashboard-ai-minimized-actions,
.dashboard-ai-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.dashboard-ai-chat-window {
  width: clamp(380px, 30vw, 440px);
  height: min(640px, 80vh);
  border: 1px solid rgba(203, 210, 217, 0.9);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-ai-chat-header {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.dashboard-ai-mark {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #0b4c75;
  background: #edf5fb;
  border: 1px solid #cfe0ec;
}

.dashboard-ai-mark.small {
  width: 22px;
  height: 22px;
}

.dashboard-ai-title {
  margin: 0;
  font-size: 15px;
  line-height: 1.25;
  color: #0f172a;
}

.dashboard-ai-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: #64748b;
}

.dashboard-ai-icon-btn {
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #334155;
  background: transparent;
  cursor: pointer;
}

.dashboard-ai-icon-btn:hover {
  border-color: #dbe2ea;
  background: #f8fafc;
}

.dashboard-ai-chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  background: #f8fafc;
}

.dashboard-ai-context-card {
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 8px 10px;
  margin-bottom: 10px;
  background: #fff;
}

.dashboard-ai-context-card summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  list-style: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.dashboard-ai-context-card summary::-webkit-details-marker {
  display: none;
}

.dashboard-ai-context-card[open] summary svg {
  transform: rotate(180deg);
}

.dashboard-ai-context-line {
  margin: 7px 0 0;
  font-size: 12px;
  color: #1f2937;
}

.dashboard-ai-context-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.dashboard-ai-context-chips span {
  font-size: 11px;
  line-height: 1;
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  padding: 4px 7px;
  color: #334155;
  background: #f8fafc;
}

.dashboard-ai-generate-btn {
  width: 100%;
  border: 1px solid #b7d2e6;
  background: #edf5fb;
  color: #0b4c75;
  border-radius: 10px;
  padding: 9px 10px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.dashboard-ai-generate-btn:disabled,
.dashboard-ai-send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dashboard-ai-thinking {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 2px 0 8px;
  font-size: 12px;
  color: #64748b;
}

.dashboard-ai-composer {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.04);
}

.dashboard-ai-question-input {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 46px;
  max-height: 112px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 10px 11px;
  resize: none;
  line-height: 1.35;
  font-size: 13px;
  font-family: inherit;
  color: #0f172a;
  background: #fff;
}

.dashboard-ai-question-input:focus {
  outline: 2px solid rgba(51, 184, 196, 0.18);
  border-color: #7ba8c3;
}

.dashboard-ai-send-btn {
  flex: 0 0 auto;
  border: 0;
  background: #0e3a56;
  color: #fff;
  border-radius: 10px;
  min-height: 42px;
  min-width: 72px;
  padding: 0 13px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 768px) {
  .dashboard-ai-chat-root {
    right: 10px;
    bottom: 10px;
    left: 10px;
  }

  .dashboard-ai-launcher {
    margin-left: auto;
  }

  .dashboard-ai-minimized {
    width: 100%;
  }

  .dashboard-ai-chat-window {
    width: 100%;
    height: calc(100vh - 20px);
    height: calc(100dvh - 20px);
    border-radius: 14px;
  }

  .dashboard-ai-composer {
    align-items: stretch;
  }

  .dashboard-ai-send-btn {
    min-width: 68px;
  }
}
</style>
