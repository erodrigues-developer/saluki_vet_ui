<template>
  <div class="hospital-page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">OPERAÇÃO CLÍNICA</p>
        <h1>Painel de Internação</h1>
        <p class="subhead">Acompanhe leitos, pacientes internados, prescrições e altas clínicas.</p>
      </div>
      <n-space class="head-actions">
        <n-button secondary size="large" class="refresh-action-btn" @click="refreshBoard" :loading="loadingBoard">Atualizar painel</n-button>
        <n-button type="primary" size="large" class="btn-primary-green new-admission-btn" @click="openAdmissionModal()">Nova internação</n-button>
      </n-space>
    </div>

    <section class="stats-grid">
      <n-card size="small" :bordered="false" class="summary-card">
        <span class="stat-label">Internações ativas</span>
        <strong class="stat-value">{{ occupiedBoxes }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <span class="stat-label">Leitos disponíveis</span>
        <strong class="stat-value">{{ availableBoxes }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <span class="stat-label">Ocupação</span>
        <strong class="stat-value">{{ occupancyRate }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <span class="stat-label">Última atualização</span>
        <strong class="stat-value small">{{ lastRefreshLabel }}</strong>
      </n-card>
    </section>

    <n-card :bordered="false" size="small" class="filters-card">
      <div class="filters-grid">
        <n-input v-model:value="draftFilters.search" placeholder="Buscar tutor, pet ou leito" clearable />
        <n-select v-model:value="draftFilters.status" :options="statusOptions" placeholder="Status" clearable />
        <n-select v-model:value="draftFilters.sector" :options="sectorOptions" placeholder="Setor" clearable />
        <n-select v-model:value="draftFilters.responsible" :options="responsibleOptions" placeholder="Responsável" clearable />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="clearFilters">Limpar filtros</n-button>
          <n-button secondary strong class="btn-filter" @click="applyFilters">Filtrar</n-button>
        </div>
      </div>
    </n-card>

    <div class="view-chips" role="tablist" aria-label="Visões do painel de internação">
      <button type="button" class="view-chip" :class="{ active: activeBoardView === 'beds' }" @click="activeBoardView = 'beds'">Leitos</button>
      <button type="button" class="view-chip" :class="{ active: activeBoardView === 'inpatients' }" @click="activeBoardView = 'inpatients'">Pacientes internados</button>
      <button type="button" class="view-chip" :class="{ active: activeBoardView === 'map' }" @click="activeBoardView = 'map'">Mapa terapêutico</button>
    </div>

    <section v-if="activeBoardView === 'beds'" class="status-legend">
      <button type="button" class="legend-toggle" @click="legendOpen = !legendOpen">
        Legenda de status <span>{{ legendOpen ? '▴' : '▾' }}</span>
      </button>
      <div v-show="legendOpen || !isMobileView" class="future-badges">
        <span class="status-badge badge-free">Livre</span>
        <span class="status-badge badge-occupied">Ocupado</span>
        <span class="status-badge badge-discharge">Alta prevista</span>
        <span class="status-badge badge-critical">Crítico</span>
        <span class="status-badge badge-isolation">Isolamento</span>
        <span class="status-badge badge-prescription">Prescrição ativa</span>
        <span class="status-badge badge-pending-signals">Sinais pendentes</span>
      </div>
    </section>

    <section v-if="activeBoardView === 'beds'" class="board">
      <article
        v-for="box in filteredBoardBoxes"
        :key="box.id"
        class="box-card"
      >
        <header class="box-header">
          <div>
            <p class="box-label">{{ box.name }}</p>
            <small>{{ box.description || 'Leito operacional' }}</small>
          </div>
          <span class="status-badge" :class="statusClass(box)">{{ statusLabel(box) }}</span>
        </header>

        <div v-if="box.currentInpatient" class="inpatient-card">
          <div class="pet-avatar" @click="openRecordWithTab(box.currentInpatient.id, 'vitals')">{{ initials(box.currentInpatient.pet?.name) }}</div>

          <div class="card-content" @click="openRecordWithTab(box.currentInpatient.id, 'vitals')">
            <div class="card-group">
              <p class="card-group-title">Paciente</p>
              <h3>{{ box.currentInpatient.pet?.name }}</h3>
              <p><strong>Tutor:</strong> {{ box.currentInpatient.pet?.client?.name || 'Não informado' }}</p>
              <p class="card-reason"><strong>Motivo:</strong> {{ box.currentInpatient.reason || 'Sem motivo clínico informado.' }}</p>
            </div>
            <div class="card-group">
              <p class="card-group-title">Internação</p>
              <div class="card-meta-grid">
                <span><strong>Entrada:</strong> {{ formatDateTime(box.currentInpatient.admissionAt) }}</span>
                <span><strong>Tempo internado:</strong> {{ stayDuration(box.currentInpatient.admissionAt) }}</span>
                <span v-if="box.currentInpatient.consultationId"><strong>Consulta relacionada:</strong> #{{ box.currentInpatient.consultationId }}</span>
                <span v-if="inpatientResponsibleLabel(box.currentInpatient)"><strong>Responsável:</strong> {{ inpatientResponsibleLabel(box.currentInpatient) }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions card-actions-row" @click.stop>
            <n-button
              size="medium"
              type="primary"
              class="open-record-btn"
              :style="isMobileView ? { width: '100%', '--n-width': '100%', '--n-height': '40px', '--n-padding': '0 12px' } : null"
              @click="openRecordWithTab(box.currentInpatient.id, 'vitals')"
            >
              Abrir internação
            </n-button>
            <div class="card-actions-secondary">
              <n-button size="small" secondary class="secondary-action-btn" @click="openRecordWithTab(box.currentInpatient.id, 'vitals')">Registrar sinais</n-button>
              <n-dropdown trigger="click" :options="rowMenuOptions(box.currentInpatient)" @select="(key) => handleRowMenuSelect(key, box.currentInpatient)">
                <n-button size="small" secondary class="menu-button menu-button-square" aria-label="Mais opções">Mais opções</n-button>
              </n-dropdown>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-copy">
            <p class="empty-title">Leito disponível para admissão.</p>
            <p><strong>Status:</strong> Disponível</p>
            <p><strong>Admissão:</strong> Pronto</p>
            <p><strong>Higienização:</strong> Sem registro</p>
          </div>
          <n-button size="small" type="primary" secondary class="admit-btn" @click="openAdmissionModal({ boxId: box.id })">Internar</n-button>
        </div>
      </article>

      <n-card v-if="filteredBoardBoxes.length === 0" size="small" :bordered="false" class="empty-result-card">
        <n-empty description="Nenhum leito encontrado para os filtros aplicados." />
      </n-card>
    </section>

    <n-card v-else-if="activeBoardView === 'inpatients'" size="small" :bordered="false" class="empty-result-card">
      <n-empty description="Visão de pacientes internados em preparação. Use a visão de Leitos para operação clínica." />
    </n-card>

    <n-card v-else size="small" :bordered="false" class="empty-result-card">
      <n-empty description="Visão de mapa terapêutico em preparação. Acompanhe itens no detalhe da internação por enquanto." />
    </n-card>

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
          <p v-if="lastCreatedPrescription.expirationDate"><strong>Validade:</strong> {{ formatDate(lastCreatedPrescription.expirationDate) }}</p>
        </div>

        <div class="print-content">{{ lastCreatedPrescription.content }}</div>
      </div>
    </n-modal>

    <n-drawer
      v-model:show="showDetailDrawer"
      :placement="detailDrawerPlacement"
      :width="isMobileView ? undefined : drawerWidth"
      :height="detailDrawerHeight"
      :trap-focus="false"
      :class="{ 'inpatient-mobile-drawer': isMobileView }"
    >
      <n-drawer-content :title="drawerTitle" closable :native-scrollbar="false" @close="showDetailDrawer = false">
        <template #header>
          <div class="drawer-header">
            <h2>{{ drawerTitle }}</h2>
            <p>{{ drawerSubtitle }}</p>
          </div>
        </template>
        <template #header-extra>
          <n-button tertiary size="small" @click="refreshSelectedRecord" :disabled="!selectedRecordId">Atualizar ficha</n-button>
        </template>

        <div v-if="detailLoading" class="detail-loading">
          <n-spin size="large" />
        </div>

        <div v-else-if="selectedRecord" class="detail-stack">
          <section class="detail-summary">
            <div class="summary-primary">
              <h3>{{ selectedRecord.pet?.name || 'Paciente não identificado' }}</h3>
              <p>
                {{ selectedRecord.pet?.client?.name || 'Tutor não informado' }}
                · {{ selectedRecord.pet?.species?.name || 'Espécie não informada' }}
                · {{ selectedRecord.pet?.breed?.name || 'Raça não informada' }}
              </p>
              <p><strong>Motivo:</strong> {{ selectedRecord.reason || 'não informado' }}</p>
              <p v-if="inpatientResponsibleLabel(selectedRecord)"><strong>Responsável:</strong> {{ inpatientResponsibleLabel(selectedRecord) }}</p>
            </div>
            <div class="summary-chips">
              <span class="summary-chip"><strong>Box:</strong> {{ selectedRecord.box?.name || '-' }}</span>
              <span class="summary-chip"><strong>Entrada:</strong> {{ formatDateTime(selectedRecord.admissionAt) }}</span>
              <span class="summary-chip"><strong>Tempo:</strong> {{ stayDuration(selectedRecord.admissionAt) }}</span>
              <span class="summary-chip status-chip badge-occupied"><strong>Status:</strong> Internado</span>
            </div>
          </section>

          <n-tabs v-model:value="activeDetailTab" type="line" animated class="detail-tabs">
            <n-tab-pane name="vitals" :tab="vitalsTabLabel">
              <n-card size="small" title="Última aferição" class="panel-card">
                <div v-if="latestClinicalItem" class="latest-vitals">
                  <div class="feed-head latest-vitals-head">
                    <strong>{{ formatDateTime(latestClinicalItem.measuredAt) }}</strong>
                    <span>Registrado por {{ latestClinicalItem.createdByUser?.name || 'Usuário não identificado' }}</span>
                  </div>
                  <div class="metric-grid">
                    <span v-if="latestClinicalItem.temperatureC">Temp {{ Number(latestClinicalItem.temperatureC).toFixed(1) }} °C</span>
                    <span v-if="latestClinicalItem.heartRateBpm">FC {{ latestClinicalItem.heartRateBpm }} bpm</span>
                    <span v-if="latestClinicalItem.respiratoryRateMpm">FR {{ latestClinicalItem.respiratoryRateMpm }} mpm</span>
                    <span v-if="latestClinicalItem.bloodPressure">PA {{ latestClinicalItem.bloodPressure }}</span>
                    <span v-if="latestClinicalItem.weightKg">Peso {{ Number(latestClinicalItem.weightKg).toFixed(2) }} kg</span>
                  </div>
                </div>
                <n-empty v-else description="Nenhuma aferição registrada." />
              </n-card>

              <n-card size="small" title="Nova aferição" class="panel-card">
                <ClinicalParametersForm :loading="savingVitals" @submit="createClinicalParameter" />
              </n-card>

              <h4 class="section-title">Histórico de aferições</h4>
              <div class="feed">
                <article v-for="item in clinicalFeed" :key="item.id" class="feed-card">
                  <div class="feed-head feed-head-stacked">
                    <strong>{{ formatDateTime(item.measuredAt) }}</strong>
                    <span>Registrado por {{ item.createdByUser?.name || 'Usuário não identificado' }}</span>
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

            <n-tab-pane name="treatment" :tab="treatmentTabLabel">
              <n-card v-if="showTreatmentForm || treatmentItems.length" size="small" title="Agendar item" class="panel-card">
                <TreatmentItemForm :loading="savingTreatment" :product-options="productOptions" :procedure-options="procedureOptions" @submit="createTreatmentItem" />
              </n-card>

              <div class="feed">
                <article v-for="item in treatmentItems" :key="item.id" class="treatment-card">
                  <div class="feed-head">
                    <strong>{{ item.procedure?.name || item.medicament?.name || 'Item de tratamento' }}</strong>
                    <n-tag size="small" :type="item.status === 'EXECUTED' ? 'success' : treatmentState(item) === 'OVERDUE' ? 'error' : 'warning'" :bordered="false">
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
                    <n-button v-if="item.status === 'PENDING'" size="small" type="primary" secondary @click="executeTreatment(item)">Executar</n-button>
                    <span v-else class="executed-by">Aplicado por {{ item.executedByUser?.name || 'usuário não identificado' }}</span>
                  </div>
                </article>

                <div v-if="!treatmentItems.length && !showTreatmentForm" class="empty-tab-action">
                  <n-empty description="Nenhum item terapêutico registrado." />
                  <n-button type="primary" secondary @click="showTreatmentForm = true">Adicionar item</n-button>
                </div>
              </div>
            </n-tab-pane>

            <n-tab-pane name="prescriptions" :tab="prescriptionsTabLabel">
              <div class="prescription-head">
                <div>
                  <p class="eyebrow">Histórico do paciente</p>
                  <h3>Receitas emitidas</h3>
                </div>
                <n-button type="primary" secondary class="new-prescription-btn" @click="openPrescriptionModalForSelectedRecord">+ Nova prescrição digital</n-button>
              </div>

              <div class="feed prescriptions-feed">
                <article v-for="item in prescriptions" :key="item.id" class="feed-card prescription-card">
                  <div class="prescription-card-head">
                    <strong>{{ formatDateTime(item.prescribedAt) }}</strong>
                    <n-tag size="small" :bordered="false" class="prescription-status-tag" :type="prescriptionStatus(item) === 'Ativa' ? 'success' : prescriptionStatus(item) === 'Finalizada' ? 'default' : 'info'">
                      {{ prescriptionStatus(item) }}
                    </n-tag>
                  </div>
                  <p class="prescription-responsible">{{ item.veterinarian?.name || 'Veterinário não identificado' }}</p>
                  <p class="feed-notes prescription-content">{{ item.content }}</p>
                  <div class="card-actions">
                    <n-button size="small" tertiary @click="previewExistingPrescription(item)">Abrir receituário</n-button>
                  </div>
                </article>

                <div v-if="!prescriptions.length" class="empty-tab-action">
                  <n-empty description="Nenhuma prescrição ativa." />
                  <n-button type="primary" secondary @click="openPrescriptionModalForSelectedRecord">Adicionar prescrição</n-button>
                </div>
              </div>
            </n-tab-pane>
          </n-tabs>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import { useDialog, useMessage } from 'naive-ui'
import InpatientAdmissionForm, { type InpatientAdmissionPayload } from '~/components/hospitalization/InpatientAdmissionForm.vue'
import ClinicalParametersForm from '~/components/hospitalization/ClinicalParametersForm.vue'
import TreatmentItemForm from '~/components/hospitalization/TreatmentItemForm.vue'
import PrescriptionForm from '~/components/hospitalization/PrescriptionForm.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

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
const showTreatmentForm = ref(false)
const activeDetailTab = ref('vitals')
const activeBoardView = ref<'beds' | 'inpatients' | 'map'>('beds')
const legendOpen = ref(false)
const isMobileView = ref(false)
let mobileQuery: MediaQueryList | null = null
let handleMobileChange: ((event: MediaQueryListEvent) => void) | null = null

const boardBoxes = ref<any[]>([])
const filteredBoardBoxes = ref<any[]>([])
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

const draftFilters = reactive({
  search: '',
  status: null as string | null,
  sector: null as string | null,
  responsible: null as string | null,
})

const appliedFilters = reactive({
  search: '',
  status: null as string | null,
  sector: null as string | null,
  responsible: null as string | null,
})

const statusOptions = [
  { label: 'Livre', value: 'FREE' },
  { label: 'Ocupado', value: 'OCCUPIED' },
  { label: 'Alta prevista', value: 'DISCHARGE_PLANNED' },
  { label: 'Isolamento', value: 'ISOLATION' },
  { label: 'Crítico', value: 'CRITICAL' },
]

const sectorOptions = [
  { label: 'Canil', value: 'CANIL' },
  { label: 'Gatil', value: 'GATIL' },
  { label: 'Isolamento', value: 'ISOLAMENTO' },
]

const api = useApi()

const occupiedBoxes = computed(() => boardBoxes.value.filter((box) => box.currentInpatient).length)
const availableBoxes = computed(() => boardBoxes.value.filter((box) => !box.currentInpatient).length)
const occupancyRate = computed(() => {
  const total = boardBoxes.value.length
  if (!total) return '0%'
  return `${Math.round((occupiedBoxes.value / total) * 100)}%`
})

const lastRefreshLabel = computed(() =>
  lastRefreshAt.value ? format(lastRefreshAt.value, 'dd/MM/yyyy HH:mm') : 'Aguardando sincronização',
)

const clinicTitle = computed(() => clinicSettings.value?.notes || 'Saluki Vet')
const drawerWidth = computed(() => (process.client && window.innerWidth < 900 ? '100%' : 720))
const detailDrawerPlacement = computed(() => (isMobileView.value ? 'bottom' : 'right'))
const detailDrawerHeight = computed(() => (isMobileView.value ? '100%' : undefined))
const drawerTitle = computed(() => selectedRecord.value?.pet?.name ? `Internação de ${selectedRecord.value.pet.name}` : 'Ficha de internação')
const drawerSubtitle = computed(() => {
  if (!selectedRecord.value) return 'Acompanhe dados clínicos, sinais vitais e evolução da internação.'
  const boxName = selectedRecord.value.box?.name || 'Box não informado'
  const entry = formatDateTime(selectedRecord.value.admissionAt)
  const duration = stayDuration(selectedRecord.value.admissionAt)
  return `${boxName} · Entrada ${entry} · ${duration} internado`
})
const latestClinicalItem = computed(() => (clinicalFeed.value?.length ? clinicalFeed.value[0] : null))
const pendingTreatmentCount = computed(() => treatmentItems.value.filter((item) => item.status === 'PENDING').length)
const vitalsTabLabel = computed(() => (isMobileView.value ? 'Sinais' : 'Sinais Vitais'))
const treatmentTabLabel = computed(() => {
  if (isMobileView.value) return 'Mapa'
  return pendingTreatmentCount.value > 0 ? `Mapa Terapêutico · ${pendingTreatmentCount.value} pendentes` : 'Mapa Terapêutico'
})
const activePrescriptionCount = computed(() => prescriptions.value.length)
const prescriptionsTabLabel = computed(() => {
  if (isMobileView.value) return activePrescriptionCount.value > 0 ? `Prescrições (${activePrescriptionCount.value})` : 'Prescrições'
  return activePrescriptionCount.value > 0 ? `Prescrições · ${activePrescriptionCount.value} ativa${activePrescriptionCount.value > 1 ? 's' : ''}` : 'Prescrições'
})

const responsibleOptions = computed(() => {
  const map = new Map<string, string>()
  boardBoxes.value.forEach((box) => {
    const label = inpatientResponsibleLabel(box.currentInpatient)
    if (label) map.set(label, label)
  })
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
})

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

const productOptions = computed(() => products.value.map((item) => ({ label: item.name, value: Number(item.id) })))
const procedureOptions = computed(() => procedures.value.map((item) => ({ label: item.name, value: Number(item.id) })))

const initials = (value?: string) => value?.split(' ').filter(Boolean).slice(0, 2).map((chunk) => chunk[0]?.toUpperCase()).join('') || 'PT'

const formatDateTime = (value?: string | Date | null) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '-')
const formatDate = (value?: string | Date | null) => (value ? format(new Date(value), 'dd/MM/yyyy') : '-')

const stayDuration = (admissionAt?: string | Date | null) => {
  if (!admissionAt) return '-'
  const diffMs = Date.now() - new Date(admissionAt).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (days > 0) return `${days}d ${remainingHours}h`
  return `${Math.max(0, hours)}h`
}

const petDescriptor = (pet?: any) => {
  if (!pet) return 'Paciente'
  const species = pet.species?.name || 'Pet'
  const breed = pet.breed?.name || pet.sex || ''
  return breed ? `${species} • ${breed}` : species
}

const inpatientResponsibleLabel = (inpatient?: any) =>
  inpatient?.responsibleUser?.name
  || inpatient?.admittedByUser?.name
  || inpatient?.veterinarian?.name
  || ''

const boxStatusCode = (box: any) => {
  if (box.currentInpatient) return 'OCCUPIED'
  const raw = String(box.operationalStatus || box.status || '').toUpperCase()
  if (raw.includes('CRIT')) return 'CRITICAL'
  if (raw.includes('ISO')) return 'ISOLATION'
  if (raw.includes('ALTA') || raw.includes('DISCH')) return 'DISCHARGE_PLANNED'
  return 'FREE'
}

const statusLabel = (box: any) => {
  const code = boxStatusCode(box)
  if (code === 'OCCUPIED') return 'Ocupado'
  if (code === 'DISCHARGE_PLANNED') return 'Alta prevista'
  if (code === 'ISOLATION') return 'Isolamento'
  if (code === 'CRITICAL') return 'Crítico'
  return 'Livre'
}

const statusClass = (box: any) => {
  const code = boxStatusCode(box)
  if (code === 'OCCUPIED') return 'badge-occupied'
  if (code === 'DISCHARGE_PLANNED') return 'badge-discharge'
  if (code === 'ISOLATION') return 'badge-isolation'
  if (code === 'CRITICAL') return 'badge-critical'
  return 'badge-free'
}

const matchesSector = (box: any, sector: string | null) => {
  if (!sector) return true
  const text = `${box.name || ''} ${box.description || ''} ${box.sector || ''}`.toLowerCase()
  if (sector === 'CANIL') return text.includes('canil')
  if (sector === 'GATIL') return text.includes('gati')
  if (sector === 'ISOLAMENTO') return text.includes('isola')
  return true
}

const applyFilters = () => {
  appliedFilters.search = draftFilters.search
  appliedFilters.status = draftFilters.status
  appliedFilters.sector = draftFilters.sector
  appliedFilters.responsible = draftFilters.responsible

  const term = appliedFilters.search.trim().toLowerCase()

  filteredBoardBoxes.value = boardBoxes.value.filter((box) => {
    const inpatient = box.currentInpatient
    const haystack = `${box.name || ''} ${inpatient?.pet?.name || ''} ${inpatient?.pet?.client?.name || ''}`.toLowerCase()
    const matchesSearch = !term || haystack.includes(term)
    const matchesStatusFilter = !appliedFilters.status || boxStatusCode(box) === appliedFilters.status
    const matchesResponsible = !appliedFilters.responsible || inpatientResponsibleLabel(inpatient) === appliedFilters.responsible
    return matchesSearch && matchesStatusFilter && matchesSector(box, appliedFilters.sector) && matchesResponsible
  })
}

const clearFilters = () => {
  draftFilters.search = ''
  draftFilters.status = null
  draftFilters.sector = null
  draftFilters.responsible = null
  applyFilters()
}

const rowMenuOptions = (inpatient: any) => [
  { label: 'Prescrição', key: `prescription:${inpatient.id}` },
  { label: 'Mapa terapêutico', key: `treatment:${inpatient.id}` },
  { label: 'Transferir leito', key: `transfer:${inpatient.id}` },
  { label: 'Dar alta', key: `discharge:${inpatient.id}` },
  { label: 'Histórico', key: `history:${inpatient.id}` },
]

const openRecordWithTab = async (recordId: number, tab: string) => {
  activeDetailTab.value = tab
  await openRecord(recordId)
}

const handleRowMenuSelect = async (key: string, inpatient: any) => {
  if (key.startsWith('prescription:')) {
    openPrescriptionModalForContext({ petId: Number(inpatient.petId), consultationId: inpatient.consultationId ? Number(inpatient.consultationId) : null })
    return
  }
  if (key.startsWith('treatment:')) {
    await openRecordWithTab(Number(inpatient.id), 'treatment')
    return
  }
  if (key.startsWith('discharge:')) {
    dialog.warning({
      title: 'Confirmar alta',
      content: 'Encerrar internação deste paciente?',
      positiveText: 'Dar alta',
      negativeText: 'Cancelar',
      onPositiveClick: async () => {
        await dischargeRecord(inpatient)
      },
    })
    return
  }
  if (key.startsWith('transfer:')) {
    message.info('Fluxo de transferência de leito será disponibilizado em breve.')
    return
  }
  if (key.startsWith('history:')) {
    await openRecordWithTab(Number(inpatient.id), 'prescriptions')
  }
}

const treatmentState = (item: any) => {
  if (item.status === 'EXECUTED') return 'EXECUTED'
  return new Date(item.scheduledAt).getTime() < Date.now() ? 'OVERDUE' : 'PENDING'
}

const prescriptionStatus = (item: any) => {
  const status = String(item?.status || '').toUpperCase()
  if (status.includes('FINAL')) return 'Finalizada'
  if (status.includes('ACTIVE') || status.includes('ATIVA')) return 'Ativa'
  if (item?.expirationDate && new Date(item.expirationDate).getTime() < Date.now()) return 'Finalizada'
  return 'Emitida'
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
    applyFilters()
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

const openPrescriptionModalForContext = (context: { petId: number; consultationId?: number | null }) => {
  const pet = pets.value.find((item) => Number(item.id) === Number(context.petId))
  const consultation = context.consultationId ? consultations.value.find((item) => Number(item.id) === Number(context.consultationId)) : null

  prescriptionContext.petId = Number(context.petId)
  prescriptionContext.consultationId = context.consultationId ? Number(context.consultationId) : null
  prescriptionContext.petLabel = pet?.name || `Paciente #${context.petId}`
  prescriptionContext.consultationLabel = consultation ? `Consulta #${consultation.id} • ${formatDateTime(consultation.visitDate)}` : ''
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
  showTreatmentForm.value = false
  await loadRecordDetails(recordId)
}

const refreshSelectedRecord = async () => {
  if (!selectedRecordId.value) return
  await loadRecordDetails(selectedRecordId.value)
}

const createAdmission = async (payload: any) => {
  savingAdmission.value = true
  try {
    const created = await api<any>('/api/v1/inpatient-records', { method: 'POST', body: payload })
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
    await api(`/api/v1/inpatient-records/${selectedRecordId.value}/clinical-parameters`, { method: 'POST', body: payload })
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
    await api(`/api/v1/inpatient-records/${selectedRecordId.value}/treatment-map`, { method: 'POST', body: payload })
    message.success('Item adicionado ao mapa terapêutico.')
    showTreatmentForm.value = true
    await refreshSelectedRecord()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao salvar o item de tratamento.')
  } finally {
    savingTreatment.value = false
  }
}

const executeTreatment = async (item: any) => {
  try {
    await api(`/api/v1/treatment-map/${item.id}/execute`, { method: 'PATCH', body: {} })
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
    const created = await api<any>('/api/v1/prescriptions', { method: 'POST', body: payload })
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

const buildPrescriptionText = (prescription: any) => [
  'Receituário Veterinário',
  `Clínica: ${clinicTitle.value}`,
  `Paciente: ${prescription.pet?.name || '-'}`,
  `Tutor: ${prescription.pet?.client?.name || '-'}`,
  `Veterinário: ${prescription.veterinarian?.name || '-'}`,
  `Emitido em: ${formatDateTime(prescription.prescribedAt)}`,
  prescription.expirationDate ? `Validade: ${formatDate(prescription.expirationDate)}` : '',
  '',
  prescription.content || '',
].filter(Boolean).join('\n')

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
          ${prescription.expirationDate ? `<div><strong>Validade:</strong> ${formatDate(prescription.expirationDate)}</div>` : ''}
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
    await api(`/api/v1/inpatient-records/${record.id}/discharge`, { method: 'PATCH', body: {} })
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
    openPrescriptionModalForContext({ petId, consultationId: consultationId || null })
  }
}

onMounted(async () => {
  if (process.client) {
    mobileQuery = window.matchMedia('(max-width: 720px)')
    const updateMobileView = (event?: MediaQueryList | MediaQueryListEvent) => {
      isMobileView.value = 'matches' in (event || mobileQuery as MediaQueryList) ? (event || mobileQuery as MediaQueryList).matches : false
      legendOpen.value = !isMobileView.value
    }
    handleMobileChange = (event: MediaQueryListEvent) => updateMobileView(event)
    updateMobileView(mobileQuery)
    mobileQuery.addEventListener('change', handleMobileChange)
  }

  try {
    await loadLookups()
    await refreshBoard()
    await handleRouteAction()
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao inicializar o painel clínico.')
  }
})

onBeforeUnmount(() => {
  if (!mobileQuery || !handleMobileChange) return
  mobileQuery.removeEventListener('change', handleMobileChange)
})

watch(activeDetailTab, async () => {
  if (!process.client || !isMobileView.value) return
  await nextTick()
  const wrapper = document.querySelector('.detail-tabs .n-tabs-nav-scroll-wrapper') as HTMLElement | null
  const activeEl = document.querySelector('.detail-tabs .n-tabs-tab--active') as HTMLElement | null
  if (!wrapper || !activeEl) return
  const targetLeft = activeEl.offsetLeft - (wrapper.clientWidth - activeEl.clientWidth) / 2
  wrapper.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
})
</script>

<style scoped>
.hospital-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.head-copy h1 {
  margin: 0;
  font-size: 2rem;
  color: #0f172a;
}

.refresh-action-btn {
  opacity: 0.92;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
}

.subhead {
  margin: 8px 0 0;
  color: #475569;
}

.btn-primary-green {
  background: #16a34a;
  border-color: #16a34a;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-value {
  display: block;
  margin-top: 4px;
  font-size: 1.8rem;
  color: #0f172a;
}

.stat-value.small {
  font-size: 1rem;
}

.filters-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-clear {
  color: #64748b;
}

.view-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.view-chip {
  flex: 0 0 auto;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 6px 12px;
  background: #fff;
  color: #475569;
}

.view-chip.active {
  background: #ecfeff;
  color: #0f766e;
  border-color: #99f6e4;
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
  gap: 14px;
}

.status-legend {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  padding: 12px 14px;
}

.legend-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: transparent;
  margin: 0 0 8px;
  padding: 0;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.box-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.box-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.box-label {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.box-header small {
  color: #64748b;
}

.status-badge {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge-free {
  color: #166534;
  background: #dcfce7;
}

.badge-occupied {
  color: #92400e;
  background: #fef3c7;
}

.badge-discharge {
  color: #1d4ed8;
  background: #dbeafe;
}

.badge-critical {
  color: #991b1b;
  background: #fee2e2;
}

.badge-isolation {
  color: #6d28d9;
  background: #f3e8ff;
}

.badge-prescription {
  color: #0369a1;
  background: #e0f2fe;
}

.badge-pending-signals {
  color: #9a3412;
  background: #ffedd5;
}

.inpatient-card {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
}

.pet-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #dcfce7;
  color: #166534;
  font-weight: 700;
  cursor: pointer;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
}

.card-group {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px;
  background: #f8fafc;
}

.card-group-title {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.card-content h3,
.card-content p,
.card-reason,
.feed-notes,
.print-meta p {
  margin: 0;
}

.card-reason,
.feed-notes {
  color: #475569;
}

.card-meta-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px 10px;
  color: #64748b;
  font-size: 12px;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: nowrap;
  gap: 8px;
}

.card-actions-row {
  padding-top: 2px;
  grid-column: 1 / -1;
  width: 100%;
}

.open-record-btn {
  min-height: 36px;
  --n-width: 100%;
}

.card-actions-secondary {
  display: flex;
  gap: 8px;
  width: 100%;
}

.secondary-action-btn {
  min-height: 36px;
}

.menu-button {
  font-weight: 700;
  min-width: 38px;
}

.menu-button-square {
  width: 36px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.empty-state {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 150px;
}

.empty-state-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-state p {
  margin: 0;
  color: #475569;
}

.admit-btn {
  min-height: 38px;
  padding-left: 16px;
  padding-right: 16px;
}

.empty-title {
  font-weight: 600;
  color: #0f172a;
}

.empty-result-card {
  grid-column: 1 / -1;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}

.future-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.drawer-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.drawer-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.summary-primary h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.summary-primary p {
  margin: 4px 0 0;
  color: #475569;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 12px;
  color: #334155;
}

.summary-chip strong {
  font-weight: 600;
}

.status-chip {
  border-color: transparent;
}

.panel-card {
  margin-bottom: 16px;
}

.feed-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.feed-head strong {
  color: #0f172a;
}

.feed-head span {
  color: #64748b;
  font-size: 12px;
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
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

.latest-vitals {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.latest-vitals-head {
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.feed-head-stacked {
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-tabs :deep(.n-tabs-nav) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
  padding-top: 2px;
}

.detail-tabs :deep(.n-tabs-nav-scroll-content) {
  flex-wrap: nowrap !important;
  min-width: max-content;
  padding-right: 12px;
}

.detail-tabs :deep(.n-tabs-tab) {
  white-space: nowrap;
}

.detail-tabs :deep(.n-tabs-pane-wrapper),
.detail-tabs :deep(.n-tab-pane) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.empty-tab-action {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.new-prescription-btn {
  min-height: 38px;
  padding-left: 14px;
  padding-right: 14px;
}

.prescription-card {
  gap: 8px;
}

.prescription-card-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;
}

.prescription-status-tag {
  align-self: flex-start;
  flex: 0 0 auto;
}

.prescriptions-feed {
  margin-top: 14px;
  padding-right: 1px;
  box-sizing: border-box;
}

.prescription-responsible {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.prescription-content {
  color: #334155;
  font-weight: 500;
}

.metric-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.metric-grid span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 13px;
}

.section-title {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  white-space: pre-wrap;
  line-height: 1.7;
}

@media (max-width: 1120px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }

  .filter-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 720px) {
  .hospital-page {
    overflow-x: hidden;
  }

  .page-head {
    flex-direction: column;
  }

  .head-actions {
    width: 100%;
    display: grid !important;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .head-actions > div {
    width: 100%;
  }

  .head-actions :deep(.n-button) {
    width: 100% !important;
    min-height: 42px;
    --n-width: 100% !important;
  }

  .new-admission-btn {
    min-height: 42px;
  }

  .refresh-action-btn {
    min-height: 42px;
    font-size: 15px;
    opacity: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid,
  .card-meta-grid,
  .print-meta {
    grid-template-columns: 1fr;
  }

  .inpatient-mobile-drawer :deep(.n-drawer) {
    width: 100vw !important;
    height: 100dvh !important;
    max-width: 100vw !important;
    max-height: 100dvh !important;
  }

  .inpatient-mobile-drawer :deep(.n-drawer-content) {
    width: 100%;
    height: 100%;
    border-radius: 0 !important;
  }

  .inpatient-mobile-drawer :deep(.n-drawer-header) {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #fff;
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
  }

  .inpatient-mobile-drawer :deep(.n-drawer-body-content-wrapper) {
    padding: 0 16px 16px !important;
    overflow-x: hidden !important;
  }

  .drawer-header h2 {
    font-size: 1.02rem;
  }

  .drawer-header p {
    margin-top: 2px;
    font-size: 12px;
  }

  .detail-stack {
    gap: 14px;
    min-width: 0;
    overflow-x: hidden;
  }

  .detail-summary,
  .panel-card,
  .feed-card,
  .treatment-card {
    max-width: 100%;
    min-width: 0;
  }

  .summary-chips,
  .metric-grid {
    row-gap: 6px;
  }

  .detail-tabs :deep(.n-tabs-nav) {
    top: 56px;
    margin: 0;
    padding: 8px 0 4px;
    overflow-x: auto;
  }

  .detail-tabs :deep(.n-tabs-nav-scroll-wrapper) {
    overflow-x: auto !important;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .detail-tabs :deep(.n-tabs-nav-scroll-wrapper::-webkit-scrollbar) {
    display: none;
  }

  .detail-tabs :deep(.n-tabs-tab) {
    font-size: 13px;
    padding: 8px 10px;
    flex: 0 0 auto;
  }

  .prescription-head,
  .feed,
  .feed-card,
  .panel-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin-left: 0;
    transform: none;
    box-sizing: border-box;
  }

  .feed-head span {
    font-size: 12px;
  }

  .new-prescription-btn {
    width: 100%;
    min-height: 40px;
  }

  .empty-tab-action :deep(.n-button) {
    width: 100%;
    min-height: 40px;
  }

  .empty-state {
    flex-direction: column;
    align-items: flex-start;
  }

  .admit-btn {
    width: 100%;
    min-height: 42px;
  }

  .card-actions-row {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .open-record-btn {
    width: 100%;
    --n-width: 100%;
    --n-padding: 0 12px;
    --n-height: 40px;
    min-height: 40px;
    white-space: nowrap;
    text-align: center;
  }

  .card-actions-row > .open-record-btn {
    width: 100% !important;
    min-width: 0 !important;
    --n-width: 100% !important;
    --n-height: 40px !important;
    --n-padding: 0 12px !important;
  }

  .card-actions-row > .open-record-btn :deep(.n-button__content) {
    white-space: nowrap;
    overflow: visible;
  }

  .card-actions-secondary {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    width: 100%;
    gap: 6px;
  }

  .secondary-action-btn {
    width: 100%;
    --n-width: 100%;
    --n-height: 38px;
    min-height: 38px;
    justify-content: center;
    white-space: nowrap;
  }

  .card-actions-row :deep(.n-button):not(.open-record-btn):not(.secondary-action-btn) {
    width: 100%;
    justify-content: center;
  }

  .card-actions-secondary :deep(.n-dropdown) {
    width: auto;
  }

  .card-actions-secondary .menu-button-square {
    width: auto;
    min-width: 116px;
    --n-height: 38px;
    height: 38px;
    padding: 0 12px;
    white-space: nowrap;
  }

  .filter-actions {
    justify-content: space-between;
  }

  .btn-filter {
    min-width: 128px;
  }

  .print-head {
    flex-direction: column;
  }
}
</style>
