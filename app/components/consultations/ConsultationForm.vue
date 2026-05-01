<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
    class="consultation-form"
  >
    <section class="form-block">
      <div class="block-heading">
        <div>
          <p class="block-eyebrow">1. Contexto do atendimento</p>
          <h3>Contexto do atendimento</h3>
          <p class="block-subtitle">
            Identifique o paciente, responsável e profissional da consulta.
          </p>
        </div>
      </div>

      <div class="grid compact-grid">
        <n-form-item
          v-if="appointmentsOptions.length > 0"
          label="Atendimento Relacionado"
          path="appointmentId"
          class="full-row"
        >
          <n-select
            v-model:value="model.appointmentId"
            :options="appointmentsOptions"
            placeholder="Selecione um agendamento anterior, se houver"
            clearable
            @update:value="handleAppointmentChange"
          />
        </n-form-item>

        <n-form-item label="Cliente" path="clientId" required>
          <n-select
            v-model:value="model.clientId"
            :options="clientOptions"
            placeholder="Selecione"
            filterable
            @update:value="handleClientChange"
          />
        </n-form-item>

        <n-form-item label="Paciente" path="petId" required>
          <n-select
            v-model:value="model.petId"
            :options="petOptions"
            placeholder="Selecione"
            :disabled="!model.clientId"
            filterable
          />
        </n-form-item>

        <n-form-item
          label="Veterinário Responsável"
          path="veterinarianId"
          required
        >
          <n-select
            v-model:value="model.veterinarianId"
            :options="veterinarianOptions"
            placeholder="Selecione"
            filterable
          />
        </n-form-item>

        <n-form-item label="Data e Hora" path="visitDate" required>
          <n-date-picker
            v-model:value="model.visitDate"
            type="datetime"
            format="dd/MM/yyyy HH:mm"
            style="width: 100%"
          />
        </n-form-item>
      </div>
    </section>

    <section class="form-block">
      <div class="block-heading">
        <div>
          <p class="block-eyebrow">2. Triagem rápida</p>
          <h3>Sinais iniciais da consulta</h3>
          <p class="block-subtitle block-subtitle-discreet">
            Campos rápidos para ganhar velocidade.
          </p>
        </div>
      </div>

      <div class="grid compact-grid triage-grid">
        <n-form-item label="Peso (kg)" path="weightKg">
          <n-input-number
            v-model:value="model.weightKg"
            :min="0"
            :precision="2"
            placeholder="Ex: 5.5"
            style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="Temperatura (°C)" path="temperatureC">
          <n-input-number
            v-model:value="model.temperatureC"
            :min="0"
            :precision="1"
            placeholder="Ex: 38.5"
            style="width: 100%"
          />
        </n-form-item>
      </div>
      <div class="section-footnote">
        <n-button tertiary size="small" type="info">+ Adicionar sinais vitais</n-button>
      </div>
    </section>

    <section class="form-block ai-assist-block">
      <div class="block-heading">
        <div>
          <p class="block-eyebrow">3. Queixa assistida por IA</p>
          <h3>Queixa assistida por IA</h3>
          <p class="block-subtitle">
            Dite ou escreva a queixa. A IA irá organizar o relato e sugerir campos da anamnese.
          </p>
        </div>
        <n-tag :type="aiStatusTagType" size="small" round>
          {{ aiStatusLabel }}
        </n-tag>
      </div>

      <div
        class="chief-complaint-panel"
        :class="{
          recording: isRecording && !isRecordingPaused,
          paused: isRecordingPaused,
        }"
      >
        <div class="chief-complaint-head">
          <div>
            <p class="field-label">Queixa Principal</p>
            <strong>Descreva a queixa do paciente</strong>
          </div>
          <span class="recording-state">{{ aiStatusLabel }}</span>
        </div>

        <div class="chief-input-shell">
          <n-input
            :value="model.mainComplaint"
            type="textarea"
            class="chief-complaint-input"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="Ex.: tutor relata vômitos há dois dias, apatia e redução do apetite..."
            @update:value="handleChiefComplaintInput"
          />
        </div>
        <div class="ia-actions-row">
          <n-button
            type="info"
            secondary
            :disabled="!model.id || !canUseAudioCapture"
            @click="handleMicrophoneAction"
          >
            {{ isRecording ? "Parar gravação" : "Iniciar ditado" }}
          </n-button>
          <n-button
            tertiary
            type="info"
            :disabled="!model.id || !canAutoGenerate || hasPendingSuggestion"
            @click="triggerTextImprove"
          >
            Melhorar texto com IA
          </n-button>
          <n-button
            v-if="isRecording"
            tertiary
            :title="isRecordingPaused ? 'Retomar gravação' : 'Pausar gravação'"
            @click="toggleRecordingPause"
          >
            {{ isRecordingPaused ? "Retomar" : "Pausar" }}
          </n-button>
        </div>

        <div class="chief-complaint-footer">
          <span class="ai-inline-status" :class="{ live: aiStatusIsLive }">{{ aiHelperText }}</span>
          <div class="chief-meta">
            <span v-if="latestAudioBlob" class="meta-chip">
              {{ audioDurationLabel }}
            </span>
            <button
              v-if="latestAudioBlob"
              type="button"
              class="text-action"
              @click="discardAudioCapture"
            >
              Descartar áudio
            </button>
          </div>
        </div>
      </div>

      <div class="suggestion-panel">
        <div class="suggestion-head">
          <div>
            <p class="block-eyebrow">4. Sugestões da IA para anamnese</p>
            <strong>Sugestões da IA para anamnese</strong>
            <p class="block-subtitle">
              Revise as sugestões antes de salvar no prontuário.
            </p>
          </div>
          <div class="suggestion-actions">
            <n-button tertiary :disabled="!visibleSuggestion?.structuredPayload" @click="reviewSuggestionsOneByOne">
              Revisar uma a uma
            </n-button>
            <n-button tertiary :disabled="!visibleSuggestion?.structuredPayload" @click="ignoreLatestSuggestion">
              Descartar
            </n-button>
            <n-button type="primary" secondary :disabled="!visibleSuggestion?.structuredPayload" @click="applyVisibleSuggestions">
              Aplicar sugestões
            </n-button>
          </div>
        </div>

        <div v-if="model.id && hasPendingSuggestion" class="suggestion-pending">
          <strong>Organizando relato clínico...</strong>
          <p>A IA está estruturando o conteúdo para facilitar sua revisão clínica.</p>
        </div>

        <div v-else-if="visibleSuggestion?.structuredPayload" class="suggestion-grid">
          <article
            v-for="card in suggestionCards"
            :key="card.field"
            class="suggestion-item"
          >
            <div class="suggestion-item-head">
              <span>{{ card.label }}</span>
              <button
                type="button"
                class="text-action"
                :disabled="!card.value"
                @click="applySuggestionField(card.field, card.value, card.kind)"
              >
                Aplicar campo
              </button>
            </div>
            <p>{{ card.value || card.emptyText }}</p>
          </article>
        </div>
        <div v-else class="suggestion-empty">
          <strong>Ainda sem sugestões.</strong>
          <p>Salve os dados básicos para liberar ditado, melhoria da queixa e sugestões automáticas.</p>
        </div>

        <div v-if="visibleSuggestion?.structuredPayload && hasSuggestedMetrics" class="metric-row">
          <button
            v-if="visibleSuggestion.structuredPayload.weightKg != null"
            type="button"
            class="metric-pill"
            @click="
              applySuggestionField(
                'weightKg',
                visibleSuggestion.structuredPayload.weightKg,
                'number',
              )
            "
          >
            Peso sugerido:
            {{ visibleSuggestion.structuredPayload.weightKg }}
          </button>
          <button
            v-if="visibleSuggestion.structuredPayload.temperatureC != null"
            type="button"
            class="metric-pill"
            @click="
              applySuggestionField(
                'temperatureC',
                visibleSuggestion.structuredPayload.temperatureC,
                'number',
              )
            "
          >
            Temperatura sugerida:
            {{ visibleSuggestion.structuredPayload.temperatureC }}
          </button>
        </div>
      </div>
      <p class="responsibility-note">Revise as sugestões antes de salvar no prontuário.</p>

      <div class="block-heading body-divider">
        <div>
          <p class="block-eyebrow">5. Anamnese / detalhes clínicos</p>
          <h3>Anamnese e evolução clínica</h3>
        </div>
      </div>
      <div class="grid compact-grid">
        <n-form-item
          label="Achados Clínicos"
          path="clinicalFindings"
          class="full-row"
        >
          <n-input
            v-model:value="model.clinicalFindings"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder="Exame físico, sintomas avaliados, resposta clínica..."
          />
        </n-form-item>

        <n-form-item label="Diagnóstico" path="diagnosis">
          <n-input
            v-model:value="model.diagnosis"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="Hipótese diagnóstica ou diagnóstico confirmado"
          />
        </n-form-item>

        <n-form-item label="Plano de Tratamento" path="treatmentPlan">
          <n-input
            v-model:value="model.treatmentPlan"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="Medicamentos, orientações, exames, retorno..."
          />
        </n-form-item>

        <n-form-item label="Anotações Privadas" path="notes" class="full-row">
          <n-input
            v-model:value="model.notes"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="Observações internas da equipe"
          />
        </n-form-item>
      </div>

      <details v-if="dictations.length > 1" class="history-panel">
        <summary>Histórico da IA</summary>
        <div class="timeline">
          <div
            v-for="dictation in dictations"
            :key="dictation.id"
            class="timeline-item"
            :data-testid="`dictation-row-${dictation.id}`"
          >
            <div class="timeline-top">
              <strong>Execução #{{ dictation.id }}</strong>
              <n-tag size="small" :type="statusTagType(dictation.status)">
                {{ dictation.status }}
              </n-tag>
            </div>
            <p>
              {{
                dictation.structuredPayload?.summary ||
                dictation.transcriptDraft
              }}
            </p>
          </div>
        </div>
      </details>
    </section>

    <div class="actions">
      <n-button tertiary :disabled="loading" @click="$emit('cancel')">
        Cancelar
      </n-button>
      <n-button tertiary :disabled="loading" @click="handleSubmit">
        Salvar rascunho
      </n-button>
      <n-button v-if="!model.id" type="primary" :loading="loading" @click="handleSubmit">
        Salvar e ativar IA
      </n-button>
      <n-button v-else type="primary" :loading="loading" @click="handleSubmit">
        Salvar atendimento
      </n-button>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import type { FormInst, FormRules } from "naive-ui";
import { useMessage } from "naive-ui";
import { format } from "date-fns";

interface DictationStructuredPayload {
  summary?: string;
  mainComplaint?: string | null;
  clinicalFindings?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  notes?: string | null;
  weightKg?: number | null;
  temperatureC?: number | null;
}

interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  0: {
    transcript: string;
  };
}

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: BrowserSpeechRecognitionResult[];
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type SuggestionField =
  | "mainComplaint"
  | "clinicalFindings"
  | "diagnosis"
  | "treatmentPlan"
  | "notes"
  | "weightKg"
  | "temperatureC";

type SuggestionFieldKind = "string" | "number";

export interface ConsultationPayload {
  id?: number;
  appointmentId?: number | null;
  petId: number | null;
  clientId: number | null;
  veterinarianId: number | null;
  visitDate: number | null;
  weightKg?: number | null;
  temperatureC?: number | null;
  mainComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
}

const props = defineProps<{
  value?: ConsultationPayload | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: ConsultationPayload): void;
  (e: "cancel"): void;
}>();

const MIN_AUTOMATION_LENGTH = 18;

const formRef = ref<FormInst | null>(null);
const message = useMessage();

const clientOptions = ref<{ label: string; value: number }[]>([]);
const petOptions = ref<{ label: string; value: number }[]>([]);
const allPets = ref<any[]>([]);
const veterinarianOptions = ref<{ label: string; value: number }[]>([]);
const appointmentsOptions = ref<{ label: string; value: number; data: any }[]>(
  [],
);

const dictations = ref<any[]>([]);
const dictationsLoading = ref(false);
const sendingDictation = ref(false);
const latestAudioUrl = ref<string | null>(null);
const latestAudioBlob = ref<Blob | null>(null);
const latestAudioFileName = ref<string | null>(null);
const isRecording = ref(false);
const isRecordingPaused = ref(false);
const audioDurationSeconds = ref<number | null>(null);
const recordingStartedAt = ref<number | null>(null);
const dismissedSuggestionId = ref<number | null>(null);
const aiInputDirty = ref(false);

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let speechRecognition: BrowserSpeechRecognition | null = null;
let dictationPoller: ReturnType<typeof setInterval> | null = null;
let autoSuggestionTimer: ReturnType<typeof setTimeout> | null = null;
let audioChunks: Blob[] = [];

const model = reactive<ConsultationPayload>({
  appointmentId: null,
  petId: null,
  clientId: null,
  veterinarianId: null,
  visitDate: Date.now(),
  weightKg: null,
  temperatureC: null,
  mainComplaint: "",
  clinicalFindings: "",
  diagnosis: "",
  treatmentPlan: "",
  notes: "",
});

const rules: FormRules = {
  clientId: {
    type: "number",
    required: true,
    message: "Selecione o cliente",
    trigger: "change",
  },
  petId: {
    type: "number",
    required: true,
    message: "Selecione o pet",
    trigger: "change",
  },
  veterinarianId: {
    type: "number",
    required: true,
    message: "Selecione o veterinário",
    trigger: "change",
  },
  visitDate: {
    type: "number",
    required: true,
    message: "Selecione a data/hora",
    trigger: "change",
  },
};

const latestCompletedDictation = computed(
  () => dictations.value.find((item) => item.status === "COMPLETED") || null,
);

const visibleSuggestion = computed(() => {
  if (!latestCompletedDictation.value) {
    return null;
  }

  if (latestCompletedDictation.value.id === dismissedSuggestionId.value) {
    return null;
  }

  return latestCompletedDictation.value;
});

const canUseAudioCapture = computed(
  () =>
    process.client &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia,
);

const canUseSpeechRecognition = computed(
  () => process.client && !!getSpeechRecognitionCtor(),
);

const hasPendingSuggestion = computed(
  () =>
    sendingDictation.value ||
    dictations.value.some((item) =>
      ["PENDING", "PROCESSING"].includes(item.status),
    ),
);

const cleanedMainComplaint = computed(() =>
  normalizeFreeText(model.mainComplaint || ""),
);

const canAutoGenerate = computed(
  () =>
    Boolean(model.id) &&
    (cleanedMainComplaint.value.length >= MIN_AUTOMATION_LENGTH ||
      !!latestAudioBlob.value),
);

const aiStatusIsLive = computed(
  () => isRecording.value || hasPendingSuggestion.value,
);

const aiStatusLabel = computed(() => {
  if (!model.id) return "IA disponível após salvar";
  if (isRecording.value) return "Ouvindo...";
  if (hasPendingSuggestion.value) return "Organizando relato clínico...";
  if (visibleSuggestion.value?.structuredPayload) return "Sugestão pronta";
  return "IA pronta";
});

const aiStatusTagType = computed<"success" | "warning" | "info">(() => {
  if (!model.id) return "warning";
  if (isRecording.value || hasPendingSuggestion.value) return "info";
  return "success";
});

const audioDurationLabel = computed(() => {
  if (isRecording.value && isRecordingPaused.value) {
    return "Gravação pausada";
  }
  if (isRecording.value) {
    return "Gravando áudio";
  }
  if (!audioDurationSeconds.value) {
    return "Áudio capturado";
  }
  return `Áudio capturado · ${audioDurationSeconds.value}s`;
});

const aiHelperText = computed(() => {
  if (!model.id) {
    return "Salve os dados básicos para liberar ditado, melhoria da queixa e sugestões automáticas.";
  }
  if (isRecording.value && isRecordingPaused.value) {
    return "Gravação pausada. Retome ou finalize para gerar sugestões.";
  }
  if (isRecording.value) {
    return "Clique em parar gravação ao concluir o relato clínico.";
  }
  if (hasPendingSuggestion.value) {
    return "Organizando relato clínico...";
  }
  if (visibleSuggestion.value?.structuredPayload) {
    return "Revise as sugestões antes de salvar no prontuário.";
  }
  if (canUseSpeechRecognition.value) {
    return "Clique em iniciar ditado e descreva a queixa do paciente.";
  }
  return "Digite a queixa principal e use Melhorar texto com IA quando quiser estruturar.";
});

const suggestionCards = computed(() => {
  const payload = visibleSuggestion.value?.structuredPayload;
  if (!payload) {
    return [];
  }

  return [
    {
      field: "mainComplaint" as SuggestionField,
      label: "Queixa organizada",
      value: payload.mainComplaint || payload.summary,
      kind: "string" as SuggestionFieldKind,
      emptyText: "Sem organização automática da queixa ainda.",
    },
    {
      field: "notes" as SuggestionField,
      label: "Duração dos sintomas",
      value: payload.notes,
      kind: "string" as SuggestionFieldKind,
      emptyText: "Sem duração sugerida.",
    },
    {
      field: "clinicalFindings" as SuggestionField,
      label: "Sinais associados",
      value: payload.clinicalFindings,
      kind: "string" as SuggestionFieldKind,
      emptyText: "Sem sugestão automática para este campo.",
    },
    {
      field: "diagnosis" as SuggestionField,
      label: "Diagnóstico provável",
      value: payload.diagnosis,
      kind: "string" as SuggestionFieldKind,
      emptyText: "Sem hipótese diagnóstica sugerida.",
    },
    {
      field: "treatmentPlan" as SuggestionField,
      label: "Perguntas recomendadas",
      value: payload.treatmentPlan,
      kind: "string" as SuggestionFieldKind,
      emptyText: "Sem plano de tratamento sugerido.",
    },
    {
      field: "notes" as SuggestionField,
      label: "Alimentação / eliminação / medicamentos",
      value: payload.notes,
      kind: "string" as SuggestionFieldKind,
      emptyText: "Sem dados adicionais sugeridos.",
    },
  ];
});

const hasSuggestedMetrics = computed(() => {
  const payload = visibleSuggestion.value?.structuredPayload;
  return Boolean(
    payload &&
      (payload.weightKg != null || payload.temperatureC != null),
  );
});

const loadLookups = async () => {
  const api = useApi();
  try {
    const [clientsRes, petsRes, usersRes, apptsRes] = await Promise.all([
      api<any>("/api/v1/clients?limit=500"),
      api<any>("/api/v1/pets?limit=1000"),
      api<any>("/api/v1/users?limit=100"),
      api<any>(
        "/api/v1/appointments?sortBy=startsAt&sortDirection=desc&limit=50",
      ),
    ]);

    clientOptions.value = clientsRes.data.map((item: any) => ({
      label: item.name,
      value: Number(item.id),
    }));
    allPets.value = petsRes.data;
    veterinarianOptions.value = usersRes.data.map((item: any) => ({
      label: item.name,
      value: Number(item.id),
    }));

    appointmentsOptions.value = apptsRes.data.map((item: any) => ({
      label: `Agendamento - ${format(new Date(item.startsAt), "dd/MM/yyyy HH:mm")} - ${item.reason || "Sem motivo"}`,
      value: Number(item.id),
      data: item,
    }));

    updatePetOptions();
  } catch (error) {
    message.error("Erro ao carregar dados auxiliares");
  }
};

const loadDictations = async () => {
  if (!model.id) {
    dictations.value = [];
    stopDictationPolling();
    return;
  }

  dictationsLoading.value = true;
  try {
    const api = useApi();
    const response = await api<any>(
      `/api/v1/consultations/${model.id}/dictations`,
    );
    dictations.value = response.data || [];
    syncPollingState();
  } catch (error) {
    message.error("Erro ao carregar sugestões automáticas");
  } finally {
    dictationsLoading.value = false;
  }
};

const handleClientChange = () => {
  model.petId = null;
  updatePetOptions();
};

const updatePetOptions = () => {
  if (!model.clientId) {
    petOptions.value = [];
    return;
  }
  const filtered = allPets.value.filter(
    (pet) => Number(pet.clientId) === model.clientId,
  );
  petOptions.value = filtered.map((pet) => ({
    label: pet.name,
    value: Number(pet.id),
  }));
};

const handleAppointmentChange = (value: number | null) => {
  if (!value) {
    return;
  }

  const appointment = appointmentsOptions.value.find(
    (item) => item.value === value,
  )?.data;

  if (!appointment) {
    return;
  }

  model.clientId = Number(appointment.clientId);
  updatePetOptions();
  model.petId = Number(appointment.petId);
  if (appointment.veterinarianId) {
    model.veterinarianId = Number(appointment.veterinarianId);
  }
  model.visitDate = new Date(appointment.startsAt).getTime();
  if (appointment.reason && !model.mainComplaint) {
    model.mainComplaint = appointment.reason;
  }
};

const getSpeechRecognitionCtor = (): BrowserSpeechRecognitionCtor | null => {
  if (!process.client) return null;
  const browserWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
  };
  return (
    browserWindow.SpeechRecognition ||
    browserWindow.webkitSpeechRecognition ||
    null
  );
};

const clearAutoSuggestionTimer = () => {
  if (autoSuggestionTimer) {
    clearTimeout(autoSuggestionTimer);
    autoSuggestionTimer = null;
  }
};

const revokeAudioPreview = () => {
  if (latestAudioUrl.value) {
    URL.revokeObjectURL(latestAudioUrl.value);
    latestAudioUrl.value = null;
  }
  latestAudioBlob.value = null;
  latestAudioFileName.value = null;
};

const cleanupRecordingResources = () => {
  if (speechRecognition) {
    speechRecognition.onresult = null;
    speechRecognition.onerror = null;
    speechRecognition.onend = null;
    speechRecognition = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  mediaRecorder = null;
  isRecording.value = false;
  isRecordingPaused.value = false;
};

const startSpeechRecognitionSession = () => {
  const recognitionCtor = getSpeechRecognitionCtor();
  if (!recognitionCtor) {
    return;
  }

  speechRecognition = new recognitionCtor();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = "pt-BR";
  speechRecognition.onresult = (event) => {
    let chunk = "";
    for (
      let index = event.resultIndex;
      index < event.results.length;
      index += 1
    ) {
      const result = event.results[index];
      if (result?.isFinal) {
        chunk += `${result[0]?.transcript || ""} `;
      }
    }

    if (chunk.trim()) {
      handleChiefComplaintInput(
        `${model.mainComplaint || ""} ${chunk}`.replace(/\s+/g, " ").trim(),
      );
    }
  };
  speechRecognition.onerror = () => {
    message.warning(
      "Reconhecimento de fala indisponível. Continue digitando ou finalize o áudio para transcrição no backend.",
    );
  };
  speechRecognition.onend = () => {
    speechRecognition = null;
  };
  speechRecognition.start();
};

const startRecording = async () => {
  if (!canUseAudioCapture.value) {
    message.warning("O navegador atual não suporta captura de áudio");
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    revokeAudioPreview();
    audioDurationSeconds.value = null;
    recordingStartedAt.value = Date.now();

    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, {
        type: mediaRecorder?.mimeType || "audio/webm",
      });
      latestAudioBlob.value = blob;
      latestAudioFileName.value = `consultation-dictation-${Date.now()}.webm`;
      latestAudioUrl.value = URL.createObjectURL(blob);
      if (recordingStartedAt.value) {
        audioDurationSeconds.value = Math.max(
          1,
          Math.round((Date.now() - recordingStartedAt.value) / 1000),
        );
      }
      aiInputDirty.value = true;
      cleanupRecordingResources();
      scheduleAutoSuggestion(250);
    };
    mediaRecorder.start();

    if (canUseSpeechRecognition.value) {
      startSpeechRecognitionSession();
    }

    isRecording.value = true;
    isRecordingPaused.value = false;
  } catch (error) {
    cleanupRecordingResources();
    message.error("Não foi possível acessar o microfone");
  }
};

const stopRecording = () => {
  if (speechRecognition) {
    speechRecognition.stop();
  }
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  } else {
    cleanupRecordingResources();
  }
};

const toggleRecordingPause = () => {
  if (!mediaRecorder) {
    return;
  }

  if (
    mediaRecorder.state === "recording" &&
    typeof mediaRecorder.pause === "function"
  ) {
    mediaRecorder.pause();
    if (speechRecognition) {
      speechRecognition.stop();
    }
    isRecordingPaused.value = true;
    return;
  }

  if (
    mediaRecorder.state === "paused" &&
    typeof mediaRecorder.resume === "function"
  ) {
    mediaRecorder.resume();
    if (!speechRecognition && canUseSpeechRecognition.value) {
      startSpeechRecognitionSession();
    }
    isRecordingPaused.value = false;
  }
};

const handleMicrophoneAction = async () => {
  if (isRecording.value) {
    stopRecording();
    return;
  }

  await startRecording();
};

const triggerTextImprove = async () => {
  if (!model.id) {
    message.warning("Salve e ative a IA para melhorar o texto.");
    return;
  }
  await submitDictation({ silent: false });
};

const discardAudioCapture = () => {
  audioDurationSeconds.value = null;
  revokeAudioPreview();
};

const handleChiefComplaintInput = (value: string) => {
  model.mainComplaint = value;
  aiInputDirty.value = true;
  dismissedSuggestionId.value = null;

  if (!isRecording.value) {
    scheduleAutoSuggestion();
  }
};

const submitDictation = async ({
  silent = true,
}: { silent?: boolean } = {}) => {
  if (!model.id || !canAutoGenerate.value || hasPendingSuggestion.value) {
    return;
  }

  clearAutoSuggestionTimer();
  sendingDictation.value = true;
  try {
    const api = useApi();
    const formData = new FormData();
    if (cleanedMainComplaint.value) {
      formData.append("transcriptDraft", cleanedMainComplaint.value);
    }
    formData.append(
      "captureSource",
      latestAudioBlob.value ? "BROWSER_AUDIO" : "MANUAL_TEXT",
    );
    formData.append("language", "pt-BR");
    if (audioDurationSeconds.value) {
      formData.append(
        "audioDurationSeconds",
        String(audioDurationSeconds.value),
      );
    }
    if (latestAudioBlob.value) {
      formData.append(
        "audioFile",
        latestAudioBlob.value,
        latestAudioFileName.value || "consultation-dictation.webm",
      );
    }

    await api(`/api/v1/consultations/${model.id}/dictations`, {
      method: "POST",
      body: formData,
    });
    aiInputDirty.value = false;
    discardAudioCapture();
    if (!silent) {
      message.success("Sugestão automática atualizada");
    }
    await loadDictations();
  } catch (error: any) {
    message.error(
      error?.data?.message || "Erro ao gerar sugestões automáticas",
    );
  } finally {
    sendingDictation.value = false;
  }
};

const scheduleAutoSuggestion = (delay = 1100) => {
  clearAutoSuggestionTimer();
  if (
    !canAutoGenerate.value ||
    hasPendingSuggestion.value ||
    !aiInputDirty.value
  ) {
    return;
  }

  autoSuggestionTimer = setTimeout(() => {
    void submitDictation();
  }, delay);
};

const syncPollingState = () => {
  const shouldPoll = dictations.value.some((item) =>
    ["PENDING", "PROCESSING"].includes(item.status),
  );

  if (shouldPoll && !dictationPoller) {
    dictationPoller = setInterval(() => {
      void loadDictations();
    }, 4000);
  }

  if (!shouldPoll) {
    stopDictationPolling();
    if (aiInputDirty.value) {
      scheduleAutoSuggestion(250);
    }
  }
};

const stopDictationPolling = () => {
  if (dictationPoller) {
    clearInterval(dictationPoller);
    dictationPoller = null;
  }
};

const applySuggestionField = (
  field: SuggestionField,
  value: string | number | null | undefined,
  kind: SuggestionFieldKind,
) => {
  if (kind === "number") {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return;
    }
    (model[field] as number | null | undefined) = Number(value);
    message.success("Campo atualizado com a sugestão da IA");
    return;
  }

  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return;
  }
  (model[field] as string | undefined) = normalizedValue;
  message.success("Campo atualizado com a sugestão da IA");
};

const applyStructuredPayload = (payload: DictationStructuredPayload) => {
  const appliedFields: string[] = [];

  const applyStringField = (field: SuggestionField, value?: string | null) => {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      return;
    }
    (model[field] as string | undefined) = normalizedValue;
    appliedFields.push(field);
  };

  const applyNumberField = (field: SuggestionField, value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return;
    }
    (model[field] as number | null | undefined) = Number(value);
    appliedFields.push(field);
  };

  applyStringField("mainComplaint", payload.mainComplaint);
  applyStringField("clinicalFindings", payload.clinicalFindings);
  applyStringField("diagnosis", payload.diagnosis);
  applyStringField("treatmentPlan", payload.treatmentPlan);
  applyStringField("notes", payload.notes);
  applyNumberField("weightKg", payload.weightKg);
  applyNumberField("temperatureC", payload.temperatureC);

  if (!appliedFields.length) {
    message.warning("Nenhum campo disponível para aplicar automaticamente");
    return;
  }

  message.success(
    `Sugestões aplicadas em ${appliedFields.length} campo(s). Revise antes de salvar.`,
  );
};

const applyVisibleSuggestions = () => {
  if (!visibleSuggestion.value?.structuredPayload) {
    message.warning("Nenhuma sugestão disponível para aplicar.");
    return;
  }
  applyStructuredPayload(visibleSuggestion.value.structuredPayload);
};

const reviewSuggestionsOneByOne = () => {
  message.info("Use o botão \"Aplicar campo\" em cada bloco para revisar uma a uma.");
};

const ignoreLatestSuggestion = () => {
  if (!latestCompletedDictation.value) {
    return;
  }

  dismissedSuggestionId.value = latestCompletedDictation.value.id;
};

const statusTagType = (status: string) => {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "error";
  if (status === "PROCESSING") return "warning";
  return "default";
};

watch(
  () => props.value,
  async (value) => {
    Object.assign(model, {
      id: value?.id,
      appointmentId: value?.appointmentId ? Number(value.appointmentId) : null,
      clientId: value?.clientId ? Number(value.clientId) : null,
      petId: value?.petId ? Number(value.petId) : null,
      veterinarianId: value?.veterinarianId
        ? Number(value.veterinarianId)
        : null,
      visitDate: value?.visitDate
        ? new Date(value.visitDate).getTime()
        : Date.now(),
      weightKg: value?.weightKg ? Number(value.weightKg) : null,
      temperatureC: value?.temperatureC ? Number(value.temperatureC) : null,
      mainComplaint: value?.mainComplaint ?? "",
      clinicalFindings: value?.clinicalFindings ?? "",
      diagnosis: value?.diagnosis ?? "",
      treatmentPlan: value?.treatmentPlan ?? "",
      notes: value?.notes ?? "",
    });
    dismissedSuggestionId.value = null;
    updatePetOptions();
    await loadDictations();

    const hasAutomationInput =
      normalizeFreeText(value?.mainComplaint ?? "").length >=
        MIN_AUTOMATION_LENGTH || !!latestAudioBlob.value;
    const hasProcessedSuggestion = dictations.value.some((item) =>
      ["PENDING", "PROCESSING", "COMPLETED"].includes(item.status),
    );

    aiInputDirty.value = Boolean(value?.id) && hasAutomationInput;

    if (aiInputDirty.value && !hasProcessedSuggestion) {
      scheduleAutoSuggestion(250);
      return;
    }

    if (!value?.id || hasProcessedSuggestion) {
      aiInputDirty.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => model.id,
  (currentId, previousId) => {
    if (currentId && !previousId && aiInputDirty.value) {
      scheduleAutoSuggestion(250);
    }
  },
);

onMounted(() => {
  void loadLookups();
});

onBeforeUnmount(() => {
  stopRecording();
  cleanupRecordingResources();
  revokeAudioPreview();
  stopDictationPolling();
  clearAutoSuggestionTimer();
});

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    emit("submit", {
      ...model,
      visitDate: model.visitDate
        ? new Date(model.visitDate).toISOString()
        : null,
    });
  } catch (error) {
    // validation handled by form
  }
};

function normalizeFreeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
</script>

<style scoped>
.consultation-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 88px;
}

.form-block {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  padding: 16px 18px;
  background:
    radial-gradient(
      circle at top right,
      rgba(14, 165, 233, 0.08),
      transparent 34%
    ),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.ai-assist-block {
  background:
    radial-gradient(
      circle at top right,
      rgba(99, 102, 241, 0.12),
      transparent 34%
    ),
    linear-gradient(180deg, #ffffff 0%, #f7f8ff 100%);
}

.block-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.block-heading h3 {
  margin: 4px 0 0;
  font-size: 18px;
  line-height: 1.2;
  color: #0f172a;
}

.block-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.45;
}

.block-subtitle-discreet {
  font-size: 12px;
  color: #64748b;
}

.block-eyebrow,
.field-label {
  margin: 0;
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.block-caption {
  font-size: 12px;
  color: #475569;
  line-height: 1.4;
  max-width: 240px;
  text-align: right;
}

.recording-state {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.section-footnote {
  margin-top: 10px;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
}

.compact-grid :deep(.n-form-item) {
  margin-bottom: 0;
}

.full-row {
  grid-column: 1 / -1;
}

.chief-complaint-panel {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  padding: 16px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 18px 40px -32px rgba(15, 23, 42, 0.5);
}

.chief-complaint-panel.recording {
  border-color: rgba(220, 38, 38, 0.38);
  box-shadow: 0 18px 40px -28px rgba(220, 38, 38, 0.2);
}

.chief-complaint-panel.paused {
  border-color: rgba(245, 158, 11, 0.38);
  box-shadow: 0 18px 40px -28px rgba(245, 158, 11, 0.18);
}

.chief-input-shell {
  position: relative;
}

.chief-complaint-head,
.chief-complaint-footer,
.suggestion-head,
.suggestion-item-head,
.timeline-top,
.metric-row,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.chief-actions,
.suggestion-actions,
.chief-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ia-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chief-complaint-input :deep(textarea) {
  font-size: 15px;
  line-height: 1.55;
  min-height: 126px;
}

.icon-action,
.metric-pill,
.text-action {
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
}

.icon-action {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #0f172a;
  color: white;
  font-size: 19px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 160ms ease,
    background 160ms ease,
    opacity 160ms ease;
}

.icon-action.secondary {
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.icon-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.icon-action:not(:disabled):hover {
  transform: translateY(-1px);
}

.ai-inline-status,
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #475569;
}

.ai-inline-status.live {
  color: #0f766e;
  font-weight: 600;
}

.meta-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
}

.text-action {
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
  padding: 0;
}

.text-action:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.suggestion-pending,
.suggestion-empty,
.suggestion-panel {
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.suggestion-pending strong,
.suggestion-empty strong {
  display: block;
  color: #0f172a;
  margin-bottom: 6px;
}

.suggestion-pending p,
.suggestion-empty p {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

.suggestion-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.suggestion-item,
.timeline-item {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 12px;
  background: white;
}

.suggestion-item span {
  display: block;
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.suggestion-item p,
.timeline-item p {
  margin: 8px 0 0;
  line-height: 1.5;
  color: #0f172a;
  white-space: pre-wrap;
}

.metric-row {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.metric-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: #115e59;
  font-size: 12px;
  font-weight: 600;
}

.history-panel {
  border-top: 1px dashed rgba(148, 163, 184, 0.4);
  padding-top: 12px;
}

.history-panel summary {
  cursor: pointer;
  font-weight: 600;
  color: #334155;
}

.timeline {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions {
  justify-content: flex-end;
  margin-top: 10px;
  position: sticky;
  bottom: 0;
  z-index: 15;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, #ffffff 45%);
  border-top: 1px solid rgba(148, 163, 184, 0.24);
  padding-top: 12px;
  padding-bottom: 2px;
}

.responsibility-note {
  margin: 2px 0 4px;
  font-size: 12px;
  color: #475569;
}

.body-divider {
  margin-top: 10px;
}

@media (max-width: 960px) {
  .grid,
  .suggestion-grid {
    grid-template-columns: 1fr;
  }

  .block-heading,
  .chief-complaint-head,
  .chief-complaint-footer,
  .suggestion-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .block-caption {
    max-width: none;
    text-align: left;
  }

  .suggestion-actions,
  .chief-meta,
  .actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .ia-actions-row { width: 100%; }
}
</style>
