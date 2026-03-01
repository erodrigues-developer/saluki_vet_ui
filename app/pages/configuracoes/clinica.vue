<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Configurações</p>
        <h1>Dados da Clínica</h1>
      </div>
    </div>

    <n-card :bordered="false" class="settings-card">
      <n-spin :show="loading">
        <n-form
          ref="formRef"
          :model="model"
          :rules="rules"
          label-placement="top"
          :show-require-mark="false"
        >
          <div class="grid">
            <n-form-item label="Duração padrão de consulta (minutos)" path="appointmentSlotDurationMinutes">
              <n-input-number
                v-model:value="model.appointmentSlotDurationMinutes"
                :min="1"
                :step="5"
                placeholder="Ex: 30"
                style="width: 100%"
              />
            </n-form-item>

            <n-form-item label="Moeda Padrão" path="defaultCurrency">
              <n-input v-model:value="model.defaultCurrency" placeholder="BRL" />
            </n-form-item>

            <n-form-item label="URL da Logo" path="logoUrl" class="full-row">
              <n-input v-model:value="model.logoUrl" placeholder="https://..." />
            </n-form-item>

            <n-form-item label="Avisos / Instruções Internas" path="notes" class="full-row">
              <n-input
                v-model:value="model.notes"
                type="textarea"
                :rows="4"
                placeholder="Exibir no rodapé de recibos ou agenda interna..."
              />
            </n-form-item>
          </div>

          <!-- Horários de funcionamento simplificados para o MVP -->
          <div class="business-hours">
            <h3>Horário de Funcionamento</h3>
            <p class="section-desc">Configure os horários em formato JSON (ex: {"seg": ["08:00-18:00"]})</p>
            <n-form-item path="businessHoursJson">
              <n-input
                v-model:value="model.businessHoursJson"
                type="textarea"
                :rows="6"
                placeholder='{ "seg": ["08:00-12:00", "13:00-18:00"], "ter": ["08:00-18:00"] }'
                style="font-family: monospace;"
              />
            </n-form-item>
          </div>

          <div class="actions">
            <n-button type="primary" :loading="saving" @click="handleSave" size="large">
              Salvar Alterações
            </n-button>
          </div>
        </n-form>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

interface ClinicSettings {
  id?: number
  appointmentSlotDurationMinutes: number
  businessHoursJson?: string | null
  logoUrl?: string | null
  defaultCurrency: string
  notes?: string | null
}

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)

const model = reactive<ClinicSettings>({
  appointmentSlotDurationMinutes: 30,
  defaultCurrency: 'BRL',
  notes: '',
  logoUrl: '',
  businessHoursJson: ''
})

const rules: FormRules = {
  appointmentSlotDurationMinutes: { type: 'number', required: true, message: 'Adicione a duração em minutos', trigger: ['blur', 'change'] },
  defaultCurrency: { required: true, message: 'Moeda é obrigatória', trigger: 'blur' },
  businessHoursJson: {
    validator: (_, value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch (e) {
        return new Error('JSON inválido')
      }
    },
    trigger: ['blur', 'input']
  }
}

const fetchSettings = async () => {
  loading.value = true
  const api = useApi()
  try {
    const data = await api<ClinicSettings>('/api/v1/clinic-settings')
    Object.assign(model, {
      id: data.id,
      appointmentSlotDurationMinutes: data.appointmentSlotDurationMinutes,
      defaultCurrency: data.defaultCurrency || 'BRL',
      notes: data.notes || '',
      logoUrl: data.logoUrl || '',
      businessHoursJson: data.businessHoursJson || ''
    })
  } catch (err) {
    message.error('Erro ao carregar configurações')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true

    // Convert empty strings to null/undefined before sending if needed,
    // or backend handles partial updates.
    const api = useApi()
    await api('/api/v1/clinic-settings', {
      method: 'PATCH',
      body: {
        appointmentSlotDurationMinutes: model.appointmentSlotDurationMinutes,
        defaultCurrency: model.defaultCurrency,
        notes: model.notes || null,
        logoUrl: model.logoUrl || null,
        businessHoursJson: model.businessHoursJson || null
      }
    })

    message.success('Configurações salvas com sucesso')
    await fetchSettings() // reload
  } catch (err: any) {
    if (err.message !== 'Form validation failed') {
       message.error(err?.data?.message || 'Erro ao salvar configurações')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eyebrow {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0;
}

h1 {
  margin: 4px 0 0;
  font-size: 24px;
}

.settings-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr 1fr;
  margin-top: 8px;
}

.full-row {
  grid-column: 1 / -1;
}

.business-hours {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.business-hours h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.section-desc {
  color: #6b7280;
  font-size: 13px;
  margin: 0 0 16px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
}
</style>
