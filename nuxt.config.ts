export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
  ],

  supabase: {
    redirect: false
  },

  css: [
    '@/assets/css/main.css'
  ],

  app: {
    head: {
      title: 'EzSplit',
      link: [
        { 
          rel: 'stylesheet', 
          href: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap'
        }
      ]
    },
    baseURL: '/calculator/'
  },

  // Thêm cấu hình typescript
  typescript: {
    strict: true,
    shim: false
  },

  // Thêm cấu hình vite
  vite: {
    server: {
      fs: {
        strict: false
      }
    }
  },

  compatibilityDate: '2025-04-10',

  ssr: false,

  target: 'static'
})
