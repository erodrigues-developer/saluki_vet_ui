<template>
  <div class="sale-page">
    <div class="page-head">
      <div class="head-copy">
        <n-button text class="back-link" @click="goBack"
          >← Voltar para vendas</n-button
        >
        <p class="eyebrow">FINANCEIRO</p>
        <div class="title-row">
          <h1>{{ isEdit ? `Venda #${model.id}` : "Nova venda" }}</h1>
          <n-tag
            v-if="isEdit"
            :bordered="false"
            :class="['status-chip', statusBadgeClass(model.status)]"
          >
            {{ statusLabel(model.status) }}
          </n-tag>
        </div>
        <p class="subhead">
          {{
            isEdit
              ? `Criada em ${createdAtLabel} por ${createdByLabel}.`
              : "Registre produtos, serviços, descontos e recebimentos da venda."
          }}
        </p>
      </div>
    </div>

    <n-card
      v-if="isMobile"
      :bordered="false"
      class="section-card mobile-summary-card"
    >
      <button
        type="button"
        class="mobile-summary-toggle"
        @click="mobileSummaryOpen = !mobileSummaryOpen"
      >
        <div class="mobile-summary-toggle-head">
          <h3 class="section-title">Resumo da venda</h3>
          <span class="mobile-summary-arrow">{{
            mobileSummaryOpen ? "▴" : "▾"
          }}</span>
        </div>
        <p class="mobile-summary-quick">
          Total: {{ formatCurrency(totalAmount) }} • {{ validItemsCount }}
          {{ validItemsCount === 1 ? "item" : "itens" }} •
          {{ statusLabel(model.status) }}
        </p>
      </button>

      <div v-if="mobileSummaryOpen" class="summary-list">
        <div class="summary-row">
          <span>Subtotal</span><strong>{{ formatCurrency(subtotal) }}</strong>
        </div>
        <div class="summary-row summary-row-discount">
          <span>Desconto — F6</span>
          <CurrencyInput
            v-model="model.discountAmount"
            size="small"
            style="width: 150px"
            :disabled="isReadonly"
          />
        </div>
        <div class="summary-row">
          <span>Status</span>
          <n-tag
            :bordered="false"
            :class="['status-chip', statusBadgeClass(model.status)]"
            >{{ statusLabel(model.status) }}</n-tag
          >
        </div>
        <div class="summary-row">
          <span>Quantidade de itens</span><strong>{{ validItemsCount }}</strong>
        </div>
        <div class="summary-row total">
          <span>Total</span><strong>{{ formatCurrency(totalAmount) }}</strong>
        </div>
        <div v-if="model.status === 'PAID' && paymentInfo" class="payment-box">
          <p class="payment-title">Pagamento registrado</p>
          <p>
            Forma: <strong>{{ paymentInfo.paymentMethod }}</strong>
          </p>
          <p>
            Valor: <strong>{{ formatCurrency(paymentInfo.amount) }}</strong>
          </p>
          <p v-if="paymentInfo.tenderedAmount > paymentInfo.amount">
            Valor recebido:
            <strong>{{ formatCurrency(paymentInfo.tenderedAmount) }}</strong>
          </p>
          <p v-if="paymentInfo.changeAmount > 0">
            Troco:
            <strong>{{ formatCurrency(paymentInfo.changeAmount) }}</strong>
          </p>
          <p>
            Pago em: <strong>{{ paymentInfo.paidAt }}</strong>
          </p>
        </div>
      </div>
    </n-card>

    <div class="content-grid">
      <div class="main-col">
        <n-card :bordered="false" class="section-card sale-meta-card">
          <n-form
            ref="formRef"
            :model="model"
            :rules="rules"
            label-placement="top"
            :show-require-mark="false"
            :disabled="isReadonly"
          >
            <div class="sale-meta-bar">
              <n-form-item
                label="Cliente"
                path="clientId"
                class="sale-meta-field sale-meta-client"
              >
                <n-select
                  ref="clientSelectRef"
                  v-model:value="model.clientId"
                  :options="clientOptions"
                  placeholder="Venda balcão (sem cliente)"
                  clearable
                  filterable
                />
              </n-form-item>

              <n-form-item
                label="Vendedor"
                path="veterinarianId"
                required
                class="sale-meta-field"
              >
                <n-select
                  v-model:value="model.veterinarianId"
                  :options="veterinarianOptions"
                  placeholder="Operador do caixa"
                  disabled
                />
              </n-form-item>

              <n-form-item
                label="Data"
                path="saleDate"
                required
                class="sale-meta-field sale-meta-date"
              >
                <n-date-picker
                  v-model:value="model.saleDate"
                  type="datetime"
                  format="dd/MM/yyyy HH:mm"
                  style="width: 100%"
                  disabled
                />
              </n-form-item>
            </div>

            <button
              v-if="!showNotes"
              type="button"
              class="notes-toggle"
              @click="showNotes = true"
            >
              Adicionar observação
            </button>

            <n-form-item
              v-if="showNotes"
              label="Observações"
              path="notes"
              class="notes-field"
            >
              <div class="notes-field-inner">
                <n-input
                  v-model:value="model.notes"
                  type="textarea"
                  :rows="2"
                  placeholder="Observações da venda"
                />
                <n-button text size="small" @click="showNotes = false"
                  >Recolher</n-button
                >
              </div>
            </n-form-item>
          </n-form>
        </n-card>

        <n-card :bordered="false" class="section-card">
          <template #header>
            <div class="section-head">
              <h3 class="section-title">Carrinho</h3>
              <div class="section-actions">
                <n-button
                  v-if="!isReadonly"
                  secondary
                  strong
                  size="small"
                  class="add-item-btn"
                  @click="addItem"
                >
                  Adicionar manualmente
                </n-button>
              </div>
            </div>
          </template>

          <div v-if="!isReadonly" class="quick-entry-panel">
            <n-input
              ref="quickEntryRef"
              v-model:value="quickEntry"
              size="large"
              clearable
              placeholder="Escanear código de barras ou buscar produto..."
              @keyup.enter="handleQuickEntrySubmit"
            >
              <template #prefix>
                <span class="quick-entry-icon">⌕</span>
              </template>
              <template #suffix>
                <span class="quick-entry-shortcut">F2</span>
              </template>
            </n-input>
            <div class="quick-filter-row">
              <button
                v-for="category in quickCategoryOptions"
                :key="category.value"
                type="button"
                :class="[
                  'quick-chip',
                  {
                    'quick-chip--active':
                      activeQuickCategory === category.value,
                  },
                ]"
                @click="activeQuickCategory = category.value"
              >
                {{ category.label }}
              </button>
            </div>
          </div>

          <template v-if="isMobile">
            <div class="mobile-item-list">
              <div
                v-for="(item, idx) in model.items"
                :key="item._key"
                class="mobile-item-card"
              >
                <div class="mobile-item-head">
                  <strong>Item {{ idx + 1 }}</strong>
                  <n-button
                    v-if="!isReadonly"
                    size="small"
                    quaternary
                    type="error"
                    class="remove-item-btn"
                    @click="removeItem(item._key)"
                  >
                    🗑
                  </n-button>
                </div>

                <template v-if="isReadonly">
                  <div class="mobile-readonly-rows">
                    <div class="mobile-readonly-row">
                      <span>Item</span
                      ><strong>{{ resolveItemName(item) }}</strong>
                    </div>
                    <div class="mobile-readonly-row">
                      <span>Tipo</span
                      ><strong>{{
                        item.itemType === "PROCEDURE" ? "Serviço" : "Produto"
                      }}</strong>
                    </div>
                    <div class="mobile-readonly-row">
                      <span>Quantidade</span
                      ><strong
                        >{{ formatQuantity(item.quantity, item) }}
                        {{ unitForRow(item) }}</strong
                      >
                    </div>
                    <div class="mobile-readonly-row">
                      <span>{{
                        isWeightedProductRow(item)
                          ? "Preço/kg"
                          : "Preço unitário"
                      }}</span
                      ><strong>{{ formatCurrency(item.unitPrice) }}</strong>
                    </div>
                    <div class="mobile-readonly-row">
                      <span>Desconto</span
                      ><strong>{{
                        formatCurrency(item.discountAmount)
                      }}</strong>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="mobile-item-grid">
                    <n-form-item label="Tipo">
                      <n-select
                        v-model:value="item.itemType"
                        :options="[
                          { label: 'Produto', value: 'PRODUCT' },
                          { label: 'Serviço', value: 'PROCEDURE' },
                        ]"
                        :disabled="isReadonly"
                        @update:value="() => handleItemTypeChange(item)"
                      />
                    </n-form-item>

                    <n-form-item label="Quantidade">
                      <n-input-number
                        v-model:value="item.quantity"
                        :min="minimumQuantityForRow(item)"
                        :step="quantityStepForRow(item)"
                        :precision="isWeightedProductRow(item) ? 3 : 0"
                        :disabled="isReadonly"
                        :show-button="false"
                        @update:value="() => recalculateRow(item)"
                      />
                    </n-form-item>
                  </div>

                  <n-form-item label="Item">
                    <n-select
                      :value="
                        item.itemType === 'PROCEDURE'
                          ? item.procedureId
                          : item.productId
                      "
                      :options="
                        item.itemType === 'PROCEDURE'
                          ? procedureOptions
                          : productOptions
                      "
                      :disabled="isReadonly"
                      :placeholder="
                        item.itemType === 'PROCEDURE'
                          ? 'Selecione o serviço'
                          : 'Selecione o produto'
                      "
                      filterable
                      @update:value="
                        (val: number) => handleItemRefChange(item, val)
                      "
                    />
                  </n-form-item>

                  <div class="mobile-item-grid">
                    <n-form-item label="Preço unit.">
                      <CurrencyInput
                        v-model="item.unitPrice"
                        :disabled="isReadonly"
                        @update:model-value="() => recalculateRow(item)"
                      />
                    </n-form-item>

                    <n-form-item label="Desconto">
                      <CurrencyInput
                        v-model="item.discountAmount"
                        :disabled="isReadonly"
                        @update:model-value="() => recalculateRow(item)"
                      />
                    </n-form-item>
                  </div>
                </template>

                <div class="mobile-item-total">
                  <span>Total do item</span>
                  <strong>{{ formatCurrency(item.totalPrice) }}</strong>
                </div>
              </div>
            </div>
          </template>
          <n-data-table
            v-else
            :columns="itemColumns"
            :data="model.items"
            :bordered="false"
            :row-props="cartRowProps"
            class="cart-table"
          />
        </n-card>
      </div>

      <div v-if="!isMobile" class="side-col">
        <n-card :bordered="false" class="section-card sticky-summary">
          <template #header>
            <h3 class="section-title">Resumo da venda</h3>
          </template>

          <div class="summary-list">
            <div class="summary-row">
              <span>Subtotal</span
              ><strong>{{ formatCurrency(subtotal) }}</strong>
            </div>
            <div class="summary-row summary-row-discount">
              <span>Desconto — F6</span>
              <CurrencyInput
                v-model="model.discountAmount"
                size="small"
                style="width: 170px"
                :disabled="isReadonly"
              />
            </div>
            <div class="summary-row">
              <span>Status</span>
              <n-tag
                :bordered="false"
                :class="['status-chip', statusBadgeClass(model.status)]"
                >{{ statusLabel(model.status) }}</n-tag
              >
            </div>
            <div class="summary-row">
              <span>Quantidade de itens</span
              ><strong>{{ validItemsCount }}</strong>
            </div>
            <div class="pdv-total-box">
              <span>Total</span>
              <strong>{{ formatCurrency(totalAmount) }}</strong>
            </div>

            <div
              v-if="model.status === 'PAID' && paymentInfo"
              class="payment-box"
            >
              <p class="payment-title">Pagamento registrado</p>
              <p>
                Forma: <strong>{{ paymentInfo.paymentMethod }}</strong>
              </p>
              <p>
                Valor: <strong>{{ formatCurrency(paymentInfo.amount) }}</strong>
              </p>
              <p v-if="paymentInfo.tenderedAmount > paymentInfo.amount">
                Valor recebido:
                <strong>{{
                  formatCurrency(paymentInfo.tenderedAmount)
                }}</strong>
              </p>
              <p v-if="paymentInfo.changeAmount > 0">
                Troco:
                <strong>{{ formatCurrency(paymentInfo.changeAmount) }}</strong>
              </p>
              <p>
                Pago em: <strong>{{ paymentInfo.paidAt }}</strong>
              </p>
            </div>
          </div>

          <div class="side-actions">
            <n-button
              v-if="canShowSave"
              type="default"
              class="sale-cta-btn sale-save-btn"
              :loading="saving"
              :disabled="!canSaveNow"
              @click="saveSale"
            >
              Salvar venda — F9
            </n-button>
            <n-button
              v-if="canShowReceiveButton"
              type="primary"
              class="sale-cta-btn"
              :disabled="!canReceiveNow"
              @click="handleReceiveNow"
            >
              Receber F8
            </n-button>
            <n-button
              v-if="canShowReprintReceipt"
              secondary
              class="sale-cta-btn"
              :loading="printingReceipt"
              @click="handleReprintReceipt"
            >
              Reimprimir cupom
            </n-button>
            <n-button
              v-if="canShowCancelSale"
              tertiary
              type="error"
              @click="confirmCancelSale"
              >Cancelar venda</n-button
            >
            <n-button
              v-if="canShowUndoPayment"
              tertiary
              type="error"
              class="undo-payment-btn"
              @click="confirmUndoPayment"
              >Estornar pagamento</n-button
            >
            <n-button v-if="isNew" tertiary @click="goBack">Cancelar</n-button>
          </div>

          <div class="shortcut-list">
            <span>F2 Buscar</span>
            <span>F4 Cliente</span>
            <span>F6 Desconto</span>
            <span>F7 Remover</span>
            <span>F8 Receber</span>
          </div>
        </n-card>
      </div>
    </div>

    <div v-if="isMobile && model.status !== 'CANCELED'" class="mobile-footer">
      <div class="mobile-footer-total">
        Total: <strong>{{ formatCurrency(totalAmount) }}</strong>
      </div>
      <div class="mobile-footer-actions">
        <n-button
          v-if="canShowSave"
          type="primary"
          class="sale-cta-btn"
          :loading="saving"
          :disabled="!canSaveNow"
          @click="saveSale"
          >Salvar</n-button
        >
        <n-button
          v-if="canShowReceiveButton"
          type="primary"
          class="sale-cta-btn"
          :disabled="!canReceiveNow"
          @click="handleReceiveNow"
          >Receber</n-button
        >
        <n-button
          v-if="canShowReprintReceipt"
          secondary
          class="sale-cta-btn"
          :loading="printingReceipt"
          @click="handleReprintReceipt"
          >Reimprimir cupom</n-button
        >
      </div>
      <n-button v-if="isNew" tertiary @click="goBack">Cancelar</n-button>
      <n-button
        v-if="canShowCancelSale"
        tertiary
        type="error"
        @click="confirmCancelSale"
        >Cancelar venda</n-button
      >
      <n-button
        v-if="canShowUndoPayment"
        tertiary
        type="error"
        class="undo-payment-btn"
        @click="confirmUndoPayment"
        >Estornar pagamento</n-button
      >
    </div>
    <div
      v-else-if="isMobile && model.status === 'CANCELED'"
      class="mobile-footer mobile-footer--info"
    >
      <div class="mobile-footer-total">
        Venda cancelada •
        <strong>Total {{ formatCurrency(totalAmount) }}</strong>
      </div>
    </div>

    <n-modal
      v-model:show="showCheckoutModal"
      preset="card"
      class="sales-checkout-modal"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">Receber venda</h3>
          <p class="modal-subtitle">
            Escolha a forma, confira o valor e confirme o recebimento.
          </p>
        </div>
      </template>
      <n-form :model="checkoutForm" label-placement="top">
        <div class="checkout-pdv">
          <div class="checkout-compact-summary">
            <span>Venda #{{ model.id || "-" }} · {{ selectedClientName }}</span>
            <strong>{{ statusLabel(model.status) }}</strong>
          </div>

          <div class="checkout-amount-panel">
            <span>Valor a receber</span>
            <strong>{{ formatCurrency(totalAmount) }}</strong>
          </div>

          <section class="checkout-section">
            <div class="checkout-section-head">
              <h4>Forma de pagamento</h4>
              <span>F1 dinheiro · F2 PIX · F3 débito · F4 crédito</span>
            </div>
            <div class="payment-quick-grid">
              <button
                v-for="option in quickPaymentOptions"
                :key="option.key"
                ref="paymentQuickButtonRef"
                type="button"
                :class="[
                  'payment-quick-btn',
                  {
                    'payment-quick-btn--active':
                      activeCheckoutPayment?.paymentMethodId === option.value,
                  },
                ]"
                @click="selectQuickPayment(option.value)"
              >
                <strong>{{ option.label }}</strong>
                <small>{{ option.shortcut }}</small>
              </button>
            </div>
          </section>

          <section class="checkout-section checkout-values-grid">
            <n-form-item label="Valor recebido" required>
              <CurrencyInput
                :key="activeCheckoutPayment?._key"
                ref="checkoutAmountRef"
                :model-value="activeCheckoutPayment?.tenderedAmount || 0"
                :max-value="activeCheckoutTenderedMax"
                @update:model-value="updateActiveTenderedAmount"
              />
            </n-form-item>

            <div
              class="checkout-result-box"
              :class="{ 'checkout-result-box--warning': checkoutRemaining > 0 }"
            >
              <span>{{ checkoutResultLabel }}</span>
              <strong>{{ formatCurrency(checkoutResultAmount) }}</strong>
            </div>
          </section>

          <section
            v-if="checkoutPayments.length > 1"
            class="checkout-payments-list"
          >
            <div
              v-for="(payment, index) in checkoutPayments"
              :key="payment._key"
              :class="[
                'checkout-payment-row',
                {
                  'checkout-payment-row--active':
                    index === activeCheckoutPaymentIndex,
                },
              ]"
              @click="activeCheckoutPaymentIndex = index"
            >
              <span>{{ paymentMethodLabel(payment.paymentMethodId) }}</span>
              <strong>{{ formatCurrency(payment.amount) }}</strong>
              <button
                type="button"
                :disabled="checkoutPayments.length <= 1"
                @click.stop="removeCheckoutPayment(index)"
              >
                Remover
              </button>
            </div>
          </section>

          <button
            type="button"
            class="checkout-add-payment"
            @click="addCheckoutPayment"
          >
            + Adicionar outro pagamento — F5
          </button>

          <div class="checkout-readonly-meta">
            <span
              >Caixa: <strong>{{ selectedCashSessionLabel }}</strong></span
            >
            <span
              >Data/hora: <strong>{{ checkoutPaidAtLabel }}</strong></span
            >
          </div>

          <button
            v-if="!showCheckoutNotes"
            type="button"
            class="notes-toggle"
            @click="showCheckoutNotes = true"
          >
            Adicionar observação
          </button>
          <n-form-item
            v-if="showCheckoutNotes"
            label="Observações"
            class="checkout-notes-field"
          >
            <n-input
              v-model:value="checkoutForm.notes"
              type="textarea"
              :rows="2"
              placeholder="Opcional"
            />
          </n-form-item>
        </div>
      </n-form>

      <template #footer>
        <div class="modal-actions">
          <n-button
            :disabled="checkoutLoading"
            @click="showCheckoutModal = false"
            >Esc Cancelar</n-button
          >
          <n-button
            type="primary"
            :loading="checkoutLoading"
            :disabled="
              checkoutRemaining > 0 ||
              checkoutPayments.some((payment) => !payment.paymentMethodId)
            "
            @click="handleCheckout"
            >Enter Confirmar</n-button
          >
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showQuickMatchModal"
      preset="card"
      class="quick-match-modal"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">Selecionar item</h3>
          <p class="modal-subtitle">
            Mais de uma correspondência encontrada para a busca.
          </p>
        </div>
      </template>

      <div class="quick-match-list">
        <button
          v-for="match in quickMatches"
          :key="`${match.type}-${match.id}`"
          type="button"
          class="quick-match-row"
          @click="selectQuickMatch(match)"
        >
          <span>
            <strong>{{ match.name }}</strong>
            <small>{{
              match.code || (match.type === "PROCEDURE" ? "Serviço" : "Produto")
            }}</small>
          </span>
          <strong>{{ formatQuickMatchPrice(match) }}</strong>
        </button>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";
import type { FormInst, FormRules } from "naive-ui";
import { NButton, NSelect, NTag, useDialog, useMessage } from "naive-ui";
import CurrencyInput from "../common/CurrencyInput.vue";
import { format } from "date-fns";
import { useAuthStore } from "~/stores/auth";

const props = defineProps<{ saleId?: number | null }>();
const message = useMessage();
const dialog = useDialog();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const isEdit = computed(() => Boolean(props.saleId));
const isNew = computed(() => !isEdit.value);
const isMobile = ref(false);
const mobileSummaryOpen = ref(false);
let mediaQuery: MediaQueryList | null = null;

const formRef = ref<FormInst | null>(null);
const quickEntryRef = ref<any>(null);
const checkoutAmountRef = ref<any>(null);
const paymentQuickButtonRef = ref<any>(null);
const clientSelectRef = ref<any>(null);
const saving = ref(false);
const loading = ref(false);
const showCheckoutModal = ref(false);
const showQuickMatchModal = ref(false);
const showNotes = ref(false);
const showCheckoutNotes = ref(false);
const checkoutLoading = ref(false);
const printingReceipt = ref(false);
const checkoutQueryHandled = ref(false);
const quickEntry = ref("");
const pendingQuickQuantity = ref(1);
const activeQuickCategory = ref("ALL");
const selectedItemKey = ref<string | null>(null);
const highlightedItemKey = ref<string | null>(null);
let highlightTimer: ReturnType<typeof window.setTimeout> | null = null;

const paymentMethodOptions = ref<Array<{ label: string; value: number }>>([]);
const cashSessionOptions = ref<Array<{ label: string; value: number }>>([]);
const clientOptions = ref<{ label: string; value: number }[]>([]);
const veterinarianOptions = ref<{ label: string; value: number }[]>([]);
type ProductOption = {
  label: string;
  value: number;
  name: string;
  salePrice: number;
  saleMode?: "UNIT" | "WEIGHT";
  saleUnit?: string | null;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
};
type ProcedureOption = {
  label: string;
  value: number;
  name: string;
  defaultPrice: number;
};
type QuickMatch = {
  type: "PRODUCT" | "PROCEDURE";
  id: number;
  name: string;
  code?: string | null;
  price: number;
  saleMode?: "UNIT" | "WEIGHT";
  saleUnit?: string | null;
};
type QuickEntryPayload = {
  term: string;
  quantity: number;
};
type CheckoutPayment = {
  _key: string;
  paymentMethodId: number | null;
  amount: number;
  tenderedAmount: number;
};

const productOptions = ref<ProductOption[]>([]);
const procedureOptions = ref<ProcedureOption[]>([]);
const quickMatches = ref<QuickMatch[]>([]);
const createdByLabel = ref("-");
const createdAtLabel = ref("-");
const paymentInfo = ref<{
  paymentMethod: string;
  amount: number;
  tenderedAmount: number;
  changeAmount: number;
  paidAt: string;
} | null>(null);
const selectedClientName = computed(() => {
  if (!model.clientId) return "Venda balcão";
  return (
    clientOptions.value.find((c) => c.value === model.clientId)?.label ||
    "Venda balcão"
  );
});

const model = reactive({
  id: null as number | null,
  clientId: null as number | null,
  veterinarianId: null as number | null,
  saleDate: Date.now(),
  status: "OPEN" as "OPEN" | "PAID" | "CANCELED",
  notes: "",
  discountAmount: 0,
  items: [] as Array<{
    id?: number;
    itemType: "PRODUCT" | "PROCEDURE";
    productId: number | null;
    procedureId: number | null;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    totalPrice: number;
    originType?: string | null;
    originReferenceId?: number | null;
    _key: string;
  }>,
});

const checkoutForm = reactive({
  paymentMethodId: null as number | null,
  cashRegisterSessionId: null as number | null,
  amount: 0,
  paidAt: Date.now(),
  notes: "",
});
const checkoutPayments = ref<CheckoutPayment[]>([]);
const activeCheckoutPaymentIndex = ref(0);

const rules: FormRules = {
  veterinarianId: {
    type: "number",
    required: true,
    message: "Selecione o vendedor",
    trigger: "change",
  },
  saleDate: {
    type: "number",
    required: true,
    message: "A data é obrigatória",
    trigger: "change",
  },
};

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0),
  );

const toMoneyNumber = (value: number | string) =>
  Number(Number(value || 0).toFixed(2));

const statusLabel = (status: string) => {
  if (status === "OPEN") return "Aberta";
  if (status === "PAID") return "Paga";
  if (status === "CANCELED") return "Cancelada";
  return status;
};

const statusBadgeClass = (status: string) => {
  if (status === "OPEN") return "badge-soft-warning";
  if (status === "PAID") return "badge-soft-success";
  if (status === "CANCELED") return "badge-soft-danger";
  return "badge-soft-neutral";
};

const subtotal = computed(() =>
  model.items.reduce(
    (acc, item) => acc + Number(item.quantity) * Number(item.unitPrice),
    0,
  ),
);
const totalAmount = computed(() => {
  const sumWithItemDiscounts = model.items.reduce(
    (acc, item) => acc + Number(item.totalPrice || 0),
    0,
  );
  return Math.max(0, sumWithItemDiscounts - Number(model.discountAmount || 0));
});

const isReadonly = computed(
  () =>
    isEdit.value && (model.status === "PAID" || model.status === "CANCELED"),
);

const hasValidItems = computed(() => {
  if (!model.items.length) return false;
  return model.items.every((item) => {
    const hasRef =
      item.itemType === "PROCEDURE"
        ? Boolean(item.procedureId)
        : Boolean(item.productId);
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const discount = Number(item.discountAmount || 0);
    const itemSubtotal = quantity * unitPrice;
    return (
      hasRef &&
      quantity > 0 &&
      unitPrice >= 0 &&
      discount >= 0 &&
      discount <= itemSubtotal
    );
  });
});
const validItemsCount = computed(() => {
  return model.items.filter((item) => {
    const hasRef =
      item.itemType === "PROCEDURE"
        ? Boolean(item.procedureId)
        : Boolean(item.productId);
    return hasRef && Number(item.quantity || 0) > 0;
  }).length;
});

const canReceiveNow = computed(() => {
  return (
    Boolean(model.veterinarianId) &&
    hasValidItems.value &&
    totalAmount.value > 0
  );
});
const canSaveNow = computed(() => {
  return Boolean(model.veterinarianId) && hasValidItems.value;
});

const canShowSave = computed(() => isNew.value || model.status === "OPEN");
const canShowReceiveButton = computed(
  () => isNew.value || model.status === "OPEN",
);
const canShowCancelSale = computed(
  () => isEdit.value && model.status === "OPEN",
);
const canShowUndoPayment = computed(
  () => isEdit.value && model.status === "PAID",
);
const canShowReprintReceipt = computed(
  () => isEdit.value && model.status === "PAID",
);
const currentUserOption = computed(() => {
  const user = auth.user;
  return user?.id
    ? { label: user.name || `Usuário #${user.id}`, value: Number(user.id) }
    : null;
});
const quickCategoryOptions = computed(() => {
  const categories = productOptions.value.reduce<
    Array<{ label: string; value: string }>
  >((acc, product) => {
    if (!product.categoryId || !product.categoryName) return acc;
    const value = String(product.categoryId);
    if (!acc.some((category) => category.value === value)) {
      acc.push({ label: product.categoryName || "Categoria", value });
    }
    return acc;
  }, []);

  return [
    { label: "Todos", value: "ALL" },
    { label: "Serviços", value: "PROCEDURES" },
    ...categories.slice(0, 4),
  ];
});

const paymentMethodLabel = (paymentMethodId: number | null) => {
  if (!paymentMethodId) return "Selecione";
  return (
    paymentMethodOptions.value.find(
      (option) => option.value === paymentMethodId,
    )?.label || `Forma #${paymentMethodId}`
  );
};

const findPaymentMethodOption = (patterns: string[]) => {
  return paymentMethodOptions.value.find((option) => {
    const normalized = normalizeSearch(option.label);
    return patterns.some((pattern) => normalized.includes(pattern));
  });
};

const quickPaymentOptions = computed(() =>
  [
    {
      key: "cash",
      label: "Dinheiro",
      shortcut: "F1",
      value: findPaymentMethodOption(["dinheiro", "cash"])?.value || null,
    },
    {
      key: "pix",
      label: "PIX",
      shortcut: "F2",
      value: findPaymentMethodOption(["pix"])?.value || null,
    },
    {
      key: "debit",
      label: "Débito",
      shortcut: "F3",
      value: findPaymentMethodOption(["debito", "debit"])?.value || null,
    },
    {
      key: "credit",
      label: "Crédito",
      shortcut: "F4",
      value: findPaymentMethodOption(["credito", "credit"])?.value || null,
    },
  ].filter((option) => option.value),
);

const selectedCashSessionLabel = computed(() => {
  return (
    cashSessionOptions.value.find(
      (option) => option.value === checkoutForm.cashRegisterSessionId,
    )?.label || "Caixa do operador"
  );
});
const checkoutPaidAtLabel = computed(() =>
  format(new Date(checkoutForm.paidAt), "dd/MM/yyyy HH:mm"),
);
const activeCheckoutPayment = computed(
  () => checkoutPayments.value[activeCheckoutPaymentIndex.value] || null,
);
const checkoutPaidTotal = computed(() =>
  checkoutPayments.value.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  ),
);
const checkoutRemaining = computed(() =>
  Math.max(0, Number(totalAmount.value || 0) - checkoutPaidTotal.value),
);
const checkoutChange = computed(() => {
  const payment = activeCheckoutPayment.value;
  if (!payment || !isCashPaymentMethod(payment.paymentMethodId)) return 0;
  return Math.max(
    0,
    Number(payment.tenderedAmount || 0) - Number(payment.amount || 0),
  );
});
const checkoutResultLabel = computed(() =>
  checkoutRemaining.value > 0 ||
  !isCashPaymentMethod(activeCheckoutPayment.value?.paymentMethodId || null)
    ? "Restante"
    : "Troco",
);
const checkoutResultAmount = computed(() =>
  checkoutResultLabel.value === "Troco"
    ? checkoutChange.value
    : checkoutRemaining.value,
);
const activeCheckoutTenderedMax = computed(() => {
  const payment = activeCheckoutPayment.value;
  if (!payment || isCashPaymentMethod(payment.paymentMethodId)) return null;
  return remainingForCheckoutPayment(activeCheckoutPaymentIndex.value);
});

const filteredProductOptions = computed(() => {
  if (
    activeQuickCategory.value === "ALL" ||
    activeQuickCategory.value === "PROCEDURES"
  ) {
    return productOptions.value;
  }

  return productOptions.value.filter(
    (product) => String(product.categoryId || "") === activeQuickCategory.value,
  );
});

const mapProductOption = (i: any): ProductOption => ({
  label: `${i.name} (${formatCurrency(i.salePrice)}${i.saleMode === "WEIGHT" ? "/kg" : ""})`,
  value: Number(i.id),
  name: i.name,
  salePrice: Number(i.salePrice || 0),
  saleMode: i.saleMode === "WEIGHT" ? "WEIGHT" : "UNIT",
  saleUnit: i.saleUnit || i.unit || null,
  sku: i.sku || null,
  barcode: i.barcode || null,
  categoryId: i.productCategoryId ? Number(i.productCategoryId) : null,
  categoryName: i.productCategory?.name || null,
});

const mapProcedureOption = (i: any): ProcedureOption => ({
  label: `${i.name} (${formatCurrency(i.defaultPrice || 0)})`,
  value: Number(i.id),
  name: i.name,
  defaultPrice: Number(i.defaultPrice || 0),
});

const upsertProductOption = (product: ProductOption) => {
  const index = productOptions.value.findIndex(
    (option) => option.value === product.value,
  );
  if (index >= 0) {
    productOptions.value[index] = product;
    return;
  }
  productOptions.value.unshift(product);
};

const applyOperatorDefaults = () => {
  if (!isNew.value) return;
  if (currentUserOption.value) {
    model.veterinarianId = currentUserOption.value.value;
    if (
      !veterinarianOptions.value.some(
        (option) => option.value === currentUserOption.value?.value,
      )
    ) {
      veterinarianOptions.value.unshift(currentUserOption.value);
    }
  }
  model.saleDate = Date.now();
};

const loadLookups = async () => {
  const api = useApi();
  const [clientsRes, usersRes, productsRes, proceduresRes, paymentMethodsRes] =
    await Promise.all([
      api<any>("/api/v1/clients?limit=500"),
      api<any>("/api/v1/users?limit=100"),
      api<any>("/api/v1/products?limit=500"),
      api<any>("/api/v1/procedures?limit=500"),
      api<any>("/api/v1/payment-methods?page=1&limit=100"),
    ]);

  clientOptions.value = (clientsRes.data || []).map((i: any) => ({
    label: i.name,
    value: Number(i.id),
  }));
  veterinarianOptions.value = (usersRes.data || []).map((i: any) => ({
    label: i.name,
    value: Number(i.id),
  }));
  productOptions.value = (productsRes.data || []).map(mapProductOption);
  procedureOptions.value = (proceduresRes.data || []).map(mapProcedureOption);
  paymentMethodOptions.value = (paymentMethodsRes.data || [])
    .filter((method: any) => method.isActive !== false)
    .map((method: any) => ({ label: method.name, value: Number(method.id) }));
};

const applyOperatorFromSession = (session: any) => {
  if (!isNew.value || !session?.openedByUserId) return;
  const userId = Number(session.openedByUserId);
  const userLabel =
    session.openedByUser?.name ||
    currentUserOption.value?.label ||
    `Usuário #${userId}`;
  model.veterinarianId = userId;
  if (!veterinarianOptions.value.some((option) => option.value === userId)) {
    veterinarianOptions.value.unshift({ label: userLabel, value: userId });
  }
};

const fetchOpenCashSessions = async () => {
  const api = useApi();
  const response = await api<any[]>("/api/v1/cash-registers/sessions/current");
  const sessions = Array.isArray(response) ? response : [];
  cashSessionOptions.value = sessions.map((session: any) => ({
    label: `${session.terminal?.name || "Caixa"} · #${session.id}`,
    value: Number(session.id),
  }));
  applyOperatorFromSession(sessions[0]);
  return sessions;
};

const addItem = () => {
  if (isReadonly.value) return;
  const row: (typeof model.items)[number] = {
    itemType: "PRODUCT",
    productId: null,
    procedureId: null,
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
    totalPrice: 0,
    originType: null,
    originReferenceId: null,
    _key: Math.random().toString(36).substring(7),
  };
  model.items.push(row);
  selectedItemKey.value = row._key;
};

const normalizeSearch = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isCashPaymentMethod = (paymentMethodId: number | null) => {
  const label = normalizeSearch(paymentMethodLabel(paymentMethodId));
  return label.includes("dinheiro") || label.includes("cash");
};

const checkoutPaymentKey = () => Math.random().toString(36).substring(7);

const amountBeforeCheckoutPayment = (index: number) =>
  checkoutPayments.value
    .slice(0, index)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

const remainingForCheckoutPayment = (index: number) =>
  Math.max(
    0,
    Number(totalAmount.value || 0) - amountBeforeCheckoutPayment(index),
  );

const focusCheckoutAmount = async () => {
  await nextTick();
  const input = document.querySelector<HTMLElement>(
    ".sales-checkout-modal input",
  );
  input?.focus();
};

const updateCheckoutPaymentAppliedAmount = (index: number) => {
  const payment = checkoutPayments.value[index];
  if (!payment) return;
  const available = remainingForCheckoutPayment(index);
  payment.amount = Math.min(
    available,
    Math.max(0, Number(payment.tenderedAmount || 0)),
  );
};

const updateActiveTenderedAmount = (value: number) => {
  const payment = activeCheckoutPayment.value;
  if (!payment) return;
  const maxTenderedAmount = activeCheckoutTenderedMax.value;
  payment.tenderedAmount =
    maxTenderedAmount === null
      ? Number(value || 0)
      : Math.min(Number(value || 0), maxTenderedAmount);
  updateCheckoutPaymentAppliedAmount(activeCheckoutPaymentIndex.value);
  checkoutForm.amount = checkoutPaidTotal.value;
  checkoutForm.paymentMethodId = payment.paymentMethodId;
};

const fillExactCheckoutAmount = async () => {
  const payment = activeCheckoutPayment.value;
  if (!payment) return;
  const exactAmount = remainingForCheckoutPayment(
    activeCheckoutPaymentIndex.value,
  );
  payment.tenderedAmount = exactAmount;
  payment.amount = exactAmount;
  checkoutForm.amount = checkoutPaidTotal.value;
  await focusCheckoutAmount();
};

const selectQuickPayment = async (paymentMethodId: number | null) => {
  if (!paymentMethodId) return;
  const payment = activeCheckoutPayment.value;
  if (!payment) return;
  payment.paymentMethodId = paymentMethodId;
  checkoutForm.paymentMethodId = paymentMethodId;
  if (!isCashPaymentMethod(paymentMethodId)) {
    await fillExactCheckoutAmount();
    return;
  }
  await focusCheckoutAmount();
};

const createCheckoutPayment = (
  paymentMethodId: number | null = null,
  amount = 0,
): CheckoutPayment => ({
  _key: checkoutPaymentKey(),
  paymentMethodId,
  amount,
  tenderedAmount: amount,
});

const addCheckoutPayment = async () => {
  const remaining = checkoutRemaining.value;
  checkoutPayments.value.push(createCheckoutPayment(null, remaining));
  activeCheckoutPaymentIndex.value = checkoutPayments.value.length - 1;
  await nextTick();
  const firstButton = Array.isArray(paymentQuickButtonRef.value)
    ? paymentQuickButtonRef.value[0]
    : paymentQuickButtonRef.value;
  firstButton?.focus?.();
};

const removeCheckoutPayment = (index: number) => {
  if (checkoutPayments.value.length <= 1) return;
  checkoutPayments.value.splice(index, 1);
  activeCheckoutPaymentIndex.value = Math.max(
    0,
    Math.min(
      activeCheckoutPaymentIndex.value,
      checkoutPayments.value.length - 1,
    ),
  );
  checkoutForm.amount = checkoutPaidTotal.value;
  checkoutForm.paymentMethodId =
    activeCheckoutPayment.value?.paymentMethodId || null;
};

const codeForItem = (row: any) => {
  if (row.itemType === "PROCEDURE") return "SERV";
  const product = productOptions.value.find(
    (item) => item.value === row.productId,
  );
  return (
    product?.barcode ||
    product?.sku ||
    (product?.value ? `#${product.value}` : "-")
  );
};

const selectCartItem = (key: string | null, highlight = false) => {
  selectedItemKey.value = key;
  if (!highlight || !key) return;

  highlightedItemKey.value = key;
  if (highlightTimer) window.clearTimeout(highlightTimer);
  highlightTimer = window.setTimeout(() => {
    if (highlightedItemKey.value === key) {
      highlightedItemKey.value = null;
    }
  }, 1600);
};

const itemTypeLabel = (row: any) =>
  row.itemType === "PROCEDURE"
    ? "Serviço"
    : isWeightedProductRow(row)
      ? "Produto · kg"
      : "Produto";

const productForRow = (row: any) =>
  productOptions.value.find((product) => product.value === row.productId);

const isWeightedProductRow = (row: any) =>
  row.itemType === "PRODUCT" && productForRow(row)?.saleMode === "WEIGHT";

const unitForRow = (row: any) => {
  if (row.itemType === "PROCEDURE") return "un";
  const product = productForRow(row);
  return product?.saleMode === "WEIGHT" ? product.saleUnit || "kg" : "un";
};

const minimumQuantityForRow = (row: any) =>
  isWeightedProductRow(row) ? 0.001 : 1;
const quantityStepForRow = (row: any) => (isWeightedProductRow(row) ? 0.1 : 1);

const formatQuantity = (value: number, row?: any) => {
  const quantity = Number(value || 0);
  if (row && isWeightedProductRow(row)) {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(quantity);
  }
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(3);
};

const formatQuickMatchPrice = (match: QuickMatch) =>
  match.type === "PRODUCT" && match.saleMode === "WEIGHT"
    ? `${formatCurrency(match.price)}/kg`
    : formatCurrency(match.price);

const addQuickMatchToCart = (match: QuickMatch, quantity = 1) => {
  if (isReadonly.value) return;
  const isWeighted = match.type === "PRODUCT" && match.saleMode === "WEIGHT";
  const minimumQuantity = isWeighted ? 0.001 : 1;
  const quantityToAdd = Math.max(
    minimumQuantity,
    Number(quantity || minimumQuantity),
  );
  const existing = model.items.find((item) =>
    match.type === "PRODUCT"
      ? item.itemType === "PRODUCT" && item.productId === match.id
      : item.itemType === "PROCEDURE" && item.procedureId === match.id,
  );

  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + quantityToAdd;
    recalculateRow(existing);
    selectCartItem(existing._key, true);
    return;
  }

  const row: (typeof model.items)[number] = {
    itemType: match.type,
    productId: match.type === "PRODUCT" ? match.id : null,
    procedureId: match.type === "PROCEDURE" ? match.id : null,
    quantity: quantityToAdd,
    unitPrice: Number(match.price || 0),
    discountAmount: 0,
    totalPrice: Number(match.price || 0) * quantityToAdd,
    originType: null,
    originReferenceId: null,
    _key: Math.random().toString(36).substring(7),
  };
  model.items.push(row);
  selectCartItem(row._key, true);
};

const findQuickMatches = (term: string) => {
  const normalizedTerm = normalizeSearch(term);
  if (!normalizedTerm) return [];

  const products = (
    activeQuickCategory.value === "PROCEDURES"
      ? []
      : filteredProductOptions.value
  ).map((product) => ({
    type: "PRODUCT" as const,
    id: product.value,
    name: product.name,
    code: product.barcode || product.sku || null,
    price: product.salePrice,
    barcode: product.barcode,
    sku: product.sku,
    saleMode: product.saleMode,
    saleUnit: product.saleUnit,
  }));
  const procedures = (
    activeQuickCategory.value === "PROCEDURES" ||
    activeQuickCategory.value === "ALL"
      ? procedureOptions.value
      : []
  ).map((procedure) => ({
    type: "PROCEDURE" as const,
    id: procedure.value,
    name: procedure.name,
    code: null,
    price: procedure.defaultPrice,
    barcode: null,
    sku: null,
  }));
  const entries = [...products, ...procedures];

  const exactBarcode = entries.filter(
    (entry) => normalizeSearch(entry.barcode) === normalizedTerm,
  );
  if (exactBarcode.length) return exactBarcode;

  const exactSku = entries.filter(
    (entry) => normalizeSearch(entry.sku) === normalizedTerm,
  );
  if (exactSku.length) return exactSku;

  return entries.filter((entry) =>
    [entry.name]
      .filter(Boolean)
      .some((value) => normalizeSearch(value).includes(normalizedTerm)),
  );
};

const productToQuickMatch = (product: ProductOption): QuickMatch => ({
  type: "PRODUCT",
  id: product.value,
  name: product.name,
  code: product.barcode || product.sku || null,
  price: product.salePrice,
  saleMode: product.saleMode,
  saleUnit: product.saleUnit,
});

const fetchProductsBy = async (
  param: "barcode" | "sku" | "name",
  term: string,
) => {
  const api = useApi();
  const query = new URLSearchParams({
    page: "1",
    limit: "20",
    isActive: "true",
    isService: "false",
    [param]: term,
  });
  const response = await api<any>(`/api/v1/products?${query.toString()}`);
  const products = (response.data || []).map(mapProductOption);
  products.forEach(upsertProductOption);
  return products;
};

const findRemoteProductMatches = async (term: string) => {
  const normalizedTerm = normalizeSearch(term);
  const barcodeMatches = await fetchProductsBy("barcode", term);
  const exactBarcodeMatches = barcodeMatches.filter(
    (product) => normalizeSearch(product.barcode) === normalizedTerm,
  );
  if (exactBarcodeMatches.length)
    return exactBarcodeMatches.map(productToQuickMatch);

  const skuMatches = await fetchProductsBy("sku", term);
  const exactSkuMatches = skuMatches.filter(
    (product) => normalizeSearch(product.sku) === normalizedTerm,
  );
  if (exactSkuMatches.length) return exactSkuMatches.map(productToQuickMatch);

  const nameMatches = await fetchProductsBy("name", term);
  return nameMatches.map(productToQuickMatch);
};

const focusQuickEntry = async () => {
  await nextTick();
  quickEntryRef.value?.focus?.();
};

const parseQuickEntry = (value: string): QuickEntryPayload | null => {
  const raw = value.trim();
  if (!raw) return null;

  const quantityMatch = raw.match(/^(\d+(?:[,.]\d{1,3})?)\s*\*\s*(.+)$/);
  if (!quantityMatch) {
    return { term: raw, quantity: 1 };
  }

  const quantity = Number(quantityMatch[1].replace(",", "."));
  const term = quantityMatch[2].trim();
  if (!term || !Number.isFinite(quantity) || quantity <= 0) {
    return { term: raw, quantity: 1 };
  }

  return { term, quantity };
};

const handleQuickEntrySubmit = async () => {
  const parsedEntry = parseQuickEntry(quickEntry.value);
  if (!parsedEntry) return;
  const { term, quantity } = parsedEntry;

  let matches: QuickMatch[] = [];
  try {
    matches = await findRemoteProductMatches(term);
  } catch (_error) {
    matches = [];
  }

  if (!matches.length) {
    matches = findQuickMatches(term);
  }

  if (!matches.length) {
    message.warning("Nenhum produto ou serviço encontrado.");
    pendingQuickQuantity.value = 1;
    await focusQuickEntry();
    return;
  }

  if (matches.length === 1) {
    addQuickMatchToCart(matches[0], quantity);
    quickEntry.value = "";
    await focusQuickEntry();
    return;
  }

  pendingQuickQuantity.value = quantity;
  quickMatches.value = matches.slice(0, 8);
  showQuickMatchModal.value = true;
};

const selectQuickMatch = async (match: QuickMatch) => {
  addQuickMatchToCart(match, pendingQuickQuantity.value);
  quickEntry.value = "";
  pendingQuickQuantity.value = 1;
  showQuickMatchModal.value = false;
  await focusQuickEntry();
};

const incrementItem = (row: any) => {
  if (isReadonly.value) return;
  row.quantity = Number(row.quantity || 0) + quantityStepForRow(row);
  recalculateRow(row);
  selectedItemKey.value = row._key;
};

const decrementItem = (row: any) => {
  if (isReadonly.value) return;
  row.quantity = Math.max(
    minimumQuantityForRow(row),
    Number(row.quantity || 0) - quantityStepForRow(row),
  );
  recalculateRow(row);
  selectedItemKey.value = row._key;
};

const handleItemTypeChange = (row: any) => {
  row.productId = null;
  row.procedureId = null;
  row.unitPrice = 0;
  row.discountAmount = 0;
  row.totalPrice = 0;
  row.originType = null;
  row.originReferenceId = null;
};

const handleItemRefChange = (row: any, val: number) => {
  if (row.itemType === "PROCEDURE") {
    const proc = procedureOptions.value.find((p) => p.value === val);
    row.procedureId = val;
    row.productId = null;
    row.unitPrice = Number(proc?.defaultPrice || 0);
  } else {
    const prod = productOptions.value.find((p) => p.value === val);
    row.productId = val;
    row.procedureId = null;
    row.unitPrice = Number(prod?.salePrice || 0);
  }
  recalculateRow(row);
};

const resolveItemName = (row: any) => {
  if (row.itemType === "PROCEDURE") {
    return (
      procedureOptions.value.find((p) => p.value === row.procedureId)?.name ||
      "Serviço não informado"
    );
  }
  return (
    productOptions.value.find((p) => p.value === row.productId)?.name ||
    "Produto não informado"
  );
};

const recalculateRow = (row: any) => {
  const quantity = Math.max(0, Number(row.quantity || 0));
  const unitPrice = Math.max(0, Number(row.unitPrice || 0));
  const subtotalItem = quantity * unitPrice;
  const discount = Math.max(
    0,
    Math.min(Number(row.discountAmount || 0), subtotalItem),
  );
  row.discountAmount = discount;
  row.totalPrice = Number(Math.max(0, subtotalItem - discount).toFixed(2));
};

const removeItem = (key: string) => {
  if (isReadonly.value) return;
  model.items = model.items.filter((item) => item._key !== key);
  if (selectedItemKey.value === key) {
    selectedItemKey.value = model.items.at(-1)?._key || null;
  }
};

const itemColumns = computed(() => [
  {
    title: "Código",
    key: "code",
    width: 210,
    minWidth: 210,
    render(row: any) {
      return h("span", { class: "cart-code" }, codeForItem(row));
    },
  },
  {
    title: "Produto",
    key: "itemId",
    minWidth: 330,
    render(row: any) {
      const options =
        row.itemType === "PROCEDURE"
          ? procedureOptions.value
          : productOptions.value;
      const value =
        row.itemType === "PROCEDURE" ? row.procedureId : row.productId;
      if (value || isReadonly.value) {
        return h("div", { class: "cart-product-cell" }, [
          h("strong", { class: "cart-product-name" }, resolveItemName(row)),
          h("span", { class: "item-type-badge" }, itemTypeLabel(row)),
        ]);
      }

      return h("div", { class: "cart-manual-cell" }, [
        h(NSelect, {
          value: row.itemType,
          options: [
            { label: "Produto", value: "PRODUCT" },
            { label: "Serviço", value: "PROCEDURE" },
          ],
          disabled: isReadonly.value,
          onUpdateValue: (val: "PRODUCT" | "PROCEDURE") => {
            row.itemType = val;
            handleItemTypeChange(row);
          },
        }),
        h(NSelect, {
          value,
          options,
          filterable: true,
          disabled: isReadonly.value,
          placeholder:
            row.itemType === "PROCEDURE"
              ? "Selecione o serviço"
              : "Selecione o produto",
          onUpdateValue: (val: number) => handleItemRefChange(row, val),
        }),
      ]);
    },
  },
  {
    title: "Qtd",
    key: "quantity",
    width: 170,
    minWidth: 170,
    align: "right" as const,
    render(row: any) {
      return h("div", { class: "quantity-stepper" }, [
        h(
          "button",
          {
            type: "button",
            class: "quantity-stepper-btn",
            disabled: isReadonly.value,
            onClick: () => decrementItem(row),
          },
          { default: () => "-" },
        ),
        h("input", {
          class: "quantity-stepper-input",
          type: "number",
          value: row.quantity,
          min: minimumQuantityForRow(row),
          step: isWeightedProductRow(row) ? 0.001 : 1,
          disabled: isReadonly.value,
          onInput: (event: Event) => {
            const minimumQuantity = minimumQuantityForRow(row);
            const value = Number(
              (event.target as HTMLInputElement).value || minimumQuantity,
            );
            row.quantity =
              Number.isFinite(value) && value > 0 ? value : minimumQuantity;
            selectedItemKey.value = row._key;
            recalculateRow(row);
          },
        }),
        h(
          "button",
          {
            type: "button",
            class: "quantity-stepper-btn",
            disabled: isReadonly.value,
            onClick: () => incrementItem(row),
          },
          { default: () => "+" },
        ),
        h("span", { class: "quantity-unit" }, unitForRow(row)),
      ]);
    },
  },
  {
    title: "Preço",
    key: "unitPrice",
    width: 150,
    align: "right" as const,
    render(row: any) {
      return h(
        "div",
        { class: "cart-money-input" },
        h(CurrencyInput, {
          modelValue: row.unitPrice,
          disabled: isReadonly.value,
          "onUpdate:modelValue": (val: number) => {
            row.unitPrice = Number(val || 0);
            selectedItemKey.value = row._key;
            recalculateRow(row);
          },
        }),
      );
    },
  },
  {
    title: "Desconto",
    key: "discountAmount",
    width: 150,
    align: "right" as const,
    render(row: any) {
      return h(
        "div",
        { class: "cart-money-input" },
        h(CurrencyInput, {
          modelValue: row.discountAmount,
          disabled: isReadonly.value,
          "onUpdate:modelValue": (val: number) => {
            row.discountAmount = Number(val || 0);
            selectedItemKey.value = row._key;
            recalculateRow(row);
          },
        }),
      );
    },
  },
  {
    title: "Total",
    key: "totalPrice",
    width: 130,
    align: "right" as const,
    render(row: any) {
      return h(
        "strong",
        { class: "item-total" },
        formatCurrency(row.totalPrice),
      );
    },
  },
  {
    title: "Ação",
    key: "actions",
    width: 76,
    align: "center" as const,
    render(row: any) {
      return h(
        "button",
        {
          type: "button",
          disabled: isReadonly.value,
          class: "cart-remove-icon",
          title: "Remover item",
          "aria-label": "Remover item",
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            removeItem(row._key);
          },
        },
        "🗑",
      );
    },
  },
]);

const cartRowProps = (row: any) => ({
  class: [
    "cart-row",
    selectedItemKey.value === row._key ? "cart-row--selected" : "",
    highlightedItemKey.value === row._key ? "cart-row--highlighted" : "",
  ]
    .filter(Boolean)
    .join(" "),
  onClick: () => {
    selectCartItem(row._key);
  },
});

const loadSale = async () => {
  if (!props.saleId) return;
  loading.value = true;
  try {
    const api = useApi();
    const sale = await api<any>(`/api/v1/sales/${props.saleId}`);

    model.id = Number(sale.id);
    model.clientId = sale.clientId ? Number(sale.clientId) : null;
    model.veterinarianId = sale.veterinarianId
      ? Number(sale.veterinarianId)
      : null;
    model.saleDate = new Date(sale.saleDate).getTime();
    model.status = sale.status;
    model.notes = sale.notes || "";
    showNotes.value = Boolean(model.notes);
    model.discountAmount = Number(sale.discountAmount || 0);
    model.items = (sale.items || []).map((item: any) => ({
      id: Number(item.id),
      itemType: item.procedureId ? "PROCEDURE" : "PRODUCT",
      productId: item.productId ? Number(item.productId) : null,
      procedureId: item.procedureId ? Number(item.procedureId) : null,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      discountAmount: Number(item.discountAmount || 0),
      totalPrice: Number(item.totalPrice || 0),
      originType: item.originType || null,
      originReferenceId: item.originReferenceId
        ? Number(item.originReferenceId)
        : null,
      _key: Math.random().toString(36).substring(7),
    }));

    const firstPayment = (sale.payments || [])[0];
    paymentInfo.value = firstPayment
      ? {
          paymentMethod: firstPayment.paymentMethod?.name || "-",
          amount: Number(firstPayment.amount || 0),
          tenderedAmount: Number(
            firstPayment.tenderedAmount || firstPayment.amount || 0,
          ),
          changeAmount: Number(firstPayment.changeAmount || 0),
          paidAt: firstPayment.paidAt
            ? format(new Date(firstPayment.paidAt), "dd/MM/yyyy HH:mm")
            : "-",
        }
      : null;

    createdByLabel.value = sale.veterinarian?.name || "-";
    createdAtLabel.value = sale.createdAt
      ? format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm")
      : "-";
    if (route.query.checkout === "1" && !checkoutQueryHandled.value) {
      checkoutQueryHandled.value = true;
      void openCheckoutModal();
    }
  } catch (_err) {
    message.error("Erro ao carregar venda");
  } finally {
    loading.value = false;
  }
};

const validateBeforeSave = () => {
  if (!model.items.length) {
    message.warning("Adicione ao menos um item à venda.");
    return false;
  }

  if (!hasValidItems.value) {
    message.warning(
      "Revise os itens: produto/serviço obrigatório, quantidade > 0 e desconto válido.",
    );
    return false;
  }

  if (Number(model.discountAmount || 0) > subtotal.value) {
    message.warning("Desconto da venda não pode ser maior que o subtotal.");
    return false;
  }

  return true;
};

const saveSale = async (): Promise<number | null> => {
  await formRef.value?.validate();
  if (!validateBeforeSave()) return null;

  saving.value = true;
  try {
    const api = useApi();
    const payload = {
      clientId: model.clientId,
      veterinarianId: model.veterinarianId,
      saleDate: new Date(model.saleDate).toISOString(),
      notes: model.notes || null,
      subtotal: subtotal.value,
      discountAmount: Number(model.discountAmount || 0),
      totalAmount: totalAmount.value,
    };

    const sale = model.id
      ? await api<any>(`/api/v1/sales/${model.id}`, {
          method: "PATCH",
          body: payload,
        })
      : await api<any>("/api/v1/sales", {
          method: "POST",
          body: { ...payload, status: "OPEN" },
        });

    const saleId = Number(sale.id || model.id);

    const existingItems = await api<any[]>(`/api/v1/sale-items/sale/${saleId}`);
    await Promise.all(
      (existingItems || []).map((item: any) =>
        api(`/api/v1/sale-items/${item.id}`, { method: "DELETE" }),
      ),
    );

    for (const item of model.items) {
      await api("/api/v1/sale-items", {
        method: "POST",
        body: {
          saleId,
          productId: item.itemType === "PRODUCT" ? item.productId : null,
          procedureId: item.itemType === "PROCEDURE" ? item.procedureId : null,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount || 0),
          totalPrice: Math.max(0, Number(item.totalPrice || 0)),
          originType: item.originType || null,
          originReferenceId: item.originReferenceId || null,
        },
      });
    }

    message.success("Venda salva com sucesso.");
    if (!model.id) {
      await router.push(`/financeiro/vendas/${saleId}`);
      return saleId;
    }

    await loadSale();
    return saleId;
  } catch (error: any) {
    message.error(error?.data?.message || "Erro ao salvar venda");
    return null;
  } finally {
    saving.value = false;
  }
};

const openCheckoutModal = async () => {
  if (!model.id || model.status !== "OPEN" || !canReceiveNow.value) return;
  checkoutForm.amount = 0;
  checkoutForm.paidAt = Date.now();
  checkoutForm.notes = "";
  checkoutForm.paymentMethodId = null;
  checkoutForm.cashRegisterSessionId = null;
  showCheckoutNotes.value = false;
  activeCheckoutPaymentIndex.value = 0;
  checkoutPayments.value = [createCheckoutPayment(null, 0)];

  checkoutLoading.value = true;
  try {
    await fetchOpenCashSessions();
    checkoutForm.paymentMethodId = paymentMethodOptions.value[0]?.value || null;
    if (cashSessionOptions.value.length === 0) {
      message.warning("Abra um caixa antes de receber vendas.");
      return;
    }
    checkoutForm.cashRegisterSessionId = cashSessionOptions.value[0].value;
  } catch (_error) {
    message.error("Erro ao carregar caixa aberto");
    return;
  } finally {
    checkoutLoading.value = false;
  }

  showCheckoutModal.value = true;
  await nextTick();
  const firstButton = Array.isArray(paymentQuickButtonRef.value)
    ? paymentQuickButtonRef.value[0]
    : paymentQuickButtonRef.value;
  firstButton?.focus?.();
};

const handleReceiveNow = async () => {
  if (!canReceiveNow.value) return;
  if (!model.id) {
    const saleId = await saveSale();
    if (!saleId) return;
    await loadSale();
  }
  await openCheckoutModal();
};

const escapeReceiptHtml = (content: string) =>
  content.replace(
    /[&<>]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] || char,
  );

const prepareReceiptPrintWindow = () => {
  if (!process.client) return null;
  const popup = window.open("", "saluki-receipt-print", "width=420,height=720");
  if (!popup) return null;

  popup.document.write(`
    <html>
      <head>
        <title>Cupom não fiscal</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; white-space: pre-wrap; }
          pre { margin: 0; white-space: pre-wrap; }
        </style>
      </head>
      <body><pre>Gerando cupom...</pre></body>
    </html>
  `);
  popup.document.close();
  return popup;
};

const printReceiptContent = (popup: Window, content: string) => {
  popup.document.open();
  popup.document.write(`
    <html>
      <head>
        <title>Cupom não fiscal</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; white-space: pre-wrap; }
          pre { margin: 0; white-space: pre-wrap; }
        </style>
      </head>
      <body><pre>${escapeReceiptHtml(content)}</pre></body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
};

const printReceiptAfterCheckout = async (
  saleId: number,
  popup: Window | null,
  receiptPayments?: any[],
) => {
  const api = useApi();
  const response = await api(`/api/v1/sales/${saleId}/print-receipt`, {
    method: "POST",
    body: { copies: 1, receiptPayments },
  });
  const content = String((response as any).content || "");
  if (!content) {
    message.warning("Cupom gerado sem conteúdo para impressão.");
    popup?.close();
    return;
  }
  if (!popup) {
    message.warning("Permita pop-ups para imprimir o cupom.");
    return;
  }
  printReceiptContent(popup, content);
};

const handleReprintReceipt = async () => {
  if (!model.id || model.status !== "PAID") {
    message.warning("Cupom disponível apenas para vendas pagas.");
    return;
  }

  const popup = prepareReceiptPrintWindow();
  printingReceipt.value = true;
  try {
    await printReceiptAfterCheckout(Number(model.id), popup);
  } catch (error: any) {
    popup?.close();
    message.error(error?.data?.message || "Erro ao reimprimir cupom.");
  } finally {
    printingReceipt.value = false;
  }
};

const focusClientSelect = async () => {
  await nextTick();
  clientSelectRef.value?.focus?.();
};

const focusDiscountInput = async () => {
  await nextTick();
  const input = document.querySelector<HTMLElement>(
    ".sticky-summary .summary-row-discount input",
  );
  input?.focus();
};

const removeSelectedItem = () => {
  const keyToRemove = selectedItemKey.value || model.items.at(-1)?._key || null;
  if (!keyToRemove) {
    message.info("Não há itens no carrinho para remover.");
    return;
  }
  removeItem(keyToRemove);
};

const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" || tagName === "textarea" || element.isContentEditable
  );
};

const moveSelectedItem = (direction: 1 | -1) => {
  if (!model.items.length) return;
  const currentIndex = model.items.findIndex(
    (item) => item._key === selectedItemKey.value,
  );
  const fallbackIndex = direction > 0 ? -1 : model.items.length;
  const nextIndex = Math.max(
    0,
    Math.min(
      model.items.length - 1,
      (currentIndex >= 0 ? currentIndex : fallbackIndex) + direction,
    ),
  );
  selectCartItem(model.items[nextIndex]?._key || null);
};

const handleCheckoutModalShortcuts = (event: KeyboardEvent) => {
  if (!showCheckoutModal.value) return false;

  if (event.key === "Escape") {
    event.preventDefault();
    showCheckoutModal.value = false;
    return true;
  }
  if (event.key === "Enter" || event.key === "F9") {
    const target = event.target as HTMLElement | null;
    if (target?.tagName.toLowerCase() === "textarea") return false;
    event.preventDefault();
    if (checkoutRemaining.value <= 0) void handleCheckout();
    return true;
  }
  if (
    event.key === "F1" ||
    event.key === "F2" ||
    event.key === "F3" ||
    event.key === "F4"
  ) {
    event.preventDefault();
    const optionIndex = Number(event.key.replace("F", "")) - 1;
    void selectQuickPayment(
      quickPaymentOptions.value[optionIndex]?.value || null,
    );
    return true;
  }
  if (event.key === "F5") {
    event.preventDefault();
    void addCheckoutPayment();
    return true;
  }
  if (event.key === "F6") {
    event.preventDefault();
    void fillExactCheckoutAmount();
    return true;
  }
  if (event.key === "F7") {
    event.preventDefault();
    void focusCheckoutAmount();
    return true;
  }

  const key = event.key.toLowerCase();
  const letterMap: Record<string, number> = {
    d: 0,
    p: 1,
    e: 2,
    c: 3,
  };
  if (key === "m") {
    event.preventDefault();
    void addCheckoutPayment();
    return true;
  }
  if (letterMap[key] !== undefined && !isTypingTarget(event.target)) {
    event.preventDefault();
    void selectQuickPayment(
      quickPaymentOptions.value[letterMap[key]]?.value || null,
    );
    return true;
  }
  return false;
};

const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (handleCheckoutModalShortcuts(event)) return;

  if (isReadonly.value && !["F2", "F3", "Escape"].includes(event.key)) return;

  if (
    (event.key === "ArrowDown" || event.key === "ArrowUp") &&
    !isTypingTarget(event.target)
  ) {
    event.preventDefault();
    moveSelectedItem(event.key === "ArrowDown" ? 1 : -1);
    return;
  }

  if (event.key === "F2" || event.key === "F3") {
    event.preventDefault();
    void focusQuickEntry();
    return;
  }
  if (event.key === "F4") {
    event.preventDefault();
    void focusClientSelect();
    return;
  }
  if (event.key === "F6") {
    event.preventDefault();
    void focusDiscountInput();
    return;
  }
  if (event.key === "F7") {
    event.preventDefault();
    removeSelectedItem();
    return;
  }
  if (event.key === "F8") {
    event.preventDefault();
    void handleReceiveNow();
    return;
  }
  if (event.key === "F9") {
    event.preventDefault();
    void saveSale();
    return;
  }
  if (event.key === "Escape") {
    if (showQuickMatchModal.value) {
      showQuickMatchModal.value = false;
      void focusQuickEntry();
      return;
    }
    if (showCheckoutModal.value) {
      showCheckoutModal.value = false;
    }
  }
};

const handleCheckout = async () => {
  if (!model.id) return;
  const paymentsPayload = checkoutPayments.value
    .filter(
      (payment) => payment.paymentMethodId && Number(payment.amount || 0) > 0,
    )
    .map((payment) => ({
      paymentMethodId: Number(payment.paymentMethodId),
      amount: toMoneyNumber(payment.amount),
      tenderedAmount: isCashPaymentMethod(payment.paymentMethodId)
        ? toMoneyNumber(payment.tenderedAmount || payment.amount)
        : toMoneyNumber(payment.amount),
    }));

  if (
    !paymentsPayload.length ||
    paymentsPayload.length !== checkoutPayments.value.length
  ) {
    message.warning("Selecione a forma de pagamento de todos os recebimentos.");
    return;
  }
  if (!checkoutForm.cashRegisterSessionId) {
    message.warning("Selecione o caixa aberto.");
    return;
  }
  if (checkoutPaidTotal.value <= 0) {
    message.warning("Não é possível receber venda com total R$ 0,00.");
    return;
  }
  if (checkoutRemaining.value > 0) {
    message.warning("Ainda há valor restante para receber.");
    return;
  }
  if (!checkoutForm.paidAt) {
    message.warning("Informe a data/hora do pagamento.");
    return;
  }

  const saleId = Number(model.id);
  const receiptPopup = prepareReceiptPrintWindow();
  checkoutLoading.value = true;
  try {
    const api = useApi();
    await api(`/api/v1/sales/${saleId}/checkout`, {
      method: "POST",
      body: {
        paymentMethodId: checkoutForm.paymentMethodId,
        cashRegisterSessionId: checkoutForm.cashRegisterSessionId,
        amount: Number(checkoutPaidTotal.value),
        payments: paymentsPayload,
        paidAt: new Date(checkoutForm.paidAt).toISOString(),
        notes: checkoutForm.notes || undefined,
      },
    });
    showCheckoutModal.value = false;
    message.success("Recebimento realizado com sucesso.");
    await printReceiptAfterCheckout(saleId, receiptPopup, paymentsPayload);
    await router.push("/financeiro/vendas/nova");
  } catch (error: any) {
    receiptPopup?.close();
    message.error(error?.data?.message || "Erro ao receber venda.");
  } finally {
    checkoutLoading.value = false;
  }
};

const confirmCancelSale = () => {
  if (!model.id) return;
  dialog.warning({
    title: "Cancelar venda",
    content: `Deseja cancelar a venda #${model.id}?`,
    positiveText: "Cancelar venda",
    negativeText: "Voltar",
    onPositiveClick: async () => {
      try {
        const api = useApi();
        await api(`/api/v1/sales/${model.id}/cancel`, { method: "POST" });
        message.success("Venda cancelada com sucesso.");
        await loadSale();
      } catch (error: any) {
        message.error(error?.data?.message || "Erro ao cancelar venda.");
      }
    },
  });
};

const confirmUndoPayment = () => {
  if (!model.id) return;
  dialog.warning({
    title: "Estornar pagamento",
    content: `Deseja estornar o pagamento da venda #${model.id}?`,
    positiveText: "Estornar",
    negativeText: "Voltar",
    onPositiveClick: async () => {
      try {
        const api = useApi();
        await api(`/api/v1/sales/${model.id}/undo-checkout`, {
          method: "POST",
        });
        message.success("Pagamento estornado com sucesso.");
        await loadSale();
      } catch (error: any) {
        message.error(error?.data?.message || "Erro ao estornar pagamento.");
      }
    },
  });
};

const goBack = () => router.push("/financeiro/vendas");

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false;
};

onMounted(async () => {
  if (!auth.token) auth.initAuth();
  mediaQuery = window.matchMedia("(max-width: 768px)");
  updateIsMobile();
  mediaQuery.addEventListener("change", updateIsMobile);

  try {
    await loadLookups();
    if (isEdit.value) {
      await loadSale();
    } else {
      applyOperatorDefaults();
      await fetchOpenCashSessions();
      await focusQuickEntry();
    }
  } catch {
    message.error("Erro ao carregar dados da tela.");
  }

  window.addEventListener("keydown", handleKeyboardShortcuts);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", updateIsMobile);
  window.removeEventListener("keydown", handleKeyboardShortcuts);
  if (highlightTimer) window.clearTimeout(highlightTimer);
});
</script>

<style scoped>
.sale-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 80px;
  overflow-x: hidden;
}
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.back-link {
  margin-left: -8px;
  color: #334155;
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
h1 {
  margin: 0;
  font-size: 28px;
  color: #0f172a;
}
.subhead {
  margin: 8px 0 0;
  color: #475569;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.45;
  width: 100%;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}
.main-col,
.side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-card {
  border: 1px solid #e5e7eb;
}
.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.add-item-btn {
  border: 1px solid #cbd5e1;
  color: #1e293b;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
.full-row {
  grid-column: 1 / -1;
}

.sale-meta-card :deep(.n-card__content) {
  padding: 10px 16px 8px;
}
.sale-meta-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 0.85fr) 190px;
  gap: 10px;
  align-items: start;
}
.sale-meta-field {
  margin-bottom: 0;
}
.sale-meta-card :deep(.n-form-item-label) {
  min-height: 20px;
  padding-bottom: 4px;
  font-size: 13px;
}
.sale-meta-card :deep(.n-form-item-feedback-wrapper) {
  min-height: 0;
}
.sale-meta-card :deep(.n-input),
.sale-meta-card :deep(.n-base-selection) {
  min-height: 34px;
}
.sale-meta-card :deep(.n-input-wrapper),
.sale-meta-card :deep(.n-base-selection-label) {
  min-height: 34px;
}
.notes-toggle {
  margin-top: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #15803d;
  font-weight: 700;
  cursor: pointer;
}
.notes-field {
  margin-top: 8px;
  margin-bottom: 0;
}
.notes-field-inner {
  display: grid;
  gap: 6px;
}

.quick-entry-panel {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}
.quick-entry-icon {
  color: #64748b;
  font-size: 18px;
  line-height: 1;
}
.quick-entry-shortcut {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 1px 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}
.quick-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.quick-chip {
  height: 30px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.quick-chip--active {
  border-color: #16a34a;
  background: #ecfdf3;
  color: #166534;
}

.sticky-summary {
  position: sticky;
  top: 16px;
}
.summary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: #334155;
}
.summary-row.total {
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
  color: #0f172a;
}
.pdv-total-box {
  margin-top: 4px;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: grid;
  gap: 4px;
}
.pdv-total-box span {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
}
.pdv-total-box strong {
  font-size: 34px;
  line-height: 1.1;
  color: #0f172a;
  letter-spacing: 0;
}
.side-actions {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}
.side-actions :deep(.sale-save-btn.n-button:not(.n-button--disabled)) {
  background: #fff !important;
  border-color: #16a34a !important;
  color: #166534 !important;
}
.side-actions :deep(.sale-save-btn.n-button:not(.n-button--disabled):hover) {
  background: #f0fdf4 !important;
  border-color: #15803d !important;
  color: #14532d !important;
}
.shortcut-list {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}
.mobile-summary-card {
  width: 100%;
}
.mobile-summary-toggle {
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}
.mobile-summary-toggle-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mobile-summary-arrow {
  color: #64748b;
  font-size: 14px;
}
.mobile-summary-quick {
  margin: 6px 0 0;
  color: #334155;
  line-height: 1.4;
  white-space: normal;
}
.mobile-summary-card .summary-list {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}
.mobile-item-list {
  display: grid;
  gap: 10px;
}
.mobile-item-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}
.mobile-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.mobile-item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.mobile-item-total {
  margin-top: 2px;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
}
.mobile-item-total strong {
  font-size: 15px;
}
.mobile-readonly-rows {
  display: grid;
  gap: 6px;
}
.mobile-readonly-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #334155;
}
.mobile-readonly-row span {
  color: #64748b;
}
.mobile-readonly-row strong {
  color: #0f172a;
  text-align: right;
}
.side-actions :deep(.sale-cta-btn.n-button--disabled),
.mobile-footer-actions :deep(.sale-cta-btn.n-button--disabled) {
  background: #e5e7eb !important;
  border-color: #d1d5db !important;
  color: #6b7280 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}
.side-actions :deep(.sale-cta-btn.n-button--disabled:hover),
.mobile-footer-actions :deep(.sale-cta-btn.n-button--disabled:hover) {
  background: #e5e7eb !important;
  border-color: #d1d5db !important;
  color: #6b7280 !important;
}
.side-actions :deep(.sale-cta-btn.n-button--disabled .n-button__content),
.mobile-footer-actions
  :deep(.sale-cta-btn.n-button--disabled .n-button__content) {
  color: #6b7280 !important;
}

.payment-box {
  margin-top: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
}
.payment-title {
  margin: 0 0 6px;
  font-weight: 700;
  color: #0f172a;
}
.payment-box p {
  margin: 3px 0;
  color: #334155;
}

.cart-table :deep(.n-data-table-th) {
  font-size: 12px;
  font-weight: 800;
  color: #475569;
  background: #f8fafc;
  white-space: nowrap;
}
.cart-table :deep(.n-data-table-td) {
  vertical-align: middle;
  padding-top: 8px;
  padding-bottom: 8px;
}
.cart-table :deep(.cart-row) {
  cursor: pointer;
}
.cart-table :deep(.cart-row--selected .n-data-table-td) {
  background: #f0fdf4;
}
.cart-table :deep(.cart-row--selected .n-data-table-td:first-child) {
  box-shadow: inset 3px 0 0 #16a34a;
}
.cart-table :deep(.cart-row--highlighted .n-data-table-td) {
  animation: cart-highlight 1.6s ease-out;
}
.cart-table :deep(.cart-code) {
  display: inline-flex;
  align-items: center;
  width: 100%;
  max-width: 210px;
  min-height: 28px;
  color: #475569;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cart-table :deep(.cart-product-cell) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-width: 0;
}
.cart-table :deep(.cart-product-name) {
  color: #0f172a;
  font-size: 14px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.cart-table :deep(.item-type-badge) {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
}
.cart-table :deep(.cart-manual-cell) {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 8px;
}
.cart-table :deep(.quantity-stepper) {
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  justify-content: end;
  width: 150px;
  max-width: 150px;
  white-space: nowrap;
  margin-left: auto;
}
.cart-table :deep(.quantity-stepper-btn) {
  appearance: none;
  width: 30px;
  min-width: 30px;
  height: 32px;
  border: 1px solid #d8dee9;
  border-radius: 4px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  text-align: center;
}
.cart-table :deep(.quantity-stepper-btn:disabled) {
  cursor: not-allowed;
  opacity: 0.55;
}
.cart-table :deep(.quantity-stepper-input) {
  appearance: textfield;
  width: 56px !important;
  min-width: 56px;
  max-width: 56px !important;
  height: 32px;
  border: 1px solid #d8dee9;
  border-radius: 4px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
  padding: 0 4px;
}
.cart-table :deep(.quantity-stepper-input::-webkit-outer-spin-button),
.cart-table :deep(.quantity-stepper-input::-webkit-inner-spin-button) {
  appearance: none;
  margin: 0;
}
.cart-table :deep(.quantity-stepper-input:disabled) {
  background: #f1f5f9;
  color: #64748b;
}
.cart-table :deep(.quantity-unit) {
  width: 18px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
}
.cart-table :deep(.cart-money-input) {
  display: flex;
  justify-content: flex-end;
}
.cart-table :deep(.cart-money-input .n-input) {
  max-width: 126px;
}
.cart-table :deep(.cart-money-input .n-input__input-el) {
  text-align: right;
}
.cart-table :deep(.item-total) {
  display: block;
  color: #0f172a;
  font-size: 15px;
  text-align: right;
  white-space: nowrap;
}
.cart-table :deep(.cart-remove-icon) {
  appearance: none;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #dc2626;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.cart-table :deep(.cart-remove-icon:hover) {
  border-color: #fecaca;
  background: #fef2f2;
}
.cart-table :deep(.cart-remove-icon:disabled) {
  cursor: not-allowed;
  opacity: 0.45;
}

@keyframes cart-highlight {
  0% {
    background: #dcfce7;
  }
  100% {
    background: transparent;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}
.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}
.checkout-pdv {
  display: grid;
  gap: 12px;
}
.checkout-compact-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}
.checkout-compact-summary strong {
  color: #b45309;
  font-weight: 800;
}
.checkout-amount-panel {
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #f0fdf4;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.checkout-amount-panel span {
  color: #166534;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}
.checkout-amount-panel strong {
  color: #052e16;
  font-size: 30px;
  line-height: 1;
  letter-spacing: 0;
}
.checkout-section {
  display: grid;
  gap: 8px;
}
.checkout-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.checkout-section-head h4 {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}
.checkout-section-head span {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}
.payment-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.payment-quick-btn {
  min-height: 58px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  display: grid;
  place-items: center;
  gap: 2px;
  cursor: pointer;
}
.payment-quick-btn strong {
  font-size: 14px;
}
.payment-quick-btn small {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}
.payment-quick-btn:focus,
.payment-quick-btn--active {
  border-color: #16a34a;
  background: #ecfdf3;
  outline: none;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.16);
}
.checkout-values-grid {
  grid-template-columns: minmax(0, 1fr) 180px;
  align-items: end;
}
.checkout-values-grid :deep(.n-form-item) {
  margin-bottom: 0;
}
.checkout-result-box {
  min-height: 64px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
  padding: 10px 12px;
  display: grid;
  align-content: center;
  gap: 2px;
}
.checkout-result-box span {
  color: #1e40af;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}
.checkout-result-box strong {
  color: #0f172a;
  font-size: 22px;
  line-height: 1;
}
.checkout-result-box--warning {
  border-color: #fed7aa;
  background: #fff7ed;
}
.checkout-result-box--warning span {
  color: #c2410c;
}
.checkout-payments-list {
  display: grid;
  gap: 6px;
}
.checkout-payment-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
}
.checkout-payment-row--active {
  border-color: #16a34a;
  background: #f0fdf4;
}
.checkout-payment-row span {
  color: #334155;
  font-weight: 700;
}
.checkout-payment-row strong {
  color: #0f172a;
}
.checkout-payment-row button {
  border: 0;
  background: transparent;
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.checkout-add-payment {
  width: fit-content;
  border: 0;
  background: transparent;
  color: #15803d;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
}
.checkout-readonly-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
  color: #64748b;
  font-size: 12px;
}
.checkout-readonly-meta strong {
  color: #334155;
}
.checkout-notes-field {
  margin-bottom: 0;
}

.quick-match-list {
  display: grid;
  gap: 8px;
}
.quick-match-row {
  width: 100%;
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.quick-match-row:hover {
  border-color: #16a34a;
  background: #f8fafc;
}
.quick-match-row span {
  display: grid;
  gap: 2px;
}
.quick-match-row strong {
  color: #0f172a;
}
.quick-match-row small {
  color: #64748b;
}

.mobile-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mobile-footer-total {
  color: #0f172a;
}
.mobile-footer-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.mobile-footer--info {
  display: flex;
  align-items: center;
  justify-content: center;
}
.undo-payment-btn {
  color: #b91c1c;
}

:deep(.status-chip.badge-soft-warning.n-tag) {
  color: #9a6700;
  background: #fff7e6;
  border: 1px solid #fdecc8;
}
:deep(.status-chip.badge-soft-success.n-tag) {
  color: #166534;
  background: #ecfdf3;
  border: 1px solid #d1fae5;
}
:deep(.status-chip.badge-soft-danger.n-tag) {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}
:deep(.status-chip.badge-soft-neutral.n-tag) {
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  .sticky-summary {
    position: static;
  }
  .sale-meta-bar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sale-page {
    gap: 12px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }
  .section-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .add-item-btn {
    width: 100%;
    min-height: 40px;
  }
  .mobile-item-grid {
    grid-template-columns: 1fr;
  }
  .mobile-summary-card .summary-row-discount {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  .mobile-summary-card .summary-row-discount > span {
    white-space: normal;
    word-break: keep-all;
  }
  :deep(.n-input),
  :deep(.n-input-number),
  :deep(.n-base-selection) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }
  :deep(.n-form-item),
  :deep(.n-form-item-feedback-wrapper) {
    width: 100%;
    max-width: 100%;
  }
  .mobile-footer {
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
  .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .modal-actions :deep(.n-button) {
    width: 100%;
  }
  .form-section {
    padding: 10px;
  }
}
</style>

<style>
.sales-checkout-modal.n-card {
  --n-padding-top: 0;
  --n-padding-bottom: 0;
  --n-padding-left: 0;
  --n-padding-right: 0;
  width: 760px !important;
  max-width: calc(100vw - 24px) !important;
  max-height: calc(100vh - 48px) !important;
  max-height: calc(100dvh - 48px) !important;
  margin: 0 auto !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sales-checkout-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.sales-checkout-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 24px;
}

.sales-checkout-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

@media (max-width: 768px) {
  .sales-checkout-modal.n-card {
    max-width: calc(100vw - 12px) !important;
    max-height: calc(100vh - 16px) !important;
    max-height: calc(100dvh - 16px) !important;
  }
}
</style>
