<template>
  <div class="clinical-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Atendimento</p>
        <h1>Novo atendimento clínico</h1>
        <p class="subhead">Registre a consulta com apoio de IA para organizar a queixa, sugerir anamnese e acelerar o prontuário.</p>
      </div>
      <div class="head-actions">
        <span class="save-status">{{ saveStatusLabel }}</span>
        <n-button tertiary @click="navigateTo('/atendimento/consultas')">Sair</n-button>
      </div>
    </div>

    <div class="layout" :class="{ mobile: isMobile }">
      <aside v-if="!isMobile" class="steps-panel">
        <button
          v-for="(step, index) in steps"
          :key="step.key"
          class="step-item"
          :class="{ active: index === currentStep, done: completedSteps.has(index), locked: isStepLocked(index) }"
          type="button"
          @click="setCurrentStep(index)"
        >
          <span class="step-index">{{ completedSteps.has(index) ? '✓' : index + 1 }}</span>
          <span>{{ step.label }}</span>
        </button>
      </aside>

      <section class="content-panel">
        <div v-if="isMobile" class="mobile-progress">
          <p>Step {{ currentStep + 1 }} de {{ steps.length }}</p>
          <n-progress type="line" :percentage="Math.round(((currentStep + 1) / steps.length) * 100)" :show-indicator="false" />
        </div>

        <n-card v-show="currentStep === 0" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head">
              <h3>1. Contexto</h3>
              <p>Identifique paciente, tutor e profissional responsável.</p>
            </div>
          </template>
          <div class="grid">
            <n-form-item label="Atendimento relacionado">
              <n-select v-model:value="model.appointmentId" :options="appointmentsOptions" placeholder="Selecione um agendamento anterior, se houver" clearable @update:value="handleAppointmentChange" />
              <template #feedback>
                <span class="field-help">Opcional. Vincule um agendamento anterior para preencher os dados automaticamente.</span>
              </template>
            </n-form-item>
            <n-form-item label="Cliente" required>
              <n-select v-model:value="model.clientId" :options="clientOptions" placeholder="Selecione" filterable @update:value="handleClientChange" />
            </n-form-item>
            <n-form-item label="Paciente" required>
              <n-select v-model:value="model.petId" :options="petOptions" :disabled="!model.clientId" placeholder="Selecione" filterable />
            </n-form-item>
            <n-form-item label="Veterinário responsável" required>
              <n-select v-model:value="model.veterinarianId" :options="veterinarianOptions" placeholder="Selecione" filterable />
            </n-form-item>
            <n-form-item label="Data e hora" required>
              <n-date-picker v-model:value="model.visitDate" type="datetime" format="dd/MM/yyyy HH:mm" style="width: 100%" />
            </n-form-item>
          </div>
          <p v-if="appointmentPrefilledFeedback" class="feedback-note">Dados preenchidos a partir do agendamento selecionado.</p>
        </n-card>

        <n-card v-show="currentStep === 1" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head">
              <h3>2. Triagem rápida</h3>
              <p>Registre sinais iniciais da consulta.</p>
            </div>
          </template>
          <div class="grid triage-grid">
            <n-form-item label="Peso (kg)">
              <n-input-number v-model:value="model.weightKg" :min="0" :precision="2" style="width: 100%" />
            </n-form-item>
            <n-form-item label="Temperatura (°C)">
              <n-input-number v-model:value="model.temperatureC" :min="0" :precision="1" style="width: 100%" />
            </n-form-item>
          </div>
          <n-button tertiary type="info" size="small" @click="showOptionalVitals = !showOptionalVitals">
            {{ showOptionalVitals ? 'Ocultar sinais vitais opcionais' : '+ Adicionar sinais vitais opcionais' }}
          </n-button>
          <p class="field-help">Frequência cardíaca, frequência respiratória, mucosas, hidratação e dor.</p>
          <div v-if="showOptionalVitals" class="grid optional-vitals-grid">
            <n-form-item label="Frequência cardíaca (bpm)">
              <n-input-number v-model:value="model.heartRateBpm" :min="0" :precision="0" style="width: 100%" />
            </n-form-item>
            <n-form-item label="Frequência respiratória (irpm)">
              <n-input-number v-model:value="model.respiratoryRateIpm" :min="0" :precision="0" style="width: 100%" />
            </n-form-item>
            <n-form-item label="Mucosas">
              <n-input v-model:value="model.mucosaStatus" placeholder="Ex.: rosadas, pálidas..." />
            </n-form-item>
            <n-form-item label="Hidratação">
              <n-input v-model:value="model.hydrationStatus" placeholder="Ex.: normohidratado, leve desidratação..." />
            </n-form-item>
            <n-form-item label="Dor">
              <n-input v-model:value="model.painStatus" placeholder="Ex.: sem dor aparente, dor moderada..." />
            </n-form-item>
          </div>
        </n-card>

        <n-card v-show="currentStep === 2" :bordered="false" class="step-card ai-card">
          <template #header>
            <div class="step-head">
              <h3>3. Queixa assistida por IA</h3>
              <p>Dite a queixa do tutor. A IA organiza o relato e sugere a anamnese.</p>
            </div>
          </template>

          <div class="recording-hero">
            <div class="mic-orb" :class="{ recording: isRecording }">
              <svg viewBox="0 0 24 24" class="mic-icon" aria-hidden="true">
                <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0a7 7 0 0 1-6 6.92V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0a5 5 0 1 0 10 0Z"/>
              </svg>
            </div>
            <div class="recording-meta">
              <div class="ai-status-row">
                <n-tag :type="aiStatusTagType" round>{{ aiStatusLabel }}</n-tag>
                <span v-if="isRecording" class="recording-dot" />
                <span v-if="isRecording" class="recording-timer">{{ recordingElapsedLabel }}</span>
                <n-spin v-if="hasPendingSuggestion" :size="14" />
              </div>
              <p class="recording-helper">{{ aiHelperText }}</p>
            </div>
          </div>

          <div v-if="showSuggestionReadyActions" class="inline-actions">
            <n-button type="info" @click="applyOrganizedComplaint">Aplicar texto organizado</n-button>
            <n-button tertiary type="info" :disabled="isRecording" @click="handleMicrophoneAction">Gravar novamente</n-button>
            <n-button tertiary type="info" @click="showOriginalComparison = !showOriginalComparison">Comparar com original</n-button>
            <n-button tertiary @click="showManualInput = true; focusManualEdit()">Editar manualmente</n-button>
          </div>

          <div v-else class="inline-actions">
            <n-button type="info" class="recording-cta" :disabled="(!model.id || !canUseAudioCapture) && !aiHasError" @click="handleMicrophoneAction">
              <template #icon>
                <svg viewBox="0 0 24 24" class="btn-mic-icon" aria-hidden="true">
                  <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0a7 7 0 0 1-6 6.92V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0a5 5 0 1 0 10 0Z"/>
                </svg>
              </template>
              {{ aiHasError ? 'Tentar novamente' : (isRecording ? 'Parar gravação' : 'Iniciar gravação') }}
            </n-button>
            <n-button tertiary type="info" @click="showManualInput = !showManualInput">
              {{ showManualInput ? 'Ocultar digitação manual' : 'Digitar manualmente' }}
            </n-button>
            <n-button v-if="isRecording" tertiary @click="toggleRecordingPause">{{ isRecordingPaused ? 'Retomar' : 'Pausar' }}</n-button>
          </div>

          <div v-if="showManualInput || model.mainComplaint || visibleSuggestion?.structuredPayload" class="manual-input-box">
            <p class="textarea-label">{{ visibleSuggestion?.structuredPayload ? 'Texto transcrito/editável' : 'Queixa registrada' }}</p>
            <n-input v-model:value="model.mainComplaint" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Ex.: tutor relata vômitos há dois dias, apatia e redução do apetite..." @update:value="onChiefComplaintChange" />
            <div class="inline-actions">
              <n-button type="info" tertiary :disabled="!model.id || !canAutoGenerate || hasPendingSuggestion" @click="triggerTextImprove">Melhorar texto com IA</n-button>
            </div>
          </div>
          <n-alert v-if="aiHasError" type="error" class="ai-error" :show-icon="false">{{ aiErrorMessage || 'Erro ao processar' }}</n-alert>
          <div v-if="showOriginalComparison && visibleSuggestion?.structuredPayload" class="comparison-box">
            <p><strong>Texto original:</strong> {{ visibleSuggestion.transcriptFinal || visibleSuggestion.transcriptDraft || 'Sem conteúdo original.' }}</p>
            <p><strong>Texto organizado:</strong> {{ visibleSuggestion.structuredPayload.mainComplaint || visibleSuggestion.structuredPayload.summary || 'Sem organização.' }}</p>
          </div>
        </n-card>

        <n-card v-show="currentStep === 3" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head">
              <h3>4. Anamnese sugerida</h3>
              <p>Revise as sugestões antes de salvar no prontuário.</p>
            </div>
          </template>

          <div v-if="hasPendingSuggestion" class="state-box">Organizando relato clínico...</div>
          <template v-else-if="visibleSuggestion?.structuredPayload">
            <p class="suggestions-summary">{{ appliedSuggestionsCount }} de {{ suggestionCards.length }} sugestões aplicadas</p>
            <div class="suggestion-grid">
              <article v-for="card in suggestionCards" :key="card.key" class="suggestion-item">
                <div class="suggestion-item-head">
                  <p class="suggestion-label">{{ card.label }}</p>
                  <n-tag size="small" :type="suggestionTagType(suggestionStateMap[card.key])">{{ card.value ? suggestionStateMap[card.key] : 'Sem sugestões' }}</n-tag>
                </div>
                <p class="suggestion-value clamp-4">{{ card.value || card.emptyText }}</p>
                <div v-if="card.value" class="suggestion-actions-inline">
                  <n-button v-if="suggestionStateMap[card.key] !== 'Aplicado'" text size="small" class="suggestion-action-btn" @click="applySuggestionCard(card)">Aplicar</n-button>
                  <n-button text size="small" class="suggestion-action-btn" @click="editSuggestionCard(card)">Editar</n-button>
                  <n-button v-if="suggestionStateMap[card.key] === 'Aplicado'" text size="small" class="suggestion-action-btn" @click="undoSuggestionCard(card)">Desfazer</n-button>
                  <n-button text size="small" class="suggestion-action-btn" @click="viewSuggestionCard(card)">Ver completo</n-button>
                </div>
                <div v-else class="suggestion-actions-inline">
                  <n-button text size="small" class="suggestion-action-btn" @click="editSuggestionCard(card)">Editar manualmente</n-button>
                </div>
              </article>
            </div>
            <div class="inline-actions">
              <n-button secondary type="primary" :disabled="allSuggestionsApplied" @click="applyVisibleSuggestions">{{ allSuggestionsApplied ? 'Tudo aplicado' : 'Aplicar todas' }}</n-button>
              <n-button tertiary @click="reviewSuggestionsOneByOne">Revisar uma a uma</n-button>
              <n-button tertiary @click="ignoreLatestSuggestion">Descartar</n-button>
            </div>
          </template>
          <div v-else class="state-box">Ainda sem sugestões.</div>

          <p class="responsibility-note">Revise as sugestões antes de salvar no prontuário.</p>
        </n-card>
        <n-modal v-model:show="suggestionModalVisible" preset="card" class="suggestion-modal" title="Texto completo" :mask-closable="true">
          <div class="suggestion-modal-body">
            <p class="suggestion-modal-label">{{ suggestionModalTitle }}</p>
            <p>{{ suggestionModalContent || 'Sem conteúdo disponível.' }}</p>
          </div>
        </n-modal>

        <n-card v-show="currentStep === 4" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head">
              <h3>5. Diagnóstico e conduta</h3>
              <p>Consolide hipóteses, plano e encaminhamentos.</p>
            </div>
          </template>
          <div class="grid">
            <n-form-item label="Diagnóstico ou hipótese diagnóstica">
              <n-input v-model:value="model.diagnosis" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
            </n-form-item>
            <n-form-item label="Conduta">
              <n-input v-model:value="model.treatmentPlan" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
            </n-form-item>
            <n-form-item label="Prescrição" class="full-row">
              <n-input v-model:value="clinical.prescription" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
            </n-form-item>
            <n-form-item label="Exames solicitados" class="full-row">
              <n-input v-model:value="clinical.exams" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
            </n-form-item>
            <n-form-item label="Retorno recomendado">
              <n-input v-model:value="clinical.followUp" placeholder="Ex.: retorno em 5 dias" />
            </n-form-item>
            <n-form-item label="Encaminhar para internação">
              <n-switch v-model:value="clinical.referInpatient" />
            </n-form-item>
          </div>
          <div class="inline-actions">
            <button type="button" class="quick-action-card" @click="message.info('Fluxo de prescrição em evolução.')">
              <span class="quick-action-icon">💊</span>
              <span><strong>Gerar prescrição</strong> — Criar prescrição vinculada ao atendimento.</span>
            </button>
            <button type="button" class="quick-action-card" @click="message.info('Fluxo de exames em evolução.')">
              <span class="quick-action-icon">🧪</span>
              <span><strong>Solicitar exame</strong> — Registrar exames complementares.</span>
            </button>
            <button type="button" class="quick-action-card" @click="clinical.referInpatient = true">
              <span class="quick-action-icon">🏥</span>
              <span><strong>Encaminhar para internação</strong> — Abrir fluxo de internação.</span>
            </button>
          </div>
        </n-card>

        <n-card v-show="currentStep === 5" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head">
              <h3>6. Revisão</h3>
              <p>Revise os dados antes da finalização.</p>
            </div>
          </template>
          <p class="muted">Revise os dados antes de finalizar. O atendimento será registrado no prontuário do paciente.</p>
          <div class="review-grid">
            <section class="review-block">
              <div class="review-block-head"><h4>Paciente</h4><button type="button" class="edit-link" @click="setCurrentStep(0)">Editar</button></div>
              <p><strong>Paciente:</strong> {{ petLabel }}</p>
              <p><strong>Tutor:</strong> {{ clientLabel }}</p>
              <p><strong>Veterinário:</strong> {{ veterinarianLabel }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Relato clínico</h4><button type="button" class="edit-link" @click="setCurrentStep(2)">Editar</button></div>
              <p><strong>Queixa organizada:</strong> {{ model.mainComplaint || 'Ainda não registrado' }}</p>
              <p><strong>Anamnese:</strong> {{ model.clinicalFindings || 'Ainda não registrado' }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Conduta</h4><button type="button" class="edit-link" @click="setCurrentStep(4)">Editar</button></div>
              <p><strong>Diagnóstico:</strong> {{ model.diagnosis || 'Ainda não registrado' }}</p>
              <p><strong>Conduta:</strong> {{ model.treatmentPlan || 'Ainda não registrado' }}</p>
              <p><strong>Prescrição:</strong> {{ clinical.prescription || 'Ainda não registrado' }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Encaminhamentos</h4><button type="button" class="edit-link" @click="setCurrentStep(4)">Editar</button></div>
              <p><strong>Exames:</strong> {{ clinical.exams || 'Não solicitado' }}</p>
              <p><strong>Retorno:</strong> {{ clinical.followUp || 'Não definido' }}</p>
              <p><strong>Internação:</strong> {{ clinical.referInpatient ? 'Encaminhar para internação' : 'Sem encaminhamento' }}</p>
            </section>
          </div>
          <div class="inline-actions">
            <n-button tertiary @click="currentStep = 0">Voltar e editar</n-button>
            <n-button type="primary" :loading="saving" @click="finalizeAttendance">Finalizar atendimento</n-button>
          </div>
        </n-card>

        <div v-if="currentStep < steps.length - 1" class="step-nav">
          <n-button :disabled="currentStep === 0" @click="goPrev">Voltar</n-button>
          <n-button type="primary" :loading="saving" @click="saveAndContinue">Salvar e continuar</n-button>
        </div>
      </section>

      <aside v-if="!isMobile" class="side-panel">
        <n-card :bordered="false" class="mini-card">
          <h4>Resumo do paciente</h4>
          <p><strong>Tutor:</strong> {{ clientLabel }}</p>
          <p><strong>Paciente:</strong> {{ petLabel }}</p>
          <p><strong>Veterinário:</strong> {{ veterinarianLabel }}</p>
          <p><strong>Status IA:</strong> {{ aiStatusLabel }}</p>
        </n-card>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { format } from 'date-fns'

interface DictationStructuredPayload {
  summary?: string
  mainComplaint?: string | null
  subjective?: string | null
  assessment?: string | null
  objective?: string | null
  plan?: string | null
  clinicalFindings?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
  notes?: string | null
  weightKg?: number | null
  temperatureC?: number | null
}

const message = useMessage()
const route = useRoute()
const saving = ref(false)
const currentStep = ref(0)
const isMobile = ref(false)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const lastSavedAt = ref<number | null>(null)
const showManualInput = ref(false)
const showOptionalVitals = ref(false)
const recordingElapsedSeconds = ref(0)
const completedSteps = ref<Set<number>>(new Set())
const appointmentPrefilledFeedback = ref(false)
const suggestionModalVisible = ref(false)
const suggestionModalTitle = ref('')
const suggestionModalContent = ref('')
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const steps = [
  { key: 'context', label: 'Contexto' },
  { key: 'triage', label: 'Triagem rápida' },
  { key: 'complaint', label: 'Queixa assistida por IA' },
  { key: 'anamnesis', label: 'Anamnese sugerida' },
  { key: 'diagnosis', label: 'Diagnóstico e conduta' },
  { key: 'review', label: 'Revisão' }
]

const model = reactive<any>({
  id: null,
  appointmentId: null,
  petId: null,
  clientId: null,
  veterinarianId: null,
  visitDate: Date.now(),
  weightKg: null,
  temperatureC: null,
  heartRateBpm: null,
  respiratoryRateIpm: null,
  mucosaStatus: '',
  hydrationStatus: '',
  painStatus: '',
  mainComplaint: '',
  clinicalFindings: '',
  diagnosis: '',
  treatmentPlan: '',
  notes: ''
})

const clinical = reactive({
  prescription: '',
  exams: '',
  followUp: '',
  referInpatient: false
})

const clientOptions = ref<{ label: string; value: number }[]>([])
const petOptions = ref<{ label: string; value: number }[]>([])
const allPets = ref<any[]>([])
const veterinarianOptions = ref<{ label: string; value: number }[]>([])
const appointmentsOptions = ref<{ label: string; value: number; data: any }[]>([])

const dictations = ref<any[]>([])
const sendingDictation = ref(false)
const latestAudioBlob = ref<Blob | null>(null)
const latestAudioFileName = ref<string | null>(null)
const isRecording = ref(false)
const isRecordingPaused = ref(false)
const audioDurationSeconds = ref<number | null>(null)
const aiInputDirty = ref(false)
const dismissedSuggestionId = ref<number | null>(null)
const aiErrorMessage = ref('')
const showOriginalComparison = ref(false)
const suggestionStateMap = reactive<Record<string, 'Sugerido' | 'Aplicado' | 'Editado' | 'Ignorado'>>({})
let recordingStartedAt: number | null = null
let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let dictationPoller: ReturnType<typeof setInterval> | null = null
let autoSuggestionTimer: ReturnType<typeof setTimeout> | null = null
let speechRecognition: any = null
let audioChunks: Blob[] = []
let recordingTicker: ReturnType<typeof setInterval> | null = null

const MIN_AUTOMATION_LENGTH = 18
const aiHasError = computed(() => Boolean(aiErrorMessage.value))
const cleanedMainComplaint = computed(() => String(model.mainComplaint || '').replace(/\s+/g, ' ').trim())
const canUseAudioCapture = computed(() => process.client && typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
const hasPendingSuggestion = computed(() => sendingDictation.value || dictations.value.some((item) => ['PENDING', 'PROCESSING'].includes(item.status)))
const canAutoGenerate = computed(() => Boolean(model.id) && (cleanedMainComplaint.value.length >= MIN_AUTOMATION_LENGTH || !!latestAudioBlob.value))
const latestCompletedDictation = computed(() => dictations.value.find((item) => item.status === 'COMPLETED') || null)
const visibleSuggestion = computed(() => {
  if (!latestCompletedDictation.value) return null
  if (latestCompletedDictation.value.id === dismissedSuggestionId.value) return null
  return latestCompletedDictation.value
})
const showSuggestionReadyActions = computed(() => Boolean(visibleSuggestion.value?.structuredPayload) && !isRecording.value && !hasPendingSuggestion.value && !aiHasError.value)

const aiStatusLabel = computed(() => {
  if (aiHasError.value) return 'Erro ao processar'
  if (isRecording.value) return 'Ouvindo...'
  if (hasPendingSuggestion.value) return 'Organizando relato clínico...'
  if (visibleSuggestion.value?.structuredPayload) return 'Sugestão pronta'
  return 'Pronto para gravar'
})

const aiStatusTagType = computed<"success" | "warning" | "info" | "error">(() => {
  if (!model.id) return 'info'
  if (aiHasError.value) return 'warning'
  if (isRecording.value) return 'error'
  if (hasPendingSuggestion.value) return 'info'
  if (visibleSuggestion.value?.structuredPayload) return 'success'
  return 'info'
})

const aiHelperText = computed(() => {
  if (!model.id) return 'Salve os dados do contexto para liberar o ditado com IA.'
  if (aiHasError.value) return 'Erro no processamento do ditado. Tente novamente.'
  if (isRecording.value) return 'Fale naturalmente.'
  if (hasPendingSuggestion.value) return 'A IA está transcrevendo e estruturando a queixa.'
  if (visibleSuggestion.value?.structuredPayload) return 'Revise as sugestões antes de salvar no prontuário.'
  return 'Dite a queixa do tutor. A IA irá transcrever, organizar e sugerir a anamnese.'
})
const saveStatusLabel = computed(() => {
  if (saveStatus.value === 'saving') return 'Salvando alterações...'
  if (saveStatus.value === 'error') return 'Erro ao salvar alterações'
  if (saveStatus.value === 'saved' && lastSavedAt.value) return 'Alterações salvas automaticamente'
  return 'Sem alterações salvas'
})
const recordingElapsedLabel = computed(() => {
  const total = Math.max(0, recordingElapsedSeconds.value)
  const mins = Math.floor(total / 60).toString().padStart(2, '0')
  const secs = (total % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})

const suggestionCards = computed(() => {
  const payload: DictationStructuredPayload | undefined = visibleSuggestion.value?.structuredPayload
  if (!payload) return []

  const normalizeSuggestionText = (value: string | null | undefined) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()

  const acceptedValues: string[] = []
  const useDistinctValue = (value: string | null | undefined) => {
    const normalized = normalizeSuggestionText(value)
    if (!normalized) return null
    if (acceptedValues.includes(normalized)) return null
    acceptedValues.push(normalized)
    return String(value).trim()
  }

  const complaintText = payload.mainComplaint || payload.subjective || payload.summary
  const durationText = payload.notes
  const findingsText = payload.clinicalFindings || payload.objective
  const historyText = payload.assessment || payload.notes
  const questionsText = payload.plan || payload.treatmentPlan

  return [
    { key: 'complaint', label: 'Queixa organizada', value: useDistinctValue(complaintText), emptyText: 'Sem organização automática da queixa.' },
    { key: 'duration', label: 'Duração dos sintomas', value: useDistinctValue(durationText), emptyText: 'Sem duração sugerida.' },
    { key: 'findings', label: 'Sinais associados', value: useDistinctValue(findingsText), emptyText: 'Sem sinais sugeridos.' },
    { key: 'feeding', label: 'Alimentação', value: null, emptyText: 'Sem dados sugeridos.' },
    { key: 'hydration', label: 'Ingestão de água', value: null, emptyText: 'Sem dados sugeridos.' },
    { key: 'elimination', label: 'Eliminação', value: null, emptyText: 'Sem dados sugeridos.' },
    { key: 'meds', label: 'Medicamentos em uso', value: null, emptyText: 'Sem dados sugeridos.' },
    { key: 'history', label: 'Histórico prévio', value: useDistinctValue(historyText), emptyText: 'Sem histórico sugerido.' },
    { key: 'questions', label: 'Perguntas recomendadas', value: useDistinctValue(questionsText), emptyText: 'Sem perguntas sugeridas.' }
  ]
})
const appliedSuggestionsCount = computed(() => suggestionCards.value.filter((card) => suggestionStateMap[card.key] === 'Aplicado').length)
const allSuggestionsApplied = computed(() => suggestionCards.value.length > 0 && appliedSuggestionsCount.value === suggestionCards.value.length)

const clientLabel = computed(() => clientOptions.value.find((c) => c.value === model.clientId)?.label || 'Não informado')
const petLabel = computed(() => petOptions.value.find((p) => p.value === model.petId)?.label || 'Não informado')
const veterinarianLabel = computed(() => veterinarianOptions.value.find((v) => v.value === model.veterinarianId)?.label || 'Não informado')
const isExistingConsultation = computed(() => Boolean(model.id))

const loadLookups = async () => {
  const api = useApi()
  try {
    const [clientsRes, petsRes, usersRes, apptsRes] = await Promise.all([
      api<any>('/api/v1/clients?limit=500'),
      api<any>('/api/v1/pets?limit=1000'),
      api<any>('/api/v1/users?limit=100'),
      api<any>('/api/v1/appointments?sortBy=startsAt&sortDirection=desc&limit=50')
    ])

    clientOptions.value = clientsRes.data.map((item: any) => ({ label: item.name, value: Number(item.id) }))
    allPets.value = petsRes.data
    veterinarianOptions.value = usersRes.data.map((item: any) => ({ label: item.name, value: Number(item.id) }))
    appointmentsOptions.value = apptsRes.data.map((item: any) => ({
      label: `Agendamento - ${format(new Date(item.startsAt), 'dd/MM/yyyy HH:mm')} - ${item.reason || 'Sem motivo'}`,
      value: Number(item.id),
      data: item
    }))
  } catch (_error) {
    message.error('Erro ao carregar dados auxiliares')
  }
}

const normalizeStepIndex = (value: unknown) => {
  const raw = Number(value)
  if (!Number.isFinite(raw)) return null
  const parsed = Math.max(1, Math.min(steps.length, Math.trunc(raw)))
  return parsed - 1
}

const resolveInitialStepFromModel = () => {
  const hasComplaint = String(model.mainComplaint || '').trim().length > 0
  const hasAnamnesis = String(model.clinicalFindings || '').trim().length > 0
  const hasDiagnosis = String(model.diagnosis || '').trim().length > 0 || String(model.treatmentPlan || '').trim().length > 0

  if (!hasComplaint) return 2
  if (hasComplaint && !hasAnamnesis) return 3
  if (hasAnamnesis && !hasDiagnosis) return 4
  return 5
}

const hasAnyText = (value: unknown) => String(value || '').trim().length > 0

const hydrateCompletedStepsFromModel = (activeStep: number) => {
  const done = new Set<number>()

  const hasCoreContext = Boolean(model.clientId && model.petId && model.veterinarianId && model.visitDate)
  const hasTriage = [
    model.weightKg,
    model.temperatureC,
    model.heartRateBpm,
    model.respiratoryRateIpm,
    model.mucosaStatus,
    model.hydrationStatus,
    model.painStatus
  ].some((value) => {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0
    return hasAnyText(value)
  })
  const hasComplaint = hasAnyText(model.mainComplaint)
  const hasAnamnesis = hasAnyText(model.clinicalFindings) || Boolean(visibleSuggestion.value?.structuredPayload)
  const hasConduct = [
    model.diagnosis,
    model.treatmentPlan,
    clinical.prescription,
    clinical.exams,
    clinical.followUp
  ].some(hasAnyText) || clinical.referInpatient

  if (hasCoreContext) done.add(0)
  if (hasTriage) done.add(1)
  if (hasComplaint) done.add(2)
  if (hasAnamnesis) done.add(3)
  if (hasConduct) done.add(4)
  if (hasCoreContext && hasComplaint && hasConduct) done.add(5)

  for (let idx = 0; idx < activeStep; idx += 1) done.add(idx)
  completedSteps.value = done
}

const hydrateClinicalNotesFromModel = () => {
  const notes = String(model.notes || '')
  const getLineValue = (label: string) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = notes.match(new RegExp(`${escaped}:\\s*(.+)`))
    return match?.[1]?.trim() || ''
  }

  clinical.prescription = getLineValue('Prescrição')
  clinical.exams = getLineValue('Exames')
  clinical.followUp = getLineValue('Retorno')
  clinical.referInpatient = /Encaminhar para internação:\s*Sim/i.test(notes)
}

const loadConsultationFromRoute = async () => {
  const rawId = Array.isArray(route.query.id) ? route.query.id[0] : route.query.id
  const consultationId = Number(rawId)
  if (!Number.isFinite(consultationId) || consultationId <= 0) {
    const requestedStep = normalizeStepIndex(Array.isArray(route.query.step) ? route.query.step[0] : route.query.step)
    if (requestedStep != null) currentStep.value = requestedStep
    return
  }

  try {
    const api = useApi()
    const consultation = await api<any>(`/api/v1/consultations/${consultationId}`)
    Object.assign(model, {
      ...consultation,
      id: Number(consultation.id),
      appointmentId: consultation.appointmentId ? Number(consultation.appointmentId) : null,
      petId: consultation.petId ? Number(consultation.petId) : null,
      clientId: consultation.clientId ? Number(consultation.clientId) : null,
      veterinarianId: consultation.veterinarianId ? Number(consultation.veterinarianId) : null,
      visitDate: consultation.visitDate ? new Date(consultation.visitDate).getTime() : Date.now()
    })
    updatePetOptions()
    hydrateClinicalNotesFromModel()
    await loadDictations()

    const requestedStep = normalizeStepIndex(Array.isArray(route.query.step) ? route.query.step[0] : route.query.step)
    currentStep.value = requestedStep ?? resolveInitialStepFromModel()
    hydrateCompletedStepsFromModel(currentStep.value)
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar atendimento clínico')
  }
}

const updatePetOptions = () => {
  if (!model.clientId) {
    petOptions.value = []
    return
  }
  const filtered = allPets.value.filter((pet) => Number(pet.clientId) === model.clientId)
  petOptions.value = filtered.map((pet) => ({ label: pet.name, value: Number(pet.id) }))
}

const handleClientChange = () => {
  model.petId = null
  updatePetOptions()
}

const handleAppointmentChange = (value: number | null) => {
  appointmentPrefilledFeedback.value = false
  if (!value) return
  const appointment = appointmentsOptions.value.find((item) => item.value === value)?.data
  if (!appointment) return

  model.clientId = Number(appointment.clientId)
  updatePetOptions()
  model.petId = Number(appointment.petId)
  if (appointment.veterinarianId) model.veterinarianId = Number(appointment.veterinarianId)
  model.visitDate = new Date(appointment.startsAt).getTime()
  if (appointment.reason && !model.mainComplaint) model.mainComplaint = appointment.reason
  appointmentPrefilledFeedback.value = true
}

const validateCore = () => {
  if (!model.clientId || !model.petId || !model.veterinarianId || !model.visitDate) {
    message.warning('Preencha cliente, paciente, veterinário e data/hora.')
    return false
  }
  return true
}

const syncExtraNotes = () => {
  const lines = [
    clinical.prescription ? `Prescrição: ${clinical.prescription}` : '',
    clinical.exams ? `Exames: ${clinical.exams}` : '',
    clinical.followUp ? `Retorno: ${clinical.followUp}` : '',
    clinical.referInpatient ? 'Encaminhar para internação: Sim' : ''
  ].filter(Boolean)

  model.notes = [String(model.notes || '').trim(), ...lines].filter(Boolean).join('\n')
}

const persist = async () => {
  if (!validateCore()) return false
  syncExtraNotes()

  saveStatus.value = 'saving'
  saving.value = true
  const api = useApi()
  try {
    const payload = {
      ...model,
      visitDate: model.visitDate ? new Date(model.visitDate).toISOString() : null
    }

    if (model.id) {
      const updated = await api<any>(`/api/v1/consultations/${model.id}`, { method: 'PATCH', body: payload })
      Object.assign(model, updated)
    } else {
      const created = await api<any>('/api/v1/consultations', { method: 'POST', body: payload })
      Object.assign(model, { ...model, ...created, id: Number(created.id) })
    }
    saveStatus.value = 'saved'
    lastSavedAt.value = Date.now()
    return true
  } catch (err: any) {
    saveStatus.value = 'error'
    message.error(err?.data?.message || 'Erro ao salvar atendimento')
    return false
  } finally {
    saving.value = false
  }
}

const saveDraft = async () => {
  const ok = await persist()
  if (ok) message.success('Rascunho salvo')
}

const saveAndContinue = async () => {
  const ok = await persist()
  if (!ok) return
  completedSteps.value.add(currentStep.value)
  if (currentStep.value < steps.length - 1) currentStep.value += 1
}

const finalizeAttendance = async () => {
  const ok = await persist()
  if (!ok) return
  message.success('Atendimento finalizado com sucesso')
  await navigateTo('/atendimento/consultas')
}

const goPrev = () => {
  if (currentStep.value > 0) currentStep.value -= 1
}

const isStepLocked = (stepIndex: number) => {
  if (isExistingConsultation.value) return false
  if (stepIndex <= currentStep.value) return false
  for (let idx = 0; idx < stepIndex; idx += 1) {
    if (!completedSteps.value.has(idx)) return true
  }
  return false
}

const setCurrentStep = (stepIndex: number) => {
  if (isStepLocked(stepIndex)) {
    let missingStep = 1
    for (let idx = 0; idx < stepIndex; idx += 1) {
      if (!completedSteps.value.has(idx)) {
        missingStep = idx + 1
        break
      }
    }
    message.warning(`Finalize o passo ${missingStep} antes de avançar.`)
    return
  }
  currentStep.value = stepIndex
}

const loadDictations = async () => {
  if (!model.id) {
    dictations.value = []
    stopDictationPolling()
    return
  }
  try {
    const api = useApi()
    const response = await api<any>(`/api/v1/consultations/${model.id}/dictations`)
    dictations.value = response.data || []
    aiErrorMessage.value = ''
    hydrateDraftFromLatestSuggestion()
    syncPollingState()
  } catch (_error) {
    message.error('Erro ao carregar sugestões automáticas')
  }
}

const hydrateDraftFromLatestSuggestion = () => {
  const latest = dictations.value.find((item) => item.status === 'COMPLETED')
  if (!latest) return

  const payload: DictationStructuredPayload | undefined = latest.structuredPayload
  const fallbackComplaint = payload?.mainComplaint || payload?.summary || latest.transcriptFinal || latest.transcriptDraft

  if (!String(model.mainComplaint || '').trim() && fallbackComplaint) {
    model.mainComplaint = fallbackComplaint
  }
  if (!String(model.clinicalFindings || '').trim() && payload?.clinicalFindings) {
    model.clinicalFindings = payload.clinicalFindings
  }
  if (!String(model.diagnosis || '').trim() && payload?.diagnosis) {
    model.diagnosis = payload.diagnosis
  }
  if (!String(model.treatmentPlan || '').trim() && (payload?.treatmentPlan || payload?.plan)) {
    model.treatmentPlan = payload?.treatmentPlan || payload?.plan || ''
  }
  suggestionCards.value.forEach((card) => {
    if (!card.value) {
      suggestionStateMap[card.key] = 'Ignorado'
      return
    }
    if (!suggestionStateMap[card.key] || suggestionStateMap[card.key] === 'Ignorado') suggestionStateMap[card.key] = 'Sugerido'
  })
}

const clearAutoSuggestionTimer = () => {
  if (autoSuggestionTimer) {
    clearTimeout(autoSuggestionTimer)
    autoSuggestionTimer = null
  }
}

const discardAudioCapture = () => {
  latestAudioBlob.value = null
  latestAudioFileName.value = null
  audioDurationSeconds.value = null
}

const cleanupRecordingResources = () => {
  if (recordingTicker) {
    clearInterval(recordingTicker)
    recordingTicker = null
  }
  if (speechRecognition) {
    speechRecognition.onresult = null
    speechRecognition.onerror = null
    speechRecognition.onend = null
    speechRecognition = null
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
  mediaRecorder = null
  isRecording.value = false
  isRecordingPaused.value = false
  recordingElapsedSeconds.value = 0
}

const getSpeechRecognitionCtor = () => {
  if (!process.client) return null
  const browserWindow = window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null
}

const startSpeechRecognitionSession = () => {
  const recognitionCtor = getSpeechRecognitionCtor()
  if (!recognitionCtor) return
  speechRecognition = new recognitionCtor()
  speechRecognition.continuous = true
  speechRecognition.interimResults = true
  speechRecognition.lang = 'pt-BR'
  speechRecognition.onresult = (event: any) => {
    let chunk = ''
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      if (result?.isFinal) chunk += `${result[0]?.transcript || ''} `
    }
    if (chunk.trim()) onChiefComplaintChange(`${model.mainComplaint || ''} ${chunk}`.replace(/\s+/g, ' ').trim())
  }
  speechRecognition.onerror = () => {
    message.warning('Reconhecimento de fala indisponível. Continue digitando ou finalize o áudio para transcrição no backend.')
  }
  speechRecognition.onend = () => { speechRecognition = null }
  speechRecognition.start()
}

const startRecording = async () => {
  if (!canUseAudioCapture.value) {
    message.warning('O navegador atual não suporta captura de áudio')
    return
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioChunks = []
    audioDurationSeconds.value = null
    recordingStartedAt = Date.now()

    mediaRecorder = new MediaRecorder(mediaStream)
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data)
    }
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      latestAudioBlob.value = blob
      latestAudioFileName.value = `consultation-dictation-${Date.now()}.webm`
      if (recordingStartedAt) audioDurationSeconds.value = Math.max(1, Math.round((Date.now() - recordingStartedAt) / 1000))
      aiInputDirty.value = true
      cleanupRecordingResources()
      scheduleAutoSuggestion(250)
    }
    mediaRecorder.start()
    recordingElapsedSeconds.value = 0
    recordingTicker = setInterval(() => {
      if (!recordingStartedAt) return
      recordingElapsedSeconds.value = Math.max(0, Math.round((Date.now() - recordingStartedAt) / 1000))
    }, 1000)

    if (getSpeechRecognitionCtor()) startSpeechRecognitionSession()

    isRecording.value = true
    isRecordingPaused.value = false
  } catch (_error) {
    cleanupRecordingResources()
    aiErrorMessage.value = 'Erro ao processar'
    message.error('Não foi possível acessar o microfone')
  }
}

const stopRecording = () => {
  if (speechRecognition) speechRecognition.stop()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  } else {
    cleanupRecordingResources()
  }
}

const toggleRecordingPause = () => {
  if (!mediaRecorder) return
  if (mediaRecorder.state === 'recording' && typeof mediaRecorder.pause === 'function') {
    mediaRecorder.pause()
    if (speechRecognition) speechRecognition.stop()
    isRecordingPaused.value = true
    return
  }
  if (mediaRecorder.state === 'paused' && typeof mediaRecorder.resume === 'function') {
    mediaRecorder.resume()
    if (!speechRecognition && getSpeechRecognitionCtor()) startSpeechRecognitionSession()
    isRecordingPaused.value = false
  }
}

const handleMicrophoneAction = async () => {
  if (isRecording.value) {
    stopRecording()
    return
  }
  await startRecording()
}

const onChiefComplaintChange = (value: string) => {
  model.mainComplaint = value
  aiInputDirty.value = true
  dismissedSuggestionId.value = null
  if (!isRecording.value) scheduleAutoSuggestion()
}

const submitDictation = async ({ silent = true }: { silent?: boolean } = {}) => {
  if (!model.id || !canAutoGenerate.value || hasPendingSuggestion.value) return
  clearAutoSuggestionTimer()
  sendingDictation.value = true
  try {
    aiErrorMessage.value = ''
    const api = useApi()
    const formData = new FormData()
    if (cleanedMainComplaint.value) formData.append('transcriptDraft', cleanedMainComplaint.value)
    formData.append('captureSource', latestAudioBlob.value ? 'BROWSER_AUDIO' : 'MANUAL_TEXT')
    formData.append('language', 'pt-BR')
    if (audioDurationSeconds.value) formData.append('audioDurationSeconds', String(audioDurationSeconds.value))
    if (latestAudioBlob.value) formData.append('audioFile', latestAudioBlob.value, latestAudioFileName.value || 'consultation-dictation.webm')

    await api(`/api/v1/consultations/${model.id}/dictations`, { method: 'POST', body: formData })
    aiInputDirty.value = false
    discardAudioCapture()
    if (!silent) message.success('Sugestão automática atualizada')
    await loadDictations()
  } catch (error: any) {
    aiErrorMessage.value = error?.data?.message || 'Erro ao processar'
    message.error(error?.data?.message || 'Erro ao gerar sugestões automáticas')
  } finally {
    sendingDictation.value = false
  }
}

const scheduleAutoSuggestion = (delay = 1100) => {
  clearAutoSuggestionTimer()
  if (!canAutoGenerate.value || hasPendingSuggestion.value || !aiInputDirty.value) return
  autoSuggestionTimer = setTimeout(() => {
    void submitDictation()
  }, delay)
}

const triggerTextImprove = async () => {
  if (!model.id) {
    message.warning('Salve e ative a IA para melhorar o texto.')
    return
  }
  await submitDictation({ silent: false })
}

const syncPollingState = () => {
  const shouldPoll = dictations.value.some((item) => ['PENDING', 'PROCESSING'].includes(item.status))
  if (shouldPoll && !dictationPoller) {
    dictationPoller = setInterval(() => { void loadDictations() }, 4000)
  }
  if (!shouldPoll) stopDictationPolling()
}

const stopDictationPolling = () => {
  if (dictationPoller) {
    clearInterval(dictationPoller)
    dictationPoller = null
  }
}

const applyVisibleSuggestions = () => {
  const payload: DictationStructuredPayload | undefined = visibleSuggestion.value?.structuredPayload
  if (!payload) {
    message.warning('Nenhuma sugestão disponível para aplicar.')
    return
  }

  if (payload.mainComplaint) model.mainComplaint = payload.mainComplaint
  if (payload.clinicalFindings) model.clinicalFindings = payload.clinicalFindings
  if (payload.diagnosis) model.diagnosis = payload.diagnosis
  if (payload.treatmentPlan) model.treatmentPlan = payload.treatmentPlan
  if (payload.notes) model.notes = payload.notes
  if (payload.weightKg != null) model.weightKg = Number(payload.weightKg)
  if (payload.temperatureC != null) model.temperatureC = Number(payload.temperatureC)
  suggestionCards.value.forEach((card) => {
    if (card.value) suggestionStateMap[card.key] = 'Aplicado'
    else suggestionStateMap[card.key] = 'Ignorado'
  })

  message.success('Sugestões aplicadas. Revise antes de salvar.')
}

const reviewSuggestionsOneByOne = () => {
  message.info('Revise os cards e aplique manualmente os dados necessários.')
}

const ignoreLatestSuggestion = () => {
  if (!latestCompletedDictation.value) return
  dismissedSuggestionId.value = latestCompletedDictation.value.id
  suggestionCards.value.forEach((card) => {
    if (card.value) suggestionStateMap[card.key] = 'Ignorado'
  })
}

const applyOrganizedComplaint = () => {
  const payload: DictationStructuredPayload | undefined = visibleSuggestion.value?.structuredPayload
  const organized = payload?.mainComplaint || payload?.summary
  if (!organized) {
    message.warning('Sem texto organizado para aplicar.')
    return
  }
  model.mainComplaint = organized
  message.success('Texto organizado aplicado.')
}

const focusManualEdit = () => {
  message.info('Edite manualmente a queixa no campo acima.')
}

const suggestionTagType = (state: 'Sugerido' | 'Aplicado' | 'Editado' | 'Ignorado') => {
  if (state === 'Aplicado') return 'success'
  if (state === 'Editado') return 'info'
  if (state === 'Ignorado') return 'default'
  return 'warning'
}

const cardValueByKey = (key: string) => {
  const payload: DictationStructuredPayload | undefined = visibleSuggestion.value?.structuredPayload
  if (!payload) return ''
  const contextText = payload.subjective || payload.notes
  const conductText = payload.plan || payload.treatmentPlan
  const map: Record<string, string> = {
    complaint: String(payload.mainComplaint || payload.summary || ''),
    duration: String(contextText || ''),
    findings: String(payload.clinicalFindings || ''),
    feeding: String(contextText || ''),
    hydration: String(contextText || ''),
    elimination: String(contextText || ''),
    meds: String(contextText || ''),
    history: String(payload.assessment || contextText || ''),
    questions: String(conductText || '')
  }
  return map[key] || ''
}

const applySuggestionCard = (card: { key: string; value: string }) => {
  if (!card.value) return
  if (card.key === 'complaint') model.mainComplaint = card.value
  if (card.key === 'findings') model.clinicalFindings = card.value
  if (card.key === 'history' && !model.notes) model.notes = card.value
  if (card.key === 'questions' && !model.treatmentPlan) model.treatmentPlan = card.value
  suggestionStateMap[card.key] = 'Aplicado'
  message.success('Sugestão aplicada.')
}

const editSuggestionCard = (card: { key: string }) => {
  if (card.value) suggestionStateMap[card.key] = 'Editado'
  if (card.key === 'complaint') currentStep.value = 2
  else if (card.key === 'findings') currentStep.value = 4
  else currentStep.value = 4
  message.info('Abra o campo clínico e ajuste manualmente.')
}

const undoSuggestionCard = (card: { key: string }) => {
  suggestionStateMap[card.key] = 'Sugerido'
  message.info('Sugestão voltou para o estado sugerido.')
}

const viewSuggestionCard = (card: { key: string; label: string }) => {
  const value = cardValueByKey(card.key)
  suggestionModalTitle.value = card.label
  suggestionModalContent.value = value
  suggestionModalVisible.value = true
}

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 900px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  await loadLookups()
  await loadConsultationFromRoute()
})

onBeforeUnmount(() => {
  stopRecording()
  cleanupRecordingResources()
  stopDictationPolling()
  clearAutoSuggestionTimer()
  mediaQuery?.removeEventListener('change', updateIsMobile)
})
</script>

<style scoped>
.clinical-page { display: flex; flex-direction: column; gap: 16px; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.eyebrow { margin: 0; text-transform: uppercase; font-size: 12px; color: #64748b; }
h1 { margin: 0; font-size: 34px; line-height: 1.1; }
.subhead { margin: 4px 0 0; color: #475569; font-size: 14px; }
.head-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.save-status { font-size: 12px; color: #64748b; align-self: center; }

.layout { display: grid; grid-template-columns: 240px 1fr 280px; gap: 14px; align-items: start; }
.layout.mobile { grid-template-columns: 1fr; }
.steps-panel, .content-panel, .side-panel { min-width: 0; }
.side-panel { position: sticky; top: 14px; align-self: start; }

.steps-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.step-item {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
}
.step-item.active { border-color: #0f766e; background: #ecfeff; color: #134e4a; box-shadow: inset 0 0 0 1px #0f766e; }
.step-item.done { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
.step-item.locked { opacity: 0.7; cursor: not-allowed; }
.step-index {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
}

.step-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
.ai-card { border-color: #e5e7eb; background: #fff; }
.step-head h3 { margin: 0; font-size: 20px; color: #0f172a; }
.step-head p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
.field-help { margin: 6px 0 0; font-size: 12px; color: #64748b; }
.feedback-note { margin: 10px 0 0; font-size: 12px; color: #0f766e; }

.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.full-row { grid-column: 1 / -1; }
.triage-grid { max-width: 520px; }

.ai-status-row { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.recording-hero {
  border: 1px solid #d7dcff;
  background: #f7f8ff;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.mic-orb {
  width: 68px;
  height: 68px;
  border-radius: 999px;
  border: 1px solid #a5b4fc;
  background: #e9edff;
  color: #3730a3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.mic-icon { width: 30px; height: 30px; }
.mic-orb.recording {
  border-color: #ef4444;
  background: #fee2e2;
  color: #7f1d1d;
}
.recording-meta { flex: 1; min-width: 0; }
.recording-helper { margin: 0; color: #475569; font-size: 13px; line-height: 1.45; }
.recording-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #ef4444;
  animation: pulse-dot 1s ease-in-out infinite;
}
.recording-timer { font-size: 12px; color: #b91c1c; font-weight: 700; }
.recording-cta { min-height: 44px; padding: 0 16px; font-weight: 600; }
.btn-mic-icon { width: 16px; height: 16px; }
.manual-input-box {
  margin-top: 12px;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #fff;
  padding: 10px;
}
.textarea-label { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #334155; }
.muted { font-size: 12px; color: #64748b; }
.inline-actions { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }

.suggestions-summary { margin: 0 0 10px; font-size: 12px; color: #334155; }
.suggestion-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.suggestion-item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; background: #fff; }
.suggestion-item-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.suggestion-label { margin: 0; font-size: 12px; color: #64748b; }
.suggestion-value { margin: 6px 0 0; color: #0f172a; line-height: 1.4; }
.clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.suggestion-actions-inline { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.suggestion-action-btn { min-height: 30px; padding: 0 8px; }
.state-box { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px; color: #475569; }
.responsibility-note { margin: 10px 0 0; font-size: 12px; color: #475569; }
.suggestion-modal { max-width: 640px; }
.suggestion-modal-body { display: flex; flex-direction: column; gap: 8px; }
.suggestion-modal-label { margin: 0; font-size: 12px; color: #64748b; }
.ai-error { margin-top: 10px; }
.comparison-box {
  margin-top: 10px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
  border-radius: 10px;
  padding: 10px;
}
.comparison-box p { margin: 0 0 8px; font-size: 13px; color: #334155; line-height: 1.45; }

.review-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.review-block { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #fff; }
.review-block-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.review-block h4 { margin: 0 0 8px; font-size: 14px; color: #0f172a; }
.review-block p { margin: 0 0 6px; color: #334155; line-height: 1.45; }
.edit-link {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}
.quick-action-card {
  flex: 1;
  min-width: 220px;
  border: 1px solid #dbeafe;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  text-align: left;
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  color: #1e293b;
}
.quick-action-icon { font-size: 16px; line-height: 1; }

.step-nav { margin-top: 10px; display: flex; justify-content: space-between; gap: 8px; }
.mobile-progress { margin-bottom: 10px; }
.mobile-progress p { margin: 0 0 6px; font-size: 12px; color: #64748b; }

.mini-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; }
.mini-card h4 { margin: 0 0 10px; font-size: 15px; }
.mini-card p { margin: 0 0 8px; font-size: 13px; color: #334155; }

:deep(.n-input), :deep(.n-base-selection), :deep(.n-date-picker), :deep(.n-input-number) { min-height: 40px; }

@keyframes pulse-dot {
  0% { opacity: 0.35; }
  50% { opacity: 1; }
  100% { opacity: 0.35; }
}

@media (max-width: 900px) {
  .page-head { flex-direction: column; gap: 10px; }
  .head-actions { width: 100%; justify-content: flex-start; }
  .save-status { width: 100%; }
  .grid, .suggestion-grid { grid-template-columns: 1fr; }
  .review-grid { grid-template-columns: 1fr; }
  .recording-hero { flex-direction: column; align-items: flex-start; }
}
</style>
