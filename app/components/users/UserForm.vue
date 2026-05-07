<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    :show-require-mark="false"
    :disabled="loading"
  >
    <div class="sections">
      <section class="form-section">
        <div class="section-head">
          <h4 class="section-title">Identificação</h4>
          <div class="active-wrap">
            <span class="active-label">Ativo</span>
            <n-switch v-model:value="model.isActive" />
          </div>
        </div>
        <div class="section-grid">
          <n-form-item label="Nome *" path="name" required>
            <n-input v-model:value="model.name" placeholder="Nome completo" />
          </n-form-item>

          <n-form-item label="E-mail *" path="email" required>
            <n-input v-model:value="model.email" placeholder="email@exemplo.com" :disabled="!!model.id" />
          </n-form-item>

          <n-form-item label="Telefone" path="phone">
            <n-input
              v-model:value="model.phone"
              placeholder="(11) 99999-9999"
              :input-props="{ maxlength: 15 }"
              @update:value="onPhoneInput"
            />
          </n-form-item>
        </div>
      </section>

      <section v-if="!isEditMode" class="form-section">
        <div class="section-head">
          <h4 class="section-title">Segurança</h4>
        </div>
        <div class="section-grid">
          <n-form-item label="Configuração de senha" path="securityMode" class="full-row">
            <n-radio-group v-model:value="securityMode" name="security-mode">
              <n-space vertical size="small">
                <n-radio value="invite">Gerar senha temporária e enviar convite</n-radio>
                <n-radio value="manual">Definir senha manualmente</n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>

          <template v-if="securityMode === 'manual'">
            <n-form-item label="Senha *" path="password" required>
              <div class="password-field">
                <n-input
                  v-model:value="model.password"
                  type="password"
                  show-password-on="mousedown"
                  placeholder="Mínimo 8 caracteres"
                />
                <div class="password-strength">
                  <n-progress
                    type="line"
                    :show-indicator="false"
                    :percentage="passwordStrength.percentage"
                    :height="8"
                    :color="passwordStrength.color"
                    :rail-color="'#e5e7eb'"
                    :border-radius="999"
                  />
                  <p class="strength-text" :style="{ color: passwordStrength.color }">
                    {{ passwordStrength.label }}
                  </p>
                  <ul class="strength-rules">
                    <li :class="{ ok: passwordChecks.minLength }">Mínimo de 8 caracteres</li>
                    <li :class="{ ok: passwordChecks.uppercase }">Pelo menos 1 letra maiúscula</li>
                    <li :class="{ ok: passwordChecks.number }">Pelo menos 1 número</li>
                    <li :class="{ ok: passwordChecks.symbol }">Pelo menos 1 símbolo</li>
                  </ul>
                </div>
              </div>
            </n-form-item>
            <n-form-item label="Confirmar senha *" path="confirmPassword" required>
              <n-input
                v-model:value="confirmPassword"
                type="password"
                show-password-on="mousedown"
                placeholder="Repita a senha"
              />
            </n-form-item>
          </template>
        </div>
      </section>

      <section v-else class="form-section">
        <div class="section-head">
          <h4 class="section-title">Segurança</h4>
        </div>
        <div class="section-grid">
          <n-alert class="full-row" type="info" :show-icon="false">
            Para alterar a senha, use a ação “Redefinir senha” na lista de usuários.
          </n-alert>
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <h4 class="section-title">Permissões</h4>
        </div>
        <div class="section-grid">
          <n-form-item label="Papéis de acesso *" path="roleIds" required class="full-row">
            <n-select
              v-model:value="model.roleIds"
              multiple
              :options="roleOptions"
              placeholder="Selecione os papéis de acesso"
              :loading="rolesLoading"
            />
          </n-form-item>
        </div>
      </section>
    </div>
  </n-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { formatBrazilPhone } from '~/composables/useBrazilPhone'

export interface Role {
  id: number
  name: string
  code: string
}

export interface User {
  id?: number
  name: string
  email: string
  password?: string
  phone?: string | null
  isActive: boolean
  roleIds: number[]
  roles?: Role[]
}

const props = defineProps<{
  value?: User | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: User): void
  (e: 'validity-change', isValid: boolean): void
}>()

const message = useMessage()
const rolesLoading = ref(false)
const roleOptions = ref<{ label: string; value: number }[]>([])
const securityMode = ref<'invite' | 'manual'>('invite')
const confirmPassword = ref('')

const formRef = ref<FormInst | null>(null)
const model = reactive<User>({
  id: undefined,
  name: '',
  email: '',
  password: '',
  phone: '',
  isActive: true,
  roleIds: []
})

const isEditMode = computed(() => Boolean(model.id))
const passwordChecks = computed(() => {
  const password = model.password || ''
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password)
  }
})
const passwordStrength = computed(() => {
  const checks = Object.values(passwordChecks.value)
  const score = checks.filter(Boolean).length
  if (!model.password) {
    return { percentage: 0, label: 'Digite uma senha', color: '#6b7280' }
  }
  if (score <= 1) {
    return { percentage: 25, label: 'Senha fraca', color: '#dc2626' }
  }
  if (score === 2) {
    return { percentage: 50, label: 'Senha regular', color: '#d97706' }
  }
  if (score === 3) {
    return { percentage: 75, label: 'Senha boa', color: '#2563eb' }
  }
  return { percentage: 100, label: 'Senha forte', color: '#16a34a' }
})
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isFormSubmittable = computed(() => {
  const hasName = Boolean((model.name || '').trim())
  const hasValidEmail = isValidEmail((model.email || '').trim())
  const hasRoles = Array.isArray(model.roleIds) && model.roleIds.length > 0
  if (!hasName || !hasValidEmail || !hasRoles) return false

  if (!model.id && securityMode.value === 'manual') {
    const hasPassword = Boolean(model.password)
    const hasConfirm = Boolean(confirmPassword.value)
    const samePassword = (model.password || '') === confirmPassword.value
    const meetsCriteria = Object.values(passwordChecks.value).every(Boolean)
    return hasPassword && hasConfirm && samePassword && meetsCriteria
  }

  return true
})

const rules: FormRules = {
  name: { required: true, message: 'Nome é obrigatório', trigger: 'blur' },
  email: [
    { required: true, message: 'E-mail é obrigatório', trigger: 'blur' },
    { type: 'email', message: 'E-mail inválido', trigger: ['blur', 'input'] }
  ],
  password: {
    validator: (_, value) => {
      if (!model.id && securityMode.value === 'manual' && !value) return new Error('Senha é obrigatória')
      if (!model.id && securityMode.value === 'manual') {
        if (!passwordChecks.value.minLength) return new Error('Senha deve ter pelo menos 8 caracteres')
        if (!passwordChecks.value.uppercase) return new Error('Senha deve conter ao menos 1 letra maiúscula')
        if (!passwordChecks.value.number) return new Error('Senha deve conter ao menos 1 número')
        if (!passwordChecks.value.symbol) return new Error('Senha deve conter ao menos 1 símbolo')
      }
      return true
    },
    trigger: ['blur', 'input']
  },
  confirmPassword: {
    validator: () => {
      if (model.id || securityMode.value !== 'manual') return true
      if (!confirmPassword.value) return new Error('Confirmação de senha é obrigatória')
      if ((model.password || '') !== confirmPassword.value) return new Error('As senhas devem ser iguais')
      return true
    },
    trigger: ['blur', 'input']
  },
  roleIds: { type: 'array', required: true, min: 1, message: 'Selecione pelo menos um papel', trigger: 'change' }
}

const fetchRoles = async () => {
  rolesLoading.value = true
  const api = useApi()
  try {
    const roles = await api<Role[]>('/api/v1/roles')
    roleOptions.value = roles.map(r => ({ label: r.name, value: Number(r.id) }))
  } catch (err) {
    message.error('Erro ao carregar papéis')
  } finally {
    rolesLoading.value = false
  }
}

watch(
  () => props.value,
  (val) => {
    Object.assign(model, {
      id: val?.id,
      name: val?.name ?? '',
      email: val?.email ?? '',
      password: '',
      phone: formatBrazilPhone(val?.phone ?? ''),
      isActive: val?.isActive ?? true,
      roleIds: val?.roles?.map(r => Number(r.id)) ?? val?.roleIds ?? []
    })

    securityMode.value = val?.id ? 'manual' : 'invite'
    confirmPassword.value = ''
  },
  { immediate: true }
)
watch(
  isFormSubmittable,
  (val) => {
    emit('validity-change', val)
  },
  { immediate: true }
)

const onPhoneInput = (value: string) => {
  model.phone = formatBrazilPhone(value)
}

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$'
  let generated = ''
  for (let i = 0; i < 10; i += 1) {
    generated += chars[Math.floor(Math.random() * chars.length)]
  }
  return generated
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    const payload: User = { ...model }
    if (!model.id) {
      payload.password = securityMode.value === 'invite' ? generateTemporaryPassword() : (model.password || '')
    } else {
      delete payload.password
    }

    emit('submit', payload)
  } catch (err) {
    // Validation failed
  }
}

defineExpose({
  submit: handleSubmit,
  isSubmittable: isFormSubmittable
})

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #334155;
}

.active-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  margin-top: 1px;
}

.active-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.section-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  align-items: start;
}

.full-row {
  grid-column: 1 / -1;
}

.password-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.password-strength {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.strength-text {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
}

.strength-rules {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 2px;
  font-size: 12px;
  color: #6b7280;
}

.strength-rules li.ok {
  color: #166534;
  font-weight: 600;
}

.password-field :deep(.n-input) {
  width: 100%;
}

@media (max-width: 768px) {
  .form-section {
    padding: 10px;
  }

  .section-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .section-head {
    margin-bottom: 6px;
  }

  .section-title {
    font-size: 15px;
  }
}
</style>
