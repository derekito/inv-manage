/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    
    // Shopify environment variables
    SHOPIFY_STORE_ONE_URL: process.env.SHOPIFY_STORE_ONE_URL,
    SHOPIFY_STORE_ONE_API_KEY: process.env.SHOPIFY_STORE_ONE_API_KEY,
    SHOPIFY_STORE_ONE_API_SECRET: process.env.SHOPIFY_STORE_ONE_API_SECRET,
    SHOPIFY_STORE_TWO_URL: process.env.SHOPIFY_STORE_TWO_URL,
    SHOPIFY_STORE_TWO_API_KEY: process.env.SHOPIFY_STORE_TWO_API_KEY,
    SHOPIFY_STORE_TWO_API_SECRET: process.env.SHOPIFY_STORE_TWO_API_SECRET,
    SHOPIFY_STORE_ONE_ACCESS_TOKEN: process.env.SHOPIFY_STORE_ONE_ACCESS_TOKEN,
    SHOPIFY_STORE_ONE_LOCATION_ID: process.env.SHOPIFY_STORE_ONE_LOCATION_ID,
    
    // Public variables (available in browser)
    NEXT_PUBLIC_SHOPIFY_STORE_ONE_URL: process.env.NEXT_PUBLIC_SHOPIFY_STORE_ONE_URL,
    NEXT_PUBLIC_SHOPIFY_STORE_TWO_URL: process.env.NEXT_PUBLIC_SHOPIFY_STORE_TWO_URL,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig