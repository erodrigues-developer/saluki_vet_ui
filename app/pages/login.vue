<template>
  <div class="login-container">
    <n-card class="login-card" title="Acesso ao Saluki ERP">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        @keyup.enter="handleLogin"
      >
        <n-form-item path="email" label="Email">
          <n-input
            v-model:value="formValue.email"
            placeholder="Seu e-mail cadastrado"
            autofocus
            @keydown.enter.prevent
          />
        </n-form-item>

        <n-form-item path="password" label="Senha">
          <n-input
            v-model:value="formValue.password"
            type="password"
            show-password-on="click"
            placeholder="Sua senha"
          />
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
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';
import type { FormInst } from 'naive-ui';
import { useMessage } from 'naive-ui';

definePageMeta({
  layout: 'blank'
});

const formRef = ref<FormInst | null>(null);
const message = useMessage();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const config = useRuntimeConfig();

const loading = ref(false);
const error = ref('');

const formValue = ref({
  email: '',
  password: ''
});

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
        message.success('Bem vindo ao Saluki ERP!');

        const redirectQuery = route.query.redirect;
        const redirect = Array.isArray(redirectQuery) ? redirectQuery[0] : redirectQuery;
        if (
          typeof redirect === 'string'
          && redirect.startsWith('/')
          && !redirect.startsWith('//')
          && redirect !== '/login'
        ) {
          router.push(redirect);
          return;
        }

        if (authStore.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/clinic');
        }

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
</style>
