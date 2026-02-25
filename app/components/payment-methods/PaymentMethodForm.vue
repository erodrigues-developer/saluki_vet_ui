<template>
  <n-form
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    require-mark-placement="right-hanging"
  >
    <n-form-item label="Nome da Forma de Pagamento" path="name">
      <n-input v-model:value="model.name" placeholder="Ex: Cartão de Crédito" />
    </n-form-item>

    <n-form-item label="Código (Interno)" path="code">
      <n-input v-model:value="model.code" placeholder="Ex: CREDIT_CARD" />
    </n-form-item>

    <n-form-item label="Status" path="isActive">
      <n-switch v-model:value="model.isActive">
        <template #checked>Ativo</template>
        <template #unchecked>Inativo</template>
      </n-switch>
    </n-form-item>

    <n-space justify="end" class="mt-4">
      <n-button @click="$emit('cancel')">Cancelar</n-button>
      <n-button type="primary" @click="handleValidateClick" :loading="loading">
        Salvar
      </n-button>
    </n-space>
  </n-form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormInst, FormRules } from 'naive-ui';

const props = defineProps<{
  initialData?: any;
}>();

const emit = defineEmits(['saved', 'cancel']);
const message = useMessage();
const loading = ref(false);

const formRef = ref<FormInst | null>(null);
const model = ref({
  name: '',
  code: '',
  isActive: true,
});

const rules: FormRules = {
  name: [
    { required: true, message: 'O nome é obrigatório', trigger: ['blur', 'input'] }
  ],
  code: [
    { required: true, message: 'O código é obrigatório', trigger: ['blur', 'input'] }
  ],
};

onMounted(() => {
  if (props.initialData) {
    model.value = { ...props.initialData };
  }
});

const handleValidateClick = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true;
      try {
        const url = props.initialData?.id
          ? `/api/v1/payment-methods/${props.initialData.id}`
          : '/api/v1/payment-methods';
        const method = props.initialData?.id ? 'PATCH' : 'POST';

        const response = await $fetch(url, {
          method,
          body: model.value,
        });

        message.success('Forma de Pagamento salva com sucesso!');
        emit('saved', response);
      } catch (error: any) {
        message.error(error.data?.message || 'Erro ao salvar forma de pagamento');
      } finally {
        loading.value = false;
      }
    } else {
      message.error('Por favor, preencha todos os campos obrigatórios');
    }
  });
};
</script>
