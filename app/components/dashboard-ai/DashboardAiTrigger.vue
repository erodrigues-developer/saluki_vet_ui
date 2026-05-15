<template>
  <div>
    <button
      v-if="!isMobile"
      class="ai-trigger"
      type="button"
      aria-label="Analisar dashboard com IA"
      title="Gerar insights sobre o dashboard"
      @click="$emit('open')"
    >
      <span class="inline-icon-label"><AppIcon name="sparkles" :size="14" :stroke-width="2" /><span>Analisar com IA</span></span>
    </button>

    <button
      v-else
      class="ai-fab"
      type="button"
      aria-label="Analisar dashboard com IA"
      @click="$emit('open')"
    >
      <span class="inline-icon-label"><AppIcon name="sparkles" :size="14" :stroke-width="2" /><span>IA</span></span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ isMobile: boolean }>()
defineEmits<{ (e: 'open'): void }>()
</script>

<style scoped>
.ai-trigger {
  border: 1px solid #aac4d6;
  background: #ffffff;
  color: #0b4c75;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
}

.ai-trigger:hover {
  border-color: #7ba8c3;
  background: #f8fafc;
  box-shadow: 0 4px 14px rgba(14, 58, 86, 0.14);
}

.ai-fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 35;
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  background: #0e3a56;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(14, 58, 86, 0.32);
}
</style>
