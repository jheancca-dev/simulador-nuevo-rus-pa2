import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Configuración de Vitest para el Simulador Académico del Formulario 1611.
 *
 * - tests/logic  -> entorno node (funciones puras: cálculo, validación, flujo).
 * - tests/ui     -> entorno jsdom (pruebas funcionales con Testing Library).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
