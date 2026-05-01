<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Atendimento</p>
        <h1>Consultório Clínico</h1>
      </div>
      <n-button type="primary" size="large" @click="openCreate">
        <template #icon>
          <span style="font-size: 1.2em">➕</span>
        </template>
        Registrar Consulta
      </n-button>
    </div>

    <!-- Filtros -->
    <n-card :bordered="false" size="small" style="margin-bottom: 16px">
      <n-form inline :show-feedback="false">
        <n-form-item label="Veterinário Responsável">
          <n-select
            v-model:value="filters.veterinarianId"
            :options="veterinarianOptions"
            placeholder="Todos"
            clearable
            style="width: 250px"
            @update:value="handleFilter"
          />
        </n-form-item>
        <n-form-item>
          <n-button @click="handleFilter" type="info" secondary
            >Filtrar</n-button
          >
        </n-form-item>
      </n-form>
    </n-card>

    <div v-if="isMobile" class="card-list">
      <div v-for="row in consultations" :key="row.id" class="entity-card" @click="openEdit(row)">
        <p class="card-title">{{ clientNameMap[row.clientId] || 'Cliente' }} / {{ petNameMap[row.petId] || 'Pet' }}</p>
        <p class="card-subtitle">{{ format(new Date(row.visitDate), "dd/MM/yyyy HH:mm") }}</p>
        <p class="card-subtitle">{{ usersMap[row.veterinarianId] || '-' }}</p>
        <div class="card-actions">
          <n-button size="small" type="primary" secondary @click.stop="navigateTo({ path: '/atendimento/internacao', query: { action: 'admit', consultationId: String(row.id), petId: String(row.petId) } })">Internar</n-button>
          <n-button size="small" tertiary @click.stop="navigateTo({ path: '/atendimento/internacao', query: { action: 'prescription', consultationId: String(row.id), petId: String(row.petId) } })">Prescrição</n-button>
        </div>
      </div>
    </div>

    <div v-else class="table-mobile-wrapper">
      <n-data-table
        :loading="loading"
        :columns="columns"
        :data="consultations"
        :pagination="pagination"
        :bordered="false"
        :row-props="rowProps"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        remote
      />
    </div>

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      style="width: min(980px, 96vw); max-height: 94vh; overflow-y: auto"
    >
      <template #header>
        <p class="eyebrow" style="margin: 0">
          {{ editingConsultation ? "Anamnese Assistida" : "Novo Atendimento" }}
        </p>
      </template>
      <ConsultationForm
        :value="editingConsultation"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="closeModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { NButton, NSpace, useMessage, useDialog } from "naive-ui";
import ConsultationForm, {
  type ConsultationPayload,
} from "~/components/consultations/ConsultationForm.vue";
import { format } from "date-fns";

const message = useMessage();
const dialog = useDialog();

const consultations = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const editingConsultation = ref<ConsultationPayload | null>(null);
const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;
const updateIsMobile = () => { isMobile.value = mediaQuery?.matches ?? false; };

const usersMap = ref<Record<number, string>>({});
const clientNameMap = ref<Record<number, string>>({});
const petNameMap = ref<Record<number, string>>({});

const filters = reactive({
  veterinarianId: null,
});

const veterinarianOptions = ref<{ label: string; value: number }[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
});

const columns = [
  {
    title: "Data da Visita",
    key: "visitDate",
    width: 150,
    render: (row: any) => format(new Date(row.visitDate), "dd/MM/yyyy HH:mm"),
  },
  {
    title: "Cliente / Pet",
    key: "clientPet",
    render: (row: any) => {
      const cName = clientNameMap.value[row.clientId] || "Carregando...";
      const pName = petNameMap.value[row.petId] || "Carregando...";
      return h("div", [
        h("div", { style: "font-weight: 500" }, cName),
        h("div", { style: "font-size: 12px; color: #6b7280" }, `Pet: ${pName}`),
      ]);
    },
  },
  {
    title: "M.V. Responsável",
    key: "veterinarian",
    render: (row: any) => h("span", usersMap.value[row.veterinarianId] || "-"),
  },
  {
    title: "Diagnóstico",
    key: "diagnosis",
    render: (row: any) =>
      h(
        "span",
        { style: "font-style: italic" },
        row.diagnosis
          ? row.diagnosis.length > 50
            ? row.diagnosis.substring(0, 50) + "..."
            : row.diagnosis
          : "Pendente",
      ),
  },
  {
    title: "Ações",
    key: "actions",
    width: 260,
    render: (row: any) =>
      h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: "small",
                type: "primary",
                secondary: true,
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  navigateTo({
                    path: "/atendimento/internacao",
                    query: {
                      action: "admit",
                      consultationId: String(row.id),
                      petId: String(row.petId),
                    },
                  });
                },
              },
              { default: () => "Internar" },
            ),
            h(
              NButton,
              {
                size: "small",
                tertiary: true,
                onClick: (event: MouseEvent) => {
                  event.stopPropagation();
                  navigateTo({
                    path: "/atendimento/internacao",
                    query: {
                      action: "prescription",
                      consultationId: String(row.id),
                      petId: String(row.petId),
                    },
                  });
                },
              },
              { default: () => "Prescrição" },
            ),
          ],
        },
      ),
  },
];

const loadLookups = async () => {
  const api = useApi();
  try {
    const [usersRes, clientsRes, petsRes] = await Promise.all([
      api<any>("/api/v1/users?limit=100"),
      api<any>("/api/v1/clients?limit=500"),
      api<any>("/api/v1/pets?limit=1000"),
    ]);

    usersRes.data.forEach((u: any) => {
      usersMap.value[u.id] = u.name;
    });
    clientsRes.data.forEach((c: any) => {
      clientNameMap.value[c.id] = c.name;
    });
    petsRes.data.forEach((p: any) => {
      petNameMap.value[p.id] = p.name;
    });

    veterinarianOptions.value = usersRes.data.map((u: any) => ({
      label: u.name,
      value: Number(u.id),
    }));
  } catch (err) {
    console.error("Failed to load lookups for consultations", err);
  }
};

const fetchConsultations = async () => {
  loading.value = true;
  try {
    const queryParams: any = {
      page: pagination.page,
      limit: pagination.pageSize,
    };
    if (filters.veterinarianId)
      queryParams.veterinarianId = filters.veterinarianId;

    const api = useApi();
    const res = await api<any>("/api/v1/consultations", {
      query: queryParams,
    });
    consultations.value = res.data;
    pagination.itemCount = res.meta.total;
  } catch (err) {
    message.error("Erro ao buscar consultas");
  } finally {
    loading.value = false;
  }
};

const handleFilter = () => {
  pagination.page = 1;
  fetchConsultations();
};

const handlePageChange = (p: number) => {
  pagination.page = p;
  fetchConsultations();
};

const handlePageSizeChange = (s: number) => {
  pagination.pageSize = s;
  pagination.page = 1;
  fetchConsultations();
};

const handleSubmit = async (payload: ConsultationPayload) => {
  saving.value = true;
  const api = useApi();
  try {
    if (payload.id) {
      const updated = await api<any>(`/api/v1/consultations/${payload.id}`, {
        method: "PATCH",
        body: payload,
      });
      editingConsultation.value = updated;
      message.success("Consulta atualizada com sucesso");
      closeModal();
    } else {
      const created = await api<any>("/api/v1/consultations", {
        method: "POST",
        body: payload,
      });
      editingConsultation.value = created;
      showModal.value = true;
      message.success(
        "Consulta registrada com sucesso. A anamnese assistida foi habilitada.",
      );
    }
    await fetchConsultations();
  } catch (err: any) {
    message.error(err?.data?.message || "Erro ao salvar consulta");
  } finally {
    saving.value = false;
  }
};

const openCreate = () => {
  editingConsultation.value = null;
  showModal.value = true;
};

const openEdit = (consultation: any) => {
  editingConsultation.value = consultation;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const rowProps = (row: any) => ({
  style: { cursor: "pointer" },
  onClick: () => openEdit(row),
});

onMounted(async () => {
  mediaQuery = window.matchMedia('(max-width: 768px)');
  updateIsMobile();
  mediaQuery.addEventListener('change', updateIsMobile);
  await loadLookups();
  fetchConsultations();
});
onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateIsMobile);
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
  align-items: center;
}
.eyebrow {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0;
}
h1 {
  margin: 4px 0 0;
  font-size: 24px;
}

@media (max-width: 768px) {
  .card-list { display: flex; flex-direction: column; gap: 12px; }
  .entity-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fff; }
  .card-title { margin: 0; font-size: 16px; font-weight: 700; }
  .card-subtitle { margin: 4px 0 0; font-size: 12px; color: #64748b; }
  .card-actions { margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px; }
}
</style>
