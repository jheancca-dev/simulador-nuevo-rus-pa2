'use client'

/**
 * Barra superior de etapas del flujo simulado:
 * 1. Seleccione — 2. Complete — 3. Presente/Pague — 4. Constancia.
 * La etapa actual se identifica visualmente y las etapas ya alcanzadas
 * permiten volver atrás conservando los datos.
 */

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Etapa } from '@/lib/rus/tipos'

const ETIQUETAS: Record<Etapa, string> = {
  1: 'Seleccione',
  2: 'Complete',
  3: 'Presente/Pague',
  4: 'Constancia',
}

interface BarraEtapasProps {
  etapaActual: Etapa
  maxEtapaAlcanzada: Etapa
  onSeleccionar: (etapa: Etapa) => void
}

export function BarraEtapas({ etapaActual, maxEtapaAlcanzada, onSeleccionar }: BarraEtapasProps) {
  const etapas: Etapa[] = [1, 2, 3, 4]

  return (
    <nav aria-label="Etapas del proceso de declaración" className="no-print">
      <ol className="grid grid-cols-4 gap-1 sm:gap-2">
        {etapas.map((etapa) => {
          const esActual = etapa === etapaActual
          const esCompletada = etapa < maxEtapaAlcanzada && !esActual
          const esClickeable = etapa <= maxEtapaAlcanzada && !esActual

          const indicador = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors sm:size-10',
                  esActual && 'border-primary bg-primary text-primary-foreground shadow-sm',
                  esCompletada && 'border-primary bg-primary/10 text-primary',
                  !esActual && !esCompletada && 'border-slate-300 bg-white text-slate-400',
                )}
              >
                {esCompletada ? <Check className="size-4" /> : etapa}
              </span>
              <span
                className={cn(
                  'text-center text-[11px] font-medium leading-tight sm:text-sm',
                  esActual && 'text-primary',
                  esCompletada && 'text-slate-700',
                  !esActual && !esCompletada && 'text-slate-400',
                )}
              >
                {ETIQUETAS[etapa]}
              </span>
            </>
          )

          return (
            <li
              key={etapa}
              aria-current={esActual ? 'step' : undefined}
              className="flex flex-col items-center"
            >
              {esClickeable ? (
                <button
                  type="button"
                  onClick={() => onSeleccionar(etapa)}
                  aria-label={`Ir a la etapa ${etapa}: ${ETIQUETAS[etapa]}`}
                  className="flex w-full flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {indicador}
                </button>
              ) : (
                <div className="flex w-full flex-col items-center gap-1.5 p-2">{indicador}</div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
