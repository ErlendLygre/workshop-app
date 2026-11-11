import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development, forward API calls to the .NET backend on port 8080.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
