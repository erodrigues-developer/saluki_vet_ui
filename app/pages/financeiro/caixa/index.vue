<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">FINANCEIRO</p>
        <h1>Caixa</h1>
        <p class="subhead">
          Controle terminais, aberturas, sangrias e fechamentos de caixa.
        </p>
      </div>
      <div v-if="!isMobile" class="head-actions">
        <n-button v-if="canManagePrinters" secondary strong @click="openPrinterModal"
          >Nova impressora</n-button
        >
        <n-button v-if="canManageTerminals" secondary strong @click="openTerminalModal"
          >Novo terminal</n-button
        >
        <n-button
          type="primary"
          v-if="canOpenCashRegister"
          size="large"
          class="head-cta"
          @click="openSessionModal"
          >Abrir caixa</n-button
        >
      </div>
    </div>

    <div v-if="isMobile" class="mobile-actions-row">
      <n-button v-if="canOpenCashRegister" type="primary" block @click="openSessionModal"
        >Abrir caixa</n-button
      >
      <n-button v-if="canManageTerminals" secondary strong block @click="openTerminalModal"
        >Novo terminal</n-button
      >
    </div>

    <div
      :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'"
    >
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Caixas abertos</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{
          summary.openSessions
        }}</strong>
      </n-card>
      <n-card
        size="small"
        :bordered="false"
        class="summary-card summary-card-success"
      >
        <p class="summary-label">Saldo em dinheiro</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{
          formatCurrency(summary.openCashAmount)
        }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Terminais ativos</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{
          summary.activeTerminals
        }}</strong>
      </n-card>
      <n-card size="small" :bordered="false" class="summary-card">
        <p class="summary-label">Impressoras ativas</p>
        <strong :class="isMobile ? 'summary-value-mobile' : 'summary-value'">{{
          summary.activePrinters
        }}</strong>
      </n-card>
    </div>

    <n-card
      v-if="!isMobile"
      :bordered="false"
      size="small"
      class="filters-card"
    >
      <div class="filters-grid">
        <n-select
          v-model:value="filters.terminalId"
          :options="terminalOptionsWithAll"
          placeholder="Terminal"
          clearable
        />
        <n-select
          v-model:value="filters.status"
          :options="statusOptions"
          placeholder="Status"
        />
        <n-date-picker
          v-model:value="filters.period"
          type="daterange"
          format="dd/MM/yyyy"
          clearable
          start-placeholder="Abertura inicial"
          end-placeholder="Abertura final"
        />
        <div class="filter-actions">
          <n-button text class="btn-clear" @click="handleClearFilters"
            >Limpar filtros</n-button
          >
          <n-button secondary strong class="btn-filter" @click="handleFilter"
            >Filtrar</n-button
          >
        </div>
      </div>
    </n-card>

    <n-card
      v-else
      :bordered="false"
      size="small"
      class="filters-card mobile-filters-card"
    >
      <div class="mobile-filter-top">
        <n-select
          v-model:value="filters.terminalId"
          :options="terminalOptionsWithAll"
          placeholder="Terminal"
          clearable
        />
        <n-button
          secondary
          strong
          class="mobile-filter-trigger"
          @click="showMobileFilters = true"
        >
          <span class="inline-icon-label"
            ><AppIcon name="search" :size="16" :stroke-width="2" /><span
              >Filtros</span
            ></span
          >
        </n-button>
      </div>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div
        v-for="row in sessions"
        :key="row.id"
        class="entity-card"
        @click="openSummary(row)"
      >
        <div class="card-top">
          <p class="card-title">{{ row.terminal?.name || "-" }}</p>
          <n-tag
            :bordered="false"
            :class="[
              'status-chip',
              row.status === 'OPEN'
                ? 'badge-soft-success'
                : 'badge-soft-neutral',
            ]"
            >{{ statusLabel(row.status) }}</n-tag
          >
        </div>
        <p class="card-subtitle">Aberto em: {{ formatDate(row.openedAt) }}</p>
        <p class="card-subtitle">
          Operador: {{ row.openedByUser?.name || "-" }}
        </p>
        <p class="card-subtitle card-value">
          Saldo esperado: {{ formatCurrency(row.expectedCashAmount) }}
        </p>
        <div class="card-actions" @click.stop>
          <n-button
            v-if="canWithdrawCashRegister"
            size="small"
            secondary
            type="primary"
            :disabled="row.status !== 'OPEN'"
            @click="openWithdrawModal(row)"
            >Sangria</n-button
          >
          <n-button
            v-if="canCloseCashRegister"
            size="small"
            secondary
            type="primary"
            :disabled="row.status !== 'OPEN'"
            @click="openCloseModal(row)"
            >Fechar</n-button
          >
        </div>
      </div>
    </div>

    <div v-else class="data-table-card">
      <n-data-table
        remote
        :columns="columns"
        :data="sessions"
        :loading="loading"
        :pagination="tablePagination"
        :bordered="false"
        :row-props="rowProps"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </div>

    <n-drawer
      v-model:show="showMobileFilters"
      placement="bottom"
      height="42%"
      :trap-focus="false"
    >
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select
            v-model:value="filters.status"
            :options="statusOptions"
            placeholder="Status"
          />
          <n-date-picker
            v-model:value="filters.period"
            type="daterange"
            format="dd/MM/yyyy"
            clearable
          />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters"
              >Limpar filtros</n-button
            >
            <n-button type="primary" @click="applyMobileFilters"
              >Filtrar</n-button
            >
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showSessionModal"
      preset="card"
      class="cash-modal"
      style="width: 760px"
      :mask-closable="false"
    >
      <template #header
        ><ModalHead
          title="Abrir caixa"
          subtitle="Selecione o terminal e informe o fundo inicial."
      /></template>
      <n-form label-placement="top" :model="openForm">
        <section class="form-section">
          <h4 class="section-title">Dados da abertura</h4>
          <div class="form-grid">
            <n-form-item label="Terminal" required>
              <n-select
                v-model:value="openForm.terminalId"
                :options="terminalOptions"
                placeholder="Selecione o terminal"
              />
            </n-form-item>
            <n-form-item label="Valor inicial" required>
              <CurrencyInput v-model="openForm.openingAmount" />
              <p v-if="openingSuggestionLoading" class="field-hint">
                Buscando saldo anterior...
              </p>
              <p
                v-else-if="openingSuggestion?.hasPreviousClosedSession"
                class="field-hint"
              >
                Sugerido a partir do fechamento do caixa #{{
                  openingSuggestion.sourceSessionId
                }}
                em {{ formatDate(openingSuggestion.sourceClosedAt) }}.
              </p>
              <p v-else-if="openForm.terminalId" class="field-hint">
                Nenhum fechamento anterior encontrado para este terminal.
              </p>
            </n-form-item>
            <n-form-item label="Observações" class="full-row">
              <n-input
                v-model:value="openForm.notes"
                type="textarea"
                :rows="3"
                placeholder="Opcional"
              />
            </n-form-item>
          </div>
        </section>
      </n-form>
      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="saving" @click="showSessionModal = false"
            >Cancelar</n-button
          >
          <n-button v-if="canOpenCashRegister" type="primary" :loading="saving" @click="handleOpenSession"
            >Abrir caixa</n-button
          >
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showCloseSangriaPrompt"
      preset="card"
      class="cash-modal"
      style="width: 760px"
      :mask-closable="false"
    >
      <template #header
        ><ModalHead
          title="Sangria antes do fechamento"
          subtitle="Antes de encerrar o caixa, confirme se haverá retirada de dinheiro."
      /></template>
      <section class="form-section">
        <h4 class="section-title">Caixa selecionado</h4>
        <div class="summary-line">
          <span>Terminal</span
          ><strong>{{ selectedSession?.terminal?.name || "-" }}</strong>
        </div>
        <div class="summary-line">
          <span>Saldo esperado</span
          ><strong>{{
            formatCurrency(selectedSession?.expectedCashAmount || 0)
          }}</strong>
        </div>
      </section>
      <template #footer>
        <div class="modal-actions">
          <n-button v-if="canCloseCashRegister" :disabled="saving" @click="continueCloseWithoutWithdraw"
            >Fechar sem sangria</n-button
          >
          <n-button
            type="primary"
            v-if="canWithdrawCashRegister"
            :disabled="saving"
            @click="startWithdrawBeforeClose"
            >Realizar sangria</n-button
          >
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showWithdrawModal"
      preset="card"
      class="cash-modal"
      style="width: 760px"
      :mask-closable="false"
    >
      <template #header
        ><ModalHead
          title="Sangria"
          subtitle="Registre a retirada de dinheiro do caixa aberto."
      /></template>
      <section class="form-section">
        <h4 class="section-title">Resumo do caixa</h4>
        <div class="summary-line">
          <span>Terminal</span
          ><strong>{{ selectedSession?.terminal?.name || "-" }}</strong>
        </div>
        <div class="summary-line">
          <span>Saldo esperado</span
          ><strong>{{
            formatCurrency(selectedSession?.expectedCashAmount || 0)
          }}</strong>
        </div>
      </section>
      <n-form label-placement="top" :model="withdrawForm">
        <section class="form-section">
          <h4 class="section-title">Dados da sangria</h4>
          <div class="form-grid">
            <n-form-item label="Valor" required
              ><CurrencyInput v-model="withdrawForm.amount"
            /></n-form-item>
            <n-form-item label="Motivo" required
              ><n-input
                v-model:value="withdrawForm.notes"
                placeholder="Ex.: retirada para cofre"
            /></n-form-item>
          </div>
        </section>
      </n-form>
      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="saving" @click="cancelWithdraw"
            >Cancelar</n-button
          >
          <n-button v-if="canWithdrawCashRegister" type="primary" :loading="saving" @click="handleWithdraw"
            >Confirmar sangria</n-button
          >
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showCloseModal"
      preset="card"
      class="cash-modal"
      style="width: 760px"
      :mask-closable="false"
    >
      <template #header
        ><ModalHead
          title="Fechar caixa"
          subtitle="Informe o valor contado para conferir a diferença."
      /></template>
      <section class="form-section">
        <h4 class="section-title">Conferência</h4>
        <div class="summary-line">
          <span>Saldo esperado</span
          ><strong>{{
            formatCurrency(selectedSession?.expectedCashAmount || 0)
          }}</strong>
        </div>
        <div class="summary-line">
          <span>Valor declarado</span
          ><strong>{{ formatCurrency(closeForm.declaredCashAmount) }}</strong>
        </div>
        <div class="summary-line">
          <span>Diferença</span
          ><strong :class="cashDifference === 0 ? 'diff-zero' : 'diff-alert'">{{
            formatCurrency(cashDifference)
          }}</strong>
        </div>
      </section>
      <n-form label-placement="top" :model="closeForm">
        <section class="form-section">
          <div class="form-grid">
            <n-form-item label="Valor contado" required
              ><CurrencyInput v-model="closeForm.declaredCashAmount"
            /></n-form-item>
            <n-form-item label="Observações"
              ><n-input
                v-model:value="closeForm.closingNotes"
                placeholder="Opcional"
            /></n-form-item>
          </div>
        </section>
      </n-form>
      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="saving" @click="showCloseModal = false"
            >Cancelar</n-button
          >
          <n-button v-if="canCloseCashRegister" type="primary" :loading="saving" @click="handleCloseSession"
            >Fechar caixa</n-button
          >
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showTerminalModal"
      :mask-closable="false"
      preset="card"
      class="cash-modal"
      style="width: 760px"
    >
      <template #header
        ><ModalHead
          title="Novo terminal"
          subtitle="Cadastre um terminal para controle individual de caixa."
      /></template>
      <CashRegisterTerminalForm
        ref="terminalFormRef"
        :loading="saving"
        :printer-options="printerOptions"
        @submit="handleSaveTerminal"
        @validity-change="terminalFormValid = $event"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="saving" @click="showTerminalModal = false"
            >Cancelar</n-button
          >
          <n-button
            type="primary"
            v-if="canManageTerminals"
            :loading="saving"
            :disabled="!terminalFormValid"
            @click="terminalFormRef?.submit()"
            >Criar terminal</n-button
          >
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showPrinterModal"
      :mask-closable="false"
      preset="card"
      class="cash-modal"
      style="width: 760px"
    >
      <template #header
        ><ModalHead
          title="Nova impressora"
          subtitle="Cadastre uma impressora térmica para os terminais."
      /></template>
      <ThermalPrinterForm
        ref="printerFormRef"
        :loading="saving"
        @submit="handleSavePrinter"
        @validity-change="printerFormValid = $event"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="saving" @click="showPrinterModal = false"
            >Cancelar</n-button
          >
          <n-button
            type="primary"
            v-if="canManagePrinters"
            :loading="saving"
            :disabled="!printerFormValid"
            @click="printerFormRef?.submit()"
            >Criar impressora</n-button
          >
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  h,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { format, subDays } from "date-fns";
import { NButton, NTag, useMessage } from "naive-ui";
import CurrencyInput from "~/components/common/CurrencyInput.vue";
import CashRegisterTerminalForm from "~/components/cash-registers/CashRegisterTerminalForm.vue";
import ThermalPrinterForm from "~/components/cash-registers/ThermalPrinterForm.vue";
import { PERMISSIONS } from "~/constants/permissions";

type SessionRow = {
  id: number;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  openingAmount: number | string;
  expectedCashAmount: number | string;
  cashDifference?: number | string | null;
  terminal?: { id: number; name: string };
  openedByUser?: { name: string };
};

const ModalHead = (_props: { title: string; subtitle: string }) =>
  h("div", { class: "modal-head" }, [
    h("h3", { class: "modal-title" }, _props.title),
    h("p", { class: "modal-subtitle" }, _props.subtitle),
  ]);

const message = useMessage();
const api = useApi();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const sessions = ref<SessionRow[]>([]);
const terminals = ref<any[]>([]);
const printers = ref<any[]>([]);
const showMobileFilters = ref(false);
const showSessionModal = ref(false);
const showCloseSangriaPrompt = ref(false);
const showWithdrawModal = ref(false);
const showCloseModal = ref(false);
const showTerminalModal = ref(false);
const showPrinterModal = ref(false);
const selectedSession = ref<SessionRow | null>(null);
const openingSuggestion = ref<any | null>(null);
const openingSuggestionLoading = ref(false);
const terminalFormRef = ref<{ submit: () => Promise<void> } | null>(null);
const printerFormRef = ref<{ submit: () => Promise<void> } | null>(null);
const terminalFormValid = ref(false);
const printerFormValid = ref(false);
const isMobile = ref(false);
const closeAfterWithdraw = ref(false);
let openingSuggestionRequest = 0;
let mediaQuery: MediaQueryList | null = null;

const filters = reactive({
  terminalId: null as number | null,
  status: "ALL",
  period: [subDays(new Date(), 29).getTime(), new Date().getTime()] as
    [number, number] | null,
});
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const summary = reactive({
  openSessions: 0,
  openCashAmount: 0,
  activeTerminals: 0,
  activePrinters: 0,
});
const openForm = reactive({
  terminalId: null as number | null,
  openingAmount: 0,
  notes: "",
});
const withdrawForm = reactive({ amount: 0, notes: "" });
const closeForm = reactive({ declaredCashAmount: 0, closingNotes: "" });

const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Aberto", value: "OPEN" },
  { label: "Fechado", value: "CLOSED" },
];
const terminalOptions = computed(() =>
  terminals.value.map((item) => ({ label: item.name, value: Number(item.id) })),
);
const terminalOptionsWithAll = computed(() => [
  { label: "Todos os terminais", value: null },
  ...terminalOptions.value,
]);
const printerOptions = computed(() =>
  printers.value.map((item) => ({ label: item.name, value: Number(item.id) })),
);
const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
}));
const cashDifference = computed(
  () =>
    Number(closeForm.declaredCashAmount || 0) -
    Number(selectedSession.value?.expectedCashAmount || 0),
);
const canOpenCashRegister = computed(() => authStore.hasPermission(PERMISSIONS.cashRegistersOpen));
const canCloseCashRegister = computed(() => authStore.hasPermission(PERMISSIONS.cashRegistersClose));
const canWithdrawCashRegister = computed(() => authStore.hasPermission(PERMISSIONS.cashRegistersWithdraw));
const canManageTerminals = computed(() => authStore.hasPermission(PERMISSIONS.cashRegistersManageTerminals));
const canManagePrinters = computed(() => authStore.hasPermission(PERMISSIONS.cashRegistersManagePrinters));
const canUseCurrentCashRegister = computed(() => authStore.hasPermission(PERMISSIONS.cashRegistersCurrent));

const columns = computed(() => [
  {
    title: "Terminal",
    key: "terminal",
    render: (row: SessionRow) =>
      h("div", { class: "cell-stacked" }, [
        h("div", { class: "cell-main" }, row.terminal?.name || "-"),
        h("small", { class: "cell-sub" }, `Caixa #${row.id}`),
      ]),
  },
  {
    title: "Status",
    key: "status",
    render: (row: SessionRow) =>
      h(
        NTag,
        {
          bordered: false,
          class: [
            "status-chip",
            row.status === "OPEN" ? "badge-soft-success" : "badge-soft-neutral",
          ],
        },
        { default: () => statusLabel(row.status) },
      ),
  },
  {
    title: "Aberto por",
    key: "openedByUser",
    render: (row: SessionRow) => row.openedByUser?.name || "-",
  },
  {
    title: "Abertura",
    key: "openedAt",
    render: (row: SessionRow) => formatDate(row.openedAt),
  },
  {
    title: "Saldo esperado",
    key: "expectedCashAmount",
    align: "right",
    titleAlign: "right",
    render: (row: SessionRow) =>
      h(
        "span",
        { class: "amount-cell" },
        formatCurrency(row.expectedCashAmount),
      ),
  },
  {
    title: "Ações",
    key: "actions",
    align: "right",
    titleAlign: "right",
    render: (row: SessionRow) =>
      h("div", { class: "table-actions" }, [
        canWithdrawCashRegister.value ? h(
          NButton,
          {
            size: "small",
            secondary: true,
            type: "primary",
            disabled: row.status !== "OPEN",
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              openWithdrawModal(row);
            },
          },
          { default: () => "Sangria" },
        ) : null,
        canCloseCashRegister.value ? h(
          NButton,
          {
            size: "small",
            secondary: true,
            type: "primary",
            disabled: row.status !== "OPEN",
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              openCloseModal(row);
            },
          },
          { default: () => "Fechar" },
        ) : null,
      ].filter(Boolean)),
  },
]);

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0),
  );
const formatDate = (value: string) =>
  value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "-";
const statusLabel = (status: string) =>
  status === "OPEN" ? "Aberto" : status === "CLOSED" ? "Fechado" : status;
const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false;
};
const extractMessage = (error: any, fallback: string) =>
  error?.data?.message || fallback;

const fetchTerminals = async () => {
  terminals.value = await api<any[]>("/api/v1/cash-registers/terminals", {
    query: { activeOnly: "true" },
  });
};
const fetchPrinters = async () => {
  printers.value = await api<any[]>("/api/v1/cash-registers/printers", {
    query: { activeOnly: "true" },
  });
};
const fetchSessions = async () => {
  loading.value = true;
  try {
    const res = await api<any>("/api/v1/cash-registers/sessions", {
      query: {
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status !== "ALL" ? filters.status : undefined,
        terminalId: filters.terminalId || undefined,
        startDate: filters.period?.[0]
          ? new Date(filters.period[0]).toISOString()
          : undefined,
        endDate: filters.period?.[1]
          ? new Date(filters.period[1]).toISOString()
          : undefined,
      },
    });
    sessions.value = res.data || [];
    pagination.total = Number(res.meta?.total || 0);
    Object.assign(summary, {
      openSessions: Number(res.meta?.summary?.openSessions || 0),
      openCashAmount: Number(res.meta?.summary?.openCashAmount || 0),
      activeTerminals: Number(res.meta?.summary?.activeTerminals || 0),
      activePrinters: Number(res.meta?.summary?.activePrinters || 0),
    });
  } catch (error: any) {
    message.error(extractMessage(error, "Erro ao carregar caixas"));
  } finally {
    loading.value = false;
  }
};
const refreshAll = async () => {
  await Promise.all([
    canOpenCashRegister.value || canManageTerminals.value ? fetchTerminals() : Promise.resolve(),
    canManagePrinters.value || canManageTerminals.value ? fetchPrinters() : Promise.resolve(),
  ]);
  await fetchSessions();
};

const fetchCurrentUserSession = async () => {
  if (!canUseCurrentCashRegister.value) return undefined;
  const response = await api<any[]>("/api/v1/cash-registers/sessions/current");
  return Array.isArray(response)
    ? (response[0] as SessionRow | undefined)
    : undefined;
};

const fetchOpeningSuggestion = async (terminalId: number | null) => {
  const requestId = ++openingSuggestionRequest;
  openingSuggestion.value = null;
  if (!terminalId) {
    openForm.openingAmount = 0;
    return;
  }
  openingSuggestionLoading.value = true;
  try {
    const suggestion = await api<any>(
      `/api/v1/cash-registers/terminals/${terminalId}/opening-suggestion`,
    );
    if (
      requestId !== openingSuggestionRequest ||
      openForm.terminalId !== terminalId
    )
      return;
    openingSuggestion.value = suggestion;
    openForm.openingAmount = Number(suggestion?.suggestedOpeningAmount || 0);
  } catch (error: any) {
    if (requestId === openingSuggestionRequest) {
      message.error(
        extractMessage(error, "Erro ao buscar saldo anterior do terminal"),
      );
    }
  } finally {
    if (requestId === openingSuggestionRequest)
      openingSuggestionLoading.value = false;
  }
};

const openSessionModal = async () => {
  if (!canOpenCashRegister.value) return;
  try {
    const currentSession = await fetchCurrentUserSession();
    if (currentSession?.id) {
      message.warning(
        "Você já possui um caixa aberto. Encerre o caixa atual antes de abrir outro terminal.",
      );
      router.push(
        `/financeiro/vendas/nova?cashRegisterSessionId=${currentSession.id}`,
      );
      return;
    }
  } catch (error: any) {
    message.error(extractMessage(error, "Erro ao verificar caixa aberto"));
    return;
  }
  openForm.terminalId = terminalOptions.value[0]?.value || null;
  openForm.openingAmount = 0;
  openForm.notes = "";
  openingSuggestion.value = null;
  showSessionModal.value = true;
  await fetchOpeningSuggestion(openForm.terminalId);
};
const openWithdrawModal = (
  row: SessionRow,
  shouldCloseAfterWithdraw = false,
) => {
  if (!canWithdrawCashRegister.value) return;
  selectedSession.value = row;
  closeAfterWithdraw.value = shouldCloseAfterWithdraw;
  withdrawForm.amount = 0;
  withdrawForm.notes = "";
  showWithdrawModal.value = true;
};
const prepareCloseModal = (row: SessionRow) => {
  if (!canCloseCashRegister.value) return;
  selectedSession.value = row;
  closeForm.declaredCashAmount = Number(row.expectedCashAmount || 0);
  closeForm.closingNotes = "";
  showCloseModal.value = true;
};
const openCloseModal = (row: SessionRow) => {
  if (!canCloseCashRegister.value) return;
  selectedSession.value = row;
  showCloseSangriaPrompt.value = true;
};
const continueCloseWithoutWithdraw = () => {
  if (!canCloseCashRegister.value) return;
  if (!selectedSession.value) return;
  showCloseSangriaPrompt.value = false;
  prepareCloseModal(selectedSession.value);
};
const startWithdrawBeforeClose = () => {
  if (!canWithdrawCashRegister.value) return;
  if (!selectedSession.value) return;
  showCloseSangriaPrompt.value = false;
  openWithdrawModal(selectedSession.value, true);
};
const cancelWithdraw = () => {
  closeAfterWithdraw.value = false;
  showWithdrawModal.value = false;
};
const openSummary = (_row: SessionRow) => {};
const openTerminalModal = () => {
  if (!canManageTerminals.value) return;
  terminalFormValid.value = false;
  showTerminalModal.value = true;
};
const openPrinterModal = () => {
  if (!canManagePrinters.value) return;
  printerFormValid.value = false;
  showPrinterModal.value = true;
};

const handleOpenSession = async () => {
  if (!canOpenCashRegister.value) return;
  if (!openForm.terminalId) return message.warning("Selecione o terminal.");
  saving.value = true;
  try {
    const session = await api<any>("/api/v1/cash-registers/sessions/open", {
      method: "POST",
      body: { ...openForm },
    });
    showSessionModal.value = false;
    message.success("Caixa aberto com sucesso.");
    router.push(`/financeiro/vendas/nova?cashRegisterSessionId=${session.id}`);
  } catch (error: any) {
    message.error(extractMessage(error, "Erro ao abrir caixa"));
  } finally {
    saving.value = false;
  }
};
const handleWithdraw = async () => {
  if (!canWithdrawCashRegister.value) return;
  if (!selectedSession.value) return;
  if (!withdrawForm.notes.trim())
    return message.warning("Informe o motivo da sangria.");
  saving.value = true;
  try {
    const response = await api<any>(
      `/api/v1/cash-registers/sessions/${selectedSession.value.id}/withdraw`,
      { method: "POST", body: { ...withdrawForm } },
    );
    showWithdrawModal.value = false;
    message.success("Sangria registrada.");
    await fetchSessions();
    if (closeAfterWithdraw.value) {
      closeAfterWithdraw.value = false;
      prepareCloseModal(response?.session || selectedSession.value);
    }
  } catch (error: any) {
    message.error(extractMessage(error, "Erro ao registrar sangria"));
  } finally {
    if (!showCloseModal.value) closeAfterWithdraw.value = false;
    saving.value = false;
  }
};
const handleCloseSession = async () => {
  if (!canCloseCashRegister.value) return;
  if (!selectedSession.value) return;
  saving.value = true;
  try {
    await api(
      `/api/v1/cash-registers/sessions/${selectedSession.value.id}/close`,
      { method: "POST", body: { ...closeForm } },
    );
    showCloseModal.value = false;
    message.success("Caixa fechado.");
    await fetchSessions();
  } catch (error: any) {
    message.error(extractMessage(error, "Erro ao fechar caixa"));
  } finally {
    saving.value = false;
  }
};
const handleSaveTerminal = async (payload: any) => {
  if (!canManageTerminals.value) return;
  saving.value = true;
  try {
    await api("/api/v1/cash-registers/terminals", {
      method: "POST",
      body: payload,
    });
    showTerminalModal.value = false;
    message.success("Terminal criado.");
    await refreshAll();
  } catch (error: any) {
    message.error(extractMessage(error, "Erro ao criar terminal"));
  } finally {
    saving.value = false;
  }
};
const handleSavePrinter = async (payload: any) => {
  if (!canManagePrinters.value) return;
  saving.value = true;
  try {
    await api("/api/v1/cash-registers/printers", {
      method: "POST",
      body: payload,
    });
    showPrinterModal.value = false;
    message.success("Impressora criada.");
    await refreshAll();
  } catch (error: any) {
    message.error(extractMessage(error, "Erro ao criar impressora"));
  } finally {
    saving.value = false;
  }
};
const onPageChange = (page: number) => {
  pagination.page = page;
  fetchSessions();
};
const onPageSizeChange = (limit: number) => {
  pagination.limit = limit;
  pagination.page = 1;
  fetchSessions();
};
const handleFilter = () => {
  pagination.page = 1;
  fetchSessions();
};
const handleClearFilters = () => {
  filters.terminalId = null;
  filters.status = "ALL";
  filters.period = null;
  pagination.page = 1;
  fetchSessions();
};
const applyMobileFilters = () => {
  showMobileFilters.value = false;
  handleFilter();
};
const rowProps = (row: SessionRow) => ({
  style: "cursor: pointer;",
  onClick: () => openSummary(row),
});

watch(
  () => openForm.terminalId,
  (terminalId) => {
    if (!showSessionModal.value) return;
    void fetchOpeningSuggestion(terminalId);
  },
);

onMounted(() => {
  mediaQuery = window.matchMedia("(max-width: 768px)");
  updateIsMobile();
  mediaQuery.addEventListener("change", updateIsMobile);
  refreshAll();
});
onBeforeUnmount(() =>
  mediaQuery?.removeEventListener("change", updateIsMobile),
);
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mobile-actions-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
}
h1 {
  margin: 4px 0 0;
  font-size: 22px;
  color: #0f172a;
}
.subhead {
  margin: 8px 0 0;
  color: #475569;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.summary-grid-mobile {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.summary-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.summary-card-success {
  border-color: #d1fae5;
  background: #f7fef9;
}
.summary-label {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}
.summary-value {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  color: #0f172a;
}
.summary-value-mobile {
  display: block;
  margin-top: 6px;
  font-size: 20px;
  color: #0f172a;
}
.filters-card {
  background: #fff;
  border: 1px solid #e5e7eb;
}
.filters-card :deep(.n-card__content) {
  padding: 12px;
}
.filters-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.5fr auto;
  gap: 12px;
  align-items: end;
}
.filter-actions,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
.btn-clear {
  color: #475569;
}
.btn-filter {
  width: 112px;
}
.data-table-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
:deep(.n-data-table-th) {
  font-weight: 600;
  color: #374151;
  background: #f8fafc;
}
:deep(.n-data-table-td) {
  background: #fff;
  padding-top: 7px !important;
  padding-bottom: 7px !important;
}
:deep(.n-data-table-tr:hover td) {
  background: #f8fafc;
}
.table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}
.amount-cell {
  font-weight: 600;
  color: #0f172a;
}
.cell-stacked {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
  gap: 2px;
}
.cell-main {
  color: #0f172a;
  white-space: nowrap;
}
.cell-sub {
  color: #64748b;
  font-size: 12px;
  line-height: 1.1;
}
:deep(.status-chip.n-tag) {
  border-width: 1px !important;
}
:deep(.status-chip.badge-soft-success.n-tag) {
  color: #166534;
  background: #ecfdf3;
  border: 1px solid #d1fae5;
}
:deep(.status-chip.badge-soft-neutral.n-tag) {
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.mobile-filters-card {
  padding: 10px;
}
.mobile-filter-top,
.mobile-filters-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mobile-filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.entity-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}
.card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.card-title {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}
.card-subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}
.card-value {
  color: #0f172a;
  font-weight: 600;
}
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
.form-section {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.field-hint {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
}
.full-row {
  grid-column: 1 / -1;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  color: #475569;
}
.summary-line strong {
  color: #0f172a;
}
.diff-zero {
  color: #166534 !important;
}
.diff-alert {
  color: #991b1b !important;
}
:deep(.cash-modal .n-card-header),
:deep(.cash-modal .n-card__footer) {
  background: #fff;
}
@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
  }
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
