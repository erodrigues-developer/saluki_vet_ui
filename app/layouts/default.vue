<template>
  <NConfigProvider :locale="ptBR" :date-locale="datePtBR">
    <NMessageProvider>
      <NDialogProvider>
        <div class="layout" @touchstart="onEdgeTouchStart" @touchmove="onEdgeTouchMove" @touchend="onEdgeTouchEnd">
          <Sidebar v-if="!isMobile" :items="menuItems" />
          <main class="content">
            <div v-if="isMobile" class="mobile-topbar">
              <button type="button" class="menu-btn" aria-label="Abrir menu" @click="openSidebar">☰</button>
              <div class="mobile-brand">
                <span class="brand-icon">🛡️</span>
                <span class="brand-name">SalukiVet</span>
              </div>
            </div>
            <slot />
          </main>
          <div v-if="isMobile" class="mobile-overlay" :class="{ open: sidebarOpen }">
            <div class="scrim" @click="closeSidebar" />
            <div class="drawer" @touchstart="onDrawerTouchStart" @touchmove="onDrawerTouchMove"
              @touchend="onDrawerTouchEnd">
              <Sidebar :items="menuItems" :is-mobile="true" @navigate="closeSidebar" />
            </div>
          </div>
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, datePtBR, ptBR } from 'naive-ui'
import Sidebar from '~/components/Sidebar.vue'

const isMobile = ref(false)
const sidebarOpen = ref(false)
let mediaQuery = null
const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
  if (!isMobile.value) {
    sidebarOpen.value = false
  }
}

const openSidebar = () => {
  sidebarOpen.value = true
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

watch(
  () => sidebarOpen.value,
  (val) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = val ? 'hidden' : ''
  }
)

const EDGE_THRESHOLD = 24
const SWIPE_THRESHOLD = 60
const MAX_VERTICAL = 40
let edgeStartX = 0
let edgeStartY = 0
let edgeTracking = false

const onEdgeTouchStart = (event) => {
  if (!isMobile.value || sidebarOpen.value) return
  const touch = event.touches?.[0]
  if (!touch) return
  edgeStartX = touch.clientX
  edgeStartY = touch.clientY
  edgeTracking = edgeStartX <= EDGE_THRESHOLD
}

const onEdgeTouchMove = (event) => {
  if (!edgeTracking) return
  const touch = event.touches?.[0]
  if (!touch) return
  const deltaX = touch.clientX - edgeStartX
  const deltaY = touch.clientY - edgeStartY
  if (Math.abs(deltaY) > MAX_VERTICAL) {
    edgeTracking = false
    return
  }
  if (deltaX > SWIPE_THRESHOLD) {
    openSidebar()
    edgeTracking = false
  }
}

const onEdgeTouchEnd = () => {
  edgeTracking = false
}

let drawerStartX = 0
let drawerStartY = 0
let drawerTracking = false

const onDrawerTouchStart = (event) => {
  if (!isMobile.value || !sidebarOpen.value) return
  const touch = event.touches?.[0]
  if (!touch) return
  drawerStartX = touch.clientX
  drawerStartY = touch.clientY
  drawerTracking = true
}

const onDrawerTouchMove = (event) => {
  if (!drawerTracking) return
  const touch = event.touches?.[0]
  if (!touch) return
  const deltaX = touch.clientX - drawerStartX
  const deltaY = touch.clientY - drawerStartY
  if (Math.abs(deltaY) > MAX_VERTICAL) {
    drawerTracking = false
    return
  }
  if (deltaX < -SWIPE_THRESHOLD) {
    closeSidebar()
    drawerTracking = false
  }
}

const onDrawerTouchEnd = () => {
  drawerTracking = false
}

onMounted(() => {
  if (typeof window === 'undefined') return
  mediaQuery = window.matchMedia('(max-width: 900px)')
  updateIsMobile()
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', updateIsMobile)
  } else {
    mediaQuery.addListener(updateIsMobile)
  }
})

onBeforeUnmount(() => {
  if (!mediaQuery) return
  if (mediaQuery.removeEventListener) {
    mediaQuery.removeEventListener('change', updateIsMobile)
  } else {
    mediaQuery.removeListener(updateIsMobile)
  }
})

const menuItems = [
  { label: 'Dashboard', icon: '📊', to: '/' },
  {
    label: 'Atendimentos',
    icon: '🩺',
    children: [
      { label: 'Agendamentos', icon: '📅', to: '/atendimento/agendamentos' },
      { label: 'Consultas', icon: '📋', to: '/atendimento/consultas' }
    ]
  },
  {
    label: 'Pets',
    icon: '🐾',
    children: [
      { label: 'Cadastro de pets', icon: '🐶', to: '/pets' }
    ]
  },
  { label: 'Clientes', icon: '👥', to: '/clientes' },
  {
    label: 'Vendas',
    icon: '💰',
    children: [
      { label: 'Caixa / PDV', icon: '💳', to: '/financeiro/vendas' }
    ]
  },
  {
    label: 'Cadastros',
    icon: '🗂️',
    children: [
      { label: 'Usuários e permissões', icon: '🛡️', to: '/usuarios' },
      { label: 'Tipos de agendamento', icon: '🗓️', to: '/cadastros/tipos-agendamento' },
      { label: 'Categorias de produto', icon: '🏷️', to: '/cadastros/categorias-produto' },
      { label: 'Produtos e Serviços', icon: '📦', to: '/cadastros/produtos' },
      { label: 'Procedimentos médicos', icon: '🩺', to: '/cadastros/procedimentos' },
      { label: 'Formas de Pagamento', icon: '💲', to: '/cadastros/formas-pagamento' },
    ]
  },
  {
    label: 'Configurações',
    icon: '⚙️',
    children: [
      { label: 'Clínica', icon: '🏥', to: '/configuracoes/clinica' }
    ]
  },
  {
    label: 'Tabelas',
    icon: '📚',
    children: [
      { label: 'Espécies', icon: '🧬', to: '/tabelas/especies' },
      { label: 'Raças', icon: '🐕', to: '/tabelas/racas' },
      { label: 'Status', icon: '✅', to: '/tabelas/status' }
    ]
  }
]
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: auto 1fr;
  min-height: 100vh;
  background: #f4f6fb;
  position: relative;
  --sidebar-bg: #f4f6fb;
  --sidebar-text: #111827;
  --sidebar-muted: #6b7280;
  --sidebar-primary: #0E3A56;
  --sidebar-secondary: #2CB67D;
}

.content {
  padding: 24px;
}

.mobile-topbar {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 8px 4px 16px;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
}

.menu-btn {
  border: none;
  background: rgba(15, 23, 42, 0.08);
  color: var(--sidebar-text);
  border-radius: 10px;
  width: 40px;
  height: 40px;
  font-size: 20px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: var(--sidebar-text);
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--sidebar-primary), var(--sidebar-secondary));
  font-size: 16px;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}

.mobile-overlay .scrim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  opacity: 0;
  transition: opacity 240ms ease-out;
}

.mobile-overlay .drawer {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 82vw;
  max-width: 360px;
  min-width: 260px;
  background: var(--sidebar-bg);
  transform: translateX(-100%);
  transition: transform 240ms ease-out;
}

.mobile-overlay.open {
  pointer-events: auto;
}

.mobile-overlay.open .scrim {
  opacity: 1;
}

.mobile-overlay.open .drawer {
  transform: translateX(0);
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }


  .mobile-topbar {
    display: flex;
  }
}
</style>
