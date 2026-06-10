<script setup lang="ts">
/**
 * @name Page DNA
 * @description
 *  Standard page showing store-first SSR, DareDash layout composition,
 *  and the five required UX states.
 */

import { useProductStore } from '@/stores/product';

useHead({
  title: 'Products | MAWA',
  meta: [{ name: 'description', content: 'Browse our products.' }],
});

definePageMeta({
  layout: 'default',
});

const productStore = useProductStore();
const route = useRoute();

const { data, status, refresh } = await useAsyncData(
  'products-list',
  () => productStore.fetchByCategory(route.params.categoryId as string),
  {
    lazy: true,
    watch: [() => route.params.categoryId],
  },
);

const isLoading = computed(() => status.value === 'pending');
const isError = computed(() => status.value === 'error');
const isEmpty = computed(
  () => !isLoading.value && !isError.value && (!data.value || data.value.length === 0),
);
const isIdeal = computed(
  () => !isLoading.value && !isError.value && Boolean(data.value?.length),
);
</script>

<template lang="pug">
dd-layout(tag="main")
  dd-stack(spaced class="page-shell")
    dd-cluster(tag="header" between)
      h1 Products
      dd-button(outline to="/categories") Browse categories

    dd-loading(v-if="isLoading" label="Loading products")

    dd-center(v-else-if="isError" intrinsic)
      dd-stack(compact)
        dd-alert(
          danger
          title="Failed to load products"
          :closable="false"
          icon
        ) We could not load the current category.
        dd-button(primary @click="refresh") Retry

    dd-center(v-else-if="isEmpty" intrinsic)
      dd-stack(compact)
        dd-alert(
          info
          title="No products found"
          :closable="false"
          icon
        ) Try another category or adjust the filters.
        dd-button(outline to="/categories") Explore categories

    template(v-else-if="isIdeal")
      dd-grid(class="products-grid")
        dd-card(v-for="product in data" :key="product.id")
          dd-stack(compact)
            nuxt-img(
              :src="product.image"
              :alt="product.name"
              width="320"
              height="220"
            )
            h3 {{ product.name }}
            p {{ product.price }}
            dd-button(primary) View details

      dd-cluster(v-if="data.length > 20" center)
        dd-button(outline) Load more
</template>

<style>
.page-shell {
  --dd-layout-gap: 1.5rem;
}

.products-grid {
  --dd-grid-gap: 1.5rem;
  --dd-grid-column-min-width: 18rem;
}
</style>
