<template>
  <div class="actions">
    <button
      v-for="action in actions"
      :key="action.label"
      type="button"
      class="action-btn"
      :disabled="action.disabled"
      @click="$emit('run', action)"
    >
      {{ action.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AiAction } from '~/types/aiInsight.types'

defineProps<{ actions: AiAction[] }>()
defineEmits<{ (e: 'run', action: AiAction): void }>()
</script>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  border: 1px solid #dbe2ea;
  background: #fff;
  color: #0b4c75;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}
</style>
