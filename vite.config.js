import { defineConfig } from 'vite'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwind()],
  base: process.env.VITE_BASE_PATH || '/',
})
