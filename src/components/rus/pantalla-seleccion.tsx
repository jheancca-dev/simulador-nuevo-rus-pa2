'use client'

/**
 * Etapa 1 «Seleccione»: el usuario elige el único trámite incluido en el
 * simulador (declaración mensual del Nuevo RUS). Los demás trámites aparecen
 * como no disponibles para dejar claro el alcance académico del prototipo.
 */

import { FileText, Lock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'

const TRAMITES_NO_DISPONIBLES = [
  {
    titulo: 'Declaración rectificatoria del Formulario 1611',
    descripcion: 'Fuera del alcance de la versión inicial del simulador.',
  },
  {
    titulo: 'Categoría especial del Nuevo RUS',
    descripcion: 'No está implementada en esta primera versión.',
  },
  {
    titulo: 'Otros formularios y trámites de SUNAT',
    descripcion: 'El simulador se concentra en un único proceso educativo.',
  },
] as const

interface PantallaSeleccionProps {
  onContinuar: () => void
}

export function PantallaSeleccion({ onContinuar }: PantallaSeleccionProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Seleccione el trámite a simular</CardTitle>
        <CardDescription>
          Este simulador incluye únicamente la declaración mensual del Nuevo Régimen Único
          Simplificado (Nuevo RUS) mediante el Formulario Virtual N.º 1611. No confundir con el
          Régimen Especial de Renta (RER).
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border-2 border-primary bg-primary/5 p-4">
          <RadioGroup defaultValue="rus" className="mt-1">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="rus" id="tramite-rus" aria-labelledby="etiqueta-tramite-rus" />
              <div className="grid gap-1">
                <Label
                  htmlFor="tramite-rus"
                  id="etiqueta-tramite-rus"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                >
                  <FileText className="size-4 text-primary" aria-hidden="true" />
                  Declaración mensual del Nuevo RUS
                </Label>
                <p className="text-sm text-slate-600">
                  Formulario Virtual N.º 1611 — declaración ordinaria mensual con Categorías 1 y 2
                  del régimen.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="grid gap-3">
          {TRAMITES_NO_DISPONIBLES.map((tramite) => (
            <div
              key={tramite.titulo}
              aria-hidden="true"
              className="flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 opacity-80"
            >
              <Lock className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="grid gap-1">
                <p className="text-sm font-medium text-slate-500 line-through decoration-slate-300">
                  {tramite.titulo}
                </p>
                <p className="text-xs text-slate-500">{tramite.descripcion}</p>
              </div>
              <Badge variant="outline" className="ml-auto shrink-0 text-slate-500">
                No disponible
              </Badge>
            </div>
          ))}
        </div>

        <p className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Recuerde: se trata de una simulación académica. No se conecta a sistemas de SUNAT ni
          registra operaciones reales.
        </p>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button onClick={onContinuar}>Continuar a la etapa Complete</Button>
      </CardFooter>
    </Card>
  )
}
