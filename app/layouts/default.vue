<template>
  <NConfigProvider :locale="ptBR" :date-locale="datePtBR">
    <NMessageProvider>
      <NDialogProvider>
        <div class="layout" @touchstart="onEdgeTouchStart" @touchmove="onEdgeTouchMove" @touchend="onEdgeTouchEnd">
          <Sidebar
            v-if="!isMobile"
            :items="menuItems"
            @pinned-change="sidebarPinned = $event"
            @expanded-change="sidebarExpanded = $event"
          />

          <main class="content" :class="{ 'sidebar-expanded': sidebarExpanded }">
            <header class="topbar" :class="{ mobile: isMobile }">
              <template v-if="!isMobile">
                <div class="topbar-left" ref="searchWrapRef">
                  <NInput
                    v-model:value="searchQuery"
                    placeholder="Buscar cliente, pet, venda, produto..."
                    clearable
                    class="global-search"
                    @focus="searchOpen = true"
                  />

                  <div v-if="searchOpen" class="search-dropdown">
                    <template v-if="searchGroups.length">
                      <div v-for="group in searchGroups" :key="group.type" class="search-group">
                        <p class="search-group-title">{{ group.label }}</p>
                        <button
                          v-for="item in group.items"
                          :key="item.label + item.to"
                          class="search-item"
                          type="button"
                          @click="goTo(item.to)"
                        >
                          <span class="item-label">{{ item.label }}</span>
                          <span class="item-meta">{{ item.meta }}</span>
                        </button>
                      </div>
                    </template>
                    <p v-else class="search-empty">Nenhum resultado encontrado.</p>
                  </div>
                </div>

                <div class="topbar-right">
                  <NDropdown v-if="quickCreateOptions.length" :options="quickCreateOptions" @select="handleQuickCreate">
                    <NButton type="primary" secondary class="topbar-btn">+ Criar</NButton>
                  </NDropdown>

                  <div ref="notificationRef" class="notification-wrap">
                    <NBadge :value="notificationCount" :max="99" class="notification-badge">
                      <NButton quaternary circle class="icon-btn" @click="notificationOpen = !notificationOpen"><AppIcon name="bell" :size="16" :stroke-width="2" /></NButton>
                    </NBadge>
                    <div v-if="notificationOpen" class="notification-panel">
                      <p class="panel-title">Notificações</p>
                      <button
                        v-for="item in visibleNotifications"
                        :key="item.id"
                        type="button"
                        class="notification-item"
                        @click="goTo(item.to)"
                      >
                        <span>{{ item.title }}</span>
                        <small>{{ item.meta }}</small>
                      </button>
                    </div>
                  </div>

                  <NSelect v-model:value="selectedUnit" :options="unitOptions" size="small" class="unit-select" />
                  <span class="clinic-chip">{{ clinicStatus }}</span>

                  <NDropdown :options="profileOptions" @select="handleProfileAction">
                    <button type="button" class="profile-btn">
                      <NAvatar size="small" round>{{ userInitials }}</NAvatar>
                      <span class="profile-name">{{ userName }}</span>
                    </button>
                  </NDropdown>
                </div>
              </template>

              <template v-else>
                <button type="button" class="menu-btn" aria-label="Abrir menu" @click="openSidebar">
                  <PanelLeft :size="20" />
                </button>
                <div class="mobile-brand">
                  <span class="brand-icon"><ShieldCheck :size="16" :stroke-width="2" /></span>
                  <span class="brand-name">SalukiVet</span>
                </div>
                <div class="mobile-actions">
                  <NButton quaternary circle class="icon-btn" @click="mobileSearchOpen = true"><AppIcon name="search" :size="16" :stroke-width="2" /></NButton>
                  <div ref="notificationRef" class="notification-wrap">
                    <NBadge :value="notificationCount" :max="99" class="notification-badge">
                      <NButton quaternary circle class="icon-btn" @click="notificationOpen = !notificationOpen"><AppIcon name="bell" :size="16" :stroke-width="2" /></NButton>
                    </NBadge>
                    <div v-if="notificationOpen" class="notification-panel">
                      <p class="panel-title">Notificações</p>
                      <button
                        v-for="item in visibleNotifications"
                        :key="`mobile-${item.id}`"
                        type="button"
                        class="notification-item"
                        @click="goTo(item.to)"
                      >
                        <span>{{ item.title }}</span>
                        <small>{{ item.meta }}</small>
                      </button>
                    </div>
                  </div>
                  <NDropdown :options="profileOptions" @select="handleProfileAction">
                    <NAvatar size="small" round>{{ userInitials }}</NAvatar>
                  </NDropdown>
                </div>
              </template>
            </header>

            <div class="page-slot">
              <slot />
            </div>
          </main>

          <NModal v-model:show="mobileSearchOpen" preset="card" class="mobile-search-modal" title="Buscar">
            <NInput
              v-model:value="searchQuery"
              placeholder="Buscar cliente, pet, venda, produto..."
              clearable
              class="global-search"
              @focus="searchOpen = true"
            />
            <div class="mobile-search-results">
              <template v-if="searchGroups.length">
                <div v-for="group in searchGroups" :key="`m-${group.type}`" class="search-group">
                  <p class="search-group-title">{{ group.label }}</p>
                  <button
                    v-for="item in group.items"
                    :key="`m-${item.label}-${item.to}`"
                    class="search-item"
                    type="button"
                    @click="goFromMobileSearch(item.to)"
                  >
                    <span class="item-label">{{ item.label }}</span>
                    <span class="item-meta">{{ item.meta }}</span>
                  </button>
                </div>
              </template>
              <p v-else class="search-empty">Nenhum resultado encontrado.</p>
            </div>
          </NModal>

          <div v-if="isMobile" class="mobile-overlay" :class="{ open: sidebarOpen }">
            <div class="scrim" @click="closeSidebar" />
            <div class="drawer" @touchstart="onDrawerTouchStart" @touchmove="onDrawerTouchMove" @touchend="onDrawerTouchEnd">
              <Sidebar :items="menuItems" :is-mobile="true" @navigate="closeSidebar" />
            </div>
          </div>
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  BadgePercent,
  BarChart3,
  FileSpreadsheet,
  Building2,
  CalendarCog,
  CalendarDays,
  ClipboardList,
  CircleDollarSign,
  CreditCard,
  Dna,
  FolderKanban,
  Hospital,
  MapPin,
  Package,
  PanelLeft,
  PawPrint,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Tags,
  TimerReset,
  Truck,
  UserCog,
  Users
} from 'lucide-vue-next'
import { NAvatar, NBadge, NButton, NConfigProvider, NDialogProvider, NDropdown, NInput, NMessageProvider, NModal, NSelect, datePtBR, ptBR } from 'naive-ui'
import Sidebar from '~/components/Sidebar.vue'
import { useAuthStore } from '~/stores/auth'
import { PERMISSIONS, findRoutePermissions } from '~/constants/permissions'

const isMobile = ref(false)
const sidebarOpen = ref(false)
const sidebarPinned = ref(false)
const sidebarExpanded = ref(false)
const searchOpen = ref(false)
const notificationOpen = ref(false)
const mobileSearchOpen = ref(false)
const searchQuery = ref('')
const selectedUnit = ref('centro')
const searchWrapRef = ref(null)
const notificationRef = ref(null)
const auth = useAuthStore()
const router = useRouter()
const { canAny, filterByPermission } = usePermissions()
let mediaQuery = null

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false
  if (!isMobile.value) {
    sidebarOpen.value = false
    mobileSearchOpen.value = false
  } else {
    sidebarPinned.value = false
    sidebarExpanded.value = false
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

const clinicStatus = computed(() => 'Aberto até 20h')
const userName = computed(() => auth.user?.name || 'Usuário')
const userInitials = computed(() => {
  const name = userName.value.trim()
  if (!name) return 'SV'
  const chunks = name.split(' ').filter(Boolean)
  return (chunks[0]?.[0] || 'S') + (chunks[1]?.[0] || 'V')
})

const unitOptions = [
  { label: 'Clínica Centro', value: 'centro' },
  { label: 'Clínica Zona Sul', value: 'sul' }
]

const rawQuickCreateOptions = [
  { label: 'Novo atendimento', key: '/consultas/novo-atendimento', permission: PERMISSIONS.consultationsCreate },
  { label: 'Novo agendamento', key: '/atendimento/agendamentos', permission: PERMISSIONS.appointmentsCreate },
  { label: 'Nova venda', key: '/financeiro/vendas/nova', permission: PERMISSIONS.salesCreate },
  { label: 'Nova entrada de estoque', key: '/estoque/saldos', permission: 'estoque.movements.in' },
  { label: 'Novo cliente', key: '/clientes', permission: PERMISSIONS.clientsCreate },
  { label: 'Novo pet', key: '/pets', permission: PERMISSIONS.petsCreate },
  { label: 'Novo box', key: '/cadastros/boxes', permission: 'cadastros.boxes.create' },
  { label: 'Nova conta a pagar', key: '/financeiro/contas-a-pagar', permission: 'financeiro.accounts_payable.create' },
  { label: 'Nova conta a receber', key: '/financeiro/contas-a-receber', permission: 'financeiro.accounts_receivable.create' }
]

const quickCreateOptions = computed(() => filterByPermission(rawQuickCreateOptions))

const profileOptions = computed(() => filterByPermission([
  { label: 'Meu perfil', key: '/usuarios' },
  { label: 'Configurações', key: '/configuracoes/clinica', permission: PERMISSIONS.clinicSettingsView },
  { label: 'Trocar clínica/unidade', key: 'switch-unit' },
  { type: 'divider', key: 'divider-1' },
  { label: 'Sair', key: 'logout' }
]))

const notifications = [
  { id: 'n1', title: '3 vacinas atrasadas', meta: 'Agenda de vacinas', to: '/atendimento/agendamentos', permission: PERMISSIONS.appointmentsView },
  { id: 'n2', title: '3 itens com estoque crítico', meta: 'Estoque', to: '/estoque/saldos?status=LOW', permission: PERMISSIONS.stockBalancesView },
  { id: 'n3', title: 'R$ 3.550 em contas atrasadas', meta: 'Financeiro', to: '/financeiro/contas-a-pagar', permission: PERMISSIONS.accountsPayableView },
  { id: 'n4', title: '3 vendas abertas', meta: 'Vendas', to: '/financeiro/vendas?status=aberta', permission: PERMISSIONS.salesView }
]

const visibleNotifications = computed(() => filterByPermission(notifications))
const notificationCount = computed(() => visibleNotifications.value.length)

const rawSearchableItems = [
  { type: 'Clientes', label: 'Cadastro de clientes', meta: 'Clientes', to: '/clientes', permission: PERMISSIONS.clientsView },
  { type: 'Pets', label: 'Cadastro de pets', meta: 'Pets', to: '/pets', permission: PERMISSIONS.petsView },
  { type: 'Boxes', label: 'Cadastro de boxes', meta: 'Cadastros', to: '/cadastros/boxes', permission: PERMISSIONS.boxesView },
  { type: 'Vendas', label: 'Vendas', meta: 'Vendas', to: '/financeiro/vendas', permission: PERMISSIONS.salesView },
  { type: 'Vendas', label: 'Caixa', meta: 'Vendas', to: '/financeiro/caixa', permission: PERMISSIONS.cashRegistersView },
  { type: 'Vendas', label: 'Comissões', meta: 'Vendas', to: '/financeiro/comissoes', permission: PERMISSIONS.commissionsView },
  { type: 'Produtos', label: 'Produtos e serviços', meta: 'Cadastros', to: '/cadastros/produtos', permission: PERMISSIONS.productsView },
  { type: 'Estoque', label: 'Saldos de estoque', meta: 'Estoque', to: '/estoque/saldos', permission: PERMISSIONS.stockBalancesView },
  { type: 'Estoque', label: 'Histórico de movimentações', meta: 'Estoque', to: '/estoque/movimentacoes', permission: PERMISSIONS.stockMovementsView },
  { type: 'Estoque', label: 'Locais de estoque', meta: 'Cadastros', to: '/cadastros/locais-estoque', permission: PERMISSIONS.stockLocationsView },
  { type: 'Financeiro', label: 'Contas a pagar', meta: 'Financeiro', to: '/financeiro/contas-a-pagar', permission: PERMISSIONS.accountsPayableView },
  { type: 'Financeiro', label: 'Contas a receber', meta: 'Financeiro', to: '/financeiro/contas-a-receber', permission: PERMISSIONS.accountsReceivableView },
  { type: 'Relatórios', label: 'Relatórios gerenciais', meta: 'Relatórios', to: '/relatorios', permission: PERMISSIONS.reportsView },
  { type: 'Fornecedores', label: 'Fornecedores', meta: 'Cadastros', to: '/cadastros/fornecedores', permission: PERMISSIONS.suppliersView },
  { type: 'Agendamentos', label: 'Agendamentos', meta: 'Atendimentos', to: '/atendimento/agendamentos', permission: PERMISSIONS.appointmentsView },
  { type: 'Configurações', label: 'Escalas e Disponibilidade', meta: 'Configurações', to: '/configuracoes/escalas-disponibilidade', permission: PERMISSIONS.availabilityView },
  { type: 'Usuários', label: 'Usuários', meta: 'Cadastros', to: '/usuarios', permission: PERMISSIONS.usersView },
  { type: 'Permissões', label: 'Permissões', meta: 'Segurança', to: '/cadastros/permissoes', permission: PERMISSIONS.permissionsView }
]

const searchableItems = computed(() => filterByPermission(rawSearchableItems))

const searchGroups = computed(() => {
  const term = searchQuery.value.trim().toLowerCase()
  const filtered = term
    ? searchableItems.value.filter((item) => `${item.label} ${item.meta} ${item.type}`.toLowerCase().includes(term))
    : searchableItems.value.slice(0, 6)

  const groupedMap = new Map()
  filtered.forEach((item) => {
    const current = groupedMap.get(item.type) || []
    current.push(item)
    groupedMap.set(item.type, current)
  })

  return Array.from(groupedMap.entries()).map(([type, items]) => ({
    type,
    label: type,
    items
  }))
})

const handleQuickCreate = (key) => {
  goTo(String(key))
}

const handleProfileAction = (key) => {
  if (key === 'logout') {
    auth.logout()
    return
  }
  if (key === 'switch-unit') {
    selectedUnit.value = selectedUnit.value === 'centro' ? 'sul' : 'centro'
    return
  }
  goTo(String(key))
}

const goTo = (to) => {
  const routePermissions = findRoutePermissions(String(to).split('?')[0])
  if (routePermissions.length && !canAny(routePermissions)) return
  searchOpen.value = false
  notificationOpen.value = false
  mobileSearchOpen.value = false
  router.push(to)
}

const goFromMobileSearch = (to) => {
  goTo(to)
}

const handleDocumentClick = (event) => {
  const searchEl = searchWrapRef.value
  const notificationEl = notificationRef.value
  if (searchEl && !searchEl.contains(event.target)) {
    searchOpen.value = false
  }
  if (notificationEl && !notificationEl.contains(event.target)) {
    notificationOpen.value = false
  }
}

const handleDocumentKeydown = (event) => {
  if (event.key !== 'Escape') return
  if (isMobile.value && sidebarOpen.value) {
    closeSidebar()
  }
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
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  if (mediaQuery) {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', updateIsMobile)
    } else {
      mediaQuery.removeListener(updateIsMobile)
    }
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleDocumentKeydown)
    document.body.style.overflow = ''
  }
})

const rawMenuItems = [
  { label: 'Dashboard', icon: BarChart3, to: '/', permission: PERMISSIONS.dashboardView },
  {
    label: 'Atendimentos',
    icon: Stethoscope,
    children: [
      { label: 'Agendamentos', icon: CalendarDays, to: '/atendimento/agendamentos', permission: PERMISSIONS.appointmentsView },
      { label: 'Consultas', icon: ClipboardList, to: '/atendimento/consultas', permission: PERMISSIONS.consultationsView },
      { label: 'Internação', icon: Hospital, to: '/atendimento/internacao', permission: PERMISSIONS.inpatientView }
    ]
  },
  {
    label: 'Pets',
    icon: PawPrint,
    to: '/pets',
    permission: PERMISSIONS.petsView
  },
  { label: 'Clientes', icon: Users, to: '/clientes', permission: PERMISSIONS.clientsView },
  {
    label: 'Vendas',
    icon: ShoppingCart,
    children: [
      { label: 'Vendas', icon: ShoppingCart, to: '/financeiro/vendas', permission: PERMISSIONS.salesView },
      { label: 'Caixa', icon: CircleDollarSign, to: '/financeiro/caixa', permission: PERMISSIONS.cashRegistersView },
      { label: 'Comissões', icon: BadgePercent, to: '/financeiro/comissoes', permission: PERMISSIONS.commissionsView }
    ]
  },
  {
    label: 'Financeiro',
    icon: CircleDollarSign,
    children: [
      { label: 'Contas a pagar', icon: ReceiptText, to: '/financeiro/contas-a-pagar', permission: PERMISSIONS.accountsPayableView },
      { label: 'Contas a receber', icon: CreditCard, to: '/financeiro/contas-a-receber', permission: PERMISSIONS.accountsReceivableView }
    ]
  },
  {
    label: 'Fiscal',
    icon: ShieldCheck,
    children: [
      { label: 'Documentos fiscais', icon: ReceiptText, to: '/fiscal/documentos', permission: PERMISSIONS.fiscalDocumentsView },
      { label: 'Pendências fiscais', icon: ClipboardList, to: '/fiscal/pendencias', permission: PERMISSIONS.fiscalPendingView },
      { label: 'Configurações fiscais', icon: Settings, to: '/fiscal/configuracoes', permission: PERMISSIONS.fiscalSettingsView }
    ]
  },
  {
    label: 'Relatórios',
    icon: FileSpreadsheet,
    to: '/relatorios',
    permission: PERMISSIONS.reportsView
  },
  {
    label: 'Estoque',
    icon: Package,
    children: [
      { label: 'Saldos', icon: Package, to: '/estoque/saldos', permission: PERMISSIONS.stockBalancesView },
      { label: 'Movimentações', icon: ClipboardList, to: '/estoque/movimentacoes', permission: PERMISSIONS.stockMovementsView }
    ]
  },
  {
    label: 'Cadastros',
    icon: FolderKanban,
    children: [
      { label: 'Usuários', icon: UserCog, to: '/usuarios', permission: PERMISSIONS.usersView },
      { label: 'Permissões', icon: ShieldCheck, to: '/cadastros/permissoes', permission: PERMISSIONS.permissionsView },
      { label: 'Tipos de agendamento', icon: CalendarCog, to: '/cadastros/tipos-agendamento', permission: PERMISSIONS.appointmentTypesView },
      { label: 'Categorias de produto', icon: Tags, to: '/cadastros/categorias-produto', permission: PERMISSIONS.productCategoriesView },
      { label: 'Fornecedores', icon: Truck, to: '/cadastros/fornecedores', permission: PERMISSIONS.suppliersView },
      { label: 'Boxes de internação', icon: Hospital, to: '/cadastros/boxes', permission: PERMISSIONS.boxesView },
      { label: 'Locais de estoque', icon: MapPin, to: '/cadastros/locais-estoque', permission: PERMISSIONS.stockLocationsView },
      { label: 'Produtos e serviços', icon: Package, to: '/cadastros/produtos', permission: PERMISSIONS.productsView },
      { label: 'Procedimentos médicos', icon: Stethoscope, to: '/cadastros/procedimentos', permission: PERMISSIONS.proceduresView },
      { label: 'Exames', icon: ClipboardList, to: '/cadastros/exames', permission: PERMISSIONS.examTypesView },
      { label: 'Formas de pagamento', icon: CreditCard, to: '/cadastros/formas-pagamento', permission: PERMISSIONS.paymentMethodsView },
      { label: 'Espécies', icon: Dna, to: '/tabelas/especies', permission: PERMISSIONS.speciesView },
      { label: 'Raças', icon: Tags, to: '/tabelas/racas', permission: PERMISSIONS.breedsView },
      { label: 'Status', icon: ClipboardList, to: '/tabelas/status', permission: PERMISSIONS.appointmentStatusesView }
    ]
  },
  {
    label: 'Configurações',
    icon: Settings,
    children: [
      { label: 'Clínica', icon: Building2, to: '/configuracoes/clinica', permission: PERMISSIONS.clinicSettingsView },
      { label: 'Escalas e Disponibilidade', icon: TimerReset, to: '/configuracoes/escalas-disponibilidade', permission: PERMISSIONS.availabilityView },
    ]
  }
]

const menuItems = computed(() => filterByPermission(rawMenuItems))
</script>

<style scoped>
:global(html),
:global(body),
:global(#__nuxt) {
  max-width: 100%;
  overflow-x: hidden;
}

:global(:root) {
  --sidebar-collapsed-width: 72px;
  --sidebar-expanded-width: 256px;
}

.layout {
  min-height: 100vh;
  background: #f4f6fb;
  position: relative;
}

.content {
  padding: 0 24px 24px;
  margin-left: var(--sidebar-collapsed-width);
  min-width: 0;
  overflow-x: hidden;
  transition: margin-left 0.2s ease;
}

.content.sidebar-expanded {
  margin-left: var(--sidebar-expanded-width);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 64px;
  background: #f4f6fb;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  overflow: visible;
}

.topbar-left {
  position: relative;
  width: min(560px, 100%);
}

.global-search {
  width: 100%;
}

.search-dropdown {
  position: absolute;
  top: 48px;
  left: 0;
  width: 100%;
  z-index: 60;
  max-height: 420px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  padding: 10px;
}

.search-group {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
}

.search-group-title {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.search-item {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
}

.search-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.item-label {
  font-size: 13px;
  color: #0f172a;
}

.item-meta {
  font-size: 12px;
  color: #64748b;
}

.search-empty {
  margin: 4px 0;
  color: #64748b;
  font-size: 13px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-btn,
.icon-btn {
  cursor: pointer;
}

.notification-wrap {
  position: relative;
}

.notification-badge :deep(.n-badge-sup) {
  left: auto;
  inset-inline-start: auto;
  inset-inline-end: 2px;
  top: 0;
  right: 2px;
  transform: translate(0, -20%);
}

.notification-panel {
  position: absolute;
  right: 0;
  top: 46px;
  z-index: 60;
  width: 300px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.panel-title {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.notification-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  padding: 8px 10px;
  text-align: left;
  display: grid;
  gap: 4px;
  cursor: pointer;
}

.notification-item span {
  font-size: 13px;
  color: #0f172a;
}

.notification-item small {
  font-size: 12px;
  color: #64748b;
}

.unit-select {
  width: 160px;
}

.clinic-chip {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  border-radius: 999px;
  font-size: 12px;
  padding: 6px 10px;
  white-space: nowrap;
}

.profile-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 999px;
  padding: 4px 8px 4px 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.profile-name {
  font-size: 13px;
  color: #334155;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-slot {
  padding-top: 16px;
}

.mobile-search-modal :deep(.n-card) {
  width: min(94vw, 520px);
}

.mobile-search-results {
  margin-top: 10px;
  max-height: 60vh;
  overflow: auto;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 40;
  overflow: hidden;
}

.mobile-overlay .scrim {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.38);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.mobile-overlay .drawer {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: min(320px, 82vw);
  background: #f4f6fb;
  box-shadow: 4px 0 18px rgba(15, 23, 42, 0.22);
  transform: translateX(-100%);
  transition: transform 0.22s ease;
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

.mobile-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 0;
  flex-shrink: 0;
  justify-self: end;
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #111827;
  min-width: 0;
}

.brand-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #0e3a56, #2cb67d);
  font-size: 16px;
}

.menu-btn {
  border: none;
  background: rgba(15, 23, 42, 0.08);
  color: #111827;
  border-radius: 10px;
  width: 40px;
  height: 40px;
  font-size: 20px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

@media (max-width: 900px) {
  .content {
    padding: 0 14px 18px;
    margin-left: 0;
  }

  .topbar.mobile {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    align-items: center;
    height: 58px;
    gap: 10px;
    overflow: visible;
    padding-right: 4px;
  }

  .profile-name,
  .unit-select,
  .clinic-chip {
    display: none;
  }

  .page-slot {
    padding-top: 12px;
    min-width: 0;
    overflow-x: hidden;
  }
}
</style>
