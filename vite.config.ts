import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.PARTYKIT_HOST': JSON.stringify(
      process.env.PARTYKIT_HOST ?? 'localhost:1999'
    ),
  },
})
