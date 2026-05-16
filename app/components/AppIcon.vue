<template>
  <component :is="iconComponent" v-if="iconComponent" :size="size" :stroke-width="strokeWidth" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Ellipsis,
  FlaskConical,
  Hospital,
  Pill,
  Search,
  Siren,
  Sparkles
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    strokeWidth?: number
  }>(),
  {
    size: 16,
    strokeWidth: 2
  }
)

const iconMap = {
  'alert-triangle': AlertTriangle,
  bell: Bell,
  'calendar-days': CalendarDays,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock3,
  ellipsis: Ellipsis,
  flask: FlaskConical,
  hospital: Hospital,
  pill: Pill,
  search: Search,
  siren: Siren,
  sparkles: Sparkles
} as const

const iconComponent = computed(() => iconMap[props.name as keyof typeof iconMap] || null)
</script>
