<template>
  <div class="hospital-page">
    <section class="hero">
      <div>
        <p class="eyebrow">Operação Clínica</p>
        <h1>Painel de Internação</h1>
        <p class="hero-copy">
          Visualize leitos, registre sinais vitais, organize o mapa terapêutico e emita
          prescrições sem sair do fluxo hospitalar.
        </p>
      </div>

      <div class="hero-actions">
        <n-button tertiary size="large" @click="refreshBoard" :loading="loadingBoard">
          Atualizar painel
        </n-button>
        <n-button type="primary" size="large" @click="openAdmissionModal()">
          Nova internação
        </n-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-label">Internações ativas</span>
        <strong class="stat-value">{{ occupiedBoxes }}</strong>
        <span class="stat-hint">pacientes em acompanhamento agora</span>
      </article>
      <article class="stat-card">
        <span class="stat-label">Boxes disponíveis</span>
        <strong class="stat-value">{{ availableBoxes }}</strong>
        <span class="stat-hint">leitos prontos para nova admissão</span>
      </article>
      <article class="stat-card accent">
        <span class="stat-label">Última atualização</span>
        <strong class="stat-value small">{{ lastRefreshLabel }}</strong>
        <span class="stat-hint">sincronizado com a API clínica</span>
      </article>
    </section>

    <section class="board">
      <article
        v-for="box in boardBoxes"
        :key="box.id"
        class="box-column"
        :class="{ occupied: box.currentInpatient }"
      >
        <header class="box-header">
          <div>
            <p class="box-label">{{ box.name }}</p>
            <small>{{ box.description || 'Leito operacional' }}</small>
          </div>
          <n-tag :type="box.currentInpatient ? 'warning' : 'success'" size="small" :bordered="false">
            {{ box.currentInpatient ? 'Ocupado' : 'Livre' }}
          </n-tag>
        </header>

        <div v-if="box.currentInpatient" class="inpatient-card" @click="openRecord(box.currentInpatient.id)">
          <div class="pet-avatar">
            {{ initials(box.currentInpatient.pet?.name) }}
          </div>

          <div class="card-content">
            <div class="card-head">
              <div>
                <h3>{{ box.currentInpatient.pet?.name }}</h3>
                <p>
                  {{ box.currentInpatient.pet?.client?.name || 'Tutor não identificado' }}
                </p>
              </div>
              <n-tag type="info" size="small" :bordered="false">
                {{ petDescriptor(box.currentInpatient.pet) }}
              </n-tag>
            </div>

            <p class="card-reason">{{ box.currentInpatient.reason || 'Sem motivo clínico informado.' }}</p>

            <div class="card-meta">
              <span>Entrada {{ formatDateTime(box.currentInpatient.admissionAt) }}</span>
              <span v-if="box.currentInpatient.consultationId">
                Consulta #{{ box.currentInpatient.consultationId }}
              </span>
            </div>

            <div class="card-actions" @click.stop>
              <n-button size="small" type="primary" @click="openRecord(box.currentInpatient.id)">
                Abrir ficha
              </n-button>
              <n-popconfirm @positive-click="dischargeRecord(box.currentInpatient)">
                <template #trigger>
                  <n-button size="small" tertiary type="error">
                    Dar alta
                  </n-button>
                </template>
                Encerrar internação deste paciente?
              </n-popconfirm>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Leito livre para admissão.</p>
          <n-button size="small" type="primary" secondary @click="openAdmissionModal({ boxId: box.id })">
            Internar aqui
          </n-button>
        </div>
      </article>
    </section>

    <n-modal
      v-model:show="showAdmissionModal"
      preset="card"
      title="Nova internação"
      class="w-full max-w-3xl"
      :mask-closable="false"
    >
      <InpatientAdmissionForm
        :loading="savingAdmission"
        :pet-options="petOptions"
        :box-options="availableBoxOptions"
        :consultation-options="consultationOptions"
        :initial-value="admissionInitialValue"
        @submit="createAdmission"
        @cancel="showAdmissionModal = false"
      />
    </n-modal>

    <n-modal
      v-model:show="showPrescriptionModal"
      preset="card"
      title="Emitir prescrição digital"
      class="w-full max-w-3xl"
      :mask-closable="false"
    >
      <PrescriptionForm
        :loading="savingPrescription"
        :pet-id="prescriptionContext.petId"
        :consultation-id="prescriptionContext.consultationId"
        :pet-label="prescriptionContext.petLabel"
        :consultation-label="prescriptionContext.consultationLabel"
        @submit="createPrescription"
        @cancel="showPrescriptionModal = false"
      />
    </n-modal>

    <n-modal
      v-model:show="showPrintModal"
      preset="card"
      title="Receituário pronto"
      class="w-full max-w-4xl"
    >
      <div v-if="lastCreatedPrescription" class="print-sheet">
        <div class="print-head">
          <div>
            <p class="eyebrow">Receituário Médico Veterinário</p>
            <h2>{{ clinicTitle }}</h2>
          </div>
          <n-space>
            <n-button tertiary @click="sharePrescriptionWhatsapp">Compartilhar no WhatsApp</n-button>
            <n-button type="primary" @click="printPrescription">Imprimir / PDF</n-button>
          </n-space>
        </div>

        <div class="print-meta">
          <p><strong>Paciente:</strong> {{ lastCreatedPrescription.pet?.name }}</p>
          <p><strong>Tutor:</strong> {{ lastCreatedPrescription.pet?.client?.name }}</p>
          <p><strong>Veterinário:</strong> {{ lastCreatedPrescription.veterinarian?.name }}</p>
          <p><strong>Emitido em:</strong> {{ formatDateTime(lastCreatedPrescription.prescribedAt) }}</p>
          <p v-if="lastCreatedPrescription.expirationDate">
            <strong>Validade:</strong> {{ formatDate(lastCreatedPrescription.expirationDate) }}
          </p>
        </div>

        <div class="print-content">{{ lastCreatedPrescription.content }}</div>
      </div>
    </n-modal>

    <n-drawer v-model:show="showDetailDrawer" placement="right" :width="drawerWidth">
      <n-drawer-content :title="selectedRecord?.pet?.name || 'Ficha de internação'">
        <template #header-extra>
          <n-button tertiary size="small" @click="refreshSelectedRecord" :disabled="!selectedRecordId">
            Atualizar ficha
          </n-button>
        </template>

        <div v-if="detailLoading" class="detail-loading">
          <n-spin size="large" />
        </div>

        <div v-else-if="selectedRecord" class="detail-stack">
          <section class="detail-summary">
            <div>
              <p class="eyebrow">Paciente</p>
              <h2>{{ selectedRecord.pet?.name }}</h2>
              <p>{{ selectedRecord.pet?.client?.name }} • {{ petDescriptor(selectedRecord.pet) }}</p>
            </div>
            <div class="summary-chip">
              <span>Box</span>
              <strong>{{ selectedRecord.box?.name }}</strong>
            </div>
            <div class="summary-chip">
              <span>Entrada</span>
              <strong>{{ formatDateTime(selectedRecord.admissionAt) }}</strong>
            </div>
          </section>

          <n-tabs type="line" animated>
            <n-tab-pane name="vitals" tab="Sinais Vitais">
              <n-card size="small" title="Nova aferição" class="panel-card">
                <ClinicalParametersForm
                  :loading="savingVitals"
                  @submit="createClinicalParameter"
                />
              </n-card>

              <div class="feed">
                <article v-for="item in clinicalFeed" :key="item.id" class="feed-card">
                  <div class="feed-head">
                    <strong>{{ formatDateTime(item.measuredAt) }}</strong>
                    <span>{{ item.createdByUser?.name || 'Usuário não identificado' }}</span>
                  </div>
                  <div class="metric-grid">
                    <span v-if="item.temperatureC">Temp {{ Number(item.temperatureC).toFixed(1) }} °C</span>
                    <span v-if="item.heartRateBpm">FC {{ item.heartRateBpm }} bpm</span>
                    <span v-if="item.respiratoryRateMpm">FR {{ item.respiratoryRateMpm }} mpm</span>
                    <span v-if="item.bloodPressure">PA {{ item.bloodPressure }}</span>
                    <span v-if="item.weightKg">Peso {{ Number(item.weightKg).toFixed(2) }} kg</span>
                  </div>
                  <p v-if="item.notes" class="feed-notes">{{ item.notes }}</p>
                </article>

                <n-empty v-if="!clinicalFeed.length" description="Nenhuma aferição registrada ainda." />
              </div>
            </n-tab-pane>

            <n-tab-pane name="treatment" tab="Mapa Terapêutico">
              <n-card size="small" title="Agendar item" class="panel-card">
                <TreatmentItemForm
                  :loading="savingTreatment"
                  :product-options="productOptions"
                  :procedure-options="procedureOptions"
                  @submit="createTreatmentItem"
                />
              </n-card>

              <div class="feed">
                <article v-for="item in treatmentItems" :key="item.id" class="treatment-card">
                  <div class="feed-head">
                    <strong>{{ item.procedure?.name || item.medicament?.name || 'Item de tratamento' }}</strong>
                    <n-tag
                      size="small"
                      :type="item.status === 'EXECUTED' ? 'success' : treatmentState(item) === 'OVERDUE' ? 'error' : 'warning'"
                      :bordered="false"
                    >
                      {{ item.status === 'EXECUTED' ? 'Executado' : treatmentState(item) === 'OVERDUE' ? 'Atrasado' : 'Pendente' }}
                    </n-tag>
                  </div>

                  <p class="card-reason">
                    Previsto para {{ formatDateTime(item.scheduledAt) }}
                    <span v-if="item.executedAt"> • executado em {{ formatDateTime(item.executedAt) }}</span>
                  </p>
                  <p v-if="item.dose">{{ item.dose }}</p>
                  <p v-if="item.notes" class="feed-notes">{{ item.notes }}</p>

                  <div class="card-actions">
                    <n-button
                      v-if="item.status === 'PENDING'"
                      size="small"
                      type="primary"
                      secondary
                      @click="executeTreatment(item)"
                    >
                      Executar
                    </n-button>
                    <span v-else class="executed-by">
                      Aplicado por {{ item.executedByUser?.name || 'usuário não identificado' }}
                    </span>
                  </div>
                </article>

                <n-empty v-if="!treatmentItems.length" description="Nenhum item de tratamento programado." />
              </div>
            </n-tab-pane>

            <n-tab-pane name="prescriptions" tab="Prescrições">
              <div class="prescription-head">
                <div>
                  <p class="eyebrow">Histórico do paciente</p>
                  <h3>Receitas emitidas</h3>
                </div>
                <n-button type="primary" secondary @click="openPrescriptionModalForSelectedRecord">
                  Nova prescrição
                </n-button>
              </div>

              <div class="feed">
                <article v-for="item in prescriptions" :key="item.id" class="feed-card">
                  <div class="feed-head">
                    <strong>{{ formatDateTime(item.prescribedAt) }}</strong>
                    <span>{{ item.veterinarian?.name || 'Veterinário não identificado' }}</span>
                  </div>
                  <p class="feed-notes">{{ item.content }}</p>
                  <div class="card-actions">
                    <n-button size="small" tertiary @click="previewExistingPrescription(item)">
                      Abrir receituário
                    </n-button>
                  </div>
                </article>

                <n-empty v-if="!prescriptions.length" description="Nenhuma prescrição emitida para este paciente." />
              </div>
            </n-tab-pane>
          </n-tabs>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { format } from 'date-fns'
import InpatientAdmissionForm, {
  type InpatientAdmissionPayload,
} from '~/components/hospitalization/InpatientAdmissionForm.vue'
import ClinicalParametersForm from '~/components/hospitalization/ClinicalParametersForm.vue'
import TreatmentItemForm from '~/components/hospitalization/TreatmentItemForm.vue'
import PrescriptionForm from '~/components/hospitalization/PrescriptionForm.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const loadingBoard = ref(false)
const detailLoading = ref(false)
const savingAdmission = ref(false)
const savingVitals = ref(false)
const savingTreatment = ref(false)
const savingPrescription = ref(false)

const showAdmissionModal = ref(false)
const showDetailDrawer = ref(false)
const showPrescriptionModal = ref(false)
const showPrintModal = ref(false)

const boardBoxes = ref<any[]>([])
const clinicalFeed = ref<any[]>([])
const treatmentItems = ref<any[]>([])
const prescriptions = ref<any[]>([])
const selectedRecord = ref<any | null>(null)
const selectedRecordId = ref<number | null>(null)
const lastRefreshAt = ref<Date | null>(null)
const lastCreatedPrescription = ref<any | null>(null)
const clinicSettings = ref<any | null>(null)

const pets = ref<any[]>([])
const products = ref<any[]>([])
const procedures = ref<any[]>([])
const consultations = ref<any[]>([])

const admissionInitialValue = ref<Partial<InpatientAdmissionPayload> | null>(null)
const prescriptionContext = reactive({
  petId: null as number | null,
  consultationId: null as number | null,
  petLabel: 'Paciente não selecionado',
  consultationLabel: '',
})

const api = useApi()

const occupiedBoxes = computed(() => boardBoxes.value.filter((box) => box.currentInpatient).length)
const availableBoxes = computed(() => boardBoxes.value.filter((box) => !box.currentInpatient).length)
const lastRefreshLabel = computed(() =>
  lastRefreshAt.value ? format(lastRefreshAt.value, 'dd/MM/yyyy HH:mm') : 'Aguardando sincronização',
)
const clinicTitle = computed(() => clinicSettings.value?.notes || 'Saluki Vet')
const drawerWidth = computed(() => (process.client && window.innerWidth < 900 ? '100%' : 720))

const petOptions = computed(() =>
  pets.value.map((pet) => ({
    label: `${pet.name} • ${pet.client?.name || 'Tutor'}`,
    value: Number(pet.id),
  })),
)

const consultationOptions = computed(() =>
  consultations.value.map((consultation) => ({
    label: `${consultation.pet?.name || 'Pet'} • ${formatDateTime(consultation.visitDate)} • ${consultation.diagnosis || 'Consulta clínica'}`,
    value: Number(consultation.id),
    petId: Number(consultation.petId),
  })),
)

const availableBoxOptions = computed(() =>
  boardBoxes.value
    .filter((box) => !box.currentInpatient || Number(box.id) === Number(admissionInitialValue.value?.boxId))
    .map((box) => ({
      label: box.name,
      value: Number(box.id),
    })),
)

const productOptions = computed(() =>
  products.value.map((item) => ({
    label: item.name,
    value: Number(item.id),
  })),
)

const procedureOptions = computed(() =>
  procedures.value.map((item) => ({
    label: item.name,
    value: Number(item.id),
  })),
)

const initials = (value?: string) =>
  value
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('') || 'PT'

const formatDateTime = (value?: string | Date | null) =>
  value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '-'

const formatDate = (value?: string | Date | null) =>
  value ? format(new Date(value), 'dd/MM/yyyy') : '-'

const petDescriptor = (pet?: any) => {
  if (!pet) return 'Paciente'
  const species = pet.species?.name || 'Pet'
  const breed = pet.breed?.name || pet.sex || ''
  return breed ? `${species} • ${breed}` : species
}

const treatmentState = (item: any) => {
  if (item.status === 'EXECUTED') return 'EXECUTED'
  return new Date(item.scheduledAt).getTime() < Date.now() ? 'OVERDUE' : 'PENDING'
}

const loadLookups = async () => {
  const [petsRes, productsRes, proceduresRes, consultationsRes, clinicRes] = await Promise.all([
    api<any>('/api/v1/pets?limit=1000'),
    api<any>('/api/v1/products?limit=500&isActive=true'),
    api<any>('/api/v1/procedures?limit=500&isActive=true'),
    api<any>('/api/v1/consultations?limit=200&sortBy=visitDate&sortDirection=desc'),
    api<any>('/api/v1/clinic-settings'),
  ])

  pets.value = petsRes.data || []
  products.value = productsRes.data || []
  procedures.value = proceduresRes.data || []
  consultations.value = consultationsRes.data || []
  clinicSettings.value = clinicRes
}

const refreshBoard = async () => {
  loadingBoard.value = true
  try {
    const response = await api<any>('/api/v1/boxes?isActive=true')
    boardBoxes.value = response.data || []
    lastRefreshAt.value = new Date()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar o painel de internação.')
  } finally {
    loadingBoard.value = false
  }
}

const openAdmissionModal = (initialValue?: Partial<InpatientAdmissionPayload>) => {
  admissionInitialValue.value = initialValue ?? null
  showAdmissionModal.value = true
}

const openPrescriptionModalForContext = (context: {
  petId: number
  consultationId?: number | null
}) => {
  const pet = pets.value.find((item) => Number(item.id) === Number(context.petId))
  const consultation = context.consultationId
    ? consultations.value.find((item) => Number(item.id) === Number(context.consultationId))
    : null

  prescriptionContext.petId = Number(context.petId)
  prescriptionContext.consultationId = context.consultationId ? Number(context.consultationId) : null
  prescriptionContext.petLabel = pet?.name || `Paciente #${context.petId}`
  prescriptionContext.consultationLabel = consultation
    ? `Consulta #${consultation.id} • ${formatDateTime(consultation.visitDate)}`
    : ''
  showPrescriptionModal.value = true
}

const openPrescriptionModalForSelectedRecord = () => {
  if (!selectedRecord.value?.petId) return
  openPrescriptionModalForContext({
    petId: Number(selectedRecord.value.petId),
    consultationId: selectedRecord.value.consultationId ? Number(selectedRecord.value.consultationId) : null,
  })
}

const loadRecordDetails = async (recordId: number) => {
  detailLoading.value = true
  try {
    const [recordRes, vitalsRes, treatmentsRes] = await Promise.all([
      api<any>(`/api/v1/inpatient-records/${recordId}`),
      api<any>(`/api/v1/inpatient-records/${recordId}/clinical-parameters`),
      api<any>(`/api/v1/inpatient-records/${recordId}/treatment-map`),
    ])

    selectedRecord.value = recordRes
    selectedRecordId.value = Number(recordId)
    clinicalFeed.value = vitalsRes.data || []
    treatmentItems.value = treatmentsRes.data || []

    if (recordRes?.petId) {
      const prescriptionsRes = await api<any>(`/api/v1/prescriptions?petId=${recordRes.petId}`)
      prescriptions.value = prescriptionsRes.data || []
    } else {
      prescriptions.value = []
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao carregar detalhes da internação.')
  } finally {
    detailLoading.value = false
  }
}

const openRecord = async (recordId: number) => {
  showDetailDrawer.value = true
  await loadRecordDetails(recordId)
}

const refreshSelectedRecord = async () => {
  if (!selectedRecordId.value) return
  await loadRecordDetails(selectedRecordId.value)
}

const createAdmission = async (payload: any) => {
  savingAdmission.value = true
  try {
    const created = await api<any>('/api/v1/inpatient-records', {
      method: 'POST',
      body: payload,
    })

    message.success('Paciente internado com sucesso.')
    showAdmissionModal.value = false
    await refreshBoard()
    await openRecord(Number(created.id))
    clearRouteQuery()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao registrar a internação.')
  } finally {
    savingAdmission.value = false
  }
}

const createClinicalParameter = async (payload: any) => {
  if (!selectedRecordId.value) return
  savingVitals.value = true
  try {
    await api(`/api/v1/inpatient-records/${selectedRecordId.value}/clinical-parameters`, {
      method: 'POST',
      body: payload,
    })
    message.success('Aferição registrada.')
    await refreshSelectedRecord()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao registrar os parâmetros.')
  } finally {
    savingVitals.value = false
  }
}

const createTreatmentItem = async (payload: any) => {
  if (!selectedRecordId.value) return
  savingTreatment.value = true
  try {
    await api(`/api/v1/inpatient-records/${selectedRecordId.value}/treatment-map`, {
      method: 'POST',
      body: payload,
    })
    message.success('Item adicionado ao mapa terapêutico.')
    await refreshSelectedRecord()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao salvar o item de tratamento.')
  } finally {
    savingTreatment.value = false
  }
}

const executeTreatment = async (item: any) => {
  try {
    await api(`/api/v1/treatment-map/${item.id}/execute`, {
      method: 'PATCH',
      body: {},
    })
    message.success('Tratamento marcado como executado.')
    await refreshSelectedRecord()
    await refreshBoard()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao executar o tratamento.')
  }
}

const createPrescription = async (payload: any) => {
  savingPrescription.value = true
  try {
    const created = await api<any>('/api/v1/prescriptions', {
      method: 'POST',
      body: payload,
    })
    lastCreatedPrescription.value = created
    showPrescriptionModal.value = false
    showPrintModal.value = true
    message.success('Prescrição emitida com sucesso.')

    if (payload.petId) {
      const prescriptionsRes = await api<any>(`/api/v1/prescriptions?petId=${payload.petId}`)
      prescriptions.value = prescriptionsRes.data || []
    }

    clearRouteQuery()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao emitir a prescrição.')
  } finally {
    savingPrescription.value = false
  }
}

const previewExistingPrescription = (item: any) => {
  lastCreatedPrescription.value = item
  showPrintModal.value = true
}

const buildPrescriptionText = (prescription: any) => {
  return [
    'Receituário Veterinário',
    `Clínica: ${clinicTitle.value}`,
    `Paciente: ${prescription.pet?.name || '-'}`,
    `Tutor: ${prescription.pet?.client?.name || '-'}`,
    `Veterinário: ${prescription.veterinarian?.name || '-'}`,
    `Emitido em: ${formatDateTime(prescription.prescribedAt)}`,
    prescription.expirationDate ? `Validade: ${formatDate(prescription.expirationDate)}` : '',
    '',
    prescription.content || '',
  ]
    .filter(Boolean)
    .join('\n')
}

const printPrescription = () => {
  if (!lastCreatedPrescription.value || !process.client) return

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!printWindow) return

  const prescription = lastCreatedPrescription.value
  const html = `
    <html>
      <head>
        <title>Receituário Veterinário</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1 { margin: 0 0 8px; }
          .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin: 24px 0; }
          .content { white-space: pre-wrap; border-top: 1px solid #d1d5db; padding-top: 24px; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <p style="text-transform: uppercase; color: #6b7280; font-size: 12px">Receituário Médico Veterinário</p>
        <h1>${clinicTitle.value}</h1>
        <div class="meta">
          <div><strong>Paciente:</strong> ${prescription.pet?.name || '-'}</div>
          <div><strong>Tutor:</strong> ${prescription.pet?.client?.name || '-'}</div>
          <div><strong>Veterinário:</strong> ${prescription.veterinarian?.name || '-'}</div>
          <div><strong>Emitido em:</strong> ${formatDateTime(prescription.prescribedAt)}</div>
          ${
            prescription.expirationDate
              ? `<div><strong>Validade:</strong> ${formatDate(prescription.expirationDate)}</div>`
              : ''
          }
        </div>
        <div class="content">${(prescription.content || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</div>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

const sharePrescriptionWhatsapp = () => {
  if (!lastCreatedPrescription.value || !process.client) return
  const text = buildPrescriptionText(lastCreatedPrescription.value)
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}

const dischargeRecord = async (record: any) => {
  try {
    await api(`/api/v1/inpatient-records/${record.id}/discharge`, {
      method: 'PATCH',
      body: {},
    })
    message.success('Internação encerrada.')
    await refreshBoard()
    if (selectedRecordId.value === Number(record.id)) {
      showDetailDrawer.value = false
      selectedRecordId.value = null
      selectedRecord.value = null
    }
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao dar alta para o paciente.')
  }
}

const clearRouteQuery = () => {
  if (!route.query.action && !route.query.consultationId && !route.query.petId) return
  router.replace({ query: {} })
}

const handleRouteAction = async () => {
  const action = typeof route.query.action === 'string' ? route.query.action : ''
  const consultationId = Number(route.query.consultationId || 0)
  const petId = Number(route.query.petId || 0)
  const boxId = Number(route.query.boxId || 0)

  if (action === 'admit') {
    const initialValue: Partial<InpatientAdmissionPayload> = {}
    if (consultationId) initialValue.consultationId = consultationId
    if (petId) initialValue.petId = petId
    if (boxId) initialValue.boxId = boxId
    openAdmissionModal(initialValue)
  }

  if (action === 'prescription' && petId) {
    openPrescriptionModalForContext({
      petId,
      consultationId: consultationId || null,
    })
  }
}

onMounted(async () => {
  try {
    await loadLookups()
    await refreshBoard()
    await handleRouteAction()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao inicializar o painel clínico.')
  }
})
</script>

<style scoped>
.hospital-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), transparent 32%),
    linear-gradient(135deg, #0f172a 0%, #13263a 42%, #1f6f78 100%);
  color: #f8fafc;
  overflow: hidden;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 1.05;
}

.hero-copy {
  max-width: 680px;
  margin: 14px 0 0;
  color: rgba(248, 250, 252, 0.84);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 22px;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #eef5ff 100%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.stat-card.accent {
  background: linear-gradient(135deg, #0f766e 0%, #0f172a 100%);
  color: #ecfeff;
}

.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.accent .stat-label,
.accent .stat-hint {
  color: rgba(236, 254, 255, 0.7);
}

.stat-value {
  font-size: 2rem;
  line-height: 1;
}

.stat-value.small {
  font-size: 1.2rem;
  line-height: 1.4;
}

.stat-hint {
  color: #64748b;
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.box-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 320px;
  padding: 18px;
  border-radius: 26px;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.box-column.occupied {
  background: linear-gradient(180deg, #fff7ed 0%, #fde68a 180%);
}

.box-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.box-label {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.box-header small {
  color: #64748b;
}

.inpatient-card {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 36px rgba(120, 53, 15, 0.14);
  cursor: pointer;
}

.pet-avatar {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0f766e 0%, #22c55e 100%);
  color: #ecfeff;
  font-weight: 700;
  font-size: 1.2rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.card-head h3,
.prescription-head h3,
.print-head h2 {
  margin: 0;
}

.card-head p,
.card-reason,
.feed-notes,
.print-meta p {
  margin: 0;
}

.card-reason,
.feed-notes {
  color: #475569;
  line-height: 1.5;
  white-space: pre-wrap;
}

.card-meta,
.card-actions,
.feed-head,
.prescription-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.card-meta,
.executed-by {
  color: #64748b;
  font-size: 0.9rem;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 12px;
  flex: 1;
  text-align: center;
  padding: 18px;
  border: 1px dashed rgba(100, 116, 139, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.55);
}

.detail-loading {
  min-height: 240px;
  display: grid;
  place-items: center;
}

.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-summary {
  display: grid;
  grid-template-columns: 1.5fr repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(135deg, #0f172a 0%, #164e63 100%);
  color: #f8fafc;
}

.summary-chip {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
}

.summary-chip span {
  display: block;
  color: rgba(248, 250, 252, 0.64);
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.panel-card {
  margin-bottom: 16px;
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feed-card,
.treatment-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.metric-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.metric-grid span {
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(14, 58, 86, 0.08);
  color: #0f172a;
  font-size: 0.92rem;
}

.print-sheet {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.print-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.print-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.print-content {
  padding: 20px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
  white-space: pre-wrap;
  line-height: 1.7;
}

@media (max-width: 1024px) {
  .hero,
  .detail-summary,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
  }

  .hero-actions {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .detail-summary {
    display: flex;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .hospital-page {
    gap: 18px;
  }

  .hero {
    padding: 22px;
    border-radius: 22px;
  }

  .print-head,
  .print-meta {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
  }

  .inpatient-card {
    grid-template-columns: 1fr;
  }
}
</style>
