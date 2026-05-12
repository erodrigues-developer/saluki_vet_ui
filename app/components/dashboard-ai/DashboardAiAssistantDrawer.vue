<template>
  <NDrawer v-if="!isMobile" v-model:show="openModel" placement="right" :width="480">
    <NDrawerContent closable class="ai-assistant-shell ai-assistant-drawer" @close="openModel = false">
      <template #header>
        <div class="modal-head">
          <h3 class="title">✨ Assistente inteligente</h3>
          <p class="subtitle">Insights operacionais baseados no dashboard atual.</p>
        </div>
      </template>

      <div class="panel-content">
        <div class="context-card">
          <p class="context-title">Contexto atual</p>
          <p class="context-line">Hoje · Dashboard operacional · Clínica aberta até 20h</p>
          <div class="context-chips"><span>Hoje</span><span>Financeiro</span><span>Estoque</span><span>Vacinas</span><span>Atendimentos</span></div>
        </div>

        <button class="generate-btn" type="button" :disabled="loading" @click="$emit('generate')">
          ✨ {{ loading ? 'Analisando indicadores...' : 'Gerar análise do dashboard' }}
        </button>

        <DashboardAiSuggestedQuestions :questions="suggestedQuestions" @select="$emit('selectQuestion', $event)" />

        <div class="messages">
          <DashboardAiMessage
            v-for="message in messages"
            :key="message.id"
            :message="message"
            @run-action="$emit('runAction', $event)"
          />
          <p v-if="loading" class="thinking">Gerando insights...</p>
        </div>
      </div>

      <template #footer>
        <div class="composer">
          <textarea
            :value="question"
            class="question-input"
            rows="3"
            placeholder="Pergunte algo sobre os indicadores da clínica..."
            aria-label="Pergunte algo sobre os indicadores da clínica"
            @input="$emit('update:question', ($event.target as HTMLTextAreaElement).value)"
            @keydown.enter.exact.prevent="$emit('send')"
          />
          <button class="send-btn" type="button" :disabled="loading" aria-label="Enviar pergunta para o assistente" @click="$emit('send')">Enviar</button>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>

  <NModal v-else v-model:show="openModel" preset="card" class="ai-assistant-shell ai-assistant-modal">
    <template #header>
      <div class="modal-head">
        <h3 class="title">✨ Assistente inteligente</h3>
        <p class="subtitle">Insights operacionais baseados no dashboard atual.</p>
      </div>
    </template>

    <div class="panel-content">
      <div class="context-card">
        <p class="context-title">Contexto atual</p>
        <p class="context-line">Hoje · Dashboard operacional · Clínica aberta até 20h</p>
        <div class="context-chips"><span>Hoje</span><span>Financeiro</span><span>Estoque</span><span>Vacinas</span><span>Atendimentos</span></div>
      </div>

      <button class="generate-btn" type="button" :disabled="loading" @click="$emit('generate')">
        ✨ {{ loading ? 'Analisando indicadores...' : 'Gerar análise do dashboard' }}
      </button>

      <DashboardAiSuggestedQuestions :questions="suggestedQuestions" @select="$emit('selectQuestion', $event)" />

      <div class="messages">
        <DashboardAiMessage
          v-for="message in messages"
          :key="`m-${message.id}`"
          :message="message"
          @run-action="$emit('runAction', $event)"
        />
        <p v-if="loading" class="thinking">Gerando insights...</p>
      </div>
    </div>

    <template #footer>
      <div class="composer">
        <textarea
          :value="question"
          class="question-input"
          rows="3"
          placeholder="Pergunte algo sobre os indicadores da clínica..."
          aria-label="Pergunte algo sobre os indicadores da clínica"
          @input="$emit('update:question', ($event.target as HTMLTextAreaElement).value)"
          @keydown.enter.exact.prevent="$emit('send')"
        />
        <button class="send-btn" type="button" :disabled="loading" aria-label="Enviar pergunta para o assistente" @click="$emit('send')">Enviar</button>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NDrawer, NDrawerContent, NModal } from 'naive-ui'
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
  (e: 'close'): void
  (e: 'generate'): void
  (e: 'selectQuestion', question: string): void
  (e: 'update:question', value: string): void
  (e: 'send'): void
  (e: 'runAction', action: AiAction): void
}>()

const openModel = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit('close')
  }
})
</script>

<style scoped>
.title { margin: 0; font-size: 18px; color: #0f172a; }
.subtitle { margin: 2px 0 0; font-size: 12px; color: #64748b; }

.modal-head { display: flex; flex-direction: column; gap: 2px; }

.panel-content {
  display: grid;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  grid-template-rows: auto auto auto 1fr;
}

.context-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
}

.context-title { margin: 0 0 2px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
.context-line { margin: 0; font-size: 13px; color: #1f2937; }
.context-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.context-chips span { font-size: 11px; border: 1px solid #dbe2ea; border-radius: 999px; padding: 3px 7px; color: #334155; }

.generate-btn {
  border: 1px solid #b7d2e6;
  background: #edf5fb;
  color: #0b4c75;
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.messages {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  overflow: auto;
}

.thinking { margin: 2px 0 0; font-size: 12px; color: #64748b; }

.composer {
  display: flex;
  width: 100%;
  align-items: end;
  gap: 8px;
}

.question-input {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  padding: 10px 12px;
  min-height: 84px;
  max-height: 168px;
  resize: vertical;
  line-height: 1.45;
  font-size: 14px;
  font-family: inherit;
  color: #0f172a;
  background: #fff;
}

.send-btn {
  flex: 0 0 auto;
  border: 0;
  background: #0e3a56;
  color: #fff;
  border-radius: 10px;
  min-height: 44px;
  min-width: 76px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

@media (max-width: 768px) {
  .composer {
    flex-direction: column;
    align-items: stretch;
  }

  .question-input {
    min-height: 96px;
  }

  .send-btn {
    width: 100%;
  }
}
</style>

<style>
:root .n-modal-container:has(.ai-assistant-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.ai-assistant-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.ai-assistant-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.ai-assistant-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.ai-assistant-shell {
  --n-padding-top: 0 !important;
  --n-padding-bottom: 0 !important;
  --n-padding-left: 0 !important;
  --n-padding-right: 0 !important;
}

.ai-assistant-drawer :deep(.n-drawer-header) {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
}

.ai-assistant-drawer :deep(.n-drawer-body-content-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.ai-assistant-drawer :deep(.n-drawer-body-content) {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
}

.ai-assistant-drawer :deep(.n-drawer-footer) {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
}

.ai-assistant-modal.n-card {
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

.ai-assistant-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 14px 16px 10px;
}

.ai-assistant-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 12px 16px;
  scroll-padding-bottom: 96px;
  -webkit-overflow-scrolling: touch;
}

.ai-assistant-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 8px 12px;
}

@media (min-width: 901px) {
  .ai-assistant-modal.n-card {
    width: 520px !important;
    max-width: 520px !important;
  }
}
</style>
