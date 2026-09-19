<template>
  <div class="login-container">
    <n-card class="login-card" title="Acesso ao Sigma Vet">
      <LoginPuppy
        :field="activeField"
        :progress="emailProgress"
        :happy="isEmailComplete"
        :peeking="passwordVisible"
      />
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        @keyup.enter="handleLogin"
      >
        <n-form-item
          path="email"
          label="Email"
          @focusin="focusEmail"
          @focusout="clearFieldFocus"
          @input="trackEmailCaret"
          @click="trackEmailCaret"
          @keyup="trackEmailCaret"
          @select="trackEmailCaret"
        >
          <n-input
            ref="emailInputRef"
            v-model:value="formValue.email"
            placeholder="Seu e-mail cadastrado"
            autofocus
            @keydown.enter.prevent
          />
        </n-form-item>

        <n-form-item
          path="password"
          label="Senha"
          @focusin="activeField = 'password'"
          @focusout="clearFieldFocus"
        >
          <n-input
            ref="passwordInputRef"
            v-model:value="formValue.password"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="Sua senha"
          >
            <template #suffix>
              <button
                class="password-visibility"
                type="button"
                :aria-label="passwordVisible ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="passwordVisible"
                @mousedown.prevent
                @click="togglePasswordVisibility"
                @keyup.enter.stop
              >
                <component :is="passwordVisible ? Eye : EyeOff" :size="16" aria-hidden="true" />
              </button>
            </template>
          </n-input>
        </n-form-item>

        <n-button
          type="primary"
          block
          :loading="loading"
          @click="handleLogin"
        >
          Entrar
        </n-button>
      </n-form>

      <div v-if="error" class="error-msg">
        <n-alert title="Erro ao Autenticar" type="error">
          {{ error }}
        </n-alert>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Eye, EyeOff } from 'lucide-vue-next';
import LoginPuppy from '~/components/LoginPuppy.vue';
import { useAuthStore } from '~/stores/auth';
import type { FormInst, InputInst } from 'naive-ui';
import { useMessage } from 'naive-ui';

definePageMeta({
  layout: 'blank'
});

const formRef = ref<FormInst | null>(null);
const message = useMessage();
const router = useRouter();
const authStore = useAuthStore();
const config = useRuntimeConfig();

const loading = ref(false);
const error = ref('');
const activeField = ref<'email' | 'password' | null>(null);
const emailProgress = ref(0);
const emailInputRef = ref<InputInst | null>(null);
const passwordInputRef = ref<InputInst | null>(null);
const passwordVisible = ref(false);

const formValue = ref({
  email: '',
  password: ''
});

const isEmailComplete = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValue.value.email));

onMounted(() => {
  // Native autofocus can happen before Vue attaches its focus listeners.
  const input = emailInputRef.value?.inputElRef;
  if (input && input === document.activeElement) {
    activeField.value = 'email';
    emailProgress.value = Math.min((input.selectionStart ?? input.value.length) / 32, 1);
  }
});

function trackEmailCaret(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const input = event.target;
  activeField.value = 'email';
  // Only the email caret position is used; the mascot never receives the password.
  emailProgress.value = Math.min((input.selectionStart ?? input.value.length) / 32, 1);
}

function focusEmail(event: FocusEvent) {
  activeField.value = 'email';
  trackEmailCaret(event);
}

function clearFieldFocus(event: FocusEvent) {
  const field = event.currentTarget as HTMLElement;
  // Keep the paws up when focus moves to the password visibility control.
  if (event.relatedTarget instanceof Node && field.contains(event.relatedTarget)) return;
  activeField.value = null;
}

function togglePasswordVisibility(event: MouseEvent) {
  passwordVisible.value = !passwordVisible.value;
  activeField.value = 'password';
  // Pointer clicks keep typing uninterrupted; keyboard users keep button focus.
  if (document.activeElement !== event.currentTarget) passwordInputRef.value?.focus();
}

const rules = {
  email: {
    required: true,
    message: 'Por favor, insira o email',
    trigger: 'blur',
    type: 'email'
  },
  password: {
    required: true,
    message: 'Por favor, insira a senha',
    trigger: 'blur'
  }
};

async function handleLogin(e: Event) {
  e.preventDefault();

  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true;
      error.value = '';

      try {
        const response = await $fetch<any>(`${config.public.apiBaseUrl}/api/v1/auth/login`, {
          method: 'POST',
          body: {
            email: formValue.value.email,
            password: formValue.value.password,
          },
        });

        // Logado com sucesso
        authStore.setAuth(response.data.access_token, response.data.user);
        message.success('Bem vindo ao Sigma Vet!');
        router.push('/');

      } catch (err: any) {
        let errorMsg = 'Falha na conexão com o servidor';

        if (err.response?._data?.message) {
            const serverMsg = err.response._data.message;
            if (Array.isArray(serverMsg)) {
                errorMsg = serverMsg.join(', ');
            } else {
                errorMsg = serverMsg;
            }
        }

        error.value = errorMsg;
        message.error('Falha no login');
      } finally {
        loading.value = false;
      }
    }
  });
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.error-msg {
  margin-top: 16px;
}

.password-visibility {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: #8b9098;
  cursor: pointer;
}

.password-visibility:hover { color: #29976b; }
.password-visibility:focus-visible { outline: 2px solid #29976b; outline-offset: 2px; }
</style>
