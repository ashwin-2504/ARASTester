import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./renderer"),
      "lucide-react": path.resolve(__dirname, "./renderer/lib/lucide-react.tsx"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'zustand', 'lucide-react'],
          'dnd': ['@hello-pangea/dnd'],
        }
      }
    }
  }
})
