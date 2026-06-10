import type { ProductSummary } from '@/types/product';

/**
 * @description API Module DNA for MAWA.
 * Responsible for raw Nuxt 4 app data fetching only.
 * Stateless by design.
 */
export const ProductModule = {
  /**
   * Fetches products for a category.
   *
   * @param categoryId - The category identifier.
   */
  async getByCategory(categoryId: string): Promise<ProductSummary[]> {
    return await $fetch<ProductSummary[]>('/api/products', {
      method: 'GET',
      query: {
        category_id: categoryId,
      },
    });
  },

  /**
   * Creates a new product.
   *
   * @param payload - Partial product payload.
   */
  async create(payload: Partial<ProductSummary>): Promise<ProductSummary> {
    return await $fetch<ProductSummary>('/api/products', {
      method: 'POST',
      body: payload,
    });
  },
};
