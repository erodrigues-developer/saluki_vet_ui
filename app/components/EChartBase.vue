<template>
  <div ref="chartEl" class="echart-base" :style="{ height }"></div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '220px'
  }
})

const chartEl = ref(null)
let chartInstance = null
let echartsLib = null

const ensureEcharts = async () => {
  if (!echartsLib) {
    const mod = await import('echarts')
    echartsLib = mod.default || mod
  }
  return echartsLib
}

const renderChart = async () => {
  if (typeof window === 'undefined') return
  await ensureEcharts()
  await nextTick()
  if (!chartEl.value) return
  if (!chartInstance) {
    chartInstance = echartsLib.init(chartEl.value)
  }
  chartInstance.setOption(props.option, true)
  chartInstance.resize()
}

const resizeChart = () => {
  chartInstance?.resize()
}

onMounted(() => {
  renderChart()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', resizeChart)
  }
})

watch(
  () => props.option,
  () => {
    renderChart()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resizeChart)
  }
  chartInstance?.dispose()
})
</script>

<style scoped>
.echart-base {
  width: 100%;
}
</style>
