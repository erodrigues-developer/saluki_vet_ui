<template>
  <section class="suggested">
    <p class="title">Perguntas rápidas</p>
    <div class="chips">
      <button
        v-for="question in questions"
        :key="question"
        type="button"
        class="chip"
        @click="$emit('select', question)"
      >
        {{ question }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ questions: string[] }>()
defineEmits<{ (e: 'select', question: string): void }>()
</script>

<style scoped>
.suggested {
  margin-bottom: 10px;
}

.title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 1px solid #dbe2ea;
  background: #fff;
  color: #1f2937;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.chip:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}
</style>
