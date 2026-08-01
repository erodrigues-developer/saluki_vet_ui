<template>
  <div class="page">
    <div class="page-head content-frame">
      <div class="head-copy">
        <p class="eyebrow">CONFIGURAÇÕES</p>
        <h1>Dados da Clínica</h1>
        <p class="subhead">Configure as informações institucionais, identidade visual e regras de funcionamento da clínica.</p>
      </div>
    </div>

    <n-spin :show="loading">
      <n-form
        ref="formRef"
        :model="model"
        :rules="rules"
        label-placement="top"
        :show-require-mark="false"
      >
        <n-card :bordered="false" class="section-card content-frame">
          <div class="tabs-shell">
            <div class="tabs-scroll">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                class="tab-button"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="card-head">
            <div>
              <h2>{{ activeTabMeta.title }}</h2>
              <p v-if="activeTabMeta.description" class="card-description">{{ activeTabMeta.description }}</p>
            </div>
            <div v-if="activeTab === 'hours'" class="quick-actions">
              <n-button size="small" @click="applyBusinessHoursPreset">Aplicar horário comercial</n-button>
              <n-button size="small" @click="copyMondayToFriday">Copiar segunda para sexta</n-button>
            </div>
          </div>

          <div v-if="activeTab === 'general'" class="form-grid">
            <n-form-item label="Nome da clínica" path="name" class="span-2">
              <n-input v-model:value="model.name" placeholder="Ex: Clínica Veterinária Saluki" />
            </n-form-item>

            <n-form-item label="Nome curto" path="shortName">
              <n-input v-model:value="model.shortName" placeholder="Ex: Saluki Vet" />
            </n-form-item>

            <n-form-item label="CNPJ" path="cnpj">
              <n-input :value="model.cnpj" placeholder="00.000.000/0000-00" @update:value="model.cnpj = maskCnpj($event)" />
            </n-form-item>

            <n-form-item label="CEP" path="zipCode" class="line-break-after">
              <n-input
                :value="model.zipCode"
                placeholder="00000-000"
                :loading="zipLoading"
                :input-props="{ maxlength: 9 }"
                @update:value="onZipInput"
              />
            </n-form-item>

            <n-form-item label="Rua" path="street" class="address-row-start">
              <n-input v-model:value="model.street" placeholder="Ex: Rua das Acácias" />
            </n-form-item>

            <n-form-item label="Número" path="number">
              <n-input v-model:value="model.number" placeholder="Ex: 120" />
            </n-form-item>

            <n-form-item label="Bairro" path="district">
              <n-input v-model:value="model.district" placeholder="Ex: Centro" />
            </n-form-item>

            <n-form-item label="Complemento" path="complement">
              <n-input v-model:value="model.complement" placeholder="Ex: Sala 2" />
            </n-form-item>

            <n-form-item label="Cidade" path="city">
              <n-input v-model:value="model.city" placeholder="Ex: São Paulo" />
            </n-form-item>

            <n-form-item label="Estado" path="state">
              <n-select v-model:value="model.state" :options="ufOptions" clearable placeholder="Selecione a UF" />
            </n-form-item>

            <n-form-item label="Telefone" path="phone">
              <n-input :value="model.phone" placeholder="(11) 3333-4444" :input-props="{ maxlength: 15 }" @update:value="model.phone = formatBrazilPhone($event)" />
            </n-form-item>

            <n-form-item label="WhatsApp" path="whatsapp">
              <n-input :value="model.whatsapp" placeholder="(11) 99999-8888" :input-props="{ maxlength: 15 }" @update:value="model.whatsapp = formatBrazilPhone($event)" />
            </n-form-item>

            <n-form-item label="E-mail" path="email">
              <n-input v-model:value="model.email" placeholder="contato@clinica.com.br" />
            </n-form-item>

            <n-form-item label="Moeda padrão" path="defaultCurrency">
              <n-input v-model:value="model.defaultCurrency" placeholder="BRL" />
            </n-form-item>

            <n-form-item label="Timezone da clínica" path="timezone" class="span-2">
              <n-select
                v-model:value="model.timezone"
                :options="timezoneOptions"
                filterable
                tag
                placeholder="Selecione ou digite um timezone IANA"
              />
            </n-form-item>
          </div>

          <div v-else-if="activeTab === 'branding'" class="branding-layout">
            <div class="assets-row">
              <div class="asset-panel asset-panel-logo">
                <div class="asset-header">
                  <div>
                    <h3>Logo da clínica</h3>
                  </div>
                  <div class="asset-actions">
                    <input ref="logoFileInputRef" type="file" accept="image/*" class="hidden-input" @change="onImageSelected('logo', $event)" />
                    <n-button size="small" :loading="uploadingLogo" @click="logoFileInputRef?.click()">Enviar imagem</n-button>
                    <n-button size="small" quaternary :loading="uploadingLogo" @click="clearImage('logo')">Remover</n-button>
                  </div>
                </div>
                <div class="asset-box asset-box-logo">
                  <div class="logo-preview">
                    <img v-if="model.logoUrl" :src="model.logoUrl" alt="Preview da logo da clínica" />
                    <div v-else class="preview-empty">Logo</div>
                  </div>
                </div>
              </div>

              <div class="asset-panel asset-panel-login">
                <div class="asset-header">
                  <div>
                    <h3>Imagem da tela de login</h3>
                  </div>
                  <div class="asset-actions">
                    <input ref="loginImageFileInputRef" type="file" accept="image/*" class="hidden-input" @change="onImageSelected('login', $event)" />
                    <n-button size="small" :loading="uploadingLoginImage" @click="loginImageFileInputRef?.click()">Enviar imagem</n-button>
                    <n-button size="small" quaternary :loading="uploadingLoginImage" @click="clearImage('login')">Remover</n-button>
                  </div>
                </div>
                <div class="asset-box">
                  <div class="login-preview">
                    <img v-if="model.loginImageUrl" :src="model.loginImageUrl" alt="Preview da imagem de login" />
                    <div v-else class="preview-empty">Preview 16:9</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="brand-section">
              <h3>Cores da marca</h3>
              <div class="form-grid compact-grid">
              <n-form-item label="Cor principal" path="primaryColor">
                <div class="color-field">
                  <n-color-picker :value="model.primaryColor" :show-alpha="false" @update:value="updateColor('primaryColor', $event)" />
                  <n-input :value="model.primaryColor" placeholder="#2563EB" @update:value="updateColor('primaryColor', $event)" />
                </div>
              </n-form-item>

              <n-form-item label="Cor secundária" path="secondaryColor">
                <div class="color-field">
                  <n-color-picker :value="model.secondaryColor" :show-alpha="false" @update:value="updateColor('secondaryColor', $event)" />
                  <n-input :value="model.secondaryColor" placeholder="#0F172A" @update:value="updateColor('secondaryColor', $event)" />
                </div>
              </n-form-item>
              </div>
            </div>

            <div class="brand-section">
              <h3>Mensagem da tela de login</h3>
              <n-form-item label="Mensagem da tela de login" path="loginMessage" class="span-2">
                <n-input
                  v-model:value="model.loginMessage"
                  type="textarea"
                  :rows="4"
                  placeholder="Bem-vindo. Tenha uma operação mais tranquila e organizada desde a recepção."
                />
              </n-form-item>
            </div>
          </div>

          <div v-else-if="activeTab === 'technical'" class="form-grid">
            <n-form-item label="Nome do responsável técnico" path="technicalResponsibleName" class="span-2">
              <n-input v-model:value="model.technicalResponsibleName" placeholder="Ex: Dra. Ana Souza" />
            </n-form-item>

            <n-form-item label="CRMV" path="technicalResponsibleCrmv">
              <n-input v-model:value="model.technicalResponsibleCrmv" placeholder="Ex: 12345" />
            </n-form-item>

            <n-form-item label="UF do CRMV" path="technicalResponsibleCrmvUf">
              <n-select v-model:value="model.technicalResponsibleCrmvUf" :options="ufOptions" placeholder="Selecione a UF" />
            </n-form-item>
          </div>

          <div v-else-if="activeTab === 'hours'" class="hours-list">
            <article v-for="day in businessDays" :key="day.key" class="day-card">
              <div class="day-card-head">
                <div>
                  <h3>{{ day.label }}</h3>
                  <p v-if="isDayOpen(day.key)">{{ model.businessHours[day.key].length }} intervalo(s)</p>
                </div>
                <div class="day-toggle">
                  <span>{{ isDayOpen(day.key) ? 'Aberto' : 'Fechado' }}</span>
                  <n-switch :value="isDayOpen(day.key)" @update:value="setDayOpen(day.key, $event)" />
                </div>
              </div>

              <div v-if="isDayOpen(day.key)" class="interval-list">
                <div v-for="(interval, index) in model.businessHours[day.key]" :key="`${day.key}-${index}`" class="interval-row">
                  <n-form-item :show-label="false" :show-feedback="false" class="interval-input">
                    <n-time-picker
                      v-model:formatted-value="interval.start"
                      value-format="HH:mm"
                      format="HH:mm"
                      :actions="null"
                    />
                  </n-form-item>

                  <span class="interval-separator">até</span>

                  <n-form-item :show-label="false" :show-feedback="false" class="interval-input">
                    <n-time-picker
                      v-model:formatted-value="interval.end"
                      value-format="HH:mm"
                      format="HH:mm"
                      :actions="null"
                    />
                  </n-form-item>

                  <n-button quaternary circle @click="removeInterval(day.key, index)" aria-label="Remover intervalo">
                    -
                  </n-button>

                  <n-button
                    v-if="index === model.businessHours[day.key].length - 1"
                    tertiary
                    size="small"
                    class="inline-add"
                    @click="addInterval(day.key)"
                  >
                    Adicionar intervalo
                  </n-button>
                </div>
              </div>

              <div v-else class="closed-state">
                Nenhum atendimento será permitido neste dia.
              </div>
            </article>
          </div>

          <div v-else-if="activeTab === 'preferences'" class="form-grid">
            <n-form-item label="Duração padrão da consulta" path="appointmentSlotDurationMinutes">
              <n-input-number
                v-model:value="model.appointmentSlotDurationMinutes"
                :min="1"
                :step="5"
                placeholder="Ex: 30"
                style="width: 100%"
              >
                <template #suffix>minutos</template>
              </n-input-number>
            </n-form-item>

            <n-form-item label="Tolerância de atraso" path="checkInToleranceMinutes">
              <n-input-number
                v-model:value="model.checkInToleranceMinutes"
                :min="0"
                :max="120"
                :step="1"
                placeholder="Ex: 10"
                style="width: 100%"
              >
                <template #suffix>minutos</template>
              </n-input-number>
            </n-form-item>

            <n-form-item label="Gerar contas recorrentes por" path="accountsPayableRecurrenceHorizonMonths">
              <n-input-number
                v-model:value="model.accountsPayableRecurrenceHorizonMonths"
                :min="1"
                :max="36"
                :step="1"
                placeholder="Ex: 12"
                style="width: 100%"
              >
                <template #suffix>meses</template>
              </n-input-number>
            </n-form-item>
          </div>

          <div v-else-if="activeTab === 'fiscal'" class="fiscal-tab">
            <section class="fiscal-section">
              <div class="fiscal-section-head">
                <div>
                  <h3>Perfil fiscal</h3>
                </div>
                <n-tag :bordered="false" :type="profileForm.fiscalMode === 'INATIVO' ? 'warning' : 'success'">
                  {{ fiscalModeLabel }}
                </n-tag>
              </div>
              <div class="form-grid">
                <n-form-item label="Código do perfil">
                  <n-input v-model:value="profileForm.code" placeholder="MATRIZ" />
                </n-form-item>
                <n-form-item label="Modo fiscal">
                  <n-select v-model:value="profileForm.fiscalMode" :options="fiscalModeOptions" />
                </n-form-item>
                <n-form-item label="Inscrição estadual">
                  <n-input v-model:value="profileForm.ie" placeholder="IE do emitente" />
                </n-form-item>
                <n-form-item label="Inscrição municipal">
                  <n-input v-model:value="profileForm.im" placeholder="Opcional" />
                </n-form-item>
                <n-form-item label="CRT">
                  <n-input v-model:value="profileForm.crt" placeholder="Ex: 1, 2 ou 3" />
                </n-form-item>
                <n-form-item label="CNAE">
                  <n-input v-model:value="profileForm.cnae" />
                </n-form-item>
                <n-form-item label="Regime tributário">
                  <n-input v-model:value="profileForm.taxRegime" />
                </n-form-item>
                <n-form-item label="Código IBGE município">
                  <n-auto-complete
                    v-model:value="profileForm.ibgeCityCode"
                    :options="municipioOptions"
                    :loading="loadingMunicipios"
                    placeholder="Digite a cidade ou o código"
                    clearable
                    @update:value="handleMunicipioInput"
                  />
                </n-form-item>
              </div>
            </section>

            <section class="fiscal-section">
              <div class="fiscal-section-head">
                <div>
                  <h3>NFC-e</h3>
                </div>
                <n-tag :bordered="false" type="info">{{ environmentLabel }}</n-tag>
              </div>
              <div class="form-grid">
                <n-form-item label="Ambiente">
                  <n-select v-model:value="nfceForm.environment" :options="environmentOptions" />
                </n-form-item>
                <n-form-item label="Série">
                  <n-input-number v-model:value="nfceForm.series" :min="1" :precision="0" style="width: 100%" />
                </n-form-item>
                <n-form-item label="ID CSC">
                  <n-input
                    v-model:value="nfceForm.cscId"
                    placeholder="Ex: 000001"
                    :input-props="{ maxlength: 20, inputmode: 'numeric', autocomplete: 'off', name: 'nfce-csc-id' }"
                    @update:value="nfceForm.cscId = String($event || '').replace(/\D/g, '').slice(0, 20)"
                  />
                </n-form-item>
                <n-form-item label="CSC">
                  <div class="secret-field">
                    <n-input
                      v-if="nfceCscMasked && !editingNfceCsc"
                      :value="`Configurado (${nfceCscMasked})`"
                      disabled
                    />
                    <n-input
                      v-else
                      v-model:value="nfceForm.csc"
                      type="password"
                      show-password-on="click"
                      placeholder="Token CSC da SEFAZ"
                      :input-props="{ autocomplete: 'new-password', name: 'nfce-csc-token' }"
                    />
                    <n-button
                      v-if="nfceCscMasked"
                      secondary
                      @click="toggleNfceCscEdit"
                    >
                      {{ editingNfceCsc ? 'Cancelar' : 'Alterar' }}
                    </n-button>
                  </div>
                </n-form-item>
                <n-form-item label="Contingência">
                  <n-switch v-model:value="nfceForm.contingencyEnabled" />
                </n-form-item>
                <n-form-item label="Alerta após (min)">
                  <n-input-number v-model:value="nfceForm.contingencyAlertAfterMinutes" :min="1" :precision="0" style="width: 100%" />
                </n-form-item>
                <n-form-item label="Crítico após (min)">
                  <n-input-number v-model:value="nfceForm.contingencyCriticalAfterMinutes" :min="1" :precision="0" style="width: 100%" />
                </n-form-item>
              </div>
            </section>

            <section class="fiscal-section">
              <div class="fiscal-section-head">
                <div>
                  <h3>Certificado A1</h3>
                </div>
                <n-tag :bordered="false" :type="certificateConfigured ? 'success' : 'warning'">
                  {{ certificateConfigured ? 'Configurado' : 'Pendente' }}
                </n-tag>
              </div>
              <div class="form-grid">
                <n-form-item label="Arquivo .pfx">
                  <div class="file-picker">
                    <input ref="certificateFileInputRef" type="file" accept=".pfx" class="hidden-input" @change="handleCertificateFile" />
                    <n-button secondary @click="certificateFileInputRef?.click()">Selecionar arquivo</n-button>
                    <span class="file-name">
                      {{ selectedCertificateFile?.name || certificateFileLabel }}
                    </span>
                  </div>
                </n-form-item>
                <n-form-item label="Senha">
                  <div class="secret-field">
                    <n-input
                      v-if="certificatePasswordConfigured && !editingCertificatePassword"
                      value="••••••••"
                      disabled
                    />
                    <n-input
                      v-else
                      v-model:value="certificateForm.password"
                      type="password"
                      show-password-on="click"
                      :placeholder="selectedCertificateFile ? 'Senha do certificado selecionado' : 'Nova senha do certificado'"
                      :input-props="{ autocomplete: 'new-password', name: 'certificate-password' }"
                    />
                    <n-button
                      v-if="certificatePasswordConfigured"
                      secondary
                      @click="toggleCertificatePasswordEdit"
                    >
                      {{ editingCertificatePassword ? 'Cancelar' : 'Alterar' }}
                    </n-button>
                  </div>
                </n-form-item>
                <n-form-item label="Validade final">
                  <n-date-picker v-model:value="certificateForm.validTo" type="date" style="width: 100%" />
                </n-form-item>
              </div>
              <div v-if="certificateMetadata" class="config-summary">
                <span>Certificado salvo</span>
                <span v-if="certificateMetadata.validTo">Validade: {{ certificateMetadata.validTo }}</span>
                <span>{{ certificateMetadata.storageMode }}</span>
              </div>
            </section>
          </div>

          <div v-else class="notes-panel">
            <n-form-item label="Instruções internas" path="notes">
              <n-input
                v-model:value="model.notes"
                type="textarea"
                :rows="7"
                placeholder="Ex: lembrar da conferência de caixa no fechamento, fluxo de encaixes e observações para recepção e atendimento."
              />
            </n-form-item>
          </div>

          <div class="footer-actions" :class="{ mobile: isMobile }">
            <n-button type="primary" size="large" :loading="saving" :block="isMobile" @click="handleSave">
              Salvar alterações
            </n-button>
          </div>
        </n-card>
      </n-form>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import cepPromise from 'cep-promise'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { formatBrazilPhone } from '~/composables/useBrazilPhone'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type ImageField = 'logo' | 'login'
type ClinicTabKey = 'general' | 'branding' | 'technical' | 'hours' | 'preferences' | 'fiscal' | 'notes'

interface BusinessHourInterval {
  start: string | null
  end: string | null
}

type BusinessHoursModel = Record<DayKey, BusinessHourInterval[]>

interface ClinicSettingsForm {
  id?: number
  name: string
  shortName: string
  street: string
  number: string
  district: string
  complement: string
  zipCode: string
  city: string
  state: string | null
  cnpj: string
  phone: string
  whatsapp: string
  email: string
  defaultCurrency: string
  timezone: string
  logoUrl: string
  loginImageUrl: string
  primaryColor: string
  secondaryColor: string
  loginMessage: string
  technicalResponsibleName: string
  technicalResponsibleCrmv: string
  technicalResponsibleCrmvUf: string | null
  appointmentSlotDurationMinutes: number
  checkInToleranceMinutes: number
  accountsPayableRecurrenceHorizonMonths: number
  notes: string
  businessHours: BusinessHoursModel
}

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const saving = ref(false)
const savingProfile = ref(false)
const savingNfce = ref(false)
const uploadingCertificate = ref(false)
const zipLoading = ref(false)
const uploadingLogo = ref(false)
const uploadingLoginImage = ref(false)
const isMobile = ref(false)
const logoFileInputRef = ref<HTMLInputElement | null>(null)
const loginImageFileInputRef = ref<HTMLInputElement | null>(null)
const certificateFileInputRef = ref<HTMLInputElement | null>(null)
const route = useRoute()
const router = useRouter()
const activeTab = ref<ClinicTabKey>('general')
const currentProfileId = ref<number | null>(null)
const selectedCertificateFile = ref<File | null>(null)
const certificateConfigured = ref(false)
const nfceCscMasked = ref('')
const editingNfceCsc = ref(false)
const editingCertificatePassword = ref(false)
const certificatePasswordConfigured = ref(false)
const certificateMetadata = ref<{ storageMode: string; validTo: string | null; passwordConfigured: boolean } | null>(null)
const municipioOptions = ref<{ label: string; value: string; nome: string; uf: string }[]>([])
const loadingMunicipios = ref(false)
let mediaQuery: MediaQueryList | null = null
let municipioSearchTimer: ReturnType<typeof setTimeout> | null = null

const tabs: Array<{ key: ClinicTabKey; label: string; title: string; description?: string }> = [
  { key: 'general', label: 'Dados gerais', title: 'Dados gerais', description: 'Informações institucionais e canais principais de contato da clínica.' },
  { key: 'branding', label: 'Identidade visual', title: 'Identidade visual', description: 'Configure imagens, cores e a mensagem exibida na tela de login.' },
  { key: 'technical', label: 'Responsável técnico', title: 'Responsável técnico', description: 'Dados do profissional responsável pela operação técnica da clínica.' },
  { key: 'hours', label: 'Horários', title: 'Horário de funcionamento', description: 'Defina períodos por dia da semana com suporte a múltiplos intervalos.' },
  { key: 'preferences', label: 'Preferências', title: 'Preferências operacionais', description: 'Parâmetros usados pela recepção e rotinas financeiras no dia a dia.' },
  { key: 'fiscal', label: 'Fiscal', title: 'Fiscal', description: 'Configure perfil fiscal, NFC-e, contingência e certificado A1 sem duplicar os dados cadastrais da clínica.' },
  { key: 'notes', label: 'Avisos internos', title: 'Avisos internos', description: 'Orientações internas para recepção, atendimento e fechamento da operação.' },
]

const activeTabMeta = computed(() => tabs.find((tab) => tab.key === activeTab.value) || tabs[0])
const businessDays = [
  { key: 'mon', label: 'Segunda-feira' },
  { key: 'tue', label: 'Terça-feira' },
  { key: 'wed', label: 'Quarta-feira' },
  { key: 'thu', label: 'Quinta-feira' },
  { key: 'fri', label: 'Sexta-feira' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
] as const

const ufOptions = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
].map((uf) => ({ label: uf, value: uf }))

const fiscalModeOptions = [
  { label: 'Inativo', value: 'INATIVO' },
  { label: 'Ativo assíncrono', value: 'ATIVO_ASSINCRONO' },
  { label: 'Ativo síncrono', value: 'ATIVO_SINCRONO' },
]

const environmentOptions = [
  { label: 'Homologação', value: 'HOMOLOG' },
  { label: 'Produção', value: 'PROD' },
]

const createDefaultBusinessHours = (): BusinessHoursModel => ({
  mon: [{ start: '08:00', end: '18:00' }],
  tue: [{ start: '08:00', end: '18:00' }],
  wed: [{ start: '08:00', end: '18:00' }],
  thu: [{ start: '08:00', end: '18:00' }],
  fri: [{ start: '08:00', end: '18:00' }],
  sat: [],
  sun: []
})

const createDefaultModel = (): ClinicSettingsForm => ({
  name: '',
  shortName: '',
  street: '',
  number: '',
  district: '',
  complement: '',
  zipCode: '',
  city: '',
  state: null,
  cnpj: '',
  phone: '',
  whatsapp: '',
  email: '',
  defaultCurrency: 'BRL',
  timezone: 'America/Sao_Paulo',
  logoUrl: '',
  loginImageUrl: '',
  primaryColor: '#2563EB',
  secondaryColor: '#0F172A',
  loginMessage: '',
  technicalResponsibleName: '',
  technicalResponsibleCrmv: '',
  technicalResponsibleCrmvUf: null,
  appointmentSlotDurationMinutes: 30,
  checkInToleranceMinutes: 10,
  accountsPayableRecurrenceHorizonMonths: 12,
  notes: '',
  businessHours: createDefaultBusinessHours()
})

const model = reactive<ClinicSettingsForm>(createDefaultModel())
const initialSnapshot = ref<string>('')

const profileForm = reactive<any>({
  code: 'MATRIZ',
  fiscalMode: 'INATIVO',
  ie: '',
  im: '',
  crt: '',
  cnae: '',
  taxRegime: '',
  ibgeCityCode: '',
  countryCode: '1058',
  isActive: true,
})

const nfceForm = reactive<any>({
  environment: 'HOMOLOG',
  series: 1,
  cscId: '',
  csc: '',
  contingencyEnabled: true,
  contingencyAlertAfterMinutes: 60,
  contingencyCriticalAfterMinutes: 720,
  isActive: true,
})

const certificateForm = reactive<any>({
  password: '',
  validTo: null,
})

const fiscalModeLabel = computed(() =>
  fiscalModeOptions.find((option) => option.value === profileForm.fiscalMode)?.label || profileForm.fiscalMode
)
const environmentLabel = computed(() =>
  environmentOptions.find((option) => option.value === nfceForm.environment)?.label || nfceForm.environment
)
const certificateFileLabel = computed(() =>
  certificateConfigured.value ? 'Certificado já enviado' : 'Nenhum arquivo selecionado'
)

const buildTimezoneOptions = () => {
  const fallback = [
    'UTC',
    'America/Sao_Paulo',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
  ]
  try {
    const maybeIntl = Intl as Intl.DateTimeFormat & {
      supportedValuesOf?: (key: string) => string[]
    }
    if (typeof maybeIntl.supportedValuesOf === 'function') {
      return maybeIntl.supportedValuesOf('timeZone')
        .map((value) => ({ label: value, value }))
        .sort((a, b) => a.label.localeCompare(b.label))
    }
  } catch {
    return fallback.map((value) => ({ label: value, value }))
  }
  return fallback.map((value) => ({ label: value, value }))
}

const timezoneOptions = buildTimezoneOptions()

const rules: FormRules = {
  name: {
    required: true,
    message: 'Nome da clínica é obrigatório',
    trigger: ['blur', 'input']
  },
  cnpj: {
    validator: (_, value) => {
      if (!value) return true
      return isValidCnpj(value) || new Error('Informe um CNPJ válido')
    },
    trigger: ['blur', 'input']
  },
  email: {
    validator: (_, value) => {
      if (!value) return true
      return /\S+@\S+\.\S+/.test(String(value)) || new Error('Informe um e-mail válido')
    },
    trigger: ['blur', 'input']
  },
  defaultCurrency: {
    required: true,
    message: 'Moeda é obrigatória',
    trigger: ['blur', 'input']
  },
  timezone: {
    required: true,
    message: 'Timezone é obrigatório',
    trigger: ['blur', 'change']
  },
  primaryColor: {
    validator: (_, value) => !value || isHexColor(value) || new Error('Use uma cor hexadecimal válida'),
    trigger: ['blur', 'input', 'change']
  },
  secondaryColor: {
    validator: (_, value) => !value || isHexColor(value) || new Error('Use uma cor hexadecimal válida'),
    trigger: ['blur', 'input', 'change']
  },
  appointmentSlotDurationMinutes: {
    type: 'number',
    required: true,
    message: 'Adicione a duração padrão da consulta',
    trigger: ['blur', 'change']
  },
  checkInToleranceMinutes: {
    type: 'number',
    required: true,
    message: 'Informe a tolerância de atraso',
    trigger: ['blur', 'change']
  },
  accountsPayableRecurrenceHorizonMonths: {
    type: 'number',
    required: true,
    message: 'Informe os meses futuros para recorrências',
    trigger: ['blur', 'change']
  }
}

const normalizeHexColor = (value: string | null | undefined, fallback = '') => {
  const normalized = String(value || '').trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback
}

const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(String(value || '').trim())

const updateColor = (field: 'primaryColor' | 'secondaryColor', value: string) => {
  const normalized = String(value || '').trim().toUpperCase()
  model[field] = normalized.startsWith('#') ? normalized : `#${normalized.replace(/^#+/, '')}`
}

const maskCnpj = (value: string) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

const digitsOnly = (value: string) => String(value || '').replace(/\D/g, '')

const formatDateForDisplay = (value: string | number | Date) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date)
}

const maskZipCode = (value: string) => {
  const digits = digitsOnly(value).slice(0, 8)
  return digits.replace(/^(\d{5})(\d)/, '$1-$2')
}

const onZipInput = async (value: string) => {
  model.zipCode = maskZipCode(value)
  const digits = digitsOnly(model.zipCode)
  if (digits.length === 8) {
    await fetchAddressByZip(digits)
  }
}

const fetchAddressByZip = async (zip: string) => {
  if (zipLoading.value) return
  zipLoading.value = true
  try {
    const data = await cepPromise(zip)
    model.street = data.street || model.street
    model.district = data.neighborhood || model.district
    model.city = data.city || model.city
    model.state = data.state || model.state
  } catch (err: any) {
    message.error(err?.message || 'CEP não encontrado')
  } finally {
    zipLoading.value = false
  }
}

const normalizeIbgeCityCode = (value: unknown) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 7)

const handleMunicipioInput = (value: string) => {
  const selected = municipioOptions.value.find((option) => option.value === value)
  if (selected) {
    profileForm.ibgeCityCode = selected.value
    model.city = selected.nome || model.city
    model.state = selected.uf || model.state
    return
  }

  if (municipioSearchTimer) clearTimeout(municipioSearchTimer)
  const search = String(value || '').trim()
  if (search.length < 2) {
    municipioOptions.value = []
    return
  }
  municipioSearchTimer = setTimeout(() => searchMunicipios(search), 300)
}

const searchMunicipios = async (search: string) => {
  const uf = String(model.state || '').trim().toUpperCase()
  const api = useApi()
  loadingMunicipios.value = true
  try {
    const params = new URLSearchParams({ search })
    if (/^[A-Z]{2}$/.test(uf)) params.set('uf', uf)
    const data = await api<any[]>(`/api/v1/fiscal/municipios?${params.toString()}`)
    municipioOptions.value = (Array.isArray(data) ? data : [])
      .map((item: any) => {
        const code = normalizeIbgeCityCode(item.codigoIbge)
        const nome = String(item.nome || '').trim()
        const optionUf = String(item.uf || '').trim().toUpperCase()
        return {
          label: `${nome} / ${optionUf} - ${code}`,
          value: code,
          nome,
          uf: optionUf,
        }
      })
      .filter((item) => item.value.length === 7 && item.nome && item.uf)
      .slice(0, 30)
  } catch {
    municipioOptions.value = []
  } finally {
    loadingMunicipios.value = false
  }
}

const buildFiscalProfilePayload = () => {
  const clinicName = String(model.name || '').trim()
  const shortName = String(model.shortName || '').trim()
  return {
    ...profileForm,
    code: String(profileForm.code || '').trim() || 'MATRIZ',
    tradeName: shortName || clinicName,
    legalName: clinicName,
    cnpj: digitsOnly(model.cnpj),
    ie: String(profileForm.ie || '').trim() || null,
    im: String(profileForm.im || '').trim() || null,
    cnae: String(profileForm.cnae || '').trim() || null,
    crt: String(profileForm.crt || '').trim() || null,
    taxRegime: String(profileForm.taxRegime || '').trim() || null,
    phone: String(model.phone || model.whatsapp || '').trim() || null,
    email: String(model.email || '').trim() || null,
    street: String(model.street || '').trim() || null,
    number: String(model.number || '').trim() || null,
    complement: String(model.complement || '').trim() || null,
    district: String(model.district || '').trim() || null,
    city: String(model.city || '').trim() || null,
    state: String(model.state || '').trim().toUpperCase() || null,
    zipCode: String(model.zipCode || '').trim() || null,
    ibgeCityCode: normalizeIbgeCityCode(profileForm.ibgeCityCode),
    countryCode: String(profileForm.countryCode || '').trim() || '1058',
    fiscalMode: profileForm.fiscalMode || 'INATIVO',
    isActive: profileForm.isActive !== undefined ? Boolean(profileForm.isActive) : true,
  }
}

const loadFiscalSettings = async () => {
  const api = useApi()
  try {
    const response = await api<any>('/api/v1/fiscal/settings')
    const profiles = Array.isArray(response.profiles) ? response.profiles : []
    const profile = profiles.find((item: any) => item.isActive) || profiles[0]
    if (!profile) {
      currentProfileId.value = null
      certificateConfigured.value = false
      certificateMetadata.value = null
      certificatePasswordConfigured.value = false
      editingCertificatePassword.value = false
      nfceCscMasked.value = ''
      editingNfceCsc.value = false
      return
    }
    currentProfileId.value = Number(profile.id)
    Object.assign(profileForm, {
      code: profile.code || 'MATRIZ',
      fiscalMode: profile.fiscalMode || 'INATIVO',
      ie: profile.ie || '',
      im: profile.im || '',
      crt: profile.crt || '',
      cnae: profile.cnae || '',
      taxRegime: profile.taxRegime || '',
      ibgeCityCode: profile.ibgeCityCode || '',
      countryCode: profile.countryCode || '1058',
      isActive: profile.isActive ?? true,
    })
    const nfceConfigs = Array.isArray(profile.nfceConfigs) ? profile.nfceConfigs : []
    const nfce =
      nfceConfigs.find((item: any) => item.isActive && item.environment === nfceForm.environment) ||
      nfceConfigs.find((item: any) => item.isActive) ||
      nfceConfigs[0]
    if (nfce) {
      Object.assign(nfceForm, {
        environment: nfce.environment,
        series: Number(nfce.series || 1),
        cscId: nfce.cscId || '',
        csc: '',
        contingencyEnabled: Boolean(nfce.contingencyEnabled),
        contingencyAlertAfterMinutes: Number(nfce.contingencyAlertAfterMinutes || 60),
        contingencyCriticalAfterMinutes: Number(nfce.contingencyCriticalAfterMinutes || 720),
        isActive: nfce.isActive,
      })
      nfceCscMasked.value = nfce.cscMasked || ''
      editingNfceCsc.value = false
    } else {
      nfceCscMasked.value = ''
      editingNfceCsc.value = false
    }
    const certificates = Array.isArray(profile.certificates) ? profile.certificates : []
    const certificate =
      certificates.find((item: any) => item.isActive) ||
      certificates[0]
    certificateConfigured.value = Boolean(certificate?.isActive)
    certificatePasswordConfigured.value = Boolean(certificate?.passwordConfigured)
    editingCertificatePassword.value = false
    certificateMetadata.value = certificate
      ? {
          storageMode: certificate.storageMode || 'LOCAL',
          validTo: certificate.validTo ? formatDateForDisplay(certificate.validTo) : null,
          passwordConfigured: Boolean(certificate.passwordConfigured),
        }
      : null
    certificateForm.validTo = certificate?.validTo ? new Date(certificate.validTo).getTime() : null
  } catch {
    message.error('Erro ao carregar configurações fiscais')
  }
}

const persistFiscalProfile = async () => {
  const payload = buildFiscalProfilePayload()
  if (!payload.legalName || !payload.tradeName || !payload.cnpj) {
    throw new Error('Preencha nome da clínica e CNPJ em Dados gerais antes de salvar o perfil fiscal.')
  }

  const api = useApi()
  savingProfile.value = true
  try {
    const response = await api<any>(
      currentProfileId.value
        ? `/api/v1/fiscal/profiles/${currentProfileId.value}`
        : '/api/v1/fiscal/profiles',
      {
        method: currentProfileId.value ? 'PATCH' : 'POST',
        body: payload,
      },
    )
    currentProfileId.value = Number(response.id)
  } catch (error: any) {
    throw new Error(error?.data?.message || 'Erro ao salvar perfil fiscal.')
  } finally {
    savingProfile.value = false
  }
}

const persistNfceConfig = async () => {
  if (!currentProfileId.value) {
    throw new Error('Salve o perfil fiscal antes de configurar a NFC-e.')
  }
  const api = useApi()
  const payload = {
    ...nfceForm,
    csc: editingNfceCsc.value || !nfceCscMasked.value ? nfceForm.csc : '',
  }
  savingNfce.value = true
  try {
    await api(`/api/v1/fiscal/profiles/${currentProfileId.value}/nfce-configs`, {
      method: 'POST',
      body: payload,
    })
    nfceForm.csc = ''
    editingNfceCsc.value = false
  } catch (error: any) {
    throw new Error(error?.data?.message || 'Erro ao salvar configuração NFC-e.')
  } finally {
    savingNfce.value = false
  }
}

const handleCertificateFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  selectedCertificateFile.value = input.files?.[0] || null
  if (selectedCertificateFile.value) {
    editingCertificatePassword.value = true
  }
}

const toggleNfceCscEdit = () => {
  editingNfceCsc.value = !editingNfceCsc.value
  nfceForm.csc = ''
}

const toggleCertificatePasswordEdit = () => {
  const wasEditing = editingCertificatePassword.value
  editingCertificatePassword.value = !editingCertificatePassword.value
  certificateForm.password = ''
  if (wasEditing && selectedCertificateFile.value) {
    selectedCertificateFile.value = null
    if (certificateFileInputRef.value) {
      certificateFileInputRef.value.value = ''
    }
  }
}

const persistCertificate = async () => {
  if (!currentProfileId.value) {
    throw new Error('Salve o perfil fiscal antes de enviar o certificado.')
  }
  if (!selectedCertificateFile.value) {
    if (editingCertificatePassword.value && certificateForm.password) {
      await persistCertificatePassword()
    }
    return
  }
  const api = useApi()
  const formData = new FormData()
  formData.append('file', selectedCertificateFile.value)
  formData.append('password', certificateForm.password || '')
  if (certificateForm.validTo) {
    formData.append('validTo', new Date(certificateForm.validTo).toISOString())
  }
  uploadingCertificate.value = true
  try {
    await api(`/api/v1/fiscal/profiles/${currentProfileId.value}/certificates`, {
      method: 'POST',
      body: formData,
    })
    certificateConfigured.value = true
    certificatePasswordConfigured.value = true
    editingCertificatePassword.value = false
    certificateForm.password = ''
    selectedCertificateFile.value = null
    if (certificateFileInputRef.value) {
      certificateFileInputRef.value.value = ''
    }
  } catch (error: any) {
    throw new Error(error?.data?.message || 'Erro ao enviar certificado.')
  } finally {
    uploadingCertificate.value = false
  }
}

const persistCertificatePassword = async () => {
  if (!currentProfileId.value) {
    throw new Error('Salve o perfil fiscal antes de alterar a senha do certificado.')
  }
  const password = String(certificateForm.password || '').trim()
  if (!password) {
    throw new Error('Informe a nova senha do certificado.')
  }

  const api = useApi()
  uploadingCertificate.value = true
  try {
    await api(`/api/v1/fiscal/profiles/${currentProfileId.value}/certificates/password`, {
      method: 'PATCH',
      body: { password },
    })
    certificatePasswordConfigured.value = true
    editingCertificatePassword.value = false
    certificateForm.password = ''
  } catch (error: any) {
    throw new Error(error?.data?.message || 'Erro ao alterar senha do certificado.')
  } finally {
    uploadingCertificate.value = false
  }
}

const isValidCnpj = (value: string) => {
  const digits = digitsOnly(value)
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const calculateDigit = (base: string, factors: number[]) => {
    const total = base.split('').reduce((acc, digit, index) => acc + Number(digit) * factors[index], 0)
    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const d1 = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calculateDigit(digits.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return digits === `${digits.slice(0, 12)}${d1}${d2}`
}

const toMinutes = (value: string) => {
  const [hour, minute] = String(value).split(':').map(Number)
  return (hour * 60) + minute
}

const cloneBusinessHours = (hours: BusinessHoursModel): BusinessHoursModel =>
  businessDays.reduce((acc, day) => {
    acc[day.key] = hours[day.key].map((interval) => ({
      start: interval.start,
      end: interval.end,
    }))
    return acc
  }, {} as BusinessHoursModel)

const snapshotModel = () => JSON.stringify({
  ...model,
  businessHours: cloneBusinessHours(model.businessHours),
})

const resetModel = (payload: ClinicSettingsForm) => {
  Object.assign(model, payload, {
    businessHours: cloneBusinessHours(payload.businessHours)
  })
  initialSnapshot.value = snapshotModel()
}

const normalizeBusinessHours = (raw: unknown): BusinessHoursModel => {
  const empty = createDefaultBusinessHours()
  if (!raw || typeof raw !== 'object') return empty

  for (const day of businessDays) {
    const value = (raw as Record<string, unknown>)[day.key]
    if (!Array.isArray(value)) {
      empty[day.key] = []
      continue
    }

    empty[day.key] = value
      .map((item) => {
        if (typeof item === 'string') {
          const [start, end] = item.split('-')
          return start && end ? { start, end } : null
        }
        if (item && typeof item === 'object') {
          const start = String((item as any).start || '').trim()
          const end = String((item as any).end || '').trim()
          return start || end ? { start: start || null, end: end || null } : null
        }
        return null
      })
      .filter(Boolean) as BusinessHourInterval[]
  }

  return empty
}

const parseBusinessHoursJson = (value: string | null | undefined) => {
  if (!value) return createDefaultBusinessHours()
  try {
    return normalizeBusinessHours(JSON.parse(value))
  } catch {
    return createDefaultBusinessHours()
  }
}

const serializeBusinessHours = () => {
  const payload = businessDays.reduce((acc, day) => {
    acc[day.key] = model.businessHours[day.key].map((interval) => ({
      start: interval.start as string,
      end: interval.end as string,
    }))
    return acc
  }, {} as Record<DayKey, { start: string; end: string }[]>)

  return JSON.stringify(payload)
}

const isDayOpen = (day: DayKey) => model.businessHours[day].length > 0

const setDayOpen = (day: DayKey, open: boolean) => {
  model.businessHours[day] = open ? [{ start: '08:00', end: '18:00' }] : []
}

const addInterval = (day: DayKey) => {
  model.businessHours[day].push({ start: '08:00', end: '18:00' })
}

const removeInterval = (day: DayKey, index: number) => {
  model.businessHours[day].splice(index, 1)
  if (!model.businessHours[day].length) {
    model.businessHours[day] = []
  }
}

const applyBusinessHoursPreset = () => {
  model.businessHours = {
    mon: [{ start: '08:00', end: '18:00' }],
    tue: [{ start: '08:00', end: '18:00' }],
    wed: [{ start: '08:00', end: '18:00' }],
    thu: [{ start: '08:00', end: '18:00' }],
    fri: [{ start: '08:00', end: '18:00' }],
    sat: [{ start: '08:00', end: '12:00' }],
    sun: [],
  }
}

const copyMondayToFriday = () => {
  const monday = model.businessHours.mon.map((interval) => ({ ...interval }))
  ;(['tue', 'wed', 'thu', 'fri'] as DayKey[]).forEach((day) => {
    model.businessHours[day] = monday.map((interval) => ({ ...interval }))
  })
}

const validateBusinessHours = () => {
  for (const day of businessDays) {
    const intervals = model.businessHours[day.key]
    if (!intervals.length) continue

    const sorted = [...intervals]
      .map((interval, index) => ({ ...interval, index }))
      .sort((a, b) => toMinutes(String(a.start)) - toMinutes(String(b.start)))

    for (const interval of sorted) {
      if (!interval.start || !interval.end) {
        message.error(`${day.label}: informe hora inicial e final em todos os intervalos.`)
        return false
      }
      if (toMinutes(interval.start) >= toMinutes(interval.end)) {
        message.error(`${day.label}: a hora inicial deve ser menor que a hora final.`)
        return false
      }
    }

    for (let i = 1; i < sorted.length; i += 1) {
      const previous = sorted[i - 1]
      const current = sorted[i]
      if (toMinutes(current.start as string) < toMinutes(previous.end as string)) {
        message.error(`${day.label}: os intervalos não podem se sobrepor.`)
        return false
      }
    }
  }
  return true
}

const clearImage = async (field: ImageField) => {
  if (field === 'logo') uploadingLogo.value = true
  else uploadingLoginImage.value = true

  const api = useApi()
  try {
    const response = await api<any>(`/api/v1/clinic-settings/image/${field}`, {
      method: 'DELETE',
    })
    model.logoUrl = response.logoUrl || ''
    model.loginImageUrl = response.loginImageUrl || ''
    initialSnapshot.value = snapshotModel()
    message.success('Imagem removida.')
  } catch (err: any) {
    const apiMessage = Array.isArray(err?.data?.message)
      ? err.data.message.join(', ')
      : err?.data?.message
    message.error(apiMessage || 'Erro ao remover imagem')
  } finally {
    if (field === 'logo') uploadingLogo.value = false
    else uploadingLoginImage.value = false
  }
}

const onImageSelected = async (field: ImageField, event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    message.error('Selecione um arquivo de imagem válido.')
    if (input) input.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    message.error('A imagem deve ter no máximo 5 MB.')
    if (input) input.value = ''
    return
  }

  const api = useApi()
  const formData = new FormData()
  formData.append('file', file)

  if (field === 'logo') uploadingLogo.value = true
  else uploadingLoginImage.value = true

  try {
    const response = await api<any>(`/api/v1/clinic-settings/upload-image/${field}`, {
      method: 'POST',
      body: formData,
    })
    model.logoUrl = response.logoUrl || ''
    model.loginImageUrl = response.loginImageUrl || ''
    initialSnapshot.value = snapshotModel()
    message.success('Imagem enviada.')
  } catch (err: any) {
    const apiMessage = Array.isArray(err?.data?.message)
      ? err.data.message.join(', ')
      : err?.data?.message
    message.error(apiMessage || 'Erro ao enviar imagem')
  } finally {
    if (field === 'logo') uploadingLogo.value = false
    else uploadingLoginImage.value = false
    if (input) input.value = ''
  }
}

const fetchSettings = async () => {
  loading.value = true
  const api = useApi()
  try {
    const data = await api<any>('/api/v1/clinic-settings')
    resetModel({
      id: data.id,
      name: data.name || '',
      shortName: data.shortName || '',
      street: data.street || '',
      number: data.number || '',
      district: data.district || '',
      complement: data.complement || '',
      zipCode: data.zipCode || '',
      city: data.city || '',
      state: data.state || null,
      cnpj: data.cnpj || '',
      phone: formatBrazilPhone(data.phone || ''),
      whatsapp: formatBrazilPhone(data.whatsapp || ''),
      email: data.email || '',
      defaultCurrency: data.defaultCurrency || 'BRL',
      timezone: data.timezone || 'America/Sao_Paulo',
      logoUrl: data.logoUrl || '',
      loginImageUrl: data.loginImageUrl || '',
      primaryColor: normalizeHexColor(data.primaryColor, '#2563EB'),
      secondaryColor: normalizeHexColor(data.secondaryColor, '#0F172A'),
      loginMessage: data.loginMessage || '',
      technicalResponsibleName: data.technicalResponsibleName || '',
      technicalResponsibleCrmv: data.technicalResponsibleCrmv || '',
      technicalResponsibleCrmvUf: data.technicalResponsibleCrmvUf || null,
      appointmentSlotDurationMinutes: Number(data.appointmentSlotDurationMinutes ?? 30),
      checkInToleranceMinutes: Number(data.checkInToleranceMinutes ?? 10),
      accountsPayableRecurrenceHorizonMonths: Number(data.accountsPayableRecurrenceHorizonMonths ?? 12),
      notes: data.notes || '',
      businessHours: parseBusinessHoursJson(data.businessHoursJson),
    })
  } catch {
    message.error('Erro ao carregar configurações')
  } finally {
    loading.value = false
  }
}

const buildClinicSettingsPayload = () => ({
  name: model.name.trim(),
  shortName: model.shortName.trim() || null,
  street: model.street.trim() || null,
  number: model.number.trim() || null,
  district: model.district.trim() || null,
  complement: model.complement.trim() || null,
  zipCode: model.zipCode.trim() || null,
  city: model.city.trim() || null,
  state: model.state || null,
  cnpj: model.cnpj.trim() || null,
  phone: model.phone.trim() || null,
  whatsapp: model.whatsapp.trim() || null,
  email: model.email.trim() || null,
  defaultCurrency: model.defaultCurrency.trim().toUpperCase(),
  timezone: model.timezone.trim() || 'America/Sao_Paulo',
  primaryColor: normalizeHexColor(model.primaryColor, '#2563EB'),
  secondaryColor: normalizeHexColor(model.secondaryColor, '#0F172A'),
  loginMessage: model.loginMessage.trim() || null,
  technicalResponsibleName: model.technicalResponsibleName.trim() || null,
  technicalResponsibleCrmv: model.technicalResponsibleCrmv.trim() || null,
  technicalResponsibleCrmvUf: model.technicalResponsibleCrmvUf || null,
  appointmentSlotDurationMinutes: model.appointmentSlotDurationMinutes,
  checkInToleranceMinutes: model.checkInToleranceMinutes,
  accountsPayableRecurrenceHorizonMonths: model.accountsPayableRecurrenceHorizonMonths,
  notes: model.notes.trim() || null,
  businessHoursJson: serializeBusinessHours(),
})

const persistClinicSettings = async () => {
  const api = useApi()
  await api('/api/v1/clinic-settings', {
    method: 'PATCH',
    body: buildClinicSettingsPayload(),
  })
}

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    if (!validateBusinessHours()) return

    saving.value = true
    await persistClinicSettings()

    if (activeTab.value === 'fiscal') {
      await persistFiscalProfile()
      await persistNfceConfig()
      await persistCertificate()
      await loadFiscalSettings()
    }

    message.success('Configurações salvas com sucesso')
    await fetchSettings()
  } catch (err: any) {
    if (err?.message !== 'Form validation failed') {
      message.error(err?.data?.message || 'Erro ao salvar configurações')
    }
  } finally {
    saving.value = false
  }
}

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
}

const isClinicTabKey = (value: unknown): value is ClinicTabKey =>
  tabs.some((tab) => tab.key === value)

watch(
  () => route.query.tab,
  (tab) => {
    const value = Array.isArray(tab) ? tab[0] : tab
    if (isClinicTabKey(value) && activeTab.value !== value) {
      activeTab.value = value
    }
  },
  { immediate: true }
)

watch(activeTab, (tab) => {
  if (route.query.tab === tab) return
  router.replace({ query: { ...route.query, tab } })
})

onMounted(() => {
  if (process.client) {
    mediaQuery = window.matchMedia('(max-width: 768px)')
    updateIsMobile()
    mediaQuery.addEventListener('change', updateIsMobile)
  }
  fetchSettings()
  loadFiscalSettings()
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile)
})
</script>

<style scoped>
.page {
  padding: 0 0 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f4f6fb;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.head-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4b5563;
}

h1,
h2,
h3,
.subhead,
.card-description,
.preview-empty,
.closed-state,
.day-toggle,
.interval-separator {
  margin: 0;
}

h1 {
  font-size: 22px;
  line-height: 1.15;
}

.subhead {
  margin: 0;
  max-width: 720px;
  color: #6b7280;
  font-size: 14px;
}

.content-frame {
  width: 100%;
  max-width: 900px;
  margin-inline: auto;
}

.tabs-shell {
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 18px;
  overflow: hidden;
}

.tabs-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-button {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  padding: 0 0 12px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.tab-button.active {
  color: #059669;
  font-weight: 700;
  border-bottom-color: #059669;
}

.section-card {
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: none;
}

.section-card :deep(.n-card__content) {
  padding: 20px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.card-head h2 {
  font-size: 1.125rem;
  color: #0f172a;
}

.card-description {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 14px;
}

.span-2 {
  grid-column: 1 / -1;
}

.line-break-after {
  grid-column: 1 / 2;
}

.address-row-start {
  grid-column: 1 / 2;
}

.branding-layout {
  display: grid;
  gap: 14px;
}

.assets-row {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 14px;
  align-items: stretch;
}

.asset-panel,
.day-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.asset-header,
.day-card h3 {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.asset-header h3,
.day-card h3,
.brand-section h3 {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
}

.day-card p,
.closed-state {
  margin-top: 3px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
}

.asset-actions,
.quick-actions,
.footer-actions,
.day-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.asset-actions {
  margin-top: 0;
}

.asset-panel-logo .asset-header {
  flex-direction: column;
}

.asset-panel-logo .asset-actions {
  gap: 6px;
}

.asset-panel-logo .asset-actions :deep(.n-button) {
  flex: 1 1 auto;
}

.hidden-input {
  display: none;
}

.asset-box {
  margin-top: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
}

.asset-box-logo {
  display: grid;
  gap: 10px;
  justify-items: center;
}

.asset-panel-login .asset-box {
  display: grid;
  gap: 12px;
}

.logo-preview,
.login-preview {
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-preview {
  width: 96px;
  height: 96px;
  padding: 10px;
}

.logo-preview img {
  max-width: 100%;
  max-height: 76px;
  object-fit: contain;
}

.login-preview {
  aspect-ratio: 16 / 9;
  max-height: 240px;
}

.login-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-empty {
  color: #94a3b8;
  font-size: 0.875rem;
}

.brand-section {
  padding-top: 2px;
}

.brand-section :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

.color-field {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  width: 100%;
}

.fiscal-tab {
  display: grid;
  gap: 22px;
}

.fiscal-section {
  display: grid;
  gap: 10px;
}

.fiscal-section + .fiscal-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 18px;
}

.fiscal-section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.fiscal-section-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.file-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  width: 100%;
}

.secret-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  width: 100%;
}

.file-name {
  min-width: 0;
  color: #64748b;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hours-list {
  display: grid;
  gap: 10px;
}

.day-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.day-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-weight: 600;
}

.interval-list {
  display: grid;
  gap: 8px;
}

.interval-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto minmax(120px, 1fr) auto auto;
  gap: 8px;
  align-items: center;
}

.interval-input {
  margin-bottom: 0;
}

.interval-separator {
  color: #64748b;
  font-size: 0.95rem;
}

.closed-state {
  padding-top: 0;
  border-radius: 0;
  background: transparent;
}

.notes-panel :deep(textarea) {
  min-height: 160px;
}

.footer-actions {
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .page {
    width: 100%;
    padding-bottom: 24px;
  }

  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .head-copy {
    gap: 2px;
  }

  h1 {
    font-size: 19px;
    line-height: 1.1;
  }

  .subhead {
    font-size: 13px;
  }

  .content-frame {
    max-width: 100%;
  }

  .card-head,
  .asset-header,
  .asset-box-logo,
  .assets-row,
  .form-grid,
  .interval-row,
  .footer-actions.mobile {
    grid-template-columns: 1fr;
    display: grid;
  }

  .card-head,
  .day-card-head,
  .asset-header,
  .fiscal-section-head {
    display: flex;
    flex-direction: column;
  }

  .fiscal-section-head {
    align-items: flex-start;
  }

  .file-picker {
    align-items: flex-start;
    flex-direction: column;
  }

  .secret-field {
    grid-template-columns: 1fr;
  }

  .form-grid {
    gap: 0 0;
  }

  .asset-box-logo {
    gap: 10px;
  }

  .tabs-scroll {
    gap: 18px;
  }

  .section-card :deep(.n-card__content) {
    padding: 16px;
  }

  .color-field {
    grid-template-columns: 88px 1fr;
  }

  .interval-row {
    gap: 8px;
  }

  .interval-separator {
    display: none;
  }

  .footer-actions.mobile {
    gap: 10px;
  }
}
</style>
