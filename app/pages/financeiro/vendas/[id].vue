<template>
  <SaleEditorPage :sale-id="saleId" />
</template>

<script setup lang="ts">
import SaleEditorPage from '~/components/sales/SaleEditorPage.vue';

const route = useRoute();
const saleId = computed(() => Number(route.params.id));
</script>
