// @vitest-environment nuxt
// Requires @nuxt/test-utils + Vitest 3 + vitest.config (nuxt env), per resources/templates/vitest.config.template.ts.
// The nuxt environment provides Nuxt auto-imports (ref, computed, acceptHMRUpdate) and the `@/` alias.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProductStore } from './store-dna';

const mockGetByCategory = vi.fn();

vi.mock('@/api/ProductModule', () => ({
  ProductModule: {
    getByCategory: (id: string) => mockGetByCategory(id),
  },
}));

describe('MAWA Store DNA: ProductStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('exposes the expected initial state', () => {
    const store = useProductStore();

    expect(store.data).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(null);
  });

  it('handles the success path', async () => {
    const store = useProductStore();
    const mockData = [{ id: '1', name: 'Widget' }];

    mockGetByCategory.mockResolvedValue(mockData);

    const promise = store.fetchByCategory('cat-1');

    expect(store.loading).toBe(true);

    await promise;

    expect(store.data).toEqual(mockData);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(null);
    expect(mockGetByCategory).toHaveBeenCalledWith('cat-1');
  });

  it('handles the error path', async () => {
    const store = useProductStore();
    const mockError = new Error('Network Error');

    mockGetByCategory.mockRejectedValue(mockError);

    await expect(store.fetchByCategory('cat-1')).rejects.toThrow('Network Error');

    expect(store.data).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toEqual(mockError);
  });
});
