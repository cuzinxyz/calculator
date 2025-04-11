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
          href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
        }
      ]
    },
    baseURL: '/calculator/'
  },

  compatibilityDate: '2025-04-10',

  ssr: false,

  target: 'static'
})
