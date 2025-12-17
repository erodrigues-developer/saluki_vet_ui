<template>
  <aside
    class="sidebar"
    :class="{ collapsed: isCollapsedComputed }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="sidebar-top">
      <div class="brand">
        <div class="brand-icon">🛡️</div>
        <span v-if="!isCollapsedComputed" class="brand-name">SalukiVet</span>
      </div>
      <button
        v-if="!isCollapsedComputed"
        type="button"
        class="pin-btn"
        :aria-pressed="isPinned"
        @click="togglePin"
      >
        <span v-if="isPinned">📌</span>
        <span v-else>📍</span>
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
            :class="[{ active: isActivePath(item) }, { 'has-children': item.children && item.children.length }]"
            @click="onParentClick(item, $event)"
          >
            <span class="icon">{{ item.icon }}</span>
            <span v-if="!isCollapsedComputed" class="label">{{ item.label }}</span>
          </NuxtLink>
          <button
            v-if="item.children && item.children.length && !isCollapsedComputed"
            type="button"
            class="caret-btn"
            :aria-expanded="isGroupOpen(item)"
            @click.stop.prevent="toggleGroup(item)"
          >
            <span :class="{ open: isGroupOpen(item) }">▾</span>
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
          >
            <span class="icon">{{ child.icon }}</span>
            <span class="label">{{ child.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from '#imports'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const route = useRoute()
const isPinned = ref(false)
const isHovering = ref(false)
const openGroups = ref(new Set())

const isCollapsedComputed = computed(() => !isPinned.value && !isHovering.value)

const isActive = (to) => (to ? route.path === to : false)
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
  }
}

const togglePin = () => {
  isPinned.value = !isPinned.value
}

const handleMouseEnter = () => {
  isHovering.value = true
}

const handleMouseLeave = () => {
  isHovering.value = false
}

watch(
  () => isPinned.value,
  (val) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem('sidebar:pinned', JSON.stringify(val))
  }
)

onMounted(() => {
  if (typeof localStorage === 'undefined') return
  const saved = localStorage.getItem('sidebar:pinned')
  if (saved !== null) {
    isPinned.value = JSON.parse(saved)
  }
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
</script>

<style scoped>
:root {
  --primary: #0E3A56;
  --secondary: #2CB67D;
  --accent: #33B8C4;
  --text-main: rgba(255, 255, 255, 0.85);
  --text-muted: rgba(255, 255, 255, 0.55);
  --bg: #050608;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 240px;
  background: var(--bg);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  padding: 14px 12px;
  gap: 14px;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 8px 0 18px rgba(0, 0, 0, 0.18);
  transition: width 0.18s ease;
  overflow: hidden;
  font-family: 'Inter', 'Roboto', system-ui, -apple-system, sans-serif;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  font-size: 18px;
}

.brand-name {
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-main);
}

.pin-btn {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: var(--text-main);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.pin-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.menu {
  display: grid;
  gap: 6px;
  overflow-y: auto;
  padding-right: 4px;
  max-height: calc(100vh - 70px);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.14) transparent;
}

.menu::-webkit-scrollbar {
  width: 6px;
}

.menu::-webkit-scrollbar-track {
  background: transparent;
}

.menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 999px;
}

.menu:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
}
.menu-group {
  display: grid;
  gap: 4px;
}

.menu-parent {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  color: var(--text-main);
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.menu-item .icon {
  width: 24px;
  display: inline-flex;
  justify-content: center;
  font-size: 18px;
  color: var(--accent);
}

.menu-item .label {
  white-space: nowrap;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-main);
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.menu-item.has-children {
  cursor: pointer;
}

.menu-item.active {
  background: rgba(51, 184, 196, 0.14);
  color: var(--text-main);
}

.menu-item.active .icon {
  color: var(--secondary);
}

.menu-item.active .label {
  color: var(--text-main);
}

.caret-btn {
  background: rgba(255, 255, 255, 0.04);
  border: none;
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.caret-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  transform: translateY(-1px);
}

.caret-btn span {
  display: inline-block;
  transition: transform 0.18s ease;
}

.caret-btn span.open {
  transform: rotate(180deg);
}

.submenu {
  display: grid;
  gap: 4px;
  padding-left: 10px;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.submenu-item .icon {
  width: 22px;
  display: inline-flex;
  justify-content: center;
  font-size: 16px;
  color: var(--accent);
}

.submenu-item .label {
  white-space: nowrap;
  font-weight: 500;
  font-size: 13px;
  color: var(--text-muted);
}

.submenu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.submenu-item.active {
  background: rgba(51, 184, 196, 0.12);
  color: var(--text-main);
}

.submenu-item.active .icon {
  color: var(--secondary);
}

.submenu-item.active .label {
  color: var(--text-main);
}
</style>
