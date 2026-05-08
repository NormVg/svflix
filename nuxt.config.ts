// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  modules: [
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    bucket0AccessKeyId: process.env.ACCESS_KEY_ID,
    bucket0SecretAccessKey: process.env.SECRET_ACCESS_KEY,
    bucket0Bucket: process.env.BUCKET0_BUCKET,
    appAuthUsers: process.env.APP_AUTH_USERS,
    appAuthPassword: process.env.APP_AUTH_PASSWORD,
    appAuthSessionSecret: process.env.APP_AUTH_SESSION_SECRET,
  },
})
