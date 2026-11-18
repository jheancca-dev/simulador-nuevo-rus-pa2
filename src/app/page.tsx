import { ShieldAlert } from 'lucide-react'
import { SimuladorRus } from '@/components/rus/simulador-rus'

/**
 * Página única del simulador. La lógica vive en <SimuladorRus /> (cliente);
 * el encabezado, la advertencia académica y el pie son estáticos y visibles
 * en todas las etapas.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      {/* Encabezado institucional */}
      <header className="no-print bg-[#123a5f] text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-100/90 sm:text-xs">
            Simulador académico · Proyecto universitario
          </p>
          <h1 className="mt-1 text-lg font-bold leading-tight sm:text-2xl">
            Formulario Virtual N.º 1611 — Nuevo RUS
          </h1>
          <p className="mt-1 text-xs text-sky-100/85 sm:text-sm">
            Declaración mensual del Régimen Especial de Renta (RUS) · Curso: Pruebas y Calidad de
            Software
          </p>
        </div>
      </header>

      {/* Advertencia visible en todas las pantallas */}
      <div
        role="alert"
        className="no-print border-b border-amber-300 bg-amber-50 text-amber-900"
      >
        <div className="mx-auto flex w-full max-w-5xl items-start gap-2.5 px-4 py-3 sm:px-6">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-xs font-medium sm:text-sm">
            SIMULADOR ACADÉMICO — No es una aplicación oficial de SUNAT. No realiza declaraciones
            ni pagos reales.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <SimuladorRus />
      </main>

      {/* Pie fijo al fondo (no flota sobre el contenido gracias a mt-auto) */}
      <footer className="no-print mt-auto border-t border-slate-300 bg-slate-200 text-slate-700">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-4 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-xs">
          <p className="font-medium">
            Simulador Académico del Formulario Virtual N.º 1611 — Nuevo RUS
          </p>
          <p>
            Simulación educativa sin conexión a SUNAT, bancos, Yape ni pasarelas de pago. No
            almacena información personal real.
          </p>
        </div>
      </footer>
    </div>
  )
}
