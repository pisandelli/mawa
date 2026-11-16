export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@vueuse/nuxt', '@pinia/nuxt', '@pisandelli/daredash'],
  typescript: { strict: true },
  pinia: { storesDirs: ['./app/stores/**'] },
})
