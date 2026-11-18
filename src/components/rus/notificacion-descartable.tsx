'use client'

/**
 * Notificación descartable y accesible, reutilizada por la bandeja y el
 * formulario (mensajes de éxito, información o alerta).
 *
 * - Accesible: `role="status"` + `aria-live="polite"` y botón de cierre con
 *   etiqueta propia (los lectores de pantalla anuncian el mensaje sin cortar
 *   la navegación).
 * - No bloqueante: siempre puede cerrarse con el botón X; nunca cubre el
 *   contenido ni impide seguir operando.
 */

import { CheckCircle2, Info, ShieldAlert, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export type VarianteNotificacion = 'exito' | 'info' | 'alerta'

const ICONO_POR_VARIANTE = {
  exito: CheckCircle2,
  info: Info,
  alerta: ShieldAlert,
} as const

const ESTILO_POR_VARIANTE: Record<VarianteNotificacion, string> = {
  exito: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  alerta: 'border-amber-300 bg-amber-50 text-amber-900',
}

interface NotificacionDescartableProps {
  /** Aspecto y icono de la notificación (por defecto «info»). */
  variante?: VarianteNotificacion
  /** Texto principal del mensaje (visible completo, sin recortar). */
  titulo: string
  /** Texto secundario opcional. */
  descripcion?: string
  /** Etiqueta accesible del botón de cierre. */
  etiquetaCerrar?: string
  onCerrar: () => void
}

export function NotificacionDescartable({
  variante = 'info',
  titulo,
  descripcion,
  etiquetaCerrar = 'Cerrar notificación',
  onCerrar,
}: NotificacionDescartableProps) {
  const Icono = ICONO_POR_VARIANTE[variante]

  return (
    <Alert
      role="status"
      aria-live="polite"
      className={cn('relative pr-12', ESTILO_POR_VARIANTE[variante])}
    >
      <Icono className="size-4" aria-hidden="true" />
      <AlertTitle className="line-clamp-none whitespace-pre-line font-semibold">
        {titulo}
      </AlertTitle>
      {descripcion ? <AlertDescription>{descripcion}</AlertDescription> : null}
      <button
        type="button"
        onClick={onCerrar}
        aria-label={etiquetaCerrar}
        className="absolute right-2.5 top-2.5 rounded-md p-1.5 opacity-70 transition-opacity hover:bg-black/5 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
      >
        <X className="size-4" aria-hidden="true" />
        <span className="sr-only">{etiquetaCerrar}</span>
      </button>
    </Alert>
  )
}
