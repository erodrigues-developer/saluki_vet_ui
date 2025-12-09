<template>
  <NConfigProvider>
    <NMessageProvider>
      <NDialogProvider>
        <div class="layout">
          <Sidebar :items="menuItems" />
          <main class="content">
            <slot />
          </main>
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup>
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui'
import Sidebar from '~/components/Sidebar.vue'

const menuItems = [
  { label: 'Dashboard', icon: '📊', to: '/' },
  { label: 'Agenda', icon: '📅', to: '/agenda' },
  {
    label: 'Atendimentos',
    icon: '🩺',
    children: [
      { label: 'Consultas', icon: '📋', to: '/atendimentos/consultas' },
      { label: 'Procedimentos', icon: '🧪', to: '/atendimentos/procedimentos' },
      { label: 'Veterinários', icon: '👨‍⚕️', to: '/atendimentos/veterinarios' }
    ]
  },
  {
    label: 'Pets',
    icon: '🐾',
    children: [
      { label: 'Espécies e raças', icon: '🧬', to: '/pets/especies-racas' },
      { label: 'Arquivos', icon: '📁', to: '/pets/arquivos' }
    ]
  },
  { label: 'Clientes', icon: '👥', to: '/clientes' },
  {
    label: 'Vacinas',
    icon: '💉',
    children: [
      { label: 'Agenda de vacinas', icon: '🗓️', to: '/vacinas/agenda' },
      { label: 'Catálogo de vacinas', icon: '📦', to: '/vacinas/catalogo' }
    ]
  },
  {
    label: 'Vendas',
    icon: '💰',
    children: [
      { label: 'Produtos e serviços', icon: '🛍️', to: '/vendas/produtos-servicos' },
      { label: 'Categorias de produto', icon: '🏷️', to: '/vendas/categorias-produto' },
      { label: 'Movimentações de estoque', icon: '🔄', to: '/vendas/movimentacoes-estoque' }
    ]
  },
  {
    label: 'Estoque',
    icon: '📦',
    children: [
      { label: 'Itens em estoque', icon: '📦', to: '/estoque/itens' },
      { label: 'Níveis críticos', icon: '⚠️', to: '/estoque/niveis-criticos' },
      { label: 'Entradas e saídas', icon: '↕️', to: '/estoque/entradas-saidas' }
    ]
  },
  {
    label: 'Financeiro',
    icon: '💳',
    children: [
      { label: 'Pagamentos', icon: '💸', to: '/financeiro/pagamentos' },
      { label: 'Recebimentos', icon: '💵', to: '/financeiro/recebimentos' },
      { label: 'Fluxo de caixa', icon: '📈', to: '/financeiro/fluxo-caixa' }
    ]
  },
  { label: 'Relatórios', icon: '📑', to: '/relatorios' },
  {
    label: 'Cadastros',
    icon: '🗂️',
    children: [
      { label: 'Usuários e permissões', icon: '🛡️', to: '/cadastros/usuarios-permissoes' },
      { label: 'Tipos de agendamento', icon: '🗓️', to: '/cadastros/tipos-agendamento' },
      { label: 'Procedimentos médicos', icon: '🧬', to: '/cadastros/procedimentos-medicos' },
      { label: 'Categorias de produto', icon: '🏷️', to: '/cadastros/categorias-produto' },
      { label: 'Vacinas', icon: '💉', to: '/cadastros/vacinas' },
      { label: 'Métodos de pagamento', icon: '💳', to: '/cadastros/metodos-pagamento' },
      { label: 'Locais de estoque', icon: '📦', to: '/cadastros/locais-estoque' }
    ]
  },
  {
    label: 'Configurações',
    icon: '⚙️',
    children: [
      { label: 'Clínica', icon: '🏥', to: '/configuracoes/clinica' },
      { label: 'Tema / visual', icon: '🎨', to: '/configuracoes/tema-visual' },
      { label: 'Preferências', icon: '⚙️', to: '/configuracoes/preferencias' },
      { label: 'Documentos e modelos', icon: '📄', to: '/configuracoes/documentos-modelos' }
    ]
  },
  {
    label: 'Tabelas',
    icon: '📚',
    children: [
      { label: 'Espécies', icon: '🧬', to: '/tabelas/especies' },
      { label: 'Raças', icon: '🐕', to: '/tabelas/racas' },
      { label: 'Status', icon: '✅', to: '/tabelas/status' },
      { label: 'Tipos de procedimento', icon: '🩺', to: '/tabelas/tipos-procedimento' },
      { label: 'Tabelas auxiliares', icon: '🗃️', to: '/tabelas/auxiliares' }
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
}

.content {
  padding: 24px;
}
</style>
