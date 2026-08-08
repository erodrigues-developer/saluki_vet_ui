<template>
  <div class="page">
    <div class="page-head">
      <div class="head-copy">
        <p class="eyebrow">CADASTROS</p>
        <h1>Produtos e serviços</h1>
        <p class="subhead">
          Gerencie produtos, serviços, preços, categorias e disponibilidade da
          clínica.
        </p>
      </div>
      <n-button
        v-if="!isMobile && canCreateProducts"
        type="primary"
        size="large"
        class="head-cta"
        @click="openCreate"
        >Novo produto/serviço</n-button
      >
    </div>

    <n-button
      v-if="isMobile && canCreateProducts"
      type="primary"
      size="large"
      block
      class="mobile-head-cta"
      @click="openCreate"
      >Novo produto/serviço</n-button
    >

    <div
      :class="isMobile ? 'summary-grid-mobile summary-grid' : 'summary-grid'"
    >
      <n-card
        v-for="card in summaryCards"
        :key="card.label"
        size="small"
        :bordered="false"
        class="summary-card"
      >
        <template v-if="loadingSummary">
          <n-skeleton text style="width: 70%; margin-bottom: 10px" />
          <n-skeleton text style="width: 36%" />
        </template>
        <template v-else>
          <p class="summary-label">{{ card.label }}</p>
          <strong
            :class="isMobile ? 'summary-value-mobile' : 'summary-value'"
            >{{ card.value }}</strong
          >
        </template>
      </n-card>
    </div>

    <n-card
      v-if="!isMobile"
      :bordered="false"
      size="small"
      class="filters-card"
    >
      <template v-if="loading">
        <div class="filters-skeleton-grid">
          <n-skeleton text :repeat="2" />
          <n-skeleton text :repeat="2" />
          <n-skeleton text :repeat="2" />
          <n-skeleton text :repeat="2" />
          <n-skeleton text :repeat="2" />
          <n-skeleton text :repeat="2" />
        </div>
      </template>
      <div v-else class="filters-grid">
        <n-input
          v-model:value="filters.name"
          placeholder="Buscar por nome"
          clearable
          @keyup.enter="handleFilter"
        />
        <n-input
          v-model:value="filters.sku"
          placeholder="Buscar por SKU"
          clearable
          @keyup.enter="handleFilter"
        />
        <n-select
          v-model:value="filters.categoryId"
          :options="categoryOptions"
          placeholder="Todas as categorias"
          clearable
        />
        <n-select
          v-model:value="filters.type"
          :options="typeOptions"
          placeholder="Tipo"
        />
        <n-select
          v-model:value="filters.status"
          :options="statusOptions"
          placeholder="Status"
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
        <n-input
          v-model:value="mobileSearch"
          placeholder="Buscar por nome ou SKU"
          clearable
          @keyup.enter="applyMobileFilters"
        />
        <n-button
          secondary
          strong
          class="mobile-filter-trigger"
          @click="showMobileFilters = true"
          >Filtros</n-button
        >
      </div>
    </n-card>

    <template v-if="loading">
      <div class="skeleton-layout" v-if="isMobile">
        <n-card
          v-for="i in 3"
          :key="i"
          size="small"
          :bordered="false"
          class="entity-card"
          ><n-skeleton text :repeat="6"
        /></n-card>
      </div>
      <div v-else class="skeleton-layout">
        <n-skeleton text :repeat="10" />
      </div>
    </template>

    <template v-else>
      <div v-if="isMobile" class="card-list">
        <template v-if="items.length">
          <div
            v-for="item in items"
            :key="item.id"
            class="entity-card"
            @click="openEdit(item)"
          >
            <p class="card-title">{{ item.name }}</p>
            <p class="card-subtitle">
              <span class="card-line-label">SKU:</span>
              <span :class="{ 'text-secondary': !item.sku?.trim() }">{{
                formatSku(item.sku)
              }}</span>
            </p>
            <p class="card-subtitle">
              <span class="card-line-label">Categoria:</span>
              {{ formatCategory(item) }}
            </p>
            <p class="card-subtitle">
              <span class="card-line-label">Tipo:</span> {{ typeLabel(item) }}
            </p>
            <p class="card-subtitle">
              <span class="card-line-label">Duração:</span>
              {{ formatDuration(item) }}
            </p>
            <p class="card-subtitle">
              <span class="card-line-label">Preço:</span>
              {{ formatSalePrice(item) }}
            </p>
            <p class="card-subtitle card-status">
              <span class="card-line-label">Status:</span>
              <n-tag
                :bordered="false"
                class="status-chip"
                :style="statusTagStyle(item.isActive)"
                >{{ item.isActive ? "Ativo" : "Inativo" }}</n-tag
              >
            </p>
            <p class="card-subtitle card-subtitle-muted">
              <span class="card-line-label">Atualizado em:</span>
              {{ formatDate(item.updatedAt || "") || "—" }}
            </p>
            <div class="card-actions" @click.stop>
              <n-button
                size="small"
                secondary
                type="primary"
                @click="openEdit(item)"
                >Ver item</n-button
              >
              <n-dropdown
                v-if="buildActionOptions(item).length"
                trigger="click"
                :options="buildActionOptions(item)"
                @select="(key: string) => handleActionSelect(key, item)"
              >
                <n-button size="small" quaternary class="menu-button"
                  ><AppIcon name="ellipsis" :size="16" :stroke-width="2"
                /></n-button>
              </n-dropdown>
            </div>
          </div>
          <div class="pagination">
            <n-pagination
              :page="pagination.page"
              :page-size="pagination.limit"
              :item-count="pagination.total"
              show-size-picker
              :page-sizes="[10, 20, 50]"
              @update:page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </template>
        <n-empty v-else :description="emptyDescription">
          <template #extra>
            <n-button v-if="hasActiveFilters" @click="handleClearFilters"
              >Limpar filtros</n-button
            >
            <n-button v-else-if="canCreateProducts" type="primary" @click="openCreate"
              >Novo produto/serviço</n-button
            >
          </template>
        </n-empty>
      </div>

      <template v-else>
        <template v-if="items.length">
          <n-data-table
            :columns="columns"
            :data="items"
            :pagination="tablePagination"
            :bordered="false"
            :row-props="rowProps"
            remote
            @update:page="onPageChange"
            @update:page-size="onPageSizeChange"
          />
        </template>
        <n-empty v-else :description="emptyDescription">
          <template #extra>
            <n-button v-if="hasActiveFilters" @click="handleClearFilters"
              >Limpar filtros</n-button
            >
            <n-button v-else-if="canCreateProducts" type="primary" @click="openCreate"
              >Novo produto/serviço</n-button
            >
          </template>
        </n-empty>
      </template>
    </template>

    <n-drawer
      v-model:show="showMobileFilters"
      placement="bottom"
      height="45%"
      :trap-focus="false"
    >
      <n-drawer-content title="Filtros">
        <div class="mobile-filters-panel">
          <n-select
            v-model:value="filters.categoryId"
            :options="categoryOptions"
            placeholder="Todas as categorias"
            clearable
          />
          <n-select
            v-model:value="filters.type"
            :options="typeOptions"
            placeholder="Tipo"
          />
          <n-select
            v-model:value="filters.status"
            :options="statusOptions"
            placeholder="Status"
          />
          <div class="mobile-filter-actions">
            <n-button text class="btn-clear" @click="handleClearFilters"
              >Limpar filtros</n-button
            >
            <n-button type="primary" @click="applyMobileFilters"
              >Aplicar filtros</n-button
            >
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      class="product-modal"
      style="width: 760px"
    >
      <template #header>
        <div class="modal-head">
          <h3 class="modal-title">
            {{
              editingItem ? "Editar produto/serviço" : "Novo produto/serviço"
            }}
          </h3>
          <p class="modal-subtitle">
            {{
              editingItem
                ? "Atualize dados, preços e status do item."
                : "Cadastre um novo produto ou serviço para o catálogo da clínica."
            }}
          </p>
        </div>
      </template>
      <ProductForm
        ref="productFormRef"
        :value="editingItem"
        :loading="saving"
        @submit="handleSubmit"
      />
      <template #footer>
        <div class="modal-actions">
          <n-button tertiary :disabled="saving" @click="closeModal"
            >Cancelar</n-button
          >
          <n-button
            v-if="canSaveProduct"
            type="primary"
            :loading="saving"
            @click="submitProductForm"
            >{{
              editingItem ? "Salvar alterações" : "Criar produto/serviço"
            }}</n-button
          >
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { format } from "date-fns";
import { NButton, NDropdown, NTag, useDialog, useMessage } from "naive-ui";
import ProductForm, {
  type Product,
} from "~/components/products/ProductForm.vue";
import { PERMISSIONS } from "~/constants/permissions";
import { useAuthStore } from "~/stores/auth";

interface ProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

const message = useMessage();
const dialog = useDialog();
const authStore = useAuthStore();

const items = ref<Product[]>([]);
const allItems = ref<Product[]>([]);
const categoryOptions = ref<{ label: string; value: number }[]>([]);
const loading = ref(false);
const loadingSummary = ref(false);
const saving = ref(false);
const showModal = ref(false);
const showMobileFilters = ref(false);
const editingItem = ref<Product | null>(null);
const productFormRef = ref<{ submit: () => Promise<void> } | null>(null);

const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;
const updateIsMobile = () => {
  isMobile.value = mediaQuery?.matches ?? false;
};

const filters = reactive({
  name: "",
  sku: "",
  categoryId: null as number | null,
  type: "all" as "all" | "product" | "service",
  status: "all" as "all" | "active" | "inactive",
});

const mobileSearch = ref("");

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

const summary = reactive({
  total: 0,
  activeProducts: 0,
  activeServices: 0,
});

const typeOptions = [
  { label: "Todos", value: "all" },
  { label: "Produto", value: "product" },
  { label: "Serviço", value: "service" },
];

const statusOptions = [
  { label: "Todos", value: "all" },
  { label: "Ativo", value: "active" },
  { label: "Inativo", value: "inactive" },
];

const summaryCards = computed(() => [
  { label: "ITENS CADASTRADOS", value: summary.total },
  { label: "PRODUTOS ATIVOS", value: summary.activeProducts },
  { label: "SERVIÇOS ATIVOS", value: summary.activeServices },
]);

const tablePagination = computed(() => ({
  page: pagination.page,
  pageSize: pagination.limit,
  itemCount: pagination.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
}));

const hasActiveFilters = computed(() =>
  Boolean(
    filters.name ||
    filters.sku ||
    filters.categoryId ||
    filters.type !== "all" ||
    filters.status !== "all",
  ),
);

const emptyDescription = computed(() =>
  hasActiveFilters.value
    ? "Nenhum item encontrado com os filtros aplicados."
    : "Nenhum produto ou serviço encontrado.",
);
const canCreateProducts = computed(() => authStore.hasPermission(PERMISSIONS.productsCreate));
const canUpdateProducts = computed(() => authStore.hasPermission(PERMISSIONS.productsUpdate));
const canDeleteProducts = computed(() => authStore.hasPermission(PERMISSIONS.productsDelete));
const canSaveProduct = computed(() => editingItem.value ? canUpdateProducts.value : canCreateProducts.value);

const formatDate = (value: string) =>
  value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "";

const formatBRL = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0),
  );

const formatSku = (value?: string | null) => value?.trim() || "Sem SKU";

const formatCategory = (item: Product) =>
  item.productCategory?.name || "Sem categoria";
const formatDuration = (item: Product) => {
  if (!item.isService) return "Não aplicável";
  const duration = Number(item.durationMinutes ?? 0);
  return duration > 0 ? `${duration} min` : "—";
};

const formatSalePrice = (item: Product) => {
  const formatted = formatBRL(Number(item.salePrice || 0));
  return item.saleMode === "WEIGHT" ? `${formatted}/kg` : formatted;
};

const typeLabel = (item: Product) => {
  if (item.isService) return "Serviço";
  return item.saleMode === "WEIGHT" ? "Produto no peso" : "Produto";
};

const typeTagClass = (item: Product) =>
  item.isService ? "type-service" : "type-product";
const statusTagStyle = (isActive: boolean) =>
  isActive
    ? "--n-color: #edf7ef; --n-text-color: #28663b; --n-border: 1px solid #d5eadb;"
    : "--n-color: #f3f4f6; --n-text-color: #374151; --n-border: 1px solid #e5e7eb;";

const columns = [
  {
    title: "Item",
    key: "name",
    render: (row: Product) => h("p", { class: "item-name" }, row.name),
  },
  {
    title: "SKU",
    key: "sku",
    render: (row: Product) =>
      h(
        "span",
        { class: row.sku?.trim() ? "" : "text-secondary" },
        formatSku(row.sku),
      ),
  },
  {
    title: "Categoria",
    key: "category",
    render: (row: Product) => formatCategory(row),
  },
  {
    title: "Tipo",
    key: "isService",
    render: (row: Product) =>
      h(
        NTag,
        { bordered: false, class: ["type-chip", typeTagClass(row)] },
        { default: () => typeLabel(row) },
      ),
  },
  {
    title: "Duração",
    key: "durationMinutes",
    render: (row: Product) => formatDuration(row),
  },
  {
    title: "Preço de venda",
    key: "salePrice",
    render: (row: Product) => formatSalePrice(row),
  },
  {
    title: "Status",
    key: "isActive",
    render: (row: Product) =>
      h(
        NTag,
        {
          bordered: false,
          class: "status-chip",
          style: statusTagStyle(row.isActive),
        },
        { default: () => (row.isActive ? "Ativo" : "Inativo") },
      ),
  },
  {
    title: "Atualizado em",
    key: "updatedAt",
    render: (row: Product) => formatDate(String(row.updatedAt || "")) || "—",
  },
  {
    title: "Ações",
    key: "actions",
    render: (row: Product) =>
      h("div", { class: "table-actions" }, [
        h(
          NButton,
          {
            size: "small",
            secondary: true,
            type: "primary",
            onClick: (e) => {
              e.stopPropagation();
              openEdit(row);
            },
          },
          { default: () => "Ver item" },
        ),
        h(
          NDropdown,
          {
            trigger: "click",
            options: buildActionOptions(row),
            style: buildActionOptions(row).length ? undefined : "display: none",
            onSelect: (key: string) => handleActionSelect(key, row),
          },
          {
            default: () =>
              h(
                NButton,
                {
                  size: "small",
                  quaternary: true,
                  class: "menu-button",
                  onClick: (e) => e.stopPropagation(),
                },
                { default: () => "⋯" },
              ),
          },
        ),
      ]),
  },
];

const buildActionOptions = (item: Product) => {
  const options: Array<{ label?: string; key: string; type?: "divider" }> = [];
  if (canUpdateProducts.value) {
    options.push({ label: "Editar", key: "edit" });
    options.push({ label: item.isActive ? "Inativar" : "Ativar", key: "toggleStatus" });
  }
  if (canDeleteProducts.value) {
    if (options.length) options.push({ type: "divider", key: `divider-${item.id}` });
    options.push({ label: "Excluir", key: "delete" });
  }
  return options;
};

const handleActionSelect = (key: string, item: Product) => {
  if (key === "edit") return openEdit(item);
  if (key === "toggleStatus")
    return item.isActive ? confirmDeactivate(item) : confirmReactivate(item);
  if (key === "delete") return confirmDelete(item);
};

const applyClientSideFilters = (list: Product[]) => list;

const fetchCategories = async () => {
  try {
    const api = useApi();
    const res = await api<any>("/api/v1/product-categories?limit=100");
    categoryOptions.value = [
      { label: "Todas as categorias", value: -1 },
      ...(res.data || []).map((c: any) => ({
        label: c.name,
        value: Number(c.id),
      })),
    ];
  } catch {
    categoryOptions.value = [{ label: "Todas as categorias", value: -1 }];
  }
};

const fetchSummary = async () => {
  loadingSummary.value = true;
  try {
    const api = useApi();
    const res = await api<ProductsResponse>("/api/v1/products", {
      query: {
        page: 1,
        limit: 500,
        name: filters.name || undefined,
        sku: filters.sku || undefined,
        productCategoryId: filters.categoryId || undefined,
        isService:
          filters.type === "all" ? undefined : filters.type === "service",
        isActive:
          filters.status === "all" ? undefined : filters.status === "active",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
    });
    allItems.value = applyClientSideFilters(res.data || []);
    summary.total = allItems.value.length;
    summary.activeProducts = allItems.value.filter(
      (item) => !item.isService && item.isActive,
    ).length;
    summary.activeServices = allItems.value.filter(
      (item) => item.isService && item.isActive,
    ).length;
  } catch {
    summary.total = 0;
    summary.activeProducts = 0;
    summary.activeServices = 0;
  } finally {
    loadingSummary.value = false;
  }
};

const fetchItems = async () => {
  loading.value = true;
  try {
    const api = useApi();
    const res = await api<ProductsResponse>("/api/v1/products", {
      query: {
        page: pagination.page,
        limit: pagination.limit,
        name: filters.name || undefined,
        sku: filters.sku || undefined,
        productCategoryId: filters.categoryId || undefined,
        isService:
          filters.type === "all" ? undefined : filters.type === "service",
        isActive:
          filters.status === "all" ? undefined : filters.status === "active",
        sortBy: "updatedAt",
        sortDirection: "desc",
      },
    });

    const filtered = applyClientSideFilters(res.data || []);
    items.value = filtered;
    pagination.total = Number(res.meta.total || 0);

    await fetchSummary();
  } catch (err: any) {
    message.error(err?.data?.message || "Erro ao buscar produtos e serviços");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async (payload: Product) => {
  if ((payload.id && !canUpdateProducts.value) || (!payload.id && !canCreateProducts.value)) return;
  saving.value = true;
  const api = useApi();

  try {
    const { id, ...body } = payload;

    if (id) {
      await api(`/api/v1/products/${id}`, {
        method: "PATCH",
        body,
      });
      message.success("Item atualizado");
    } else {
      await api("/api/v1/products", {
        method: "POST",
        body,
      });
      message.success("Item criado");
    }

    closeModal();
    await fetchItems();
  } catch (err: any) {
    const apiMessage = Array.isArray(err?.data?.message)
      ? err.data.message.join(", ")
      : err?.data?.message;

    message.error(apiMessage || "Erro ao salvar item");
  } finally {
    saving.value = false;
  }
};

const submitProductForm = async () => {
  if (!canSaveProduct.value) return;
  await productFormRef.value?.submit();
};

const confirmDeactivate = (item: Product) => {
  if (!canUpdateProducts.value) return;
  if (!item.id) return;

  dialog.warning({
    title: "Confirmar inativação",
    content: `Deseja inativar o item ${item.name}?`,
    positiveText: "Inativar",
    negativeText: "Cancelar",
    onPositiveClick: async () => {
      const api = useApi();
      try {
        await api(`/api/v1/products/${item.id}`, {
          method: "PATCH",
          body: { isActive: false },
        });
        message.success("Item inativado");
        await fetchItems();
      } catch (err: any) {
        message.error(err?.data?.message || "Erro ao inativar item");
      }
    },
  });
};

const confirmReactivate = (item: Product) => {
  if (!canUpdateProducts.value) return;
  if (!item.id) return;

  dialog.success({
    title: "Confirmar ativação",
    content: `Deseja ativar o item ${item.name}?`,
    positiveText: "Ativar",
    negativeText: "Cancelar",
    onPositiveClick: async () => {
      const api = useApi();
      try {
        await api(`/api/v1/products/${item.id}`, {
          method: "PATCH",
          body: { isActive: true },
        });
        message.success("Item ativado");
        await fetchItems();
      } catch (err: any) {
        message.error(err?.data?.message || "Erro ao ativar item");
      }
    },
  });
};

const confirmDelete = (item: Product) => {
  if (!canDeleteProducts.value) return;
  if (!item.id) return;

  dialog.warning({
    title: "Confirmar exclusão",
    content: `Deseja excluir o item ${item.name}?`,
    positiveText: "Excluir",
    negativeText: "Cancelar",
    onPositiveClick: async () => {
      const api = useApi();
      try {
        await api(`/api/v1/products/${item.id}`, { method: "DELETE" });
        message.success("Item excluído");
        await fetchItems();
      } catch (err: any) {
        message.error(err?.data?.message || "Não foi possível excluir o item.");
      }
    },
  });
};

const openCreate = () => {
  if (!canCreateProducts.value) return;
  editingItem.value = null;
  showModal.value = true;
};

const openEdit = (item: Product) => {
  editingItem.value = item;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const onPageChange = (page: number) => {
  pagination.page = page;
  fetchItems();
};

const onPageSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  fetchItems();
};

const handleFilter = () => {
  pagination.page = 1;
  fetchItems();
};

const handleClearFilters = () => {
  filters.name = "";
  filters.sku = "";
  filters.categoryId = null;
  filters.type = "all";
  filters.status = "all";
  mobileSearch.value = "";
  pagination.page = 1;
  showMobileFilters.value = false;
  fetchItems();
};

const applyMobileFilters = () => {
  const search = (mobileSearch.value || "").trim();
  filters.name = search;
  filters.sku = "";
  pagination.page = 1;
  showMobileFilters.value = false;
  fetchItems();
};

const rowProps = (row: Product) => ({
  style: { cursor: "pointer" },
  onClick: () => openEdit(row),
});

onMounted(async () => {
  mediaQuery = window.matchMedia("(max-width: 768px)");
  updateIsMobile();
  mediaQuery.addEventListener("change", updateIsMobile);
  await Promise.all([fetchCategories(), fetchItems()]);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", updateIsMobile);
});
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
  gap: 12px;
}
.head-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.1;
}
.subhead {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}
.mobile-head-cta {
  margin-top: -4px;
}

.summary-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.summary-grid-mobile {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  min-height: 112px;
}
.summary-card :deep(.n-card__content) {
  padding: 14px 16px !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.summary-label {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  font-weight: 500;
}
.summary-value {
  display: block;
  margin-top: 10px;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}
.summary-value-mobile {
  display: block;
  margin-top: 8px;
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
}

.filters-card {
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.filters-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 12px;
  align-items: center;
}
.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.filters-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.btn-clear {
  color: #6b7280;
  font-weight: 500;
}
.btn-filter {
  width: 112px;
}
:deep(.btn-filter.n-button) {
  border: 1px solid #334155;
  color: #1e293b;
}

.skeleton-layout {
  display: grid;
  gap: 10px;
}

:deep(.n-data-table) {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
:deep(.n-data-table-th) {
  font-weight: 600;
  color: #374151;
}
:deep(.n-data-table-tr:hover td) {
  background: #f8fafc;
}
:deep(.n-data-table-td) {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  line-height: 1.15;
}
:deep(.n-data-table-th),
:deep(.n-data-table-td) {
  white-space: nowrap;
  word-break: normal;
}

.item-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item-name {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
}
.text-secondary {
  color: #94a3b8;
  font-weight: 400;
}
.stock-ok {
  color: #28663b;
}
.stock-warning {
  color: #a16207;
}
.stock-danger {
  color: #b91c1c;
  font-weight: 600;
}

.type-chip,
.status-chip {
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  line-height: 1.15;
  border: 1px solid transparent;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
}
:deep(.type-product) {
  background: #f3e8ff !important;
  color: #7e22ce !important;
  border-color: #d8b4fe !important;
}
:deep(.type-service) {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border-color: #bfdbfe !important;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.entity-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}
.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}
.card-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #334155;
}
.card-subtitle-muted {
  color: #64748b;
}
.card-line-label {
  color: #64748b;
  font-weight: 500;
}
.card-status {
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-actions {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.pagination {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.mobile-filter-top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.mobile-filters-panel {
  display: grid;
  gap: 10px;
}
.mobile-filter-actions {
  margin-top: 2px;
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
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .page-head {
    gap: 10px;
  }
  h1 {
    font-size: 19px;
  }
  .subhead {
    font-size: 13px;
  }
  .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>

<style>
:root .n-modal-container:has(.product-modal) .n-modal-body-wrapper {
  overflow: hidden !important;
}

:root
  .n-modal-container:has(.product-modal)
  .n-modal-body-wrapper
  > .n-scrollbar,
:root
  .n-modal-container:has(.product-modal)
  .n-modal-body-wrapper
  > .n-scrollbar
  > .n-scrollbar-container,
:root
  .n-modal-container:has(.product-modal)
  .n-modal-body-wrapper
  > .n-scrollbar
  > .n-scrollbar-container
  > .n-scrollbar-content {
  max-height: 100vh !important;
  max-height: 100dvh !important;
  overflow: hidden !important;
}

.product-modal.n-card {
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

.product-modal.n-card .n-card-header {
  flex: 0 0 auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px 12px;
  z-index: 4;
}

.product-modal.n-card .n-card__content {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 20px;
  scroll-padding-bottom: 88px;
}

.product-modal.n-card .n-card__footer {
  flex: 0 0 auto;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -6px 14px rgba(15, 23, 42, 0.05);
  padding: 10px 16px;
  z-index: 4;
}

.product-modal .modal-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-modal .modal-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 700;
}

.product-modal .modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.product-modal .modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .product-modal.n-card {
    width: 100% !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 48px) !important;
    max-height: calc(100dvh - 48px) !important;
  }

  .product-modal.n-card .n-card-header {
    padding: 14px 14px 10px;
  }

  .product-modal.n-card .n-card__content {
    padding: 10px 12px 16px;
    scroll-padding-bottom: 96px;
    -webkit-overflow-scrolling: touch;
  }

  .product-modal.n-card .n-card__footer {
    padding: 8px 12px;
  }

  .product-modal .modal-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .product-modal .modal-actions .n-button {
    min-height: 44px;
    width: 100%;
  }
}
</style>
