<template>
  <n-input
    ref="nInputRef"
    :value="displayValue"
    :disabled="disabled"
    :placeholder="placeholder"
    :size="size"
    :input-props="inputProps"
    @update:value="handleUpdate"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { NInput } from "naive-ui";

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    maxValue?: number | null;
    disabled?: boolean;
    placeholder?: string;
    size?: "small" | "medium" | "large";
  }>(),
  {
    modelValue: 0,
    maxValue: null,
    disabled: false,
    placeholder: "R$ 0,00",
    size: "medium",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const nInputRef = ref<any>(null);
const displayValue = ref("");
const isFocused = ref(false);
const inputProps = {
  inputmode: "decimal",
  onClick: () => {
    void selectInputContent();
  },
  onMouseup: (event: MouseEvent) => {
    event.preventDefault();
    void selectInputContent();
  },
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrencyInput = (value: number | null | undefined) =>
  currencyFormatter.format(Number(value || 0));

const limitValue = (value: number) => {
  const maxValue = props.maxValue;
  if (maxValue === null || maxValue === undefined) return value;
  return Math.min(value, Number(maxValue || 0));
};

const parseCurrencyInput = (value: string, shouldLimit = true) => {
  const normalized = value.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (
    !normalized ||
    normalized === "-" ||
    normalized === "," ||
    normalized === "."
  ) {
    return 0;
  }

  const sign = normalized.startsWith("-") ? -1 : 1;
  const unsigned = normalized.replace(/-/g, "");

  let decimalValue = unsigned;
  if (unsigned.includes(",")) {
    decimalValue = unsigned.replace(/\./g, "").replace(",", ".");
  } else if (unsigned.includes(".")) {
    const parts = unsigned.split(".");
    const lastPart = parts[parts.length - 1] || "";
    decimalValue =
      parts.length === 2 && lastPart.length <= 2
        ? unsigned
        : unsigned.replace(/\./g, "");
  }

  const parsed = Number(decimalValue);
  if (!Number.isFinite(parsed)) return 0;
  const parsedValue = sign * parsed;
  return shouldLimit ? limitValue(parsedValue) : parsedValue;
};

displayValue.value = formatCurrencyInput(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    if (!isFocused.value) displayValue.value = formatCurrencyInput(value);
  },
);

const handleUpdate = (value: string) => {
  const rawValue = parseCurrencyInput(value, false);
  const parsedValue = parseCurrencyInput(value);
  const isAboveMax =
    props.maxValue !== null &&
    props.maxValue !== undefined &&
    rawValue > Number(props.maxValue || 0);

  displayValue.value = isAboveMax ? formatCurrencyInput(parsedValue) : value;
  emit("update:modelValue", parsedValue);
};

const handleBlur = () => {
  isFocused.value = false;
  displayValue.value = formatCurrencyInput(
    parseCurrencyInput(displayValue.value),
  );
};

const handleFocus = async () => {
  isFocused.value = true;
  await selectInputContent();
};

const selectInputContent = async () => {
  await nextTick();
  const nativeInputEl = nInputRef.value?.inputElRef as
    HTMLInputElement | undefined;
  nativeInputEl?.select();
};
</script>
