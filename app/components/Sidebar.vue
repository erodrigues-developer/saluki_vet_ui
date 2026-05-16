<template>
  <aside
    class="sidebar"
    :class="{ collapsed: isCollapsedComputed, mobile: isMobile }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="sidebar-top">
      <div class="brand">
        <div class="brand-icon">
          <ShieldCheck :size="18" :stroke-width="2" />
        </div>
        <span v-if="!isCollapsedComputed" class="brand-name">SalukiVet</span>
      </div>
      <button
        v-if="!isCollapsedComputed && !isMobile"
        type="button"
        class="pin-btn"
        :aria-pressed="isPinned"
        :aria-label="isPinned ? 'Desafixar menu' : 'Fixar menu aberto'"
        :title="isPinned ? 'Desafixar menu' : 'Fixar menu aberto'"
        @click="togglePin"
      >
        <PinOff v-if="isPinned" :size="16" />
        <Pin v-else :size="16" />
      </button>
    </div>

    <nav class="menu">
      <div
        v-for="item in items"
        :key="item.to || item.label"
        class="menu-group"
        :class="{ open: isGroupOpen(item) }"
      >
        <div class="menu-parent">
          <NuxtLink
            :to="item.to || '#'"
            class="menu-item"
            :class="[
              { active: isCurrentItem(item) },
              { 'active-parent': item.children?.length && isActivePath(item) },
              { 'has-children': item.children && item.children.length }
            ]"
            :aria-current="isActivePath(item) ? 'page' : undefined"
            :aria-label="item.label"
            :title="isCollapsedComputed ? item.label : undefined"
            @click="onParentClick(item, $event)"
          >
            <span class="icon"><component :is="item.icon" :size="20" :stroke-width="2" /></span>
            <span v-if="!isCollapsedComputed" class="label">{{ item.label }}</span>
          </NuxtLink>
          <button
            v-if="item.children && item.children.length && !isCollapsedComputed"
            type="button"
            class="caret-btn"
            :aria-expanded="isGroupOpen(item)"
            :aria-label="`${isGroupOpen(item) ? 'Recolher' : 'Expandir'} ${item.label}`"
            @click.stop.prevent="toggleGroup(item)"
          >
            <ChevronDown :size="16" :class="{ open: isGroupOpen(item) }" />
          </button>
        </div>
        <div
          v-if="item.children && item.children.length && !isCollapsedComputed && isGroupOpen(item)"
          class="submenu"
        >
          <NuxtLink
            v-for="child in item.children"
            :key="child.to"
            :to="child.to"
            class="submenu-item"
            :class="{ active: isActive(child.to) }"
            :aria-current="isActive(child.to) ? 'page' : undefined"
            @click="handleNavigate"
          >
            <span class="icon"><component :is="child.icon || Circle" :size="16" :stroke-width="2" /></span>
            <span class="label">{{ child.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown, Circle, Pin, PinOff, ShieldCheck } from 'lucide-vue-next'
import { useRoute } from '#imports'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['navigate', 'pinned-change', 'expanded-change'])

const route = useRoute()
const isPinned = ref(false)
const isHovering = ref(false)
const openGroups = ref(new Set())
let hoverOpenTimer = null
let hoverCloseTimer = null

const isCollapsedComputed = computed(() => (props.isMobile ? false : !isPinned.value && !isHovering.value))

const isActive = (to) => (to ? route.path === to : false)
const isCurrentItem = (item) => Boolean(item.to && isActive(item.to))
const isActivePath = (item) => {
  const key = item.to
  if (key && isActive(key)) return true
  if (item.children) {
    return item.children.some((child) => isActive(child.to) || route.path.startsWith(`${child.to}/`))
  }
  return key ? route.path.startsWith(`${key}/`) : false
}

const groupKey = (item) => item.to || item.label

const isGroupOpen = (item) => openGroups.value.has(groupKey(item))
const setGroupOpen = (item, open) => {
  const key = groupKey(item)
  if (open) {
    openGroups.value = new Set([key])
  } else {
    const next = new Set(openGroups.value)
    next.delete(key)
    openGroups.value = next
  }
}
const toggleGroup = (item) => {
  setGroupOpen(item, !isGroupOpen(item))
}

const onParentClick = (item, event) => {
  if (item.children && item.children.length) {
    event.preventDefault()
    toggleGroup(item)
    return
  }
  handleNavigate()
}

const togglePin = () => {
  isPinned.value = !isPinned.value
}

const clearHoverTimers = () => {
  if (hoverOpenTimer) {
    clearTimeout(hoverOpenTimer)
    hoverOpenTimer = null
  }
  if (hoverCloseTimer) {
    clearTimeout(hoverCloseTimer)
    hoverCloseTimer = null
  }
}

const handleMouseEnter = () => {
  if (props.isMobile || isPinned.value) return
  if (hoverCloseTimer) {
    clearTimeout(hoverCloseTimer)
    hoverCloseTimer = null
  }
  hoverOpenTimer = setTimeout(() => {
    isHovering.value = true
    hoverOpenTimer = null
  }, 120)
}

const handleMouseLeave = () => {
  if (props.isMobile || isPinned.value) return
  if (hoverOpenTimer) {
    clearTimeout(hoverOpenTimer)
    hoverOpenTimer = null
  }
  hoverCloseTimer = setTimeout(() => {
    isHovering.value = false
    hoverCloseTimer = null
  }, 180)
}

watch(
  () => isPinned.value,
  (val) => {
    emit('pinned-change', val)
    if (typeof localStorage === 'undefined') return
    localStorage.setItem('sidebar:pinned', JSON.stringify(val))
  }
)

watch(
  () => isCollapsedComputed.value,
  (collapsed) => {
    emit('expanded-change', !collapsed)
  },
  { immediate: true }
)

onMounted(() => {
  if (props.isMobile) return
  if (typeof localStorage === 'undefined') return
  const saved = localStorage.getItem('sidebar:pinned')
  if (saved !== null) {
    isPinned.value = JSON.parse(saved)
  }
})

onBeforeUnmount(() => {
  clearHoverTimers()
})

const ensureActiveGroupsOpen = () => {
  let opened = false
  props.items.forEach((item) => {
    if (opened) return
    if (item.children && item.children.length) {
      const shouldOpen =
        (item.to && isActive(item.to)) ||
        (item.to && route.path.startsWith(`${item.to}/`)) ||
        item.children.some((child) => isActive(child.to) || route.path.startsWith(`${child.to}/`))
      if (shouldOpen) {
        setGroupOpen(item, true)
        opened = true
      }
    }
  })
  if (!opened) {
    openGroups.value = new Set()
  }
}

watch(
  () => route.path,
  () => {
    ensureActiveGroupsOpen()
  },
  { immediate: true }
)

const handleNavigate = () => {
  if (props.isMobile) {
    emit('navigate')
  }
}
</script>

<style scoped>
:root {
  --primary: #0f766e;
  --secondary: #2CB67D;
  --accent: #33B8C4;
  --text-main: #172033;
  --text-strong: #0f172a;
  --text-active: #0f172a;
  --text-muted: #4b5565;
  --text-disabled: #94a3b8;
  --icon-default: #5b6678;
  --icon-muted: #6b7688;
  --icon-hover: #334155;
  --bg: #f4f6fb;
  --sidebar-bg: #e9eef5;
  --sidebar-header-bg: #eef3f8;
  --sidebar-border: #d3dce8;
  --active-bg: #ffffff;
  --active-border: #14b8a6;
  --active-shadow: rgba(15, 23, 42, 0.06);
  --hover-bg: #dde6f0;
  --open-bg: #dde6f0;
}

.sidebar {
  --primary: #0f766e;
  --text-main: #172033;
  --text-strong: #0f172a;
  --text-active: #0f172a;
  --text-muted: #4b5565;
  --text-disabled: #94a3b8;
  --icon-default: #5b6678;
  --icon-muted: #6b7688;
  --icon-hover: #334155;
  --sidebar-bg: #e9eef5;
  --sidebar-header-bg: #eef3f8;
  --sidebar-border: #d3dce8;
  --active-bg: #ffffff;
  --active-border: #14b8a6;
  --active-shadow: rgba(15, 23, 42, 0.06);
  --hover-bg: #dde6f0;
  --open-bg: #dde6f0;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  height: 100vh;
  width: 256px;
  background: var(--sidebar-bg);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  padding: 12px 10px;
  gap: 12px;
  box-sizing: border-box;
  border-right: 1px solid var(--sidebar-border);
  transition: width 0.2s ease;
  overflow-x: hidden;
  overflow-y: hidden;
  font-family: 'Inter', 'Roboto', system-ui, -apple-system, sans-serif;
}

.sidebar.mobile {
  position: relative;
  top: auto;
  left: auto;
  z-index: auto;
  height: 100%;
  width: 100%;
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 46px;
  padding: 6px 8px;
  border-radius: 10px;
  background: var(--sidebar-header-bg);
  flex-shrink: 0;
}

.sidebar.collapsed .sidebar-top {
  justify-content: center;
  padding-inline: 0;
  background: transparent;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex: 0 0 32px;
  border-radius: 9px;
  background: var(--sidebar-header-bg);
  color: var(--icon-default);
}

.brand-name {
  font-weight: 700;
  letter-spacing: 0;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pin-btn {
  background: var(--hover-bg);
  border: none;
  color: var(--icon-hover);
  border-radius: 9px;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.pin-btn:hover {
  background: var(--sidebar-border);
  transform: translateY(-1px);
}

.pin-btn[aria-pressed='true'] {
  background: var(--active-bg);
  color: var(--primary);
}

.menu {
  display: grid;
  gap: 6px;
  flex: 1;
  align-content: start;
  grid-auto-rows: max-content;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 4px 18px 0;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--app-scrollbar-thumb) var(--app-scrollbar-track);
}

.menu::-webkit-scrollbar {
  width: 8px;
}

.menu::-webkit-scrollbar-track {
  background: var(--app-scrollbar-track);
}

.menu::-webkit-scrollbar-thumb {
  background: var(--app-scrollbar-thumb);
  border-radius: 999px;
  border: 2px solid var(--app-scrollbar-track);
}

.menu:hover::-webkit-scrollbar-thumb {
  background: var(--app-scrollbar-thumb-hover);
}
.menu-group {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.menu-parent {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  border-radius: 10px;
  transition: background 0.18s ease;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  min-width: 0;
  padding: 11px 13px;
  border-radius: 10px;
  color: var(--text-main);
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: 0;
  width: 3px;
  border-radius: 999px;
  background: transparent;
}

.menu-item .icon {
  width: 22px;
  flex: 0 0 22px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: var(--icon-default);
  transition: color 0.18s ease;
}

.menu-item .label {
  white-space: nowrap;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.18s ease, opacity 0.18s ease;
}

.menu-item:hover {
  background: var(--hover-bg);
  color: var(--text-strong);
}

.menu-item:hover .icon {
  color: var(--icon-hover);
}

.menu-item:hover .label {
  color: var(--text-strong);
}

.menu-parent:has(.menu-item.has-children):hover {
  background: var(--hover-bg);
}

.menu-parent:has(.menu-item.has-children):hover .menu-item.has-children {
  background: transparent;
}

.menu-parent:has(.menu-item.has-children):hover .menu-item.has-children .icon,
.menu-parent:has(.menu-item.has-children):hover .caret-btn {
  color: var(--icon-hover);
}

.menu-parent:has(.menu-item.has-children):hover .menu-item.has-children .label {
  color: var(--text-strong);
}

.menu-item.has-children {
  cursor: pointer;
}

.menu-item.active {
  background: var(--active-bg);
  color: var(--text-active);
  box-shadow: 0 8px 18px var(--active-shadow);
}

.menu-item.active::before {
  background: var(--active-border);
}

.menu-item.active,
.menu-item.active .label {
  font-weight: 700;
}

.menu-item.active .icon {
  color: var(--primary);
}

.menu-item.active .label {
  color: var(--text-active);
}

.menu-item.active:hover {
  background: var(--active-bg);
  color: var(--text-active);
}

.menu-item.active:hover .icon {
  color: var(--primary);
}

.menu-item.active:hover .label {
  color: var(--text-active);
}

.menu-item.active-parent {
  color: var(--text-strong);
}

.menu-item.active-parent .icon {
  color: var(--icon-hover);
}

.menu-item.active-parent .label {
  font-weight: 700;
}

.sidebar.collapsed .menu-item {
  justify-content: center;
  padding-inline: 0;
}

.sidebar.collapsed .menu-item.active-parent {
  background: var(--active-bg);
  box-shadow: 0 8px 18px var(--active-shadow);
}

.sidebar.collapsed .menu-item.active-parent::before {
  background: var(--active-border);
}

.caret-btn {
  background: rgba(15, 23, 42, 0);
  border: none;
  color: var(--icon-muted);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.caret-btn:hover {
  background: var(--hover-bg);
  color: var(--icon-hover);
  transform: translateY(-1px);
}

.caret-btn svg {
  transition: transform 0.18s ease;
}

.caret-btn .open {
  transform: rotate(180deg);
}

.submenu {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 2px 0 4px 28px;
  overflow-x: hidden;
}

.submenu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 9px;
  color: var(--text-main);
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.submenu-item::before {
  content: '';
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  border-radius: 999px;
  background: transparent;
}

.submenu-item .icon {
  width: 18px;
  flex: 0 0 18px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  color: var(--icon-muted);
}

.submenu-item .label {
  white-space: nowrap;
  font-weight: 500;
  font-size: 13px;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
}

.submenu-item:hover {
  background: var(--hover-bg);
  color: var(--text-main);
}

.submenu-item:hover .icon {
  color: var(--icon-default);
}

.submenu-item:hover .label {
  color: var(--text-main);
}

.submenu-item.active {
  background: var(--active-bg);
  color: var(--text-active);
  box-shadow: 0 8px 18px var(--active-shadow);
}

.submenu-item.active::before {
  background: var(--active-border);
}

.submenu-item.active .icon {
  color: var(--primary);
}

.submenu-item.active .label {
  font-weight: 600;
  color: var(--text-active);
}

.menu-group.open .menu-parent .menu-item {
  background: transparent;
  color: var(--text-strong);
}

.menu-group.open .menu-parent {
  background: var(--open-bg);
}

.menu-group.open .menu-parent .menu-item .icon,
.menu-group.open .caret-btn {
  color: var(--icon-hover);
}

.menu-group.open .menu-parent .menu-item .label {
  font-weight: 700;
  color: var(--text-strong);
}

.menu-group.open .menu-parent .menu-item.active,
.sidebar.collapsed .menu-group.open .menu-parent .menu-item.active-parent {
  background: var(--active-bg);
}

.menu-group.open .menu-parent .menu-item.active .icon {
  color: var(--primary);
}

.menu-group.open .menu-parent .menu-item.active .label {
  color: var(--text-active);
}

.sidebar.collapsed .menu-group.open .menu-parent .menu-item.active-parent .icon {
  color: var(--primary);
}

.menu-group.open .menu-parent .menu-item.active-parent:not(.active) {
  background: transparent;
}

.sidebar.collapsed .menu-group.open .menu-parent .menu-item.active-parent {
  background: var(--active-bg);
  box-shadow: 0 8px 18px var(--active-shadow);
}

.sidebar.collapsed .menu-group.open .menu-parent .menu-item.active-parent::before {
  background: var(--active-border);
}

.sidebar.collapsed .menu-group.open .menu-parent .menu-item.active-parent .icon {
  color: var(--primary);
}

.menu-item:focus-visible,
.submenu-item:focus-visible,
.caret-btn:focus-visible,
.pin-btn:focus-visible {
  outline: 2px solid rgba(20, 184, 166, 0.42);
  outline-offset: 2px;
}

.sidebar.collapsed .menu-parent {
  grid-template-columns: 1fr;
}
</style>
