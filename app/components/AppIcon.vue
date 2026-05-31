<template>
  <component :is="iconComponent" v-if="iconComponent" :size="size" :stroke-width="strokeWidth" aria-hidden="true" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Ellipsis,
  FlaskConical,
  Hospital,
  Minus,
  Pill,
  Search,
  Siren,
  Sparkles,
  X
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
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  clock: Clock3,
  ellipsis: Ellipsis,
  flask: FlaskConical,
  hospital: Hospital,
  minus: Minus,
  pill: Pill,
  search: Search,
  siren: Siren,
  sparkles: Sparkles,
  x: X
} as const

const iconComponent = computed(() => iconMap[props.name as keyof typeof iconMap] || null)
</script>
