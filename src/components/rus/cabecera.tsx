'use client'

/**
 * Cabecera institucional del simulador (visible en todas las etapas).
 *
 * Incluye:
 * - Título «Formulario Virtual N.º 1611 — Nuevo RUS» con la denominación
 *   correcta del régimen: «Nuevo Régimen Único Simplificado (Nuevo RUS)»
 *   (no confundir con el RER, Régimen Especial de Renta).
 * - Panel de bienvenida del contribuyente ficticio precargado.
 * - Opción «Perfil de demostración»: muestra nombre, DNI y RUC ficticios.
 * - Contador discreto de la bandeja: «Bandeja (0)» / «Bandeja (1)» …
 *
 * Los datos del perfil provienen del módulo único `src/lib/rus/perfil.ts`.
 */

import { BadgeCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NOTA_DATOS_FICTICIOS, PERFIL_DEMOSTRACION } from '@/lib/rus/perfil'

interface CabeceraProps {
  /** Cantidad de declaraciones actualmente en la bandeja temporal. */
  cantidadBandeja: number
}

interface FilaPerfil {
  etiqueta: string
  valor: string
}

const FILAS_PERFIL: FilaPerfil[] = [
  { etiqueta: 'Nombre', valor: PERFIL_DEMOSTRACION.nombre },
  { etiqueta: 'DNI de demostración', valor: PERFIL_DEMOSTRACION.dni },
  { etiqueta: 'RUC de demostración', valor: PERFIL_DEMOSTRACION.ruc },
  { etiqueta: 'Régimen', valor: PERFIL_DEMOSTRACION.regimen },
  { etiqueta: 'Tipo de cuenta', valor: PERFIL_DEMOSTRACION.tipoCuenta },
]

export function Cabecera({ cantidadBandeja }: CabeceraProps) {
  return (
    <header className="no-print bg-[#123a5f] text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-100/90 sm:text-xs">
            Simulador académico · Proyecto universitario
          </p>
          <h1 className="mt-1 text-lg font-bold leading-tight sm:text-2xl">
            Formulario Virtual N.º 1611 — Nuevo RUS
          </h1>
          <p className="mt-1 text-xs text-sky-100/85 sm:text-sm">
            Declaración mensual del Nuevo Régimen Único Simplificado (Nuevo RUS) · Curso: Pruebas y
            Calidad de Software
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-3 lg:min-w-72 lg:items-end">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <UserRound className="size-4 shrink-0 text-sky-100" aria-hidden="true" />
            Bienvenida, {PERFIL_DEMOSTRACION.nombre}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              aria-label={`Declaraciones en la bandeja: ${cantidadBandeja}`}
              className="border-white/30 bg-white/10 text-white hover:bg-white/10"
            >
              Bandeja ({cantidadBandeja})
            </Badge>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/15 hover:text-white"
                >
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  Perfil de demostración
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Perfil de demostración</DialogTitle>
                  <DialogDescription>
                    Contribuyente académico precargado, sin inicio de sesión real.
                  </DialogDescription>
                </DialogHeader>

                <dl className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                  {FILAS_PERFIL.map((fila) => (
                    <div
                      key={fila.etiqueta}
                      className="flex items-center justify-between gap-3"
                    >
                      <dt className="text-slate-500">{fila.etiqueta}</dt>
                      <dd className="text-right font-semibold text-slate-900">{fila.valor}</dd>
                    </div>
                  ))}
                </dl>

                <p className="text-xs text-slate-500">{NOTA_DATOS_FICTICIOS}</p>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Cerrar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  )
}
