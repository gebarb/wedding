// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      charset: "utf-8",
      link: [
        { rel: "preconnect", href: "https://ebarb-wedding.s3.us-east-2.amazonaws.com" }
      ],
      viewport: "width=device-width, initial-scale=1",
    },
    layoutTransition: { name: "layout", mode: "out-in" },
    pageTransition: { name: "page", mode: "out-in" },
  },
  build: {
    transpile: [
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/vue-fontawesome",
    ],
  },
  compatibilityDate: "2024-04-03",
  css: [
    "~/assets/css/main.css",
    "@fortawesome/fontawesome-svg-core/styles.css",
  ],
  devtools: { enabled: true },
  modules: ["@nuxt/image"],
  image: {
    // Use IPX as the provider
    provider: "ipx",
    // Configure responsive image breakpoints
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    // Allow images from your S3 domain
    domains: [
      "ebarb-wedding.s3.us-east-2.amazonaws.com"
    ],
    // Default format and quality
    format: ["webp"],
    quality: 80,
    // IPX configuration
    ipx: {
      maxAge: 60 * 60 * 24 * 365, // 1 year
    }
  }
});
