<template>
  <div class="sale-page">
    <div class="page-head">
      <div class="head-copy">
        <n-button text class="back-link" @click="goBack">← Voltar para vendas</n-button>
        <p class="eyebrow">FINANCEIRO</p>
        <div class="title-row">
          <h1>{{ isEdit ? `Venda #${model.id}` : 'Nova venda avulsa' }}</h1>
          <n-tag
            v-if="isEdit"
            :bordered="false"
            :class="['status-chip', statusBadgeClass(model.status)]"
          >
            {{ statusLabel(model.status) }}
          </n-tag>
        </div>
        <p class="subhead">
          {{ isEdit
            ? `Criada em ${createdAtLabel} por ${createdByLabel}.`
            : 'Registre produtos, serviços, descontos e recebimentos da venda avulsa.' }}
        </p>
      </div>
    </div>

    <n-card v-if="isMobile" :bordered="false" class="section-card mobile-summary-card">
      <button type="button" class="mobile-summary-toggle" @click="mobileSummaryOpen = !mobileSummaryOpen">
        <div class="mobile-summary-toggle-head">
          <h3 class="section-title">Resumo da venda</h3>
          <span class="mobile-summary-arrow">{{ mobileSummaryOpen ? '▴' : '▾' }}</span>
        </div>
        <p class="mobile-summary-quick">
          Total: {{ formatCurrency(totalAmount) }} • {{ validItemsCount }} {{ validItemsCount === 1 ? 'item' : 'itens' }} • {{ statusLabel(model.status) }}
        </p>
      </button>

      <div v-if="mobileSummaryOpen" class="summary-list">
        <div class="summary-row"><span>Subtotal</span><strong>{{ formatCurrency(subtotal) }}</strong></div>
        <div class="summary-row summary-row-discount">
          <span>Desconto</span>
          <CurrencyInput
            v-model="model.discountAmount"
            size="small"
            style="width: 150px"
            :disabled="isReadonly"
          />
        </div>
        <div class="summary-row">
          <span>Status</span>
          <n-tag :bordered="false" :class="['status-chip', statusBadgeClass(model.status)]">{{ statusLabel(model.status) }}</n-tag>
        </div>
        <div class="summary-row"><span>Quantidade de itens</span><strong>{{ validItemsCount }}</strong></div>
        <div class="summary-row total"><span>Total</span><strong>{{ formatCurrency(totalAmount) }}</strong></div>
        <div v-if="model.status === 'PAID' && paymentInfo" class="payment-box">
          <p class="payment-title">Pagamento registrado</p>
          <p>Forma: <strong>{{ paymentInfo.paymentMethod }}</strong></p>
          <p>Valor: <strong>{{ formatCurrency(paymentInfo.amount) }}</strong></p>
          <p>Pago em: <strong>{{ paymentInfo.paidAt }}</strong></p>
        </div>
      </div>
    </n-card>

    <div class="content-grid">
      <div class="main-col">
        <n-card :bordered="false" class="section-card">
          <template #header>
            <h3 class="section-title">Dados da venda</h3>
          </template>

          <n-form
            ref="formRef"
            :model="model"
            :rules="rules"
            label-placement="top"
            :show-require-mark="false"
            :disabled="isReadonly"
          >
            <div class="form-grid">
              <n-form-item label="Cliente" path="clientId">
                <n-select
                  v-model:value="model.clientId"
                  :options="clientOptions"
                  placeholder="Venda balcão (sem cliente)"
                  clearable
                  filterable
                />
              </n-form-item>

              <n-form-item label="Veterinário/Vendedor *" path="veterinarianId" required>
                <n-select
                  v-model:value="model.veterinarianId"
                  :options="veterinarianOptions"
                  placeholder="Selecione o vendedor"
                  filterable
                />
              </n-form-item>

              <n-form-item label="Data da venda" path="saleDate" required>
                <n-date-picker
                  v-model:value="model.saleDate"
                  type="datetime"
                  format="dd/MM/yyyy HH:mm"
                  style="width: 100%"
                />
              </n-form-item>

              <n-form-item label="Observações" path="notes" class="full-row">
                <n-input
                  v-model:value="model.notes"
                  type="textarea"
                  :rows="2"
                  placeholder="Observações da venda"
                />
              </n-form-item>
            </div>
          </n-form>
        </n-card>

        <n-card :bordered="false" class="section-card">
          <template #header>
            <div class="section-head">
              <h3 class="section-title">Itens da venda</h3>
              <n-button
                v-if="!isReadonly"
                secondary
                strong
                size="small"
                class="add-item-btn"
                @click="addItem"
              >
                + Adicionar item
              </n-button>
            </div>
          </template>

          <template v-if="isMobile">
            <div class="mobile-item-list">
              <div v-for="(item, idx) in model.items" :key="item._key" class="mobile-item-card">
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
                    <div class="mobile-readonly-row"><span>Item</span><strong>{{ resolveItemName(item) }}</strong></div>
                    <div class="mobile-readonly-row"><span>Tipo</span><strong>{{ item.itemType === 'PROCEDURE' ? 'Serviço' : 'Produto' }}</strong></div>
                    <div class="mobile-readonly-row"><span>Quantidade</span><strong>{{ item.quantity }}</strong></div>
                    <div class="mobile-readonly-row"><span>Preço unitário</span><strong>{{ formatCurrency(item.unitPrice) }}</strong></div>
                    <div class="mobile-readonly-row"><span>Desconto</span><strong>{{ formatCurrency(item.discountAmount) }}</strong></div>
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
                        :min="1"
                        :disabled="isReadonly"
                        :show-button="false"
                        @update:value="() => recalculateRow(item)"
                      />
                    </n-form-item>
                  </div>

                  <n-form-item label="Item">
                    <n-select
                      :value="item.itemType === 'PROCEDURE' ? item.procedureId : item.productId"
                      :options="item.itemType === 'PROCEDURE' ? procedureOptions : productOptions"
                      :disabled="isReadonly"
                      :placeholder="item.itemType === 'PROCEDURE' ? 'Selecione o serviço' : 'Selecione o produto'"
                      filterable
                      @update:value="(val: number) => handleItemRefChange(item, val)"
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
          />
        </n-card>
      </div>

      <div v-if="!isMobile" class="side-col">
        <n-card :bordered="false" class="section-card sticky-summary">
          <template #header>
            <h3 class="section-title">Resumo da venda</h3>
          </template>

          <div class="summary-list">
            <div class="summary-row"><span>Subtotal</span><strong>{{ formatCurrency(subtotal) }}</strong></div>
            <div class="summary-row">
              <span>Desconto</span>
              <CurrencyInput
                v-model="model.discountAmount"
                size="small"
                style="width: 170px"
                :disabled="isReadonly"
              />
            </div>
            <div class="summary-row">
              <span>Status</span>
              <n-tag :bordered="false" :class="['status-chip', statusBadgeClass(model.status)]">{{ statusLabel(model.status) }}</n-tag>
            </div>
            <div class="summary-row"><span>Quantidade de itens</span><strong>{{ validItemsCount }}</strong></div>
            <div class="summary-row total"><span>Total</span><strong>{{ formatCurrency(totalAmount) }}</strong></div>

            <div v-if="model.status === 'PAID' && paymentInfo" class="payment-box">
              <p class="payment-title">Pagamento registrado</p>
              <p>Forma: <strong>{{ paymentInfo.paymentMethod }}</strong></p>
              <p>Valor: <strong>{{ formatCurrency(paymentInfo.amount) }}</strong></p>
              <p>Pago em: <strong>{{ paymentInfo.paidAt }}</strong></p>
            </div>
          </div>

          <div class="side-actions">
            <n-button
              v-if="canShowSave"
              :type="isEdit && model.status === 'OPEN' ? 'default' : 'primary'"
              :secondary="isEdit && model.status === 'OPEN'"
              class="sale-cta-btn"
              :loading="saving"
              :disabled="!canSaveNow"
              @click="saveSale"
            >
              Salvar venda
            </n-button>
            <n-button v-if="canShowReceiveButton" type="primary" class="sale-cta-btn" :disabled="!canReceiveNow" @click="handleReceiveNow">
              Receber agora
            </n-button>
            <n-button v-if="canShowCancelSale" tertiary type="error" @click="confirmCancelSale">Cancelar venda</n-button>
            <n-button v-if="canShowUndoPayment" tertiary type="error" class="undo-payment-btn" @click="confirmUndoPayment">Estornar pagamento</n-button>
            <n-button v-if="isNew" tertiary @click="goBack">Cancelar</n-button>
          </div>
        </n-card>
      </div>
    </div>

    <div v-if="isMobile && model.status !== 'CANCELED'" class="mobile-footer">
      <div class="mobile-footer-total">Total: <strong>{{ formatCurrency(totalAmount) }}</strong></div>
      <div class="mobile-footer-actions">
        <n-button v-if="canShowSave" type="primary" class="sale-cta-btn" :loading="saving" :disabled="!canSaveNow" @click="saveSale">Salvar</n-button>
        <n-button v-if="canShowReceiveButton" type="primary" class="sale-cta-btn" :disabled="!canReceiveNow" @click="handleReceiveNow">Receber</n-button>
      </div>
      <n-button v-if="isNew" tertiary @click="goBack">Cancelar</n-button>
      <n-button v-if="canShowCancelSale" tertiary type="error" @click="confirmCancelSale">Cancelar venda</n-button>
      <n-button v-if="canShowUndoPayment" tertiary type="error" class="undo-payment-btn" @click="confirmUndoPayment">Estornar pagamento</n-button>
    </div>
    <div v-else-if="isMobile && model.status === 'CANCELED'" class="mobile-footer mobile-footer--info">
      <div class="mobile-footer-total">Venda cancelada • <strong>Total {{ formatCurrency(totalAmount) }}</strong></div>
    </div>

    <n-modal v-model:show="showCheckoutModal" preset="card" class="sales-checkout-modal">
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">Receber venda</h3>
          <p class="modal-subtitle">Informe os dados do recebimento para marcar a venda como paga.</p>
        </div>
      </template>
      <n-form :model="checkoutForm" label-placement="top">
        <div class="sections">
          <section class="form-section">
            <h4 class="section-title">Resumo da venda</h4>
            <div class="checkout-summary-card">
              <p class="checkout-summary-title">Venda #{{ model.id || '-' }}</p>
              <p><span>Cliente:</span> <strong>{{ selectedClientName }}</strong></p>
              <p><span>Total da venda:</span> <strong>{{ formatCurrency(totalAmount) }}</strong></p>
              <p class="checkout-amount-due"><span>Valor a receber:</span> <strong>{{ formatCurrency(totalAmount) }}</strong></p>
              <p><span>Status:</span> <strong>{{ statusLabel(model.status) }}</strong></p>
            </div>
          </section>

          <section class="form-section">
            <h4 class="section-title">Dados do recebimento</h4>
            <div class="form-grid">
              <n-form-item label="Forma de pagamento" required>
                <n-select
                  v-model:value="checkoutForm.paymentMethodId"
                  :options="paymentMethodOptions"
                  placeholder="Selecione a forma de pagamento"
                  filterable
                  clearable
                />
              </n-form-item>

              <n-form-item label="Valor recebido" required>
                <CurrencyInput v-model="checkoutForm.amount" />
              </n-form-item>

              <n-form-item label="Data/hora do pagamento" required>
                <n-date-picker
                  v-model:value="checkoutForm.paidAt"
                  type="datetime"
                  format="dd/MM/yyyy HH:mm"
                  style="width: 100%"
                />
              </n-form-item>

              <n-form-item label="Observações" class="full-row">
                <n-input v-model:value="checkoutForm.notes" type="textarea" :rows="3" placeholder="Opcional" />
              </n-form-item>
            </div>
            <p class="checkout-hint">Ao confirmar, esta venda será marcada como Paga.</p>
          </section>
        </div>
      </n-form>

      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="checkoutLoading" @click="showCheckoutModal = false">Cancelar</n-button>
          <n-button type="primary" :loading="checkoutLoading" @click="handleCheckout">Confirmar recebimento</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { NButton, NInputNumber, NSelect, NTag, useDialog, useMessage } from 'naive-ui';
import CurrencyInput from '../common/CurrencyInput.vue';
import { format } from 'date-fns';

const props = defineProps<{ saleId?: number | null }>();
const message = useMessage();
const dialog = useDialog();
const router = useRouter();
const route = useRoute();

const isEdit = computed(() => Boolean(props.saleId));
const isNew = computed(() => !isEdit.value);
const isMobile = ref(false);
const mobileSummaryOpen = ref(false);
let mediaQuery: MediaQueryList | null = null;

const formRef = ref<FormInst | null>(null);
const saving = ref(false);
const loading = ref(false);
const showCheckoutModal = ref(false);
const checkoutLoading = ref(false);
const checkoutQueryHandled = ref(false);

const paymentMethodOptions = ref<Array<{ label: string; value: number }>>([]);
const clientOptions = ref<{ label: string; value: number }[]>([]);
const veterinarianOptions = ref<{ label: string; value: number }[]>([]);
const productOptions = ref<{ label: string; value: number; salePrice: number }[]>([]);
const procedureOptions = ref<{ label: string; value: number; defaultPrice: number }[]>([]);
const createdByLabel = ref('-');
const createdAtLabel = ref('-');
const paymentInfo = ref<{ paymentMethod: string; amount: number; paidAt: string } | null>(null);
const selectedClientName = computed(() => {
  if (!model.clientId) return 'Venda balcão';
  return clientOptions.value.find((c) => c.value === model.clientId)?.label || 'Venda balcão';
});

const model = reactive({
  id: null as number | null,
  clientId: null as number | null,
  veterinarianId: null as number | null,
  saleDate: Date.now(),
  status: 'OPEN' as 'OPEN' | 'PAID' | 'CANCELED',
  notes: '',
  discountAmount: 0,
  items: [] as Array<{
    id?: number;
    itemType: 'PRODUCT' | 'PROCEDURE';
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
  amount: 0,
  paidAt: Date.now(),
  notes: '',
});

const rules: FormRules = {
  veterinarianId: { type: 'number', required: true, message: 'Selecione o vendedor', trigger: 'change' },
  saleDate: { type: 'number', required: true, message: 'A data é obrigatória', trigger: 'change' },
};

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const statusLabel = (status: string) => {
  if (status === 'OPEN') return 'Aberta';
  if (status === 'PAID') return 'Paga';
  if (status === 'CANCELED') return 'Cancelada';
  return status;
};

const statusBadgeClass = (status: string) => {
  if (status === 'OPEN') return 'badge-soft-warning';
  if (status === 'PAID') return 'badge-soft-success';
  if (status === 'CANCELED') return 'badge-soft-danger';
  return 'badge-soft-neutral';
};

const subtotal = computed(() => model.items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unitPrice), 0));
const totalAmount = computed(() => {
  const sumWithItemDiscounts = model.items.reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
  return Math.max(0, sumWithItemDiscounts - Number(model.discountAmount || 0));
});

const isReadonly = computed(() => isEdit.value && (model.status === 'PAID' || model.status === 'CANCELED'));

const hasValidItems = computed(() => {
  if (!model.items.length) return false;
  return model.items.every((item) => {
    const hasRef = item.itemType === 'PROCEDURE' ? Boolean(item.procedureId) : Boolean(item.productId);
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const discount = Number(item.discountAmount || 0);
    const itemSubtotal = quantity * unitPrice;
    return hasRef && quantity > 0 && unitPrice >= 0 && discount >= 0 && discount <= itemSubtotal;
  });
});
const validItemsCount = computed(() => {
  return model.items.filter((item) => {
    const hasRef = item.itemType === 'PROCEDURE' ? Boolean(item.procedureId) : Boolean(item.productId);
    return hasRef && Number(item.quantity || 0) > 0;
  }).length;
});

const canReceiveNow = computed(() => {
  return Boolean(model.veterinarianId) && hasValidItems.value && totalAmount.value > 0;
});
const canSaveNow = computed(() => {
  return Boolean(model.veterinarianId) && hasValidItems.value;
});

const canShowSave = computed(() => isNew.value || model.status === 'OPEN');
const canShowReceiveButton = computed(() => isNew.value || model.status === 'OPEN');
const canShowCancelSale = computed(() => isEdit.value && model.status === 'OPEN');
const canShowUndoPayment = computed(() => isEdit.value && model.status === 'PAID');

const loadLookups = async () => {
  const api = useApi();
  const [clientsRes, usersRes, productsRes, proceduresRes, paymentMethodsRes] = await Promise.all([
    api<any>('/api/v1/clients?limit=500'),
    api<any>('/api/v1/users?limit=100'),
    api<any>('/api/v1/products?limit=500'),
    api<any>('/api/v1/procedures?limit=500'),
    api<any>('/api/v1/payment-methods?page=1&limit=100'),
  ]);

  clientOptions.value = (clientsRes.data || []).map((i: any) => ({ label: i.name, value: Number(i.id) }));
  veterinarianOptions.value = (usersRes.data || []).map((i: any) => ({ label: i.name, value: Number(i.id) }));
  productOptions.value = (productsRes.data || []).map((i: any) => ({
    label: `${i.name} (${formatCurrency(i.salePrice)})`,
    value: Number(i.id),
    salePrice: Number(i.salePrice || 0),
  }));
  procedureOptions.value = (proceduresRes.data || []).map((i: any) => ({
    label: `${i.name} (${formatCurrency(i.defaultPrice || 0)})`,
    value: Number(i.id),
    defaultPrice: Number(i.defaultPrice || 0),
  }));
  paymentMethodOptions.value = (paymentMethodsRes.data || [])
    .filter((method: any) => method.isActive !== false)
    .map((method: any) => ({ label: method.name, value: Number(method.id) }));
};

const addItem = () => {
  if (isReadonly.value) return;
  model.items.push({
    itemType: 'PRODUCT',
    productId: null,
    procedureId: null,
    quantity: 1,
    unitPrice: 0,
    discountAmount: 0,
    totalPrice: 0,
    originType: null,
    originReferenceId: null,
    _key: Math.random().toString(36).substring(7),
  });
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
  if (row.itemType === 'PROCEDURE') {
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
  if (row.itemType === 'PROCEDURE') {
    return procedureOptions.value.find((p) => p.value === row.procedureId)?.label || 'Serviço não informado';
  }
  return productOptions.value.find((p) => p.value === row.productId)?.label || 'Produto não informado';
};

const recalculateRow = (row: any) => {
  const quantity = Math.max(0, Number(row.quantity || 0));
  const unitPrice = Math.max(0, Number(row.unitPrice || 0));
  const subtotalItem = quantity * unitPrice;
  const discount = Math.max(0, Math.min(Number(row.discountAmount || 0), subtotalItem));
  row.discountAmount = discount;
  row.totalPrice = Math.max(0, subtotalItem - discount);
};

const removeItem = (key: string) => {
  if (isReadonly.value) return;
  model.items = model.items.filter((item) => item._key !== key);
};

const itemColumns = computed(() => [
  {
    title: 'Tipo',
    key: 'itemType',
    width: 130,
    render(row: any) {
      return h(NSelect, {
        value: row.itemType,
        options: [
          { label: 'Produto', value: 'PRODUCT' },
          { label: 'Serviço', value: 'PROCEDURE' },
        ],
        disabled: isReadonly.value,
        onUpdateValue: (val: 'PRODUCT' | 'PROCEDURE') => {
          row.itemType = val;
          handleItemTypeChange(row);
        },
      });
    },
  },
  {
    title: 'Item',
    key: 'itemId',
    width: 320,
    render(row: any) {
      const options = row.itemType === 'PROCEDURE' ? procedureOptions.value : productOptions.value;
      const value = row.itemType === 'PROCEDURE' ? row.procedureId : row.productId;
      return h(NSelect, {
        value,
        options,
        filterable: true,
        disabled: isReadonly.value,
        placeholder: row.itemType === 'PROCEDURE' ? 'Selecione o serviço' : 'Selecione o produto',
        onUpdateValue: (val: number) => handleItemRefChange(row, val),
      });
    },
  },
  {
    title: 'Qtd',
    key: 'quantity',
    width: 90,
    render(row: any) {
      return h(NInputNumber, {
        value: row.quantity,
        min: 1,
        disabled: isReadonly.value,
        showButton: false,
        onUpdateValue: (val: number) => {
          row.quantity = val || 1;
          recalculateRow(row);
        },
      });
    },
  },
  {
    title: 'Preço unit.',
    key: 'unitPrice',
    width: 150,
    render(row: any) {
      return h(CurrencyInput, {
        modelValue: row.unitPrice,
        disabled: isReadonly.value,
        'onUpdate:modelValue': (val: number) => {
          row.unitPrice = Number(val || 0);
          recalculateRow(row);
        },
      });
    },
  },
  {
    title: 'Desconto',
    key: 'discountAmount',
    width: 140,
    render(row: any) {
      return h(CurrencyInput, {
        modelValue: row.discountAmount,
        disabled: isReadonly.value,
        'onUpdate:modelValue': (val: number) => {
          row.discountAmount = Number(val || 0);
          recalculateRow(row);
        },
      });
    },
  },
  {
    title: 'Total do item',
    key: 'totalPrice',
    width: 150,
    render(row: any) {
      return h('strong', { class: 'item-total' }, formatCurrency(row.totalPrice));
    },
  },
  {
    title: '',
    key: 'actions',
    width: 60,
    render(row: any) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          type: 'error',
          disabled: isReadonly.value,
          class: 'remove-item-btn',
          onClick: () => removeItem(row._key),
        },
        { default: () => '🗑' },
      );
    },
  },
]);

const loadSale = async () => {
  if (!props.saleId) return;
  loading.value = true;
  try {
    const api = useApi();
    const sale = await api<any>(`/api/v1/sales/${props.saleId}`);

    model.id = Number(sale.id);
    model.clientId = sale.clientId ? Number(sale.clientId) : null;
    model.veterinarianId = sale.veterinarianId ? Number(sale.veterinarianId) : null;
    model.saleDate = new Date(sale.saleDate).getTime();
    model.status = sale.status;
    model.notes = sale.notes || '';
    model.discountAmount = Number(sale.discountAmount || 0);
    model.items = (sale.items || []).map((item: any) => ({
      id: Number(item.id),
      itemType: item.procedureId ? 'PROCEDURE' : 'PRODUCT',
      productId: item.productId ? Number(item.productId) : null,
      procedureId: item.procedureId ? Number(item.procedureId) : null,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      discountAmount: Number(item.discountAmount || 0),
      totalPrice: Number(item.totalPrice || 0),
      originType: item.originType || null,
      originReferenceId: item.originReferenceId ? Number(item.originReferenceId) : null,
      _key: Math.random().toString(36).substring(7),
    }));

    const firstPayment = (sale.payments || [])[0];
    paymentInfo.value = firstPayment
      ? {
          paymentMethod: firstPayment.paymentMethod?.name || '-',
          amount: Number(firstPayment.amount || 0),
          paidAt: firstPayment.paidAt ? format(new Date(firstPayment.paidAt), 'dd/MM/yyyy HH:mm') : '-',
        }
      : null;

    createdByLabel.value = sale.veterinarian?.name || '-';
    createdAtLabel.value = sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm') : '-';
    if (route.query.checkout === '1' && !checkoutQueryHandled.value) {
      checkoutQueryHandled.value = true;
      openCheckoutModal();
    }
  } catch (_err) {
    message.error('Erro ao carregar venda');
  } finally {
    loading.value = false;
  }
};

const validateBeforeSave = () => {
  if (!model.items.length) {
    message.warning('Adicione ao menos um item à venda.');
    return false;
  }

  if (!hasValidItems.value) {
    message.warning('Revise os itens: produto/serviço obrigatório, quantidade > 0 e desconto válido.');
    return false;
  }

  if (Number(model.discountAmount || 0) > subtotal.value) {
    message.warning('Desconto da venda não pode ser maior que o subtotal.');
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
      ? await api<any>(`/api/v1/sales/${model.id}`, { method: 'PATCH', body: payload })
      : await api<any>('/api/v1/sales', { method: 'POST', body: { ...payload, status: 'OPEN' } });

    const saleId = Number(sale.id || model.id);

    const existingItems = await api<any[]>(`/api/v1/sale-items/sale/${saleId}`);
    await Promise.all((existingItems || []).map((item: any) => api(`/api/v1/sale-items/${item.id}`, { method: 'DELETE' })));

    for (const item of model.items) {
      await api('/api/v1/sale-items', {
        method: 'POST',
        body: {
          saleId,
          productId: item.itemType === 'PRODUCT' ? item.productId : null,
          procedureId: item.itemType === 'PROCEDURE' ? item.procedureId : null,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discountAmount || 0),
          totalPrice: Math.max(0, Number(item.totalPrice || 0)),
          originType: item.originType || null,
          originReferenceId: item.originReferenceId || null,
        },
      });
    }

    message.success('Venda salva com sucesso.');
    if (!model.id) {
      await router.push(`/financeiro/vendas/${saleId}`);
      return saleId;
    }

    await loadSale();
    return saleId;
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao salvar venda');
    return null;
  } finally {
    saving.value = false;
  }
};

const openCheckoutModal = () => {
  if (!model.id || model.status !== 'OPEN' || !canReceiveNow.value) return;
  checkoutForm.amount = Number(totalAmount.value || 0);
  checkoutForm.paidAt = Date.now();
  checkoutForm.notes = '';
  checkoutForm.paymentMethodId = paymentMethodOptions.value[0]?.value || null;
  showCheckoutModal.value = true;
};

const handleReceiveNow = async () => {
  if (!canReceiveNow.value) return;
  if (!model.id) {
    const saleId = await saveSale();
    if (!saleId) return;
    await loadSale();
  }
  openCheckoutModal();
};

const handleCheckout = async () => {
  if (!model.id) return;
  if (!checkoutForm.paymentMethodId) {
    message.warning('Selecione a forma de pagamento.');
    return;
  }
  if (Number(checkoutForm.amount || 0) <= 0) {
    message.warning('Não é possível receber venda com total R$ 0,00.');
    return;
  }
  if (Number(checkoutForm.amount || 0) > Number(totalAmount.value || 0)) {
    message.warning('Valor recebido não pode ser maior que o valor a receber.');
    return;
  }
  if (!checkoutForm.paidAt) {
    message.warning('Informe a data/hora do pagamento.');
    return;
  }

  checkoutLoading.value = true;
  try {
    const api = useApi();
    await api(`/api/v1/sales/${model.id}/checkout`, {
      method: 'POST',
      body: {
        paymentMethodId: checkoutForm.paymentMethodId,
        amount: Number(checkoutForm.amount),
        paidAt: new Date(checkoutForm.paidAt).toISOString(),
        notes: checkoutForm.notes || undefined,
      },
    });
    showCheckoutModal.value = false;
    message.success('Recebimento realizado com sucesso.');
    await loadSale();
  } catch (error: any) {
    message.error(error?.data?.message || 'Erro ao receber venda.');
  } finally {
    checkoutLoading.value = false;
  }
};

const confirmCancelSale = () => {
  if (!model.id) return;
  dialog.warning({
    title: 'Cancelar venda',
    content: `Deseja cancelar a venda #${model.id}?`,
    positiveText: 'Cancelar venda',
    negativeText: 'Voltar',
    onPositiveClick: async () => {
      try {
        const api = useApi();
        await api(`/api/v1/sales/${model.id}/cancel`, { method: 'POST' });
        message.success('Venda cancelada com sucesso.');
        await loadSale();
      } catch (error: any) {
        message.error(error?.data?.message || 'Erro ao cancelar venda.');
      }
    },
  });
};

const confirmUndoPayment = () => {
  if (!model.id) return;
  dialog.warning({
    title: 'Estornar pagamento',
    content: `Deseja estornar o pagamento da venda #${model.id}?`,
    positiveText: 'Estornar',
    negativeText: 'Voltar',
    onPositiveClick: async () => {
      try {
        const api = useApi();
        await api(`/api/v1/sales/${model.id}/undo-checkout`, { method: 'POST' });
        message.success('Pagamento estornado com sucesso.');
        await loadSale();
      } catch (error: any) {
        message.error(error?.data?.message || 'Erro ao estornar pagamento.');
      }
    },
  });
};

const goBack = () => router.push('/financeiro/vendas');

const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false;
};

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateIsMobile();
  mediaQuery.addEventListener('change', updateIsMobile);

  try {
    await loadLookups();
    if (isEdit.value) {
      await loadSale();
    } else {
      addItem();
    }
  } catch {
    message.error('Erro ao carregar dados da tela.');
  }
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile);
});
</script>

<style scoped>
.sale-page { display: flex; flex-direction: column; gap: 16px; padding-bottom: 80px; overflow-x: hidden; }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.back-link { margin-left: -8px; color: #334155; }
.eyebrow { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .08em; color: #64748b; }
.title-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
h1 { margin: 0; font-size: 28px; color: #0f172a; }
.subhead { margin: 8px 0 0; color: #475569; white-space: normal; overflow: visible; text-overflow: clip; line-height: 1.45; width: 100%; }

.content-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr); gap: 16px; align-items: start; }
.main-col, .side-col { display: flex; flex-direction: column; gap: 16px; }
.section-card { border: 1px solid #e5e7eb; }
.section-title { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.add-item-btn { border: 1px solid #cbd5e1; color: #1e293b; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; }
.full-row { grid-column: 1 / -1; }

.sticky-summary { position: sticky; top: 16px; }
.summary-list { display: flex; flex-direction: column; gap: 10px; }
.summary-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: #334155; }
.summary-row.total { border-top: 1px solid #e2e8f0; padding-top: 10px; color: #0f172a; }
.side-actions { margin-top: 12px; display: grid; gap: 8px; }
.mobile-summary-card { width: 100%; }
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
.mobile-summary-arrow { color: #64748b; font-size: 14px; }
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
.mobile-item-list { display: grid; gap: 10px; }
.mobile-item-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}
.mobile-item-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.mobile-item-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.mobile-item-total {
  margin-top: 2px;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
}
.mobile-item-total strong { font-size: 15px; }
.mobile-readonly-rows { display: grid; gap: 6px; }
.mobile-readonly-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #334155;
}
.mobile-readonly-row span { color: #64748b; }
.mobile-readonly-row strong { color: #0f172a; text-align: right; }
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
.mobile-footer-actions :deep(.sale-cta-btn.n-button--disabled .n-button__content) {
  color: #6b7280 !important;
}

.payment-box {
  margin-top: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
}
.payment-title { margin: 0 0 6px; font-weight: 700; color: #0f172a; }
.payment-box p { margin: 3px 0; color: #334155; }

.item-total { color: #0f172a; font-size: 14px; }
.remove-item-btn { font-size: 14px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.modal-head { display: flex; flex-direction: column; gap: 4px; }
.modal-title { margin: 0; font-size: 24px; line-height: 1.2; color: #0f172a; font-weight: 700; }
.modal-subtitle { margin: 0; font-size: 13px; color: #64748b; }
.sections { display: flex; flex-direction: column; gap: 12px; }
.form-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}
.checkout-summary-card {
  padding: 2px 0 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.checkout-summary-title { margin: 0 0 6px; font-weight: 700; color: #0f172a; }
.checkout-summary-card p { margin: 3px 0; color: #334155; }
.checkout-summary-card span { color: #64748b; }
.checkout-amount-due strong { color: #0f172a; font-size: 16px; font-weight: 800; }
.checkout-hint { margin: 8px 0 0; color: #64748b; font-size: 12px; }

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
.mobile-footer-total { color: #0f172a; }
.mobile-footer-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.mobile-footer--info { display: flex; align-items: center; justify-content: center; }
.undo-payment-btn { color: #b91c1c; }

:deep(.status-chip.badge-soft-warning.n-tag) { color: #9a6700; background: #fff7e6; border: 1px solid #fdecc8; }
:deep(.status-chip.badge-soft-success.n-tag) { color: #166534; background: #ecfdf3; border: 1px solid #d1fae5; }
:deep(.status-chip.badge-soft-danger.n-tag) { color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; }
:deep(.status-chip.badge-soft-neutral.n-tag) { color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; }

@media (max-width: 1100px) {
  .content-grid { grid-template-columns: 1fr; }
  .sticky-summary { position: static; }
}

@media (max-width: 768px) {
  .sale-page { gap: 12px; }
  .form-grid { grid-template-columns: 1fr; }
  .section-head { flex-direction: column; align-items: stretch; }
  .add-item-btn { width: 100%; min-height: 40px; }
  .mobile-item-grid { grid-template-columns: 1fr; }
  .mobile-summary-card .summary-row-discount {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  .mobile-summary-card .summary-row-discount > span {
    white-space: normal;
    word-break: keep-all;
  }
  :deep(.n-input), :deep(.n-input-number), :deep(.n-base-selection) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }
  :deep(.n-form-item), :deep(.n-form-item-feedback-wrapper) {
    width: 100%;
    max-width: 100%;
  }
  .mobile-footer { padding-bottom: calc(10px + env(safe-area-inset-bottom)); }
  .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .modal-actions :deep(.n-button) { width: 100%; }
  .form-section { padding: 10px; }
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
