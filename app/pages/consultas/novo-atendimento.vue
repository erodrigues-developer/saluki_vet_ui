<template>
  <div class="clinical-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Atendimento</p>
        <h1>Novo atendimento clínico</h1>
        <p class="subhead">Registre a consulta com apoio de IA para conduzir a anamnese por conversa e organizar automaticamente o prontuário.</p>
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
              <n-select v-model:value="model.appointmentId" :options="appointmentsOptions" placeholder="Vincular agendamento, retorno ou atendimento anterior" clearable @update:value="handleAppointmentChange" />
              <template #feedback>
                <span class="field-help">Opcional. Vincule um agendamento anterior para preencher os dados automaticamente.</span>
              </template>
            </n-form-item>
            <n-form-item label="Tutor" required>
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
              <h3>2. Triagem e sinais vitais</h3>
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
            <n-form-item label="Prioridade clínica">
              <n-select v-model:value="model.triageRisk" :options="triageRiskOptions" placeholder="Não triado" />
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
              <h3>3. Anamnese</h3>
              <p>Conduza a conversa com o tutor. A transcrição original é preservada e a IA apresenta a anamnese sugerida em chat para revisão.</p>
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
              <div class="inline-actions">
                <n-button type="info" class="recording-cta" :disabled="(!model.id || !canUseAudioCapture) && !aiHasError" @click="handleMicrophoneAction">
                  <template #icon>
                    <svg viewBox="0 0 24 24" class="btn-mic-icon" aria-hidden="true">
                      <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0a7 7 0 0 1-6 6.92V20h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 11a1 1 0 1 1 2 0a5 5 0 1 0 10 0Z"/>
                    </svg>
                  </template>
                  {{ aiHasError ? 'Tentar novamente' : (isRecording ? 'Parar gravação' : (hasExistingTranscript ? 'Incluir gravação' : 'Iniciar gravação')) }}
                </n-button>
                <n-button v-if="isRecording" tertiary @click="toggleRecordingPause">{{ isRecordingPaused ? 'Retomar' : 'Pausar' }}</n-button>
              </div>
            </div>
          </div>
          <article class="assist-block">
            <p class="suggestion-label">Perguntas recomendadas</p>
            <ul class="missing-list">
              <li v-for="item in recommendedQuestions" :key="item">{{ item }}</li>
            </ul>
          </article>

          <div class="manual-input-box complaint-split">
            <p class="textarea-label">Transcrição original da consulta</p>
            <n-input
              v-model:value="model.originalComplaint"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 8 }"
              :readonly="isOriginalTranscriptReadonly"
              placeholder="Disponível para digitação manual apenas antes da primeira gravação."
              @update:value="onOriginalComplaintChange"
            />
            <div v-if="model.aiOrganizedComplaint" class="accepted-anamnesis-box">
              <div class="accepted-anamnesis-head">
                <div>
                  <p class="textarea-label">Anamnese em uso no prontuário</p>
                  <span>O texto sugerido foi aplicado e pode ser editado livremente pelo veterinário.</span>
                </div>
                <n-tag type="success" size="small" round>Texto utilizado</n-tag>
              </div>
              <n-input
                :value="model.aiOrganizedComplaint"
                type="textarea"
                :autosize="{ minRows: 5, maxRows: 10 }"
                placeholder="Edite a anamnese antes de avançar."
                @update:value="onAiOrganizedComplaintChange"
              />
            </div>
            <div class="inline-actions" v-if="suggestedAnamnesisText && !model.anamnesisApproved">
              <n-button tertiary type="info" @click="openAnamnesisChat">Revisar sugestão da IA</n-button>
            </div>
            <p class="field-help">Texto sugerido: <strong>{{ model.anamnesisApproved ? 'Utilizado no prontuário' : suggestedAnamnesisText ? 'Aguardando revisão no chat' : 'Aguardando IA' }}</strong></p>
          </div>
          <n-alert v-if="aiHasError" type="error" class="ai-error" :show-icon="false">{{ aiErrorMessage || 'Erro ao processar' }}</n-alert>
        </n-card>
        <n-modal v-model:show="suggestionModalVisible" preset="card" class="suggestion-modal" title="Texto completo" :mask-closable="true">
          <div class="suggestion-modal-body">
            <p class="suggestion-modal-label">{{ suggestionModalTitle }}</p>
            <p>{{ suggestionModalContent || 'Sem conteúdo disponível.' }}</p>
          </div>
        </n-modal>
        <n-modal v-model:show="prescriptionModalVisible" preset="card" class="prescription-modal" :mask-closable="false">
          <template #header>
            <div class="modal-head">
              <h3 class="modal-title">Gerar prescrição</h3>
              <p class="modal-subtitle">Revise o texto antes de gerar o documento para impressão.</p>
            </div>
          </template>
          <div class="suggestion-modal-body prescription-modal-body">
            <div class="prescription-sections">
              <section class="prescription-form-section">
                <div class="prescription-section-head">
                  <h4 class="prescription-section-title">Receituário</h4>
                </div>
                <p class="suggestion-modal-label">Texto da prescrição</p>
                <n-input
                  v-model:value="prescriptionDraftContent"
                  type="textarea"
                  :autosize="{ minRows: 8, maxRows: 16 }"
                  placeholder="Digite a prescrição..."
                />
              </section>

              <section class="prescription-form-section">
                <div class="prescription-section-head">
                  <h4 class="prescription-section-title">Orientações</h4>
                </div>
                <p class="prescription-note">
                  Revise dosagem, frequência, via e duração antes de gerar a versão para impressão.
                </p>
              </section>
            </div>
          </div>
          <template #footer>
            <div class="modal-actions">
              <n-button tertiary @click="prescriptionModalVisible = false">Cancelar</n-button>
              <n-button type="primary" :loading="creatingPrescription" @click="confirmGeneratePrescription">
                Gerar e abrir prescrição
              </n-button>
            </div>
          </template>
        </n-modal>
        <n-modal v-model:show="examRequestModalVisible" preset="card" class="prescription-modal" :mask-closable="false">
          <template #header>
            <div class="modal-head">
              <h3 class="modal-title">Solicitar exames</h3>
              <p class="modal-subtitle">Selecione os exames ativos para gerar o pedido de impressão.</p>
            </div>
          </template>
          <div class="suggestion-modal-body prescription-modal-body">
            <div class="prescription-sections">
              <section class="prescription-form-section">
                <div class="prescription-section-head">
                  <h4 class="prescription-section-title">Exames disponíveis</h4>
                  <n-button quaternary type="info" @click="openQuickExamCreateModal">Cadastro rápido de exame</n-button>
                </div>
                <n-input
                  v-model:value="examRequestFilter"
                  placeholder="Filtrar por nome ou categoria"
                  clearable
                  class="exam-filter-input"
                />
                <n-checkbox-group v-model:value="selectedExamTypeIds">
                  <div class="exam-checkbox-list">
                    <label v-for="item in filteredActiveExamTypes" :key="item.id" class="exam-checkbox-item">
                      <n-checkbox :value="item.id">
                        <span class="exam-checkbox-label">
                          <strong>{{ item.name }}</strong>
                          <small>{{ item.examCategory?.name || 'Sem categoria' }}</small>
                        </span>
                      </n-checkbox>
                    </label>
                    <p v-if="!filteredActiveExamTypes.length" class="field-help">Nenhum exame encontrado para o filtro aplicado.</p>
                  </div>
                </n-checkbox-group>
              </section>
              <section class="prescription-form-section">
                <div class="prescription-section-head">
                  <h4 class="prescription-section-title">Observações</h4>
                </div>
                <n-input
                  v-model:value="examRequestNotes"
                  type="textarea"
                  :autosize="{ minRows: 4, maxRows: 8 }"
                  placeholder="Ex.: jejum de 8h; coletar urina por cistocentese."
                />
              </section>
            </div>
          </div>
          <template #footer>
            <div class="modal-actions">
              <n-button tertiary @click="examRequestModalVisible = false">Cancelar</n-button>
              <n-button type="primary" :loading="creatingExamRequest" @click="confirmGenerateExamRequest">
                Gerar pedido e abrir impressão
              </n-button>
            </div>
          </template>
        </n-modal>
        <n-modal v-model:show="quickExamCreateModalVisible" preset="card" class="exam-modal" style="width: 760px" :mask-closable="false">
          <template #header>
            <div class="modal-head">
              <h3 class="modal-title">Novo exame</h3>
              <p class="modal-subtitle">Cadastre um tipo de exame para uso nos atendimentos.</p>
            </div>
          </template>
          <ExamForm ref="quickExamFormRef" :loading="creatingQuickExamType" @submit="handleQuickExamSubmit" />
          <template #footer>
            <div class="modal-actions">
              <n-button tertiary @click="quickExamCreateModalVisible = false">Cancelar</n-button>
              <n-button type="primary" :loading="creatingQuickExamType" @click="confirmQuickExamCreate">Criar exame</n-button>
            </div>
          </template>
        </n-modal>
        <n-modal v-model:show="billingProcedureModalVisible" preset="card" class="billing-procedure-modal" :mask-closable="false">
          <template #header>
            <div class="modal-head">
              <h3 class="modal-title">{{ billingProcedureForm.id ? 'Editar procedimento cobrável' : 'Adicionar procedimento cobrável' }}</h3>
              <p class="modal-subtitle">Esses itens serão levados automaticamente para a venda ao finalizar e cobrar.</p>
            </div>
          </template>
          <div class="suggestion-modal-body prescription-modal-body">
            <div class="prescription-sections">
              <section class="prescription-form-section">
                <div class="grid">
                  <n-form-item label="Procedimento" class="full-row" required>
                    <n-select
                      v-model:value="billingProcedureForm.procedureId"
                      :options="procedureOptions"
                      placeholder="Selecione o procedimento"
                      filterable
                      @update:value="handleBillingProcedureChange"
                    />
                  </n-form-item>
                  <n-form-item label="Quantidade" required>
                    <n-input-number
                      v-model:value="billingProcedureForm.quantity"
                      :min="1"
                      :precision="0"
                      style="width: 100%"
                      @update:value="recalculateBillingProcedureTotal"
                    />
                  </n-form-item>
                  <n-form-item label="Preço unitário" required>
                    <CurrencyInput
                      v-model="billingProcedureForm.unitPrice"
                      @update:model-value="recalculateBillingProcedureTotal"
                    />
                  </n-form-item>
                </div>
                <div class="billing-procedure-total">
                  <span>Total do procedimento</span>
                  <strong>{{ formatCurrency(billingProcedureTotal) }}</strong>
                </div>
              </section>
            </div>
          </div>
          <template #footer>
            <div class="modal-actions">
              <n-button tertiary @click="billingProcedureModalVisible = false">Cancelar</n-button>
              <n-button type="primary" :loading="savingBillingProcedure" @click="submitBillingProcedure">
                {{ billingProcedureForm.id ? 'Salvar procedimento' : 'Adicionar procedimento' }}
              </n-button>
            </div>
          </template>
        </n-modal>

        <n-card v-show="currentStep === 3" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head-row">
              <div class="step-head">
                <h3>4. Diagnóstico e conduta</h3>
                <p>Consolide hipóteses, plano e encaminhamentos.</p>
              </div>
              <n-button v-if="model.consultiveSupportText" tertiary type="info" @click="openClinicalSupportChat">
                Ver apoio clínico da IA
              </n-button>
            </div>
          </template>
          <div class="grid">
            <n-form-item label="Diagnóstico ou hipótese diagnóstica" class="full-row">
              <n-input v-model:value="model.diagnosis" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
            </n-form-item>
            <n-form-item label="Conduta" class="full-row">
              <n-input v-model:value="model.treatmentPlan" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
              <template #feedback>
                <span v-if="treatmentPlanFromAi" class="field-help">Sugestão da IA aplicada. Revise antes de finalizar.</span>
              </template>
            </n-form-item>
            <n-form-item label="Retorno recomendado">
              <n-input v-model:value="clinical.followUp" placeholder="Ex.: retorno em 5 dias" />
            </n-form-item>
            <n-form-item label="Encaminhar para internação">
              <n-switch v-model:value="clinical.referInpatient" />
            </n-form-item>
            <template v-if="clinical.referInpatient">
              <n-form-item label="Box/Leito" required>
                <n-select
                  v-model:value="inpatientReferral.boxId"
                  :options="availableInpatientBoxOptions"
                  placeholder="Selecione um leito disponível"
                  filterable
                />
              </n-form-item>
              <n-form-item label="Motivo clínico" required class="full-row">
                <n-input
                  v-model:value="inpatientReferral.reason"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  placeholder="Ex.: pós-operatório, fluidoterapia, observação neurológica..."
                />
              </n-form-item>
              <n-form-item label="Observações" class="full-row">
                <n-input
                  v-model:value="inpatientReferral.notes"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  placeholder="Anotações iniciais para a equipe de plantão."
                />
              </n-form-item>
            </template>
          </div>
          <div class="inline-actions">
            <button type="button" class="quick-action-card" @click="openPrescriptionPrint">
              <span class="quick-action-icon"><AppIcon name="pill" :size="14" :stroke-width="2" /></span>
              <span><strong>{{ prescriptionActionLabel }}</strong> — {{ prescriptionActionHint }}</span>
            </button>
            <button type="button" class="quick-action-card" @click="openExamRequestPrint">
              <span class="quick-action-icon"><AppIcon name="flask" :size="14" :stroke-width="2" /></span>
              <span><strong>{{ examRequestActionLabel }}</strong> — {{ examRequestActionHint }}</span>
            </button>
          </div>

          <div class="artifact-sections">
            <section class="artifact-section">
              <div class="artifact-section-head">
                <div>
                  <h4>Arquivos do prontuário</h4>
                  <p>Anexe documentos, imagens e arquivos enviados pelo tutor.</p>
                </div>
                <div class="artifact-section-actions">
                  <input
                    ref="consultationFileInputRef"
                    type="file"
                    class="hidden-file-input"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.xls,.xlsx"
                    @change="handleConsultationFileSelected"
                  />
                  <n-button
                    type="primary"
                    secondary
                    :loading="uploadingConsultationAttachment"
                    :disabled="!model.id"
                    @click="openConsultationFilePicker"
                  >
                    Enviar arquivo
                  </n-button>
                </div>
              </div>
              <p v-if="!model.id" class="field-help">Salve a consulta para liberar uploads no prontuário.</p>
              <n-spin :show="consultationAttachmentsLoading">
                <div v-if="!consultationAttachments.length && !consultationAttachmentsLoading" class="artifact-empty">
                  Nenhum arquivo anexado ao prontuário.
                </div>
                <div v-else class="artifact-list">
                  <article v-for="item in consultationAttachments" :key="item.id" class="artifact-item">
                    <div class="artifact-item-copy">
                      <strong>{{ item.originalName }}</strong>
                      <span>{{ formatDate(item.createdAt) }} · {{ formatFileSize(item.fileSize) }}</span>
                      <small v-if="item.notes">{{ item.notes }}</small>
                    </div>
                    <div class="artifact-item-actions">
                      <n-button tertiary size="small" @click="openExternalFile(item.fileUrl)">Abrir</n-button>
                      <n-button
                        tertiary
                        size="small"
                        type="error"
                        :loading="deletingConsultationAttachmentId === item.id"
                        @click="removeConsultationAttachment(item.id)"
                      >
                        Remover
                      </n-button>
                    </div>
                  </article>
                </div>
              </n-spin>
            </section>

            <section class="artifact-section">
              <div class="artifact-section-head">
                <div>
                  <h4>Resultados de exames</h4>
                  <p>Envie laudos e arquivos dos pedidos vinculados a esta consulta.</p>
                </div>
                <input
                  ref="examResultFileInputRef"
                  type="file"
                  class="hidden-file-input"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.xls,.xlsx"
                  @change="handleExamResultFileSelected"
                />
              </div>
              <n-spin :show="examResultsLoading">
                <div v-if="!consultationExamRequests.length && !examResultsLoading" class="artifact-empty">
                  Nenhum pedido de exame gerado para esta consulta.
                </div>
                <div v-else class="exam-request-list">
                  <article v-for="request in consultationExamRequests" :key="request.id" class="exam-request-item">
                    <div class="artifact-item-copy">
                      <strong>{{ request.examType?.name || `Pedido #${request.id}` }}</strong>
                      <span>{{ request.examType?.examCategory?.name || 'Sem categoria' }} · {{ formatDate(request.requestedAt) }}</span>
                      <small>{{ request.notes || 'Sem observações.' }}</small>
                    </div>
                    <div class="artifact-item-actions">
                      <n-tag :bordered="false" round>{{ normalizeExamRequestStatus(request.status) }}</n-tag>
                      <n-button
                        tertiary
                        size="small"
                        :loading="uploadingExamResult && pendingExamRequestIdForUpload === request.id"
                        @click="openExamResultFilePicker(request.id)"
                      >
                        Enviar resultado
                      </n-button>
                    </div>
                  </article>
                </div>

                <div v-if="examResults.length" class="artifact-list">
                  <article v-for="item in examResults" :key="item.id" class="artifact-item">
                    <div class="artifact-item-copy">
                      <strong>{{ item.examRequest?.examType?.name || 'Resultado de exame' }}</strong>
                      <span>{{ formatDate(item.completedAt) }} · {{ item.veterinarian?.name || 'Sem responsável' }}</span>
                      <small>{{ item.originalName || item.notes || 'Resultado textual registrado.' }}</small>
                    </div>
                    <div class="artifact-item-actions">
                      <n-button v-if="item.fileUrl" tertiary size="small" @click="openExternalFile(item.fileUrl)">Abrir</n-button>
                    </div>
                  </article>
                </div>
              </n-spin>
            </section>
          </div>
        </n-card>

        <n-card v-show="currentStep === 4" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head">
              <h3>5. Revisão clínica</h3>
              <p>Revise os dados clínicos antes de avançar para a finalização.</p>
            </div>
          </template>
          <p class="muted">Revise os dados antes de seguir para a etapa final. O atendimento será registrado no prontuário do paciente.</p>
          <n-alert
            v-if="hasPendingAppliedAiBlocks"
            type="warning"
            :show-icon="false"
            class="ai-error"
          >
            Há sugestão de IA pendente. Revise no chat e utilize o texto sugerido antes de finalizar.
          </n-alert>
          <div class="review-grid">
            <section class="review-block">
              <div class="review-block-head"><h4>Paciente</h4><button type="button" class="edit-link" @click="setCurrentStep(0)">Editar</button></div>
              <p><strong>Paciente:</strong> {{ petLabel }}</p>
              <p><strong>Tutor:</strong> {{ clientLabel }}</p>
              <p><strong>Veterinário:</strong> {{ veterinarianLabel }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Relato clínico</h4><button type="button" class="edit-link" @click="setCurrentStep(2)">Editar</button></div>
              <p><strong>Relato original:</strong> {{ model.originalComplaint || 'Ainda não registrado' }}</p>
              <p><strong>Queixa final:</strong> {{ model.mainComplaint || 'Ainda não registrado' }}</p>
              <p><strong>Anamnese organizada:</strong> {{ model.aiOrganizedComplaint || 'Ainda não registrado' }}</p>
              <p><strong>Texto sugerido:</strong> {{ model.anamnesisApproved ? 'Utilizado' : 'Pendente' }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Conduta</h4><button type="button" class="edit-link" @click="setCurrentStep(3)">Editar</button></div>
              <p><strong>Diagnóstico:</strong> {{ model.diagnosis || 'Ainda não registrado' }}</p>
              <p><strong>Conduta:</strong> {{ model.treatmentPlan || 'Ainda não registrado' }}</p>
              <p><strong>Origem da conduta:</strong> {{ treatmentPlanFromAi ? 'IA revisada' : 'Manual' }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Encaminhamentos</h4><button type="button" class="edit-link" @click="setCurrentStep(3)">Editar</button></div>
              <p><strong>Retorno:</strong> {{ clinical.followUp || 'Não definido' }}</p>
              <p><strong>Internação:</strong> {{ clinical.referInpatient ? 'Encaminhar para internação' : 'Sem encaminhamento' }}</p>
              <p v-if="clinical.referInpatient"><strong>Box/Leito:</strong> {{ inpatientBoxLabel || 'Não definido' }}</p>
              <p v-if="clinical.referInpatient"><strong>Motivo clínico:</strong> {{ inpatientReferral.reason || 'Não definido' }}</p>
              <p v-if="clinical.referInpatient"><strong>Observações:</strong> {{ inpatientReferral.notes || 'Não definido' }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Anexos e exames</h4><button type="button" class="edit-link" @click="setCurrentStep(3)">Editar</button></div>
              <p><strong>Arquivos do prontuário:</strong> {{ consultationAttachments.length }}</p>
              <p><strong>Pedidos de exame:</strong> {{ consultationExamRequests.length }}</p>
              <p><strong>Resultados anexados:</strong> {{ examResults.length }}</p>
            </section>
            <section class="review-block">
              <div class="review-block-head"><h4>Cobrança</h4><button type="button" class="edit-link" @click="setCurrentStep(5)">Editar</button></div>
              <p><strong>Procedimentos cobrados:</strong> {{ consultationBillingItems.length }}</p>
              <p><strong>Total previsto:</strong> {{ formatCurrency(consultationBillingTotal) }}</p>
              <p><strong>Status:</strong> {{ consultationBillingItems.length ? 'Itens lançados para cobrança' : 'Sem itens para cobrança' }}</p>
            </section>
          </div>
        </n-card>

        <n-card v-show="currentStep === 5" :bordered="false" class="step-card">
          <template #header>
            <div class="step-head">
              <h3>6. Finalização e cobrança</h3>
              <p>Defina os itens de cobrança e finalize a consulta com um único fluxo.</p>
            </div>
          </template>
          <n-alert
            v-if="canFinalizeAndBill"
            type="info"
            :show-icon="false"
            class="ai-error"
          >
            Esta consulta possui itens para cobrança. Ao finalizar, o sistema irá gerar ou atualizar a venda vinculada e abrir o checkout automaticamente.
          </n-alert>
          <n-alert
            v-else
            type="default"
            :show-icon="false"
            class="ai-error"
          >
            Esta consulta não possui itens para cobrança. Ao finalizar, apenas o prontuário será concluído.
          </n-alert>

          <section class="artifact-section billing-section">
            <div class="artifact-section-head">
              <div>
                <h4>Itens para cobrança</h4>
                <p>Procedimentos realizados na consulta que devem seguir para a venda e o checkout.</p>
              </div>
              <div class="artifact-section-actions">
                <n-button type="primary" secondary @click="openBillingProcedureModal()">Adicionar procedimento</n-button>
              </div>
            </div>
            <p v-if="!model.id" class="field-help">Ao adicionar o primeiro item, a consulta será salva como rascunho para liberar a cobrança.</p>
            <div v-if="!consultationBillingItems.length" class="artifact-empty">
              Nenhum procedimento cobrável lançado nesta consulta.
            </div>
            <div v-else class="billing-list">
              <article v-for="item in consultationBillingItems" :key="item.id" class="artifact-item billing-item">
                <div class="artifact-item-copy">
                  <strong>{{ resolveProcedureLabel(item.procedureId) }}</strong>
                  <span>
                    {{ Number(item.quantity) }} {{ Number(item.quantity) === 1 ? 'unidade' : 'unidades' }}
                    · {{ formatCurrency(item.unitPrice) }} cada
                  </span>
                  <small>Total: {{ formatCurrency(item.totalPrice) }}</small>
                </div>
                <div class="artifact-item-actions">
                  <n-button tertiary size="small" @click="openBillingProcedureModal(item)">Editar</n-button>
                  <n-button
                    tertiary
                    size="small"
                    type="error"
                    :loading="removingBillingProcedureId === item.id"
                    @click="removeBillingProcedure(item.id)"
                  >
                    Remover
                  </n-button>
                </div>
              </article>
            </div>
            <div class="billing-summary-row">
              <span>Total previsto para cobrança</span>
              <strong>{{ formatCurrency(consultationBillingTotal) }}</strong>
            </div>
          </section>

          <div class="review-grid finalization-grid">
            <section class="review-block">
              <div class="review-block-head"><h4>Resumo final</h4><button type="button" class="edit-link" @click="setCurrentStep(4)">Revisar</button></div>
              <p><strong>Paciente:</strong> {{ petLabel }}</p>
              <p><strong>Conduta registrada:</strong> {{ model.treatmentPlan || 'Ainda não registrado' }}</p>
              <p><strong>Total para cobrança:</strong> {{ formatCurrency(consultationBillingTotal) }}</p>
            </section>
          </div>
          <div class="inline-actions">
            <n-button tertiary @click="currentStep = 4">Voltar para revisão</n-button>
            <n-button
              type="primary"
              :loading="saving || finalizingAndBilling || loadingConsultationBillingItems"
              :disabled="hasPendingAppliedAiBlocks"
              @click="finalizeAttendance"
            >
              Finalizar consulta
            </n-button>
          </div>
        </n-card>

        <div v-if="currentStep < steps.length - 1" class="step-nav">
          <n-button :disabled="currentStep === 0" @click="goPrev">Voltar</n-button>
          <n-button type="primary" :loading="saving" :disabled="currentStep === 2 && !model.anamnesisApproved && !suggestedAnamnesisText" @click="saveAndContinue">Salvar e continuar</n-button>
        </div>
      </section>

      <aside v-if="!isMobile" class="side-panel">
        <n-card :bordered="false" class="mini-card">
          <h4>Resumo do paciente</h4>
          <p><strong>Tutor:</strong> {{ clientLabel }}</p>
          <p><strong>Paciente:</strong> {{ petLabel }}</p>
          <p><strong>Veterinário:</strong> {{ veterinarianLabel }}</p>
          <p><strong>Peso:</strong> {{ model.weightKg || 'N/I' }} kg</p>
          <p><strong>Temperatura:</strong> {{ model.temperatureC || 'N/I' }} °C</p>
          <p><strong>Prioridade:</strong> {{ triageRiskLabel(model.triageRisk) }}</p>
          <p><strong>Status IA:</strong> {{ aiStatusLabel }}</p>
        </n-card>
      </aside>
    </div>

    <AiChatFloating
      :show="consultationAiChatVisible"
      launcher
      :is-mobile="isMobile"
      :title="consultationAiTitle"
      :subtitle="consultationAiSubtitle"
      launcher-title="Abrir assistente da consulta"
      :context-line="consultationAiContextLine"
      :context-chips="consultationAiContextChips"
      :messages="consultationConversation.messages.value"
      :loading="consultationConversation.loading.value || savingAnamnesisApproval"
      :question="consultationAiQuestion"
      :placeholder="consultationAiPlaceholder"
      :suggested-questions="consultationAiQuickQuestions"
      :primary-action="consultationAiPrimaryAction"
      @open="openConsultationChat"
      @close="closeConsultationChat"
      @send="sendConsultationAiQuestion"
      @update:question="consultationAiQuestion = $event"
      @select-question="sendConsultationAiQuickQuestion"
      @primary-action="handleConsultationAiPrimaryAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { format } from 'date-fns'
import AiChatFloating from '~/components/ai/AiChatFloating.vue'
import CurrencyInput from '~/components/common/CurrencyInput.vue'
import ExamForm, { type ExamType } from '~/components/exams/ExamForm.vue'
import { useAiConversation } from '~/composables/useAiConversation'

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
  keywords?: string[] | null
}

interface ActiveExamType {
  id: number
  name: string
  examCategoryId?: number | null
  examCategory?: { id: number; name: string } | null
}

interface ConsultationAttachmentRow {
  id: number
  attachmentType: string
  originalName: string
  fileUrl: string
  notes?: string | null
  mimeType: string
  fileSize: number
  createdAt: string
}

interface ExamRequestRow {
  id: number
  status: string
  requestedAt: string
  notes?: string | null
  examType?: {
    name?: string | null
    examCategory?: { name?: string | null } | null
  } | null
}

interface ExamResultRow {
  id: number
  fileUrl?: string | null
  originalName?: string | null
  notes?: string | null
  resultData?: string | null
  completedAt: string
  examRequest?: ExamRequestRow | null
  veterinarian?: { name?: string | null } | null
}

interface ConsultationBillingProcedureRow {
  id: number
  consultationId: number
  procedureId: number
  quantity: number
  unitPrice: number
  totalPrice: number
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
const prescriptionModalVisible = ref(false)
const prescriptionDraftContent = ref('')
const creatingPrescription = ref(false)
const examRequestModalVisible = ref(false)
const creatingExamRequest = ref(false)
const selectedExamTypeIds = ref<number[]>([])
const examRequestNotes = ref('')
const examRequestFilter = ref('')
const hasExistingExamRequest = ref(false)
const activeExamTypes = ref<ActiveExamType[]>([])
const consultationAttachments = ref<ConsultationAttachmentRow[]>([])
const consultationAttachmentsLoading = ref(false)
const uploadingConsultationAttachment = ref(false)
const deletingConsultationAttachmentId = ref<number | null>(null)
const consultationFileInputRef = ref<HTMLInputElement | null>(null)
const consultationExamRequests = ref<ExamRequestRow[]>([])
const examResults = ref<ExamResultRow[]>([])
const examResultsLoading = ref(false)
const uploadingExamResult = ref(false)
const examResultFileInputRef = ref<HTMLInputElement | null>(null)
const pendingExamRequestIdForUpload = ref<number | null>(null)
const availableInpatientBoxOptions = ref<{ label: string; value: number }[]>([])
const quickExamCreateModalVisible = ref(false)
const creatingQuickExamType = ref(false)
const quickExamFormRef = ref<InstanceType<typeof ExamForm> | null>(null)
const linkedInpatientRecordId = ref<number | null>(null)
const savingAnamnesisApproval = ref(false)
const consultationAiChatVisible = ref(false)
const billingProcedureModalVisible = ref(false)
const savingBillingProcedure = ref(false)
const removingBillingProcedureId = ref<number | null>(null)
const loadingConsultationBillingItems = ref(false)
const finalizingAndBilling = ref(false)
const consultationAiQuestion = ref('')
const consultationAiMode = ref<'general' | 'anamnesis' | 'clinical-support'>('general')
const suggestedAnamnesisText = ref('')
const suggestedAnamnesisDictationId = ref<number | null>(null)
const lastOpenedClinicalSupportText = ref('')
const lastOpenedSuggestedAnamnesisText = ref('')
const anamnesisQuickQuestions = [
  'O que falta nessa anamnese?',
  'Reescreva de forma mais objetiva.',
  'Quais perguntas devo fazer ao tutor?',
]
const clinicalSupportQuickQuestions = [
  'Quais hipóteses devo considerar?',
  'Que exames complementares fazem sentido?',
  'Há sinais de alerta?',
]
let mediaQuery: MediaQueryList | null = null
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false }

const steps = [
  { key: 'context', label: 'Paciente e contexto' },
  { key: 'triage', label: 'Triagem e sinais vitais' },
  { key: 'anamnesis', label: 'Anamnese' },
  { key: 'diagnosis', label: 'Conduta clínica' },
  { key: 'review', label: 'Revisão clínica' },
  { key: 'finalization', label: 'Finalização e cobrança' }
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
  triageRisk: null,
  originalComplaint: '',
  aiOrganizedComplaint: '',
  assistedAnamnesisSummary: '',
  anamnesisApproved: false,
  anamnesisApprovedAt: null,
  anamnesisApprovedByUserId: null,
  consultiveSupportText: '',
  consultiveSupportGeneratedAt: null,
  aiReviewAudit: [],
  migratedFromLegacyFlow: false,
  recordStatus: 'DRAFT',
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
const inpatientReferral = reactive({
  boxId: null as number | null,
  reason: '',
  notes: '',
})
const anamnesisAnswers = reactive<Record<string, string>>({
  symptomStart: '',
  symptomEvolution: '',
  feeding24h: '',
  hydrationIntake: '',
  urineAndFeces: '',
  medsGiven: '',
  traumaHistory: '',
  toxicExposure: ''
})

const consultationContextBase = () => ({
  consultationId: model.id,
  petId: model.petId,
  clientId: model.clientId,
  veterinarianId: model.veterinarianId,
  pet: petLabel.value,
  client: clientLabel.value,
  veterinarian: veterinarianLabel.value,
  weightKg: model.weightKg,
  temperatureC: model.temperatureC,
  triageRisk: model.triageRisk,
})

const consultationConversation = useAiConversation({
  contextType: 'consultation',
  contextId: () => model.id || 'draft',
  title: 'Assistente da consulta',
  metadata: () => ({ screen: 'consultation', consultationId: model.id }),
  contextSnapshot: () => ({
    ...consultationContextBase(),
    screen: 'consultation',
    currentStep: currentStep.value + 1,
    mode: consultationAiMode.value,
    originalTranscript: model.originalComplaint,
    suggestedAnamnesis: suggestedAnamnesisText.value,
    currentAnamnesis: model.aiOrganizedComplaint,
    diagnosis: model.diagnosis,
    treatmentPlan: model.treatmentPlan,
    clinicalFindings: model.clinicalFindings,
    consultiveSupportText: model.consultiveSupportText,
    prescription: clinical.prescription,
    exams: clinical.exams,
    followUp: clinical.followUp,
  }),
})

const triageRiskOptions = [
  { label: 'Não triado', value: 'NOT_TRIAGED' },
  { label: 'Verde', value: 'VERDE' },
  { label: 'Amarela', value: 'AMARELA' },
  { label: 'Vermelha', value: 'VERMELHA' },
  { label: 'Emergência', value: 'EMERGENCY' }
]

const normalizeSuggestionText = (value: string) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()

const buildAutomaticMessageKey = (source: string, content: string) => {
  let hash = 5381
  for (const char of String(content || '').trim()) {
    hash = ((hash << 5) + hash) ^ char.charCodeAt(0)
  }
  return `${source}:${model.id || 'draft'}:${(hash >>> 0).toString(36)}`
}

const clientOptions = ref<{ label: string; value: number }[]>([])
const petOptions = ref<{ label: string; value: number }[]>([])
const allPets = ref<any[]>([])
const veterinarianOptions = ref<{ label: string; value: number }[]>([])
const appointmentsOptions = ref<{ label: string; value: number; data: any }[]>([])
const procedureOptions = ref<Array<{ label: string; value: number; defaultPrice: number }>>([])
const consultationBillingItems = ref<ConsultationBillingProcedureRow[]>([])
const hasExistingPrescription = ref(false)

const dictations = ref<any[]>([])
const sendingDictation = ref(false)
const latestAudioBlob = ref<Blob | null>(null)
const latestAudioFileName = ref<string | null>(null)
const isRecording = ref(false)
const isRecordingPaused = ref(false)
const audioDurationSeconds = ref<number | null>(null)
const aiInputDirty = ref(false)
const isHydratingConsultation = ref(false)
const lastSubmittedSuggestionText = ref('')
const dismissedSuggestionId = ref<number | null>(null)
const aiErrorMessage = ref('')
const showOriginalComparison = ref(false)
const suggestionStateMap = reactive<Record<string, 'Sugerido' | 'Aplicado' | 'Editado' | 'Ignorado'>>({})
const blockDecisions = reactive<{ complaint: 'pending' | 'confirmed' | 'edited' | 'discarded'; anamnesis: 'pending' | 'confirmed' | 'edited' | 'discarded' }>({
  complaint: 'pending',
  anamnesis: 'pending'
})
let recordingStartedAt: number | null = null
let mediaRecorder: MediaRecorder | null = null
let mediaStream: MediaStream | null = null
let dictationPoller: ReturnType<typeof setInterval> | null = null
let autoSuggestionTimer: ReturnType<typeof setTimeout> | null = null
let speechRecognition: any = null
let audioChunks: Blob[] = []
let recordingTicker: ReturnType<typeof setInterval> | null = null

const billingProcedureForm = reactive<{
  id: number | null
  procedureId: number | null
  quantity: number
  unitPrice: number
}>({
  id: null,
  procedureId: null,
  quantity: 1,
  unitPrice: 0,
})

const MIN_AUTOMATION_LENGTH = 18
const aiHasError = computed(() => Boolean(aiErrorMessage.value))
const cleanedMainComplaint = computed(() =>
  String(model.originalComplaint || model.mainComplaint || '')
    .replace(/\s+/g, ' ')
    .trim(),
)
const normalizedAutoSuggestionText = computed(() => normalizeSuggestionText(cleanedMainComplaint.value))
const canUseAudioCapture = computed(() => process.client && typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
const hasPendingSuggestion = computed(() => sendingDictation.value || dictations.value.some((item) => ['PENDING', 'PROCESSING'].includes(item.status)))
const canAutoGenerate = computed(() => Boolean(model.id) && (cleanedMainComplaint.value.length >= MIN_AUTOMATION_LENGTH || !!latestAudioBlob.value))
const hasExistingTranscript = computed(() => String(model.originalComplaint || '').trim().length > 0)
const hasPersistedAudio = computed(() => dictations.value.some((item) => Boolean(item.audioFileName)))
const isOriginalTranscriptReadonly = computed(() => hasPersistedAudio.value || isRecording.value || hasPendingSuggestion.value)
const latestCompletedDictation = computed(() => dictations.value.find((item) => item.status === 'COMPLETED') || null)
const visibleSuggestion = computed(() => {
  if (!latestCompletedDictation.value) return null
  if (latestCompletedDictation.value.id === dismissedSuggestionId.value) return null
  return latestCompletedDictation.value
})
const showSuggestionReadyActions = computed(
  () =>
    Boolean(
      String(visibleSuggestion.value?.transcriptFinal || '').trim() ||
        visibleSuggestion.value?.structuredPayload,
    ) &&
    !isRecording.value &&
    !hasPendingSuggestion.value &&
    !aiHasError.value,
)

const aiStatusLabel = computed(() => {
  if (aiHasError.value) return 'Erro ao processar'
  if (isRecording.value) return 'Ouvindo...'
  if (hasPendingSuggestion.value) return 'Organizando relato clínico...'
  if (showSuggestionReadyActions.value) return 'Sugestão pronta'
  return 'Pronto para gravar'
})

const aiStatusTagType = computed<"success" | "warning" | "info" | "error">(() => {
  if (!model.id) return 'info'
  if (aiHasError.value) return 'warning'
  if (isRecording.value) return 'error'
  if (hasPendingSuggestion.value) return 'info'
  if (showSuggestionReadyActions.value) return 'success'
  return 'info'
})

const aiHelperText = computed(() => {
  if (!model.id) return 'Salve os dados do contexto para liberar o ditado com IA.'
  if (aiHasError.value) return 'Erro no processamento do ditado. Tente novamente.'
  if (isRecording.value) return 'Fale naturalmente.'
  if (hasPendingSuggestion.value) return 'A IA está transcrevendo e estruturando a queixa.'
  if (showSuggestionReadyActions.value) return 'Revise a anamnese sugerida no chat e utilize o texto se estiver correto.'
  return 'Dite a conversa da anamnese. A IA irá transcrever e organizar o conteúdo.'
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
const prescriptionActionLabel = computed(() => hasExistingPrescription.value ? 'Abrir prescrição' : 'Gerar prescrição')
const prescriptionActionHint = computed(() =>
  hasExistingPrescription.value
    ? 'Abrir documento de prescrição para impressão.'
    : 'Abrir modal para gerar a prescrição.',
)
const examRequestActionLabel = computed(() => hasExistingExamRequest.value ? 'Abrir pedido de exames' : 'Solicitar exame')
const examRequestActionHint = computed(() =>
  hasExistingExamRequest.value
    ? 'Abrir pedido de exames para impressão.'
    : 'Selecionar exames e gerar pedido para impressão.',
)
const normalizeSearchText = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const filteredActiveExamTypes = computed(() => {
  const query = normalizeSearchText(examRequestFilter.value)
  if (!query) return activeExamTypes.value
  return activeExamTypes.value.filter((item) => {
    const name = normalizeSearchText(item.name)
    const category = normalizeSearchText(item.examCategory?.name)
    return name.includes(query) || category.includes(query)
  })
})

const consultationAiTitle = computed(() => {
  if (consultationAiMode.value === 'anamnesis') return 'Anamnese sugerida pela IA'
  if (consultationAiMode.value === 'clinical-support') return 'Apoio clínico da IA'
  return 'Assistente da consulta'
})
const consultationAiSubtitle = computed(() => {
  if (consultationAiMode.value === 'anamnesis') return 'Revise antes de utilizar no prontuário.'
  if (consultationAiMode.value === 'clinical-support') return 'Consulta auxiliar para o raciocínio clínico.'
  return 'Conversa com histórico persistente da consulta.'
})
const consultationAiContextLine = computed(() => {
  const step = steps[currentStep.value]?.label || 'Consulta'
  return `Consulta em atendimento · ${step}`
})
const consultationAiContextChips = computed(() => {
  if (consultationAiMode.value === 'anamnesis') return ['Anamnese', 'Transcrição', 'Prontuário']
  if (consultationAiMode.value === 'clinical-support') return ['Consultivo', 'Diagnóstico', 'Conduta']
  return ['Consulta', 'Histórico', 'Prontuário']
})
const consultationAiPlaceholder = computed(() => {
  if (consultationAiMode.value === 'anamnesis') return 'Pergunte algo sobre a anamnese sugerida...'
  if (consultationAiMode.value === 'clinical-support') return 'Pergunte algo sobre hipóteses, riscos ou exames...'
  return 'Pergunte algo sobre esta consulta...'
})
const consultationAiQuickQuestions = computed(() => {
  if (consultationAiMode.value === 'anamnesis') return anamnesisQuickQuestions
  if (consultationAiMode.value === 'clinical-support') return clinicalSupportQuickQuestions
  return ['Resuma a consulta até agora.', 'Quais pontos precisam de revisão?', 'O que devo priorizar agora?']
})
const consultationAiPrimaryAction = computed(() => {
  if (consultationAiMode.value !== 'anamnesis') return null
  if (!String(suggestedAnamnesisText.value || '').trim() || model.anamnesisApproved) return null
  return { label: 'Utilizar texto sugerido', disabled: !model.id }
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
const extractedClinicalPoints = computed(() => {
  const payload: DictationStructuredPayload | undefined = visibleSuggestion.value?.structuredPayload
  const keywords = Array.isArray(payload?.keywords) ? payload?.keywords || [] : []
  const base = [payload?.mainComplaint, payload?.clinicalFindings, payload?.assessment]
    .filter(Boolean)
    .join(' ')
    .split(/[.,;:\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8)
    .slice(0, 5)
  return Array.from(new Set([...(keywords || []), ...base])).slice(0, 8)
})
const extractedClinicalSigns = computed(() => {
  const blockedTerms = ['neurologico', 'gastrointestinal', 'oftalmico', 'suspeita']
  return extractedClinicalPoints.value
    .map((item) => String(item || '').trim())
    .filter((item) => item.length >= 3)
    .filter((item) => !blockedTerms.some((term) => item.toLowerCase().includes(term)))
    .slice(0, 8)
})
const extractedClinicalSystems = computed(() => {
  const text = [
    String(model.originalComplaint || ''),
    String(model.aiOrganizedComplaint || ''),
    String(visibleSuggestion.value?.structuredPayload?.assessment || ''),
    String(visibleSuggestion.value?.structuredPayload?.keywords?.join(' ') || '')
  ]
    .join(' ')
    .toLowerCase()
  const systems: string[] = []
  if (/(vomit|vomito|diarre|gastro)/.test(text)) systems.push('Gastrointestinal')
  if (/(ataxia|equilibr|convuls|neurolog)/.test(text)) systems.push('Neurológico')
  if (/(olho|ocular|cegueira|visao|oftalm)/.test(text)) systems.push('Oftálmico')
  if (/(febre|prostr|sistemic)/.test(text)) systems.push('Sistêmico')
  return systems
})
const missingClinicalData = computed(() => {
  const missing: string[] = []
  const source = String(model.originalComplaint || model.aiOrganizedComplaint || '').toLowerCase()
  if (!String(anamnesisAnswers.symptomStart || '').trim()) missing.push('Início e duração dos sintomas')
  if (!String(anamnesisAnswers.symptomEvolution || '').trim()) missing.push('Evolução dos sintomas')
  if (/vomit|vomito/.test(source) && !String(anamnesisAnswers.symptomEvolution || '').trim()) missing.push('Frequência e aspecto dos vômitos')
  if (!String(anamnesisAnswers.feeding24h || '').trim()) missing.push('Alimentação nas últimas 24h')
  if (!String(anamnesisAnswers.hydrationIntake || '').trim()) missing.push('Ingestão de água')
  if (!String(anamnesisAnswers.urineAndFeces || '').trim()) missing.push('Urina e fezes')
  if (!String(anamnesisAnswers.medsGiven || '').trim()) missing.push('Medicamentos administrados')
  if (/ataxia|locomo|equilibr|olho|cegueira/.test(source) && !String(anamnesisAnswers.traumaHistory || '').trim()) missing.push('Histórico de trauma/queda')
  if (!String(anamnesisAnswers.toxicExposure || '').trim()) missing.push('Contato com tóxicos')
  if (!String(clinical.followUp || '').trim()) missing.push('Retorno recomendado')
  return Array.from(new Set(missing))
})
const anamnesisMissingFields = computed(() => {
  const source = String(model.originalComplaint || model.aiOrganizedComplaint || '').toLowerCase()
  const fields: Array<{ key: string; label: string; placeholder: string }> = [
    { key: 'symptomStart', label: 'Início dos sintomas', placeholder: 'Ex.: começou ontem à noite.' },
    { key: 'symptomEvolution', label: 'Evolução dos sintomas', placeholder: 'Ex.: piorou durante a madrugada.' },
    { key: 'feeding24h', label: 'Alimentação nas últimas 24h', placeholder: 'Ex.: não come desde ontem.' },
    { key: 'hydrationIntake', label: 'Ingestão de água', placeholder: 'Ex.: bebendo pouca água.' },
    { key: 'urineAndFeces', label: 'Urina e fezes', placeholder: 'Ex.: urinou pouco e sem evacuação hoje.' },
    { key: 'medsGiven', label: 'Medicamentos administrados', placeholder: 'Ex.: tutor nega medicação prévia.' }
  ]
  if (/ataxia|locomo|equilibr|olho|cegueira/.test(source)) {
    fields.push({ key: 'traumaHistory', label: 'Histórico de trauma/queda', placeholder: 'Ex.: tutor nega queda ou atropelamento.' })
  }
  fields.push({ key: 'toxicExposure', label: 'Contato com tóxicos', placeholder: 'Ex.: sem contato conhecido com venenos/químicos.' })
  return fields
})
const recommendedQuestions = computed(() => {
  return [
    'Qual o motivo da consulta?',
    'Quando os sintomas começaram?',
    'Como os sintomas evoluíram desde o início?',
    'Está se alimentando normalmente?',
    'Está bebendo água normalmente?',
    'Está urinando e defecando normalmente?',
    'Teve contato com tóxicos, produto químico ou alimento diferente?'
  ]
})
const treatmentPlanFromAi = computed(() => {
  const aiText = String(visibleSuggestion.value?.structuredPayload?.treatmentPlan || visibleSuggestion.value?.structuredPayload?.plan || '').trim().toLowerCase()
  const current = String(model.treatmentPlan || '').trim().toLowerCase()
  return Boolean(aiText && current && current.includes(aiText.slice(0, Math.min(30, aiText.length))))
})
const hasPendingAppliedAiBlocks = computed(() => {
  return Boolean(String(suggestedAnamnesisText.value || model.aiOrganizedComplaint || '').trim().length > 0 && !model.anamnesisApproved)
})
const triageRiskLabel = (value: string | null | undefined) => {
  const code = String(value || 'NOT_TRIAGED').toUpperCase()
  if (code === 'VERDE') return 'Verde'
  if (code === 'AMARELA') return 'Amarela'
  if (code === 'VERMELHA') return 'Vermelha'
  if (code === 'EMERGENCY') return 'Emergência'
  return 'Não triado'
}

const clientLabel = computed(() => clientOptions.value.find((c) => c.value === model.clientId)?.label || 'Não informado')
const petLabel = computed(() => petOptions.value.find((p) => p.value === model.petId)?.label || 'Não informado')
const veterinarianLabel = computed(() => veterinarianOptions.value.find((v) => v.value === model.veterinarianId)?.label || 'Não informado')
const inpatientBoxLabel = computed(() => availableInpatientBoxOptions.value.find((item) => item.value === inpatientReferral.boxId)?.label || '')
const isExistingConsultation = computed(() => Boolean(model.id))
const hasBillableConsultationItems = computed(() =>
  consultationBillingItems.value.some((item) =>
    Number(item.quantity || 0) > 0 && Number(item.totalPrice || 0) > 0,
  ),
)
const consultationBillingTotal = computed(() =>
  consultationBillingItems.value.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0)
    const totalPrice = Number(item.totalPrice || 0)
    if (quantity <= 0 || totalPrice <= 0) return sum
    return sum + totalPrice
  }, 0),
)
const billingProcedureTotal = computed(() =>
  Math.max(
    0,
    Number(billingProcedureForm.quantity || 0) * Number(billingProcedureForm.unitPrice || 0),
  ),
)
const canFinalizeAndBill = computed(
  () => hasBillableConsultationItems.value && consultationBillingTotal.value > 0,
)
const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))

const loadLookups = async () => {
  const api = useApi()
  try {
    const [clientsRes, petsRes, usersRes, apptsRes, boxesRes, proceduresRes] = await Promise.all([
      api<any>('/api/v1/clients?limit=500'),
      api<any>('/api/v1/pets?limit=1000'),
      api<any>('/api/v1/users?limit=100'),
      api<any>('/api/v1/appointments?sortBy=startsAt&sortDirection=desc&limit=50'),
      api<any>('/api/v1/boxes?isActive=true'),
      api<any>('/api/v1/procedures?limit=500'),
    ])

    clientOptions.value = clientsRes.data.map((item: any) => ({ label: item.name, value: Number(item.id) }))
    allPets.value = petsRes.data
    veterinarianOptions.value = usersRes.data.map((item: any) => ({ label: item.name, value: Number(item.id) }))
    appointmentsOptions.value = apptsRes.data.map((item: any) => ({
      label: `Agendamento - ${format(new Date(item.startsAt), 'dd/MM/yyyy HH:mm')} - ${item.reason || 'Sem motivo'}`,
      value: Number(item.id),
      data: item
    }))
    const boxes = Array.isArray(boxesRes?.data) ? boxesRes.data : []
    availableInpatientBoxOptions.value = boxes
      .filter((item: any) => !item.currentInpatient)
      .map((item: any) => ({ label: item.name, value: Number(item.id) }))
    procedureOptions.value = (proceduresRes.data || [])
      .filter((item: any) => item.isActive !== false)
      .map((item: any) => ({
        label: item.name,
        value: Number(item.id),
        defaultPrice: Number(item.defaultPrice || 0),
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

const readQueryNumber = (key: string) => {
  const raw = Array.isArray(route.query[key]) ? route.query[key][0] : route.query[key]
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const resolveInitialStepFromModel = () => {
  const hasAnamnesis = String(model.aiOrganizedComplaint || model.originalComplaint || '').trim().length > 0
  const hasDiagnosis = String(model.diagnosis || '').trim().length > 0 || String(model.treatmentPlan || '').trim().length > 0

  if (!hasAnamnesis) return 2
  if (hasAnamnesis && !hasDiagnosis) return 3
  if (model.recordStatus === 'FINALIZED') return 5
  return 4
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
  const hasAnamnesis = hasAnyText(model.aiOrganizedComplaint) || hasAnyText(model.originalComplaint)
  const hasConduct = [
    model.diagnosis,
    model.treatmentPlan,
    clinical.prescription,
    clinical.exams,
    clinical.followUp
  ].some(hasAnyText) || clinical.referInpatient

  if (hasCoreContext) done.add(0)
  if (hasTriage) done.add(1)
  if (hasComplaint || hasAnamnesis) done.add(2)
  if (hasConduct) done.add(3)
  if (hasCoreContext && (hasComplaint || hasAnamnesis) && hasConduct) done.add(4)
  if (String(model.recordStatus || '').toUpperCase() === 'FINALIZED') done.add(5)

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
  inpatientReferral.boxId = Number(getLineValue('Box/Leito internação ID') || 0) || null
  inpatientReferral.reason = getLineValue('Motivo internação')
  inpatientReferral.notes = getLineValue('Observações internação')
  anamnesisAnswers.symptomStart = getLineValue('Anamnese - Início dos sintomas')
  anamnesisAnswers.symptomEvolution = getLineValue('Anamnese - Evolução dos sintomas')
  anamnesisAnswers.feeding24h = getLineValue('Anamnese - Alimentação 24h')
  anamnesisAnswers.hydrationIntake = getLineValue('Anamnese - Ingestão de água')
  anamnesisAnswers.urineAndFeces = getLineValue('Anamnese - Urina e fezes')
  anamnesisAnswers.medsGiven = getLineValue('Anamnese - Medicamentos')
  anamnesisAnswers.traumaHistory = getLineValue('Anamnese - Trauma/queda')
  anamnesisAnswers.toxicExposure = getLineValue('Anamnese - Contato com tóxicos')
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
    isHydratingConsultation.value = true
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
    const auditList = Array.isArray(consultation.aiReviewAudit) ? consultation.aiReviewAudit : []
    const anamnesisAudit = auditList.find((item: any) => item?.blockType === 'anamnesis')
    model.anamnesisApproved = Boolean(
      consultation.anamnesisApproved || anamnesisAudit?.action === 'confirmed',
    )
    updatePetOptions()
    hydrateClinicalNotesFromModel()
    await loadDictations()
    await loadConsultationBillingItems()

    const requestedStep = normalizeStepIndex(Array.isArray(route.query.step) ? route.query.step[0] : route.query.step)
    currentStep.value = requestedStep ?? resolveInitialStepFromModel()
    hydrateCompletedStepsFromModel(currentStep.value)
    aiInputDirty.value = false
    if (!lastSubmittedSuggestionText.value) {
      lastSubmittedSuggestionText.value = normalizeSuggestionText(model.originalComplaint || model.mainComplaint)
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar atendimento clínico')
  } finally {
    isHydratingConsultation.value = false
  }
}

const loadConsultationBillingItems = async () => {
  if (!model.id) {
    consultationBillingItems.value = []
    return
  }

  loadingConsultationBillingItems.value = true
  try {
    const api = useApi()
    const rows = await api<any[]>(`/api/v1/consultation-procedures/consultation/${model.id}`)
    consultationBillingItems.value = (Array.isArray(rows) ? rows : []).map((item: any) => ({
      id: Number(item.id),
      consultationId: Number(item.consultationId),
      procedureId: Number(item.procedureId),
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      totalPrice: Number(item.totalPrice || 0),
    }))
  } catch (_error) {
    message.error('Não foi possível carregar os procedimentos cobrados.')
  } finally {
    loadingConsultationBillingItems.value = false
  }
}

const applySchedulingContextFromRoute = () => {
  const appointmentId = readQueryNumber('appointmentId')
  const clientId = readQueryNumber('clientId')
  const petId = readQueryNumber('petId')
  const veterinarianId = readQueryNumber('veterinarianId')

  if (!appointmentId && !clientId && !petId && !veterinarianId) return

  if (appointmentId) {
    model.appointmentId = appointmentId
    handleAppointmentChange(appointmentId)
  }

  if (clientId) {
    model.clientId = clientId
    updatePetOptions()
  }

  if (petId) model.petId = petId
  if (veterinarianId) model.veterinarianId = veterinarianId

  appointmentPrefilledFeedback.value = true
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
  if (appointment.reason && !model.originalComplaint) model.originalComplaint = appointment.reason
  if (appointment.reason && !model.mainComplaint) model.mainComplaint = appointment.reason
  appointmentPrefilledFeedback.value = true
}

const validateCore = () => {
  if (!model.clientId || !model.petId || !model.veterinarianId || !model.visitDate) {
    message.warning('Preencha tutor, paciente, veterinário e data/hora.')
    return false
  }
  return true
}

const resetBillingProcedureForm = () => {
  billingProcedureForm.id = null
  billingProcedureForm.procedureId = null
  billingProcedureForm.quantity = 1
  billingProcedureForm.unitPrice = 0
}

const recalculateBillingProcedureTotal = () => {
  billingProcedureForm.quantity = Math.max(1, Number(billingProcedureForm.quantity || 1))
  billingProcedureForm.unitPrice = Math.max(0, Number(billingProcedureForm.unitPrice || 0))
}

const resolveProcedureLabel = (procedureId?: number | null) =>
  procedureOptions.value.find((item) => Number(item.value) === Number(procedureId))?.label || `Procedimento #${procedureId || '-'}`

const handleBillingProcedureChange = (procedureId: number | null) => {
  if (!procedureId) return
  const selected = procedureOptions.value.find((item) => Number(item.value) === Number(procedureId))
  if (!selected) return
  if (!billingProcedureForm.id) {
    billingProcedureForm.unitPrice = Number(selected.defaultPrice || 0)
  }
  recalculateBillingProcedureTotal()
}

const ensureConsultationDraftForBilling = async () => {
  if (model.id) return true
  const ok = await persist()
  if (!ok || !model.id) return false
  await loadConsultationBillingItems()
  return true
}

const syncConsultationBillingItems = async () => {
  const ready = await ensureConsultationDraftForBilling()
  if (!ready) return false
  await loadConsultationBillingItems()
  return true
}

const openBillingProcedureModal = async (item?: ConsultationBillingProcedureRow) => {
  const ready = await ensureConsultationDraftForBilling()
  if (!ready) return

  if (item) {
    billingProcedureForm.id = Number(item.id)
    billingProcedureForm.procedureId = Number(item.procedureId)
    billingProcedureForm.quantity = Number(item.quantity || 1)
    billingProcedureForm.unitPrice = Number(item.unitPrice || 0)
  } else {
    resetBillingProcedureForm()
  }

  billingProcedureModalVisible.value = true
}

const submitBillingProcedure = async () => {
  if (!model.id) return
  if (!billingProcedureForm.procedureId) {
    message.warning('Selecione o procedimento a cobrar.')
    return
  }

  recalculateBillingProcedureTotal()
  if (billingProcedureTotal.value <= 0) {
    message.warning('Informe um valor válido para o procedimento.')
    return
  }

  savingBillingProcedure.value = true
  try {
    const api = useApi()
    const body = {
      consultationId: model.id,
      procedureId: billingProcedureForm.procedureId,
      quantity: Number(billingProcedureForm.quantity || 1),
      unitPrice: Number(billingProcedureForm.unitPrice || 0),
      totalPrice: Number(billingProcedureTotal.value || 0),
    }

    if (billingProcedureForm.id) {
      await api(`/api/v1/consultation-procedures/${billingProcedureForm.id}`, {
        method: 'PATCH',
        body,
      })
    } else {
      await api('/api/v1/consultation-procedures', {
        method: 'POST',
        body,
      })
    }

    billingProcedureModalVisible.value = false
    resetBillingProcedureForm()
    await loadConsultationBillingItems()
    message.success('Procedimento de cobrança salvo com sucesso.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao salvar procedimento de cobrança.')
  } finally {
    savingBillingProcedure.value = false
  }
}

const removeBillingProcedure = async (id: number) => {
  removingBillingProcedureId.value = id
  try {
    const api = useApi()
    await api(`/api/v1/consultation-procedures/${id}`, { method: 'DELETE' })
    await loadConsultationBillingItems()
    message.success('Procedimento removido da cobrança.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao remover procedimento de cobrança.')
  } finally {
    removingBillingProcedureId.value = null
  }
}

const validateInpatientReferral = () => {
  if (!clinical.referInpatient) return true
  if (!inpatientReferral.boxId) {
    message.warning('Selecione o box/leito para encaminhar para internação.')
    currentStep.value = 3
    return false
  }
  if (!String(inpatientReferral.reason || '').trim()) {
    message.warning('Informe o motivo clínico da internação.')
    currentStep.value = 3
    return false
  }
  return true
}

const blockDecisionLabel = (value: 'pending' | 'confirmed' | 'edited' | 'discarded') => {
  if (value === 'confirmed') return 'Confirmado'
  if (value === 'edited') return 'Editado'
  if (value === 'discarded') return 'Descartado'
  return 'Pendente'
}

const validatedStateLabel = (value: 'pending' | 'confirmed' | 'edited' | 'discarded') => {
  if (value === 'confirmed') return 'confirmada'
  if (value === 'edited') return 'editada'
  if (value === 'discarded') return 'descartada'
  return 'pendente'
}

const confirmComplaintBlock = () => {
  model.mainComplaint = String(model.aiOrganizedComplaint || model.mainComplaint || model.originalComplaint || '').trim()
  blockDecisions.complaint = model.aiOrganizedComplaint ? 'confirmed' : 'edited'
  message.success('Bloco de queixa confirmado.')
}

const discardComplaintBlock = () => {
  model.aiOrganizedComplaint = ''
  if (String(model.originalComplaint || '').trim()) model.mainComplaint = model.originalComplaint
  blockDecisions.complaint = 'discarded'
  message.info('Sugestão de queixa da IA descartada.')
}

const confirmAnamnesisBlock = () => {
  model.clinicalFindings = String(model.assistedAnamnesisSummary || model.clinicalFindings || '').trim()
  blockDecisions.anamnesis = model.assistedAnamnesisSummary ? 'confirmed' : 'edited'
  message.success('Resumo de anamnese confirmado.')
}

const markAnamnesisAsEdited = () => {
  if (blockDecisions.anamnesis !== 'confirmed') blockDecisions.anamnesis = 'edited'
}

const refreshAnamnesisSummaryFromAnswers = () => {
  const source = String(model.assistedAnamnesisSummary || '').trim()
  const segments = [
    source,
    anamnesisAnswers.symptomStart ? `Início: ${anamnesisAnswers.symptomStart}.` : '',
    anamnesisAnswers.symptomEvolution ? `Evolução: ${anamnesisAnswers.symptomEvolution}.` : '',
    anamnesisAnswers.feeding24h ? `Alimentação: ${anamnesisAnswers.feeding24h}.` : '',
    anamnesisAnswers.hydrationIntake ? `Ingestão hídrica: ${anamnesisAnswers.hydrationIntake}.` : '',
    anamnesisAnswers.urineAndFeces ? `Urina/fezes: ${anamnesisAnswers.urineAndFeces}.` : '',
    anamnesisAnswers.medsGiven ? `Medicamentos prévios: ${anamnesisAnswers.medsGiven}.` : '',
    anamnesisAnswers.traumaHistory ? `Trauma/queda: ${anamnesisAnswers.traumaHistory}.` : '',
    anamnesisAnswers.toxicExposure ? `Contato com tóxicos: ${anamnesisAnswers.toxicExposure}.` : ''
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!segments) {
    message.warning('Preencha ao menos uma resposta de anamnese para atualizar o resumo.')
    return
  }
  model.assistedAnamnesisSummary = segments
  model.clinicalFindings = segments
  blockDecisions.anamnesis = 'edited'
  message.success('Resumo da anamnese atualizado com as respostas coletadas.')
}

const discardAnamnesisBlock = () => {
  model.assistedAnamnesisSummary = ''
  blockDecisions.anamnesis = 'discarded'
  message.info('Resumo assistido da anamnese descartado.')
}

const buildAiReviewAudit = () => {
  const now = new Date().toISOString()
  return [
    {
      blockType: 'anamnesis',
      aiSuggestedText: String(model.aiOrganizedComplaint || '').trim() || null,
      finalText: String(model.mainComplaint || '').trim() || null,
      action: model.anamnesisApproved ? 'confirmed' : 'pending',
      timestamp: now
    }
  ]
}

const syncExtraNotes = () => {
  const unmanagedNotes = String(model.notes || '')
    .split('\n')
    .filter((line) =>
      !/^Prescrição:/i.test(line) &&
      !/^Exames:/i.test(line) &&
      !/^Retorno:/i.test(line) &&
      !/^Encaminhar para internação:/i.test(line) &&
      !/^Box\/Leito internação:/i.test(line) &&
      !/^Box\/Leito internação ID:/i.test(line) &&
      !/^Motivo internação:/i.test(line) &&
      !/^Observações internação:/i.test(line) &&
      !/^Prioridade clínica:/i.test(line) &&
      !/^Anamnese - /i.test(line),
    )
    .join('\n')
    .trim()

  const lines = [
    clinical.prescription ? `Prescrição: ${clinical.prescription}` : '',
    clinical.exams ? `Exames: ${clinical.exams}` : '',
    clinical.followUp ? `Retorno: ${clinical.followUp}` : '',
    clinical.referInpatient ? 'Encaminhar para internação: Sim' : '',
    clinical.referInpatient && inpatientBoxLabel.value ? `Box/Leito internação: ${inpatientBoxLabel.value}` : '',
    clinical.referInpatient && inpatientReferral.boxId ? `Box/Leito internação ID: ${inpatientReferral.boxId}` : '',
    clinical.referInpatient && inpatientReferral.reason ? `Motivo internação: ${inpatientReferral.reason}` : '',
    clinical.referInpatient && inpatientReferral.notes ? `Observações internação: ${inpatientReferral.notes}` : '',
    model.triageRisk && model.triageRisk !== 'NOT_TRIAGED' ? `Prioridade clínica: ${triageRiskLabel(model.triageRisk)}` : '',
    anamnesisAnswers.symptomStart ? `Anamnese - Início dos sintomas: ${anamnesisAnswers.symptomStart}` : '',
    anamnesisAnswers.symptomEvolution ? `Anamnese - Evolução dos sintomas: ${anamnesisAnswers.symptomEvolution}` : '',
    anamnesisAnswers.feeding24h ? `Anamnese - Alimentação 24h: ${anamnesisAnswers.feeding24h}` : '',
    anamnesisAnswers.hydrationIntake ? `Anamnese - Ingestão de água: ${anamnesisAnswers.hydrationIntake}` : '',
    anamnesisAnswers.urineAndFeces ? `Anamnese - Urina e fezes: ${anamnesisAnswers.urineAndFeces}` : '',
    anamnesisAnswers.medsGiven ? `Anamnese - Medicamentos: ${anamnesisAnswers.medsGiven}` : '',
    anamnesisAnswers.traumaHistory ? `Anamnese - Trauma/queda: ${anamnesisAnswers.traumaHistory}` : '',
    anamnesisAnswers.toxicExposure ? `Anamnese - Contato com tóxicos: ${anamnesisAnswers.toxicExposure}` : ''
  ].filter(Boolean)

  model.notes = [unmanagedNotes, ...lines].filter(Boolean).join('\n')
  model.aiReviewAudit = buildAiReviewAudit()
}

const persist = async ({ finalize = false }: { finalize?: boolean } = {}) => {
  if (!validateCore()) return false
  if (!validateInpatientReferral()) return false
  if (finalize) {
    const hasComplaint = String(model.aiOrganizedComplaint || model.originalComplaint || '').trim().length > 0
    const hasClinical = String(model.treatmentPlan || model.notes || '').trim().length > 0
    if (!hasComplaint) {
      message.warning('Informe a queixa principal ou relato clínico antes de finalizar.')
      currentStep.value = 2
      return false
    }
    if (!hasClinical) {
      message.warning('Informe a conduta clínica antes de finalizar.')
      currentStep.value = 3
      return false
    }
    if (String(model.aiOrganizedComplaint || '').trim() && !model.anamnesisApproved) {
      message.warning('Utilize ou revise o texto sugerido antes de finalizar o atendimento.')
      currentStep.value = 2
      return false
    }
  }
  syncExtraNotes()

  saveStatus.value = 'saving'
  saving.value = true
  const api = useApi()
  try {
    const payload = {
      ...model,
      visitDate: model.visitDate ? new Date(model.visitDate).toISOString() : null,
      recordStatus: finalize ? 'FINALIZED' : 'DRAFT'
    }

    if (model.id) {
      const endpoint = finalize ? `/api/v1/consultations/${model.id}/finalize` : `/api/v1/consultations/${model.id}`
      const method = finalize ? 'POST' : 'PATCH'
      const updated = await api<any>(endpoint, { method, body: payload })
      Object.assign(model, updated)
    } else {
      const created = await api<any>('/api/v1/consultations', { method: 'POST', body: payload })
      Object.assign(model, { ...model, ...created, id: Number(created.id) })
    }

    const inpatientResult = await ensureInpatientReferralCreated()
    if (inpatientResult === 'created') {
      message.success('Internação criada automaticamente a partir da consulta.')
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

const ensureInpatientReferralCreated = async () => {
  if (!clinical.referInpatient || !model.id || !model.petId) return 'skipped' as const
  if (linkedInpatientRecordId.value) return 'exists' as const

  const api = useApi()
  try {
    if (!model.clientId) {
      throw new Error('Tutor é obrigatório para criar a internação.')
    }
    if (!String(inpatientReferral.reason || '').trim()) {
      throw new Error('Motivo clínico da internação é obrigatório.')
    }
    const selectedBox = availableInpatientBoxOptions.value.find((item) => Number(item.value) === Number(inpatientReferral.boxId))
    if (!selectedBox) {
      throw new Error('O box selecionado não está mais disponível para internação.')
    }

    const usedConsultationRes = await api<any>('/api/v1/inpatient-records', {
      query: { consultationId: model.id, page: 1, limit: 1 },
    })
    const usedRows = Array.isArray(usedConsultationRes?.data) ? usedConsultationRes.data : []
    if (usedRows.length > 0) {
      const reused = usedRows.find((item: any) => Number(item.id) !== Number(linkedInpatientRecordId.value || 0))
      if (reused) {
        throw new Error('A consulta de origem já foi utilizada em outra internação.')
      }
    }

    const existingRes = await api<any>('/api/v1/inpatient-records', {
      query: { petId: model.petId, status: 'ACTIVE', page: 1, limit: 20 },
    })
    const rows = Array.isArray(existingRes?.data) ? existingRes.data : []
    const matchingRecord = rows.find((item: any) => Number(item.consultationId) === Number(model.id))

    if (matchingRecord?.id) {
      linkedInpatientRecordId.value = Number(matchingRecord.id)
      return 'exists' as const
    }

    if (rows.length > 0) {
      throw new Error('Paciente já possui uma internação ativa.')
    }

    const created = await api<any>('/api/v1/inpatient-records', {
      method: 'POST',
      body: {
        consultationId: model.id,
        petId: model.petId,
        boxId: inpatientReferral.boxId,
        admissionAt: new Date().toISOString(),
        reason: String(inpatientReferral.reason || '').trim(),
        notes: String(inpatientReferral.notes || '').trim(),
      },
    })

    linkedInpatientRecordId.value = Number(created?.id || 0) || null
    return 'created' as const
  } catch (error: any) {
    throw new Error(error?.data?.message || error?.message || 'Erro ao criar internação automaticamente.')
  }
}

const saveAndContinue = async () => {
  if (currentStep.value === 2 && !model.anamnesisApproved) {
    message.warning('Revise a sugestão da IA e utilize o texto sugerido para avançar.')
    if (suggestedAnamnesisText.value) openAnamnesisChat()
    return
  }
  const ok = await persist()
  if (!ok) return
  completedSteps.value.add(currentStep.value)
  if (currentStep.value < steps.length - 1) currentStep.value += 1
}

const finalizeAttendance = async () => {
  const ready = await syncConsultationBillingItems()
  if (!ready) return

  if (canFinalizeAndBill.value) {
    await finalizeAndBill({ skipBillingSync: true })
    return
  }
  const ok = await persist({ finalize: true })
  if (!ok) return
  message.success('Atendimento finalizado com sucesso')
  await navigateTo('/atendimento/consultas')
}

const finalizeAndBill = async (options: { skipBillingSync?: boolean } = {}) => {
  const ready = options.skipBillingSync ? await ensureConsultationDraftForBilling() : await syncConsultationBillingItems()
  if (!ready || !model.id) return
  if (!canFinalizeAndBill.value) {
    const ok = await persist({ finalize: true })
    if (!ok) return
    message.success('Atendimento finalizado com sucesso')
    await navigateTo('/atendimento/consultas')
    return
  }
  if (!validateInpatientReferral()) return

  const hasComplaint = String(model.aiOrganizedComplaint || model.originalComplaint || '').trim().length > 0
  const hasClinical = String(model.treatmentPlan || model.notes || '').trim().length > 0
  if (!hasComplaint) {
    message.warning('Informe a queixa principal ou relato clínico antes de finalizar.')
    currentStep.value = 2
    return
  }
  if (!hasClinical) {
    message.warning('Informe a conduta clínica antes de finalizar.')
    currentStep.value = 3
    return
  }
  if (String(model.aiOrganizedComplaint || '').trim() && !model.anamnesisApproved) {
    message.warning('Utilize ou revise o texto sugerido antes de finalizar o atendimento.')
    currentStep.value = 2
    return
  }

  syncExtraNotes()
  finalizingAndBilling.value = true
  try {
    const api = useApi()
    const response = await api<any>(`/api/v1/consultations/${model.id}/finalize-and-bill`, {
      method: 'POST',
      body: {
        ...model,
        visitDate: model.visitDate ? new Date(model.visitDate).toISOString() : null,
        recordStatus: 'FINALIZED',
        billingItems: consultationBillingItems.value.map((item) => ({
          id: item.id,
          consultationId: item.consultationId,
          procedureId: item.procedureId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      },
    })

    if (response?.consultation) {
      Object.assign(model, response.consultation, {
        id: Number(response.consultation.id),
        appointmentId: response.consultation.appointmentId ? Number(response.consultation.appointmentId) : null,
        petId: response.consultation.petId ? Number(response.consultation.petId) : null,
        clientId: response.consultation.clientId ? Number(response.consultation.clientId) : null,
        veterinarianId: response.consultation.veterinarianId ? Number(response.consultation.veterinarianId) : null,
        visitDate: response.consultation.visitDate ? new Date(response.consultation.visitDate).getTime() : model.visitDate,
      })
    }

    const saleId = Number(response?.saleId || 0)
    if (!saleId) {
      message.success('Atendimento finalizado com sucesso')
      await navigateTo('/atendimento/consultas')
      return
    }

    message.success('Atendimento finalizado e venda preparada para cobrança.')
    await navigateTo({
      path: `/financeiro/vendas/${saleId}`,
      query: response?.shouldOpenCheckout ? { checkout: '1' } : undefined,
    })
  } catch (error: any) {
    message.error(error?.data?.message || error?.message || 'Erro ao finalizar e cobrar.')
  } finally {
    finalizingAndBilling.value = false
  }
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
  const organizedAnamnesis = latest.transcriptFinal || payload?.mainComplaint || payload?.subjective || payload?.summary || ''
  lastSubmittedSuggestionText.value = normalizeSuggestionText(latest.transcriptDraft || latest.transcriptFinal || '')
  aiInputDirty.value = false

  if (!String(model.originalComplaint || '').trim() && latest.transcriptDraft) {
    model.originalComplaint = latest.transcriptDraft
    model.migratedFromLegacyFlow = true
  }
  if (organizedAnamnesis) {
    const normalizedSuggestion = String(organizedAnamnesis).trim()
    suggestedAnamnesisText.value = normalizedSuggestion
    suggestedAnamnesisDictationId.value = Number(latest.id)
    if (String(model.aiOrganizedComplaint || '').trim() !== normalizedSuggestion) {
      model.anamnesisApproved = false
      model.anamnesisApprovedAt = null
      model.anamnesisApprovedByUserId = null
      if (currentStep.value === 2) openAnamnesisChat()
    }
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
    if (chunk.trim()) onOriginalComplaintChange(`${model.originalComplaint || ''} ${chunk}`.replace(/\s+/g, ' ').trim())
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

const onOriginalComplaintChange = (value: string) => {
  if (isOriginalTranscriptReadonly.value) return
  model.originalComplaint = value
  if (isHydratingConsultation.value) return
  const normalizedValue = normalizeSuggestionText(value)
  if (normalizedValue === lastSubmittedSuggestionText.value) {
    aiInputDirty.value = false
    return
  }
  aiInputDirty.value = true
  dismissedSuggestionId.value = null
  if (!isRecording.value) scheduleAutoSuggestion()
}

const onAiOrganizedComplaintChange = (value: string) => {
  model.aiOrganizedComplaint = value
  model.mainComplaint = value
  model.assistedAnamnesisSummary = value
  model.clinicalFindings = value
  aiInputDirty.value = true
  dismissedSuggestionId.value = null
}

const openConsultationChat = async () => {
  if (!model.id) {
    message.warning('Salve a consulta antes de abrir o assistente com histórico persistente.')
    return
  }
  await consultationConversation.ensureConversation()
  consultationAiChatVisible.value = true
}

const closeConsultationChat = () => {
  consultationAiChatVisible.value = false
}

const openAnamnesisChat = async () => {
  if (!String(suggestedAnamnesisText.value || '').trim()) {
    message.info('A IA ainda não gerou uma anamnese sugerida.')
    return
  }
  consultationAiMode.value = 'anamnesis'
  await openConsultationChat()
  if (!consultationAiChatVisible.value) return
  const suggestion = String(suggestedAnamnesisText.value || '').trim()
  const formattedSuggestionMessage = `Organizei a anamnese a partir da transcrição. Revise o texto abaixo e utilize somente se estiver clinicamente correto.\n\n${suggestion}`
  const idempotencyKey = buildAutomaticMessageKey(
    'dictation-suggestion',
    formattedSuggestionMessage,
  )
  const hasPersistedSuggestionMessage = consultationConversation.messages.value.some(
    (item) => {
      const source = String(item.metadata?.source || '').trim().toLowerCase()
      const content = String(item.content || '').trim()
      return (
        item.metadata?.idempotencyKey === idempotencyKey ||
        (source === 'dictation-suggestion' &&
          content === formattedSuggestionMessage)
      )
    },
  )

  if (
    lastOpenedSuggestedAnamnesisText.value !== suggestion &&
    !hasPersistedSuggestionMessage
  ) {
    await consultationConversation.addAssistantMessage(
      formattedSuggestionMessage,
      {
        source: 'dictation-suggestion',
        step: 3,
        suggestedAnamnesisDictationId: suggestedAnamnesisDictationId.value,
        idempotencyKey,
      },
    )
  }
  lastOpenedSuggestedAnamnesisText.value = suggestion
}

const openClinicalSupportChat = async () => {
  if (!String(model.consultiveSupportText || '').trim()) {
    message.info('O apoio clínico ainda não está disponível.')
    return
  }
  consultationAiMode.value = 'clinical-support'
  await openConsultationChat()
  if (!consultationAiChatVisible.value) return
  const support = String(model.consultiveSupportText || '').trim()
  const formattedSupportMessage = `Preparei um apoio consultivo a partir da anamnese utilizada. Use como referência clínica, sem aplicação automática no prontuário.\n\n${support}`
  const idempotencyKey = buildAutomaticMessageKey(
    'clinical-support',
    formattedSupportMessage,
  )
  const hasPersistedClinicalSupportMessage = consultationConversation.messages.value.some((item) => {
    const source = String(item.metadata?.source || '').trim().toLowerCase()
    const content = String(item.content || '').trim()
    return (
      item.metadata?.idempotencyKey === idempotencyKey ||
      (source === 'clinical-support' && content === formattedSupportMessage)
    )
  })

  if (lastOpenedClinicalSupportText.value !== support && !hasPersistedClinicalSupportMessage) {
    await consultationConversation.addAssistantMessage(
      formattedSupportMessage,
      {
        source: 'clinical-support',
        step: 4,
        html: false,
        idempotencyKey,
      },
    )
  }
  lastOpenedClinicalSupportText.value = support
}

const sendConsultationAiQuestion = async () => {
  const question = consultationAiQuestion.value.trim()
  if (!question) return
  if (!model.id) {
    message.warning('Salve a consulta antes de conversar com a IA.')
    return
  }
  consultationAiQuestion.value = ''
  await consultationConversation.sendUserMessage(question)
}

const sendConsultationAiQuickQuestion = async (question: string) => {
  if (!model.id) {
    message.warning('Salve a consulta antes de conversar com a IA.')
    return
  }
  await consultationConversation.sendUserMessage(question)
}

const handleConsultationAiPrimaryAction = async () => {
  if (consultationAiMode.value === 'anamnesis') await useSuggestedAnamnesis()
}

const useSuggestedAnamnesis = async () => {
  const suggestion = String(suggestedAnamnesisText.value || '').trim()
  if (!suggestion) {
    message.warning('A anamnese sugerida precisa ter conteúdo para uso no prontuário.')
    return
  }
  if (!model.id) {
    message.warning('Salve a consulta antes de utilizar a anamnese sugerida.')
    return
  }
  try {
    savingAnamnesisApproval.value = true
    model.aiOrganizedComplaint = suggestion
    model.mainComplaint = suggestion
    model.assistedAnamnesisSummary = suggestion
    model.clinicalFindings = suggestion
    const api = useApi()
    const updated = await api<any>(`/api/v1/consultations/${model.id}/anamnesis/approve`, {
      method: 'POST',
      body: {
        anamnesisText: suggestion,
      },
    })
    Object.assign(model, updated)
    await consultationConversation.registerAction('use_suggested_anamnesis', 'Texto sugerido utilizado no prontuário.', {
      consultationId: model.id,
      suggestedAnamnesisDictationId: suggestedAnamnesisDictationId.value,
    })
    message.success('Texto sugerido utilizado no prontuário.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao utilizar texto sugerido')
  } finally {
    savingAnamnesisApproval.value = false
  }
}

const submitDictation = async ({ silent = true }: { silent?: boolean } = {}) => {
  if (!model.id || !canAutoGenerate.value || hasPendingSuggestion.value) return
  const draftText = normalizedAutoSuggestionText.value
  if (!latestAudioBlob.value && draftText === lastSubmittedSuggestionText.value) {
    aiInputDirty.value = false
    return
  }
  clearAutoSuggestionTimer()
  sendingDictation.value = true
  try {
    aiErrorMessage.value = ''
    const api = useApi()
    const formData = new FormData()
    if (draftText) formData.append('transcriptDraft', draftText)
    formData.append('captureSource', latestAudioBlob.value ? 'BROWSER_AUDIO' : 'MANUAL_TEXT')
    formData.append('language', 'pt-BR')
    if (audioDurationSeconds.value) formData.append('audioDurationSeconds', String(audioDurationSeconds.value))
    if (latestAudioBlob.value) formData.append('audioFile', latestAudioBlob.value, latestAudioFileName.value || 'consultation-dictation.webm')

    await api(`/api/v1/consultations/${model.id}/dictations`, { method: 'POST', body: formData })
    aiInputDirty.value = false
    lastSubmittedSuggestionText.value = draftText
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
  if (!latestAudioBlob.value && normalizedAutoSuggestionText.value === lastSubmittedSuggestionText.value) {
    aiInputDirty.value = false
    return
  }
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

  if (payload.mainComplaint) {
    model.aiOrganizedComplaint = payload.mainComplaint
    model.mainComplaint = payload.mainComplaint
    blockDecisions.complaint = 'pending'
  }
  if (payload.subjective || payload.clinicalFindings) {
    model.assistedAnamnesisSummary = String(payload.subjective || payload.clinicalFindings || '')
    model.clinicalFindings = model.assistedAnamnesisSummary
    blockDecisions.anamnesis = 'pending'
  }
  if (!String(model.originalComplaint || '').trim() && visibleSuggestion.value?.transcriptDraft) {
    model.originalComplaint = visibleSuggestion.value.transcriptDraft
  }
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
  model.aiOrganizedComplaint = organized
  model.mainComplaint = organized
  blockDecisions.complaint = 'pending'
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

const refreshPrescriptionStatus = async () => {
  if (!model.id) {
    hasExistingPrescription.value = false
    return
  }

  try {
    const api = useApi()
    const response = await api<any>('/api/v1/prescriptions', {
      query: { consultationId: model.id }
    })
    const rows = Array.isArray(response?.data) ? response.data : []
    hasExistingPrescription.value = rows.length > 0

    // Mantém o textarea do step 4 sincronizado com a última prescrição salva.
    const latestContent = String(rows[0]?.content || '').trim()
    if (latestContent) {
      clinical.prescription = latestContent
    }
  } catch (_error) {
    hasExistingPrescription.value = false
  }
}

const fetchExamSupportData = async () => {
  const api = useApi()
  try {
    const [examTypesRes, categoriesRes] = await Promise.all([
      api<any>('/api/v1/exam-types', {
        query: { page: 1, limit: 100, isActive: true, sortBy: 'name', sortDirection: 'asc' },
      }),
      api<any>('/api/v1/exam-categories', { query: { page: 1, limit: 100, isActive: true } }),
    ])
    const rows = Array.isArray(examTypesRes?.data) ? examTypesRes.data : []
    activeExamTypes.value = rows.map((item: any) => ({
      id: Number(item.id),
      name: item.name,
      examCategoryId: item.examCategoryId ? Number(item.examCategoryId) : null,
      examCategory: item.examCategory || null,
    }))
    const categories = Array.isArray(categoriesRes?.data) ? categoriesRes.data : []
    void categories
  } catch (_error) {
    message.error('Não foi possível carregar exames ativos.')
  }
}

const refreshExamRequestStatus = async () => {
  if (!model.id) {
    hasExistingExamRequest.value = false
    consultationExamRequests.value = []
    return
  }
  try {
    const api = useApi()
    const response = await api<any>('/api/v1/exam-requests', {
      query: { consultationId: model.id },
    })
    consultationExamRequests.value = Array.isArray(response?.data) ? response.data : []
    hasExistingExamRequest.value = consultationExamRequests.value.length > 0
  } catch (_error) {
    hasExistingExamRequest.value = false
    consultationExamRequests.value = []
  }
}

const loadConsultationAttachments = async () => {
  if (!model.id) {
    consultationAttachments.value = []
    return
  }
  consultationAttachmentsLoading.value = true
  try {
    const api = useApi()
    const response = await api<{ data: ConsultationAttachmentRow[] }>(`/api/v1/consultations/${model.id}/attachments`)
    consultationAttachments.value = response.data || []
  } catch (_error) {
    message.error('Não foi possível carregar os anexos do prontuário.')
  } finally {
    consultationAttachmentsLoading.value = false
  }
}

const loadExamResults = async () => {
  if (!model.id) {
    examResults.value = []
    return
  }
  examResultsLoading.value = true
  try {
    const api = useApi()
    const response = await api<{ data: ExamResultRow[] }>('/api/v1/exam-results', {
      query: { consultationId: model.id },
    })
    examResults.value = response.data || []
  } catch (_error) {
    message.error('Não foi possível carregar os resultados de exames.')
  } finally {
    examResultsLoading.value = false
  }
}

const openConsultationFilePicker = () => {
  if (!model.id) {
    message.warning('Salve a consulta antes de enviar arquivos.')
    return
  }
  consultationFileInputRef.value?.click()
}

const handleConsultationFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file || !model.id) {
    if (input) input.value = ''
    return
  }

  const api = useApi()
  const formData = new FormData()
  formData.append('attachmentType', 'DOCUMENT')
  formData.append('file', file)

  uploadingConsultationAttachment.value = true
  try {
    await api(`/api/v1/consultations/${model.id}/attachments`, {
      method: 'POST',
      body: formData,
    })
    message.success('Arquivo anexado ao prontuário.')
    await loadConsultationAttachments()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao anexar arquivo ao prontuário.')
  } finally {
    uploadingConsultationAttachment.value = false
    if (input) input.value = ''
  }
}

const removeConsultationAttachment = async (attachmentId: number) => {
  deletingConsultationAttachmentId.value = attachmentId
  const api = useApi()
  try {
    await api(`/api/v1/consultations/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
    message.success('Anexo removido.')
    await loadConsultationAttachments()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao remover anexo.')
  } finally {
    deletingConsultationAttachmentId.value = null
  }
}

const openExamResultFilePicker = (examRequestId: number) => {
  if (!model.id) {
    message.warning('Salve a consulta antes de enviar resultados.')
    return
  }
  pendingExamRequestIdForUpload.value = examRequestId
  examResultFileInputRef.value?.click()
}

const handleExamResultFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  const examRequestId = pendingExamRequestIdForUpload.value
  if (!file || !examRequestId) {
    if (input) input.value = ''
    pendingExamRequestIdForUpload.value = null
    return
  }

  const api = useApi()
  const formData = new FormData()
  formData.append('examRequestId', String(examRequestId))
  formData.append('completedAt', new Date().toISOString())
  formData.append('file', file)

  uploadingExamResult.value = true
  try {
    await api('/api/v1/exam-results', {
      method: 'POST',
      body: formData,
    })
    message.success('Resultado de exame anexado.')
    await Promise.all([refreshExamRequestStatus(), loadExamResults()])
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao anexar resultado de exame.')
  } finally {
    uploadingExamResult.value = false
    pendingExamRequestIdForUpload.value = null
    if (input) input.value = ''
  }
}

const openExternalFile = (url?: string | null) => {
  if (!process.client || !url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

const formatDate = (value?: string | number | Date | null) => {
  if (!value) return '—'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return format(date, 'dd/MM/yyyy HH:mm')
}

const formatFileSize = (size?: number | null) => {
  const numericSize = Number(size || 0)
  if (numericSize < 1024) return `${numericSize} B`
  if (numericSize < 1024 * 1024) return `${(numericSize / 1024).toFixed(1)} KB`
  return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`
}

const normalizeExamRequestStatus = (status?: string | null) => {
  const normalized = String(status || '').trim().toUpperCase()
  if (normalized === 'COMPLETED') return 'Concluído'
  if (normalized === 'PENDING') return 'Pendente'
  return normalized || 'Pendente'
}

const openPrescriptionPrint = () => {
  if (!model.id) {
    message.warning('Salve a consulta antes de abrir a prescrição.')
    return
  }
  const prescriptionPath = `/atendimento/consultas/${model.id}/prescricao/imprimir`
  if (hasExistingPrescription.value && process.client) {
    window.open(prescriptionPath, '_blank', 'noopener,noreferrer')
    return
  }
  openPrescriptionGenerateModal()
}

const openExamRequestPrint = () => {
  if (!model.id) {
    message.warning('Salve a consulta antes de solicitar exames.')
    return
  }
  const examRequestPath = `/atendimento/consultas/${model.id}/exames/imprimir`
  if (hasExistingExamRequest.value && process.client) {
    window.open(examRequestPath, '_blank', 'noopener,noreferrer')
    return
  }
  openExamRequestModal()
}

const openExamRequestModal = async () => {
  await fetchExamSupportData()
  const selectedNames = String(clinical.exams || '')
    .split(';')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  selectedExamTypeIds.value = activeExamTypes.value
    .filter((item) => selectedNames.includes(item.name.trim().toLowerCase()))
    .map((item) => item.id)
  examRequestNotes.value = ''
  examRequestFilter.value = ''
  examRequestModalVisible.value = true
}

const openQuickExamCreateModal = async () => {
  quickExamCreateModalVisible.value = true
}

const confirmQuickExamCreate = async () => {
  quickExamFormRef.value?.submit?.()
}

const handleQuickExamSubmit = async (payload: ExamType) => {
  creatingQuickExamType.value = true
  try {
    const api = useApi()
    await api('/api/v1/exam-types', {
      method: 'POST',
      body: {
        name: String(payload.name || '').trim(),
        description: String(payload.description || '').trim() || null,
        examCategoryId: payload.examCategoryId || null,
        defaultPrice: payload.defaultPrice ?? null,
        isActive: payload.isActive ?? true,
      },
    })
    quickExamCreateModalVisible.value = false
    await fetchExamSupportData()
    message.success('Exame criado com sucesso.')
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao criar exame.')
  } finally {
    creatingQuickExamType.value = false
  }
}

const openPrescriptionGenerateModal = () => {
  prescriptionDraftContent.value = String(clinical.prescription || '').trim()
  prescriptionModalVisible.value = true
}

const confirmGeneratePrescription = async () => {
  if (!model.id || !model.petId) {
    message.warning('Salve a consulta com paciente vinculado antes de gerar a prescrição.')
    return
  }

  const prescriptionPath = `/atendimento/consultas/${model.id}/prescricao/imprimir`
  const content = String(prescriptionDraftContent.value || '').trim()
  if (!content) {
    message.warning('Preencha o campo de prescrição antes de gerar o documento.')
    currentStep.value = 3
    return
  }

  try {
    creatingPrescription.value = true
    const api = useApi()
    await api('/api/v1/prescriptions', {
      method: 'POST',
      body: {
        consultationId: model.id,
        petId: model.petId,
        veterinarianId: model.veterinarianId || undefined,
        content,
        prescribedAt: new Date().toISOString()
      }
    })

    clinical.prescription = content
    hasExistingPrescription.value = true
    prescriptionModalVisible.value = false
    if (process.client) {
      window.open(prescriptionPath, '_blank', 'noopener,noreferrer')
      return
    }
    await navigateTo(prescriptionPath)
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao gerar a prescrição.')
  } finally {
    creatingPrescription.value = false
  }
}

const confirmGenerateExamRequest = async () => {
  if (!model.id || !model.petId) {
    message.warning('Salve a consulta com paciente vinculado antes de gerar o pedido.')
    return
  }
  const selectedIds = selectedExamTypeIds.value.map((id) => Number(id)).filter(Boolean)
  if (!selectedIds.length) {
    message.warning('Selecione ao menos um exame para gerar o pedido.')
    return
  }

  const examRequestPath = `/atendimento/consultas/${model.id}/exames/imprimir`

  try {
    creatingExamRequest.value = true
    const api = useApi()
    await api('/api/v1/exam-requests', {
      method: 'POST',
      body: {
        consultationId: model.id,
        petId: model.petId,
        examTypeIds: selectedIds,
        notes: String(examRequestNotes.value || '').trim() || null,
        requestedAt: new Date().toISOString(),
      },
    })

    const selectedNames = activeExamTypes.value
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => item.name)
    clinical.exams = selectedNames.join('; ')
    hasExistingExamRequest.value = true
    examRequestModalVisible.value = false
    await refreshExamRequestStatus()
    if (process.client) {
      window.open(examRequestPath, '_blank', 'noopener,noreferrer')
      return
    }
    await navigateTo(examRequestPath)
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao gerar o pedido de exames.')
  } finally {
    creatingExamRequest.value = false
  }
}

watch(
  [currentStep, suggestedAnamnesisText, () => model.anamnesisApproved],
  ([step, suggestion, approved]) => {
    if (step !== 2 || approved) return
    if (!String(suggestion || '').trim()) return
    if (consultationAiChatVisible.value && consultationAiMode.value === 'anamnesis') return
    openAnamnesisChat()
  },
  { flush: 'post' },
)

watch(
  [currentStep, () => model.consultiveSupportText],
  ([step, supportText]) => {
    const normalizedSupport = String(supportText || '').trim()
    if (step !== 3 || !normalizedSupport) return
    if (lastOpenedClinicalSupportText.value === normalizedSupport) return
    openClinicalSupportChat()
  },
  { flush: 'post' },
)

watch(
  () => model.id,
  () => {
    void refreshPrescriptionStatus()
    void refreshExamRequestStatus()
    void loadConsultationAttachments()
    void loadExamResults()
    void loadConsultationBillingItems()
  },
  { immediate: true },
)

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 900px)')
  updateIsMobile()
  mediaQuery.addEventListener('change', updateIsMobile)
  await loadLookups()
  await loadConsultationFromRoute()
  await refreshPrescriptionStatus()
  await refreshExamRequestStatus()
  await loadConsultationAttachments()
  await loadExamResults()
  await fetchExamSupportData()
  if (!model.id) applySchedulingContextFromRoute()
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
h1 { margin: 0; font-size: 22px; line-height: 1.1; }
.subhead { margin: 4px 0 0; color: #475569; font-size: 14px; }
.head-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.save-status { font-size: 12px; color: #64748b; align-self: center; }

.layout { display: grid; grid-template-columns: 240px 1fr 280px; gap: 14px; align-items: start; }
.layout.mobile { grid-template-columns: 1fr; }
.steps-panel, .content-panel, .side-panel { min-width: 0; }
.side-panel { position: sticky; top: 14px; align-self: start; }
.side-panel .mini-card + .mini-card { margin-top: 12px; }

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
.step-head-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.consultive-text {
  margin: 0;
  color: #0f172a;
  line-height: 1.5;
}
.consultive-text :deep(p) { margin: 0 0 8px; }
.consultive-text :deep(p:last-child) { margin-bottom: 0; }
.consultive-text :deep(ol),
.consultive-text :deep(ul) {
  margin: 0;
  padding-left: 20px;
}
.consultive-text :deep(li) { margin: 0 0 10px; }
.consultive-text :deep(li:last-child) { margin-bottom: 0; }
.consultive-text :deep(strong) { color: #0f172a; font-weight: 700; }
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
  margin-bottom: 12px;
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
.complaint-split { display: flex; flex-direction: column; gap: 8px; }
.textarea-label { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #334155; }
.accepted-anamnesis-box {
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  background: #f0fdf4;
  padding: 10px;
}
.accepted-anamnesis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.accepted-anamnesis-head span {
  display: block;
  color: #166534;
  font-size: 12px;
  line-height: 1.35;
}
.accepted-anamnesis-box :deep(.n-input) {
  background: #fff;
}
.accepted-anamnesis-box :deep(textarea) {
  margin: 0;
  color: #0f172a;
  line-height: 1.45;
}
.muted { font-size: 12px; color: #64748b; }
.inline-actions { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
.exam-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow: auto;
  padding-right: 2px;
}
.exam-filter-input {
  margin-bottom: 10px;
}
.exam-checkbox-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
}
.exam-checkbox-label {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}
.exam-checkbox-label small {
  color: #64748b;
  font-size: 12px;
}
.assist-block {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  margin-bottom: 10px;
}
.anamnesis-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 6px;
}
.anamnesis-field-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.anamnesis-field-label {
  margin: 0;
  font-size: 12px;
  color: #334155;
  font-weight: 600;
}
.tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.missing-list { margin: 6px 0 0; padding-left: 18px; color: #334155; line-height: 1.45; }

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
.prescription-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.prescription-form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
}
.prescription-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.prescription-section-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #334155;
}
.prescription-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #475569;
}
.modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}
.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
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
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
}
.quick-action-card:hover {
  background: #f8fbff;
  border-color: #bfdbfe;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}
.quick-action-card:active {
  transform: translateY(1px);
}
.quick-action-card:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 1px;
}
.quick-action-icon { font-size: 16px; line-height: 1; }

.hidden-file-input {
  display: none;
}

.artifact-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.artifact-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
}

.artifact-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.artifact-section-head h4 {
  margin: 0 0 4px;
  font-size: 14px;
  color: #0f172a;
}

.artifact-section-head p {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.artifact-section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.billing-section {
  margin-top: 14px;
  background: linear-gradient(180deg, #fcfdff 0%, #f8fafc 100%);
}

.billing-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.billing-item {
  background: #fff;
}

.billing-summary-row,
.billing-procedure-total {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  color: #0f172a;
}

.billing-summary-row span,
.billing-procedure-total span {
  color: #64748b;
  font-size: 12px;
}

.billing-summary-row strong,
.billing-procedure-total strong {
  font-size: 16px;
}

.artifact-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 18px 12px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
}

.artifact-list,
.exam-request-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.artifact-item,
.exam-request-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.artifact-item-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.artifact-item-copy strong {
  color: #0f172a;
}

.artifact-item-copy span,
.artifact-item-copy small {
  color: #64748b;
}

.artifact-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

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
  .artifact-section-head,
  .artifact-item,
  .exam-request-item {
    flex-direction: column;
  }

  .artifact-item-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .prescription-form-section {
    padding: 10px;
  }

  .prescription-section-title {
    font-size: 15px;
  }
}
</style>

<style>
:root .n-modal-container:has(.prescription-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.exam-modal) .n-modal-body-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

:root .n-modal-container:has(.billing-procedure-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root .n-modal-container:has(.exam-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.exam-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.exam-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.exam-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
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

.exam-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.exam-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.exam-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

:root .n-modal-container:has(.prescription-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.prescription-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.prescription-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

:root .n-modal-container:has(.billing-procedure-modal) .n-modal-body-wrapper > .n-scrollbar,
:root .n-modal-container:has(.billing-procedure-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container,
:root .n-modal-container:has(.billing-procedure-modal) .n-modal-body-wrapper > .n-scrollbar > .n-scrollbar-container > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.prescription-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
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

.prescription-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.prescription-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.prescription-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.billing-procedure-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
  width: 640px !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 48px) !important;
  max-height: calc(100dvh - 48px) !important;
  margin: 0 auto !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.billing-procedure-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.billing-procedure-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
}

.billing-procedure-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .exam-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .exam-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .exam-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .exam-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .prescription-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .billing-procedure-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .prescription-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .prescription-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .prescription-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .billing-procedure-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .billing-procedure-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    -webkit-overflow-scrolling: touch;
  }

  .billing-procedure-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .prescription-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .prescription-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }

  .billing-procedure-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .billing-procedure-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
