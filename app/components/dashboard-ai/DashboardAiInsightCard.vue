<template>
  <article class="insight-card" :class="`is-${response.severity}`">
    <div class="head">
      <h4>{{ response.title }}</h4>
      <span class="severity">{{ severityLabel }}</span>
    </div>

    <section class="block">
      <p class="block-title">Resumo executivo</p>
      <p class="text">{{ response.summary }}</p>
    </section>

    <section v-if="response.attentionPoints?.length" class="block">
      <p class="block-title">Pontos de atenção</p>
      <ul>
        <li v-for="item in response.attentionPoints" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section v-if="response.possibleCauses?.length" class="block">
      <p class="block-title">Possíveis causas</p>
      <ul>
        <li v-for="item in response.possibleCauses" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section v-if="response.recommendedActions?.length" class="block">
      <p class="block-title">Ações recomendadas</p>
      <ul>
        <li v-for="item in response.recommendedActions" :key="item">{{ item }}</li>
      </ul>
    </section>

    <DashboardAiActions v-if="response.actions?.length" :actions="response.actions" @run="$emit('runAction', $event)" />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AiAction, AiInsightResponse } from '~/types/aiInsight.types'
import DashboardAiActions from './DashboardAiActions.vue'

const props = defineProps<{ response: AiInsightResponse }>()

defineEmits<{ (e: 'runAction', action: AiAction): void }>()

const severityLabel = computed(() => {
  const labels: Record<string, string> = {
    critical: 'Crítico',
    attention: 'Atenção',
    opportunity: 'Oportunidade',
    info: 'Informativo'
  }
  return labels[props.response.severity] || 'Informativo'
})
</script>

<style scoped>
.insight-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.insight-card.is-critical { border-color: #fecaca; }
.insight-card.is-attention { border-color: #fdecc8; }
.insight-card.is-opportunity { border-color: #d1fae5; }
.insight-card.is-info { border-color: #bfdbfe; }

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

h4 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
}

.severity {
  font-size: 11px;
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  padding: 3px 8px;
  color: #334155;
  white-space: nowrap;
}

.block-title {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.text {
  margin: 0;
  font-size: 13px;
  color: #1f2937;
  line-height: 1.45;
}

ul {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 3px;
  font-size: 13px;
  color: #334155;
}
</style>
