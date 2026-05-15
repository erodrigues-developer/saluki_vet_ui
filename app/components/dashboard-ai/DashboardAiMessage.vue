<template>
  <div class="message" :class="message.role">
    <div v-if="message.role === 'user'" class="bubble user-bubble">{{ message.content }}</div>
    <div v-else class="assistant-wrap">
      <span class="assistant-icon"><AppIcon name="sparkles" :size="14" :stroke-width="2" /></span>
      <DashboardAiInsightCard v-if="message.response" :response="message.response" @run-action="$emit('runAction', $event)" />
      <div v-else class="bubble">{{ message.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AiAction, AiMessage } from '~/types/aiInsight.types'
import DashboardAiInsightCard from './DashboardAiInsightCard.vue'

defineProps<{ message: AiMessage }>()
defineEmits<{ (e: 'runAction', action: AiAction): void }>()
</script>

<style scoped>
.message {
  display: flex;
  margin-bottom: 10px;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 90%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 9px 10px;
  font-size: 13px;
  color: #1f2937;
}

.user-bubble {
  background: #e8f1f8;
  border-color: #c6d8e7;
}

.assistant-wrap {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
}

.assistant-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #dbe2ea;
  background: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  margin-top: 2px;
}
</style>
