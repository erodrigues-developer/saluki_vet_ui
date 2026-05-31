<template>
  <div class="prescription-print-page">
    <div class="toolbar no-print">
      <n-button tertiary @click="navigateTo('/atendimento/consultas')">Voltar</n-button>
      <div class="toolbar-actions">
        <n-button type="primary" @click="handlePrint">Imprimir</n-button>
      </div>
    </div>

    <n-spin :show="loading">
      <div v-if="loadError" class="state-card">
        <h2>Não foi possível carregar a prescrição</h2>
        <p>Verifique se existe prescrição vinculada à consulta #{{ consultationId }}.</p>
      </div>

      <article v-else-if="documentReady" class="page">
        <header class="clinic-header">
          <div class="logo-wrap">
            <img v-if="clinic.logoUrl" :src="clinic.logoUrl" alt="Logo da clínica" class="clinic-logo" />
            <div v-else class="logo-fallback">Logo</div>
          </div>
          <div class="clinic-meta">
            <h1>{{ clinic.name }}</h1>
            <p v-if="clinic.cnpj"><strong>CNPJ:</strong> {{ clinic.cnpj }}</p>
            <p v-if="clinic.address">{{ clinic.address }}</p>
            <p>{{ clinic.contactLine }}</p>
            <p v-if="clinic.site">{{ clinic.site }}</p>
          </div>
        </header>

        <section class="document-head">
          <div class="meta-grid">
            <p><strong>Prescrição nº:</strong> {{ prescriptionCode }}</p>
            <p><strong>Atendimento nº:</strong> {{ attendanceCode }}</p>
            <p><strong>Data de emissão:</strong> {{ formatDateTime(prescription.prescribedAt) }}</p>
            <p><strong>Data da consulta:</strong> {{ formatDateTime(consultation.visitDate) }}</p>
          </div>
        </section>

        <section class="doc-section">
          <h3>Tutor/Responsável</h3>
          <div class="info-grid columns-2">
            <p><strong>Nome:</strong> {{ tutor.name }}</p>
            <p><strong>CPF/CNPJ:</strong> {{ tutor.document }}</p>
            <p class="full-row"><strong>Endereço:</strong> {{ tutor.address }}</p>
          </div>
        </section>

        <section class="doc-section">
          <h3>Paciente</h3>
          <div class="info-grid columns-3">
            <p class="full-row patient-name"><strong>Nome:</strong> {{ patient.name }}</p>
            <p><strong>Espécie:</strong> {{ patient.species }}</p>
            <p><strong>Raça:</strong> {{ patient.breed }}</p>
            <p><strong>Sexo:</strong> {{ patient.sex }}</p>
            <p><strong>Idade:</strong> {{ patient.age }}</p>
            <p><strong>Peso:</strong> {{ patient.weight }}</p>
            <p><strong>Pelagem/cor:</strong> {{ patient.color }}</p>
            <p><strong>Microchip:</strong> {{ patient.microchip }}</p>
          </div>
        </section>

        <section class="doc-section">
          <h3>Prescrição</h3>
          <div class="prescription-content">{{ prescriptionText }}</div>
        </section>

        <section v-if="returnRecommended" class="doc-section">
          <h3>Retorno recomendado</h3>
          <p>{{ returnRecommended }}</p>
        </section>

        <section class="doc-section alert-box">
          <h3>Atenção</h3>
          <ul>
            <li>Não utilizar medicações humanas sem orientação veterinária.</li>
            <li>Não alterar dose ou frequência sem orientação.</li>
            <li>Em caso de reação adversa, interromper o uso e contatar a clínica.</li>
          </ul>
        </section>

        <section class="signature-section">
          <div class="signature-line"></div>
          <p class="vet-title">{{ veterinarian.name }}</p>
          <p>CRMV: {{ veterinarian.crmv }}</p>
          <p v-if="veterinarian.specialty">Especialidade: {{ veterinarian.specialty }}</p>
        </section>

        <footer class="document-footer">
          <p>
            Documento gerado em {{ generationDate }} · Prescrição {{ prescriptionCode }} · {{ clinic.name }}
          </p>
        </footer>
      </article>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const consultationId = Number(route.params.id)
const api = useApi()

const loading = ref(true)
const loadError = ref(false)
const generationTimestamp = ref(new Date().toISOString())

const consultation = reactive<any>({})
const prescription = reactive<any>({})
const pet = reactive<any>({})
const tutorRaw = reactive<any>({})
const clinicSettings = reactive<any>({})

const fallbackLabel = 'Não informado'

const formatDate = (value?: string | Date | null) => {
  if (!value) return fallbackLabel
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallbackLabel
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return fallbackLabel
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallbackLabel
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

const safeText = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const orFallback = (value: unknown) => {
  const text = safeText(value)
  return text || fallbackLabel
}

const prescriptionCode = computed(() => {
  const id = Number(prescription.id || 0)
  if (!id) return 'RX-N/I'
  const year = new Date(prescription.prescribedAt || Date.now()).getFullYear()
  return `RX-${year}-${String(id).padStart(6, '0')}`
})

const attendanceCode = computed(() => `ATD-${new Date(consultation.visitDate || Date.now()).getFullYear()}-${String(consultation.id || consultationId).padStart(6, '0')}`)

const clinic = computed(() => {
  const notes = safeText(clinicSettings.notes)
  const cnpjMatch = notes.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/)
  const siteMatch = notes.match(/https?:\/\/\S+/i)
  return {
    logoUrl: safeText(clinicSettings.logoUrl) || '',
    name: 'Clínica SalukiVet',
    cnpj: cnpjMatch?.[0] || '',
    address: safeText(tutorRaw.street) ? `${tutorRaw.street}, ${tutorRaw.number || 's/n'} · ${tutorRaw.district || ''} · ${tutorRaw.city || ''}/${tutorRaw.state || ''}` : '',
    contactLine: [orFallback(tutorRaw.mobilePhone || tutorRaw.phone), orFallback(tutorRaw.email)].join(' · '),
    site: siteMatch?.[0] || ''
  }
})

const tutor = computed(() => {
  const addressParts = [tutorRaw.street, tutorRaw.number, tutorRaw.complement, tutorRaw.district, tutorRaw.city, tutorRaw.state]
    .map((part) => safeText(part))
    .filter(Boolean)
  return {
    name: orFallback(tutorRaw.name),
    document: orFallback(tutorRaw.document),
    phone: orFallback(tutorRaw.mobilePhone || tutorRaw.phone),
    email: orFallback(tutorRaw.email),
    address: addressParts.length ? addressParts.join(' · ') : fallbackLabel
  }
})

const patient = computed(() => {
  const age = pet.dateOfBirth
    ? `${Math.max(0, new Date().getFullYear() - new Date(pet.dateOfBirth).getFullYear())} anos`
    : fallbackLabel
  const sexLabel = pet.sex === 'M' ? 'Macho' : pet.sex === 'F' ? 'Fêmea' : fallbackLabel
  const weightText = pet.weightKg ? `${String(pet.weightKg).replace('.', ',')} kg` : fallbackLabel
  return {
    name: orFallback(pet.name),
    species: orFallback(pet.species?.name),
    breed: orFallback(pet.breed?.name),
    sex: sexLabel,
    age,
    weight: weightText,
    color: orFallback(pet.color),
    microchip: orFallback(pet.microchipCode)
  }
})

const veterinarian = computed(() => ({
  name: orFallback(prescription.veterinarian?.name),
  crmv: 'não informado',
  specialty: ''
}))

const prescriptionText = computed(() => safeText(prescription.content) || fallbackLabel)

const returnRecommended = computed(() => {
  const notes = safeText(consultation.notes)
  const match = notes.match(/Retorno\s*:\s*(.+)/i)
  return match?.[1]?.trim() || ''
})

const generationDate = computed(() => formatDateTime(generationTimestamp.value))
const documentReady = computed(() => Number(consultation.id) > 0 && Number(prescription.id) > 0)

const handlePrint = () => {
  if (!process.client) return
  window.print()
}

const fetchData = async () => {
  if (!Number.isFinite(consultationId) || consultationId <= 0) {
    loadError.value = true
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = false

  try {
    const [consultationRes, prescriptionsRes, clinicRes] = await Promise.all([
      api<any>(`/api/v1/consultations/${consultationId}`),
      api<any>('/api/v1/prescriptions', { query: { consultationId } }),
      api<any>('/api/v1/clinic-settings')
    ])

    Object.assign(consultation, consultationRes || {})
    Object.assign(clinicSettings, clinicRes || {})

    const selectedPrescription = (prescriptionsRes?.data || [])[0]
    if (!selectedPrescription?.id) {
      loadError.value = true
      return
    }

    Object.assign(prescription, selectedPrescription)

    const [petRes, tutorRes] = await Promise.all([
      api<any>(`/api/v1/pets/${consultation.petId}`),
      api<any>(`/api/v1/clients/${consultation.clientId}`)
    ])

    Object.assign(pet, petRes || {})
    Object.assign(tutorRaw, tutorRes || {})
    generationTimestamp.value = new Date().toISOString()
  } catch (_error) {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.prescription-print-page {
  min-height: 100vh;
  padding: 20px;
  background: #e8edf3;
  color: #111827;
  font-family: Inter, Arial, Helvetica, sans-serif;
  box-sizing: border-box;
}

.toolbar {
  max-width: 900px;
  margin: 0 auto 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 14mm;
  background: #fff;
  box-shadow: 0 2px 18px rgba(15, 23, 42, 0.12);
  box-sizing: border-box;
}

.state-card {
  width: 210mm;
  margin: 0 auto;
  background: #fff;
  padding: 24px;
  box-sizing: border-box;
}

.clinic-header {
  display: flex;
  gap: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #d6dbe3;
}

.logo-wrap {
  width: 74px;
  height: 74px;
  flex-shrink: 0;
}

.clinic-logo,
.logo-fallback {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #d6dbe3;
}

.logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #64748b;
  background: #f8fafc;
}

.clinic-meta h1 {
  margin: 0;
  font-size: 18px;
}

.clinic-meta p {
  margin: 2px 0;
  font-size: 12px;
}

.document-head {
  margin-top: 10px;
  padding-top: 8px;
}

.document-head .meta-grid {
  gap: 6px 10px;
}

.document-head p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.info-grid {
  display: grid;
  gap: 6px 10px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.columns-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.columns-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.doc-section {
  margin-top: 10px;
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
}

.doc-section h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

.doc-section p,
.doc-section li {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.full-row {
  grid-column: 1 / -1;
}

.patient-name,
.vet-title {
  font-weight: 700;
}

.prescription-content {
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.alert-box {
  background: #f8fafc;
  border: 1px solid #d6dbe3;
  border-radius: 8px;
  padding: 10px;
}

.alert-box ul {
  margin: 0;
  padding-left: 18px;
}

.signature-section {
  margin-top: 24px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.signature-section h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

.signature-section p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.signature-line {
  width: 320px;
  border-top: 1px solid #0f172a;
  margin-bottom: 8px;
}

.document-footer {
  margin-top: 16px;
  border-top: 1px solid #d6dbe3;
  padding-top: 8px;
  color: #475569;
}

.document-footer p {
  font-size: 11px;
}

@page {
  size: A4;
  margin: 0;
}

@media print {
  .prescription-print-page {
    background: #fff;
    padding: 0;
  }

  .no-print {
    display: none !important;
  }

  .page,
  .state-card {
    width: auto;
    min-height: auto;
    margin: 0;
    padding: 14mm;
    box-shadow: none;
  }

  .clinic-header,
  .document-head,
  .signature-section,
  .document-footer {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}

@media screen and (max-width: 980px) {
  .prescription-print-page {
    padding: 12px;
  }

  .page,
  .state-card {
    width: 100%;
    min-height: auto;
    padding: 18px;
  }

  .meta-grid,
  .columns-2,
  .columns-3,
  .item-grid {
    grid-template-columns: 1fr;
  }
}
</style>
