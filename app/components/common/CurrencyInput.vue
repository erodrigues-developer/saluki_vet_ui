<template>
  <n-input
    ref="nInputRef"
    :value="formattedValue || ''"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size"
    :input-props="{ inputmode: 'decimal' }"
    @update:value="handleUpdate"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { NInput } from 'naive-ui';
import { useCurrencyInput } from 'vue-currency-input';

const props = withDefaults(defineProps<{
  modelValue: number | null;
  disabled?: boolean;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
}>(), {
  modelValue: 0,
  disabled: false,
  placeholder: 'R$ 0,00',
  size: 'medium',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const nInputRef = ref<any>(null);

const { inputRef, formattedValue, numberValue, setValue } = useCurrencyInput(
  {
    locale: 'pt-BR',
    currency: 'BRL',
    currencyDisplay: 'symbol',
    precision: 2,
    hideGroupingSeparatorOnFocus: false,
    hideNegligibleDecimalDigitsOnFocus: false,
    hideCurrencySymbolOnFocus: false,
  },
  false,
);

const bindNativeInput = async () => {
  await nextTick();
  const nativeInputEl = nInputRef.value?.inputElRef as HTMLInputElement | undefined;
  if (nativeInputEl) {
    inputRef.value = nativeInputEl;
    setValue(Number(props.modelValue || 0));
  }
};

onMounted(bindNativeInput);

watch(() => props.modelValue, (value) => {
  const nextValue = Number(value || 0);
  if ((numberValue.value ?? 0) !== nextValue) setValue(nextValue);
});

watch(numberValue, (value) => {
  emit('update:modelValue', Number(value || 0));
});

const handleUpdate = (value: string) => {
  formattedValue.value = value;
};

const handleBlur = () => {
  setValue(Number(numberValue.value || 0));
};
</script>
