'use client'

/**
 * Etapa 2 «Complete»: formulario del Formulario Virtual N.º 1611 (Nuevo RUS).
 *
 * - Casillas 507 y 607 son editables (ingresos y compras).
 * - Casillas de solo lectura, cada una con tratamiento explícito:
 *     · 400: categoría calculada automáticamente.
 *     · 503: cuota mensual calculada automáticamente.
 *     · 504: valor fijo S/ 0 (escenario ordinario sin intereses).
 *     · 505: importe calculado automáticamente.
 *     · 509: funcionalidad NO implementada (no se calcula ni se aplica
 *       compensación) en esta versión.
 * - Al seleccionar el período se muestra brevemente el mensaje
 *   «Cargando datos, espere un momento...» (solo visual y local, sin
 *   conexiones tributarias reales).
 * - Los errores de validación se muestran junto a cada campo.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Ban, ClipboardPlus, Loader2, Lock } from 'lucide-react'
import { calcularCategoriaYCuota } from '@/lib/rus/calculo'
import { formatCategoria, formatSoles } from '@/lib/rus/formato'
import { leerMonto } from '@/lib/rus/validacion'
import type { ErroresValidacion } from '@/lib/rus/tipos'
import { cn } from '@/lib/utils'
import { NotificacionDescartable } from '@/components/rus/notificacion-descartable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface EstadoFormulario {
  periodoMes: string
  periodoAnio: string
  rectificatoria: boolean
  ingresosTexto: string
  comprasTexto: string
}

const MESES = [
  { valor: '01', etiqueta: '01 - Enero' },
  { valor: '02', etiqueta: '02 - Febrero' },
  { valor: '03', etiqueta: '03 - Marzo' },
  { valor: '04', etiqueta: '04 - Abril' },
  { valor: '05', etiqueta: '05 - Mayo' },
  { valor: '06', etiqueta: '06 - Junio' },
  { valor: '07', etiqueta: '07 - Julio' },
  { valor: '08', etiqueta: '08 - Agosto' },
  { valor: '09', etiqueta: '09 - Septiembre' },
  { valor: '10', etiqueta: '10 - Octubre' },
  { valor: '11', etiqueta: '11 - Noviembre' },
  { valor: '12', etiqueta: '12 - Diciembre' },
]

/** Años disponibles en el selector: del actual +1 hacia atrás, cinco años. */
const ANIOS: string[] = (() => {
  const actual = new Date().getFullYear()
  const lista: string[] = []
  for (let anio = actual + 1; anio >= actual - 5; anio--) {
    lista.push(String(anio))
  }
  return lista
})()

interface FormularioDeclaracionProps {
  formulario: EstadoFormulario
  errores: ErroresValidacion
  /** Aviso informativo opcional (p. ej. edición de una declaración de la bandeja). */
  aviso?: string | null
  onCerrarAviso?: () => void
  onCambios: (cambios: Partial<EstadoFormulario>) => void
  onAgregarABandeja: () => void
  onVolver: () => void
}

function MensajeError({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-red-700">
      {mensaje}
    </p>
  )
}

/** Etiqueta pequeña con el número de casilla del formulario. */
function Casilla({ numero }: { numero: string }) {
  return (
    <span className="ml-2 inline-flex items-center rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
      Casilla {numero}
    </span>
  )
}

/** Campo calculado de solo lectura (categoría, cuota, interés, importe, etc.). */
function CampoCalculado({
  etiqueta,
  casilla,
  valor,
  nota,
  destacado = false,
}: {
  etiqueta: string
  casilla: string
  valor: string
  nota?: string
  destacado?: boolean
}) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-700">
        {etiqueta}
        <Casilla numero={casilla} />
      </span>
      <div
        className={cn(
          'mt-1.5 flex h-10 items-center gap-2 rounded-md border border-input bg-muted/60 px-3 text-sm',
          destacado && 'border-primary/40 bg-primary/5 font-semibold text-primary',
        )}
      >
        <Lock className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span className={cn('truncate', valor === '—' && 'text-slate-400')}>{valor}</span>
      </div>
      {nota ? <p className="mt-1 text-xs text-slate-500">{nota}</p> : null}
    </div>
  )
}

/** Duración (ms) del aviso «Cargando datos, espere un momento...». */
const DURACION_AVISO_CARGA_MS = 1000

export function FormularioDeclaracion({
  formulario,
  errores,
  aviso,
  onCerrarAviso,
  onCambios,
  onAgregarABandeja,
  onVolver,
}: FormularioDeclaracionProps) {
  // Aviso breve y local al seleccionar el período tributario (mes o año):
  // solo visual, sin conexiones tributarias reales. Se dispara desde los
  // eventos de selección (sin setState dentro de efectos).
  const [cargandoPeriodo, setCargandoPeriodo] = useState(false)
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const iniciarAvisoCarga = useCallback(() => {
    setCargandoPeriodo(true)
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
    temporizadorRef.current = setTimeout(
      () => setCargandoPeriodo(false),
      DURACION_AVISO_CARGA_MS,
    )
  }, [])

  // Al desmontar el formulario se limpia el temporizador pendiente.
  useEffect(
    () => () => {
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
    },
    [],
  )

  const cambiarPeriodoMes = useCallback(
    (valor: string) => {
      iniciarAvisoCarga()
      onCambios({ periodoMes: valor })
    },
    [iniciarAvisoCarga, onCambios],
  )

  const cambiarPeriodoAnio = useCallback(
    (valor: string) => {
      iniciarAvisoCarga()
      onCambios({ periodoAnio: valor })
    },
    [iniciarAvisoCarga, onCambios],
  )

  // Cálculo en vivo: se recalcula con cada cambio de los campos de entrada.
  const lecturaIngresos = leerMonto(formulario.ingresosTexto)
  const lecturaCompras = leerMonto(formulario.comprasTexto)
  const montosValidos = lecturaIngresos.esValido && lecturaCompras.esValido

  let calculo = null
  if (montosValidos) {
    try {
      calculo = calcularCategoriaYCuota(
        lecturaIngresos.valor as number,
        lecturaCompras.valor as number,
      )
    } catch {
      calculo = null
    }
  }
  const dentroDeRango = calculo?.estado === 'dentro_de_rango' ? calculo : null
  const fueraDeRango = calculo?.estado === 'fuera_de_rango' ? calculo : null

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">
          Complete la declaración mensual del Nuevo Régimen Único Simplificado (Nuevo RUS)
        </CardTitle>
        <CardDescription>
          Ingrese sus datos del mes. Las casillas 400, 503, 504, 505 y 509 son de solo lectura y
          cada una tiene un tratamiento específico que se indica debajo de su valor.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Aviso de edición (corrección desde la bandeja) */}
        {aviso && onCerrarAviso ? (
          <NotificacionDescartable
            variante="info"
            titulo="Corrección de declaración"
            descripcion={aviso}
            etiquetaCerrar="Cerrar aviso de corrección"
            onCerrar={onCerrarAviso}
          />
        ) : null}

        {/* Período tributario */}
        <div className="grid gap-2">
          <Label htmlFor="periodo-mes">Período tributario (MM/AAAA)</Label>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div>
              <Select
                value={formulario.periodoMes}
                onValueChange={cambiarPeriodoMes}
              >
                <SelectTrigger
                  id="periodo-mes"
                  aria-label="Mes del período tributario"
                  aria-invalid={Boolean(errores.periodo)}
                  aria-describedby={errores.periodo ? 'error-periodo' : undefined}
                  className="w-full bg-white"
                >
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor}>
                      {mes.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={formulario.periodoAnio}
                onValueChange={cambiarPeriodoAnio}
              >
                <SelectTrigger
                  id="periodo-anio"
                  aria-label="Año del período tributario"
                  aria-invalid={Boolean(errores.periodo)}
                  aria-describedby={errores.periodo ? 'error-periodo' : undefined}
                  className="w-full bg-white"
                >
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {ANIOS.map((anio) => (
                    <SelectItem key={anio} value={anio}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aviso de carga (solo visual y local) tras la selección del período */}
          {cargandoPeriodo ? (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-xs font-medium text-sky-700"
            >
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Cargando datos, espere un momento...
            </p>
          ) : null}

          <MensajeError id="error-periodo" mensaje={errores.periodo} />
        </div>

        {/* Declaración rectificatoria (fuera de alcance) */}
        <div className="grid gap-2">
          <Label id="etiqueta-rectificatoria">¿Es una declaración rectificatoria?</Label>
          <RadioGroup
            aria-labelledby="etiqueta-rectificatoria"
            value={formulario.rectificatoria ? 'si' : 'no'}
            onValueChange={(valor) => onCambios({ rectificatoria: valor === 'si' })}
            className="flex flex-row gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="rectificatoria-no" />
              <Label htmlFor="rectificatoria-no" className="font-normal">
                No (ordinaria)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="si" id="rectificatoria-si" />
              <Label htmlFor="rectificatoria-si" className="font-normal">
                Sí
              </Label>
            </div>
          </RadioGroup>
          {formulario.rectificatoria ? (
            <p role="alert" className="text-xs font-medium text-amber-700">
              La declaración rectificatoria está fuera del alcance de esta versión.
              Seleccione «No» para poder continuar.
            </p>
          ) : null}
          <MensajeError id="error-rectificatoria" mensaje={errores.rectificatoria} />
        </div>

        {/* Montos editables */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="ingresos">
              Total de ingresos brutos mensuales
              <Casilla numero="507" />
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                S/
              </span>
              <Input
                id="ingresos"
                className="pl-11 bg-white"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={formulario.ingresosTexto}
                onChange={(evento) => onCambios({ ingresosTexto: evento.target.value })}
                aria-invalid={Boolean(errores.ingresos)}
                aria-describedby={errores.ingresos ? 'error-ingresos' : undefined}
              />
            </div>
            <MensajeError id="error-ingresos" mensaje={errores.ingresos} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="compras">
              Total de adquisiciones o compras mensuales
              <Casilla numero="607" />
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                S/
              </span>
              <Input
                id="compras"
                className="pl-11 bg-white"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={formulario.comprasTexto}
                onChange={(evento) => onCambios({ comprasTexto: evento.target.value })}
                aria-invalid={Boolean(errores.compras)}
                aria-describedby={errores.compras ? 'error-compras' : undefined}
              />
            </div>
            <MensajeError id="error-compras" mensaje={errores.compras} />
          </div>
        </div>

        {/* Aviso fuera de rango (en vivo) */}
        {fueraDeRango ? (
          <Alert className="border-red-300 bg-red-50 text-red-900">
            <Ban className="size-4" />
            <AlertTitle>Declaración fuera del flujo ordinario</AlertTitle>
            <AlertDescription>{fueraDeRango.motivo}</AlertDescription>
          </Alert>
        ) : null}

        {/* Error general (p. ej. fuera de rango al intentar agregar) */}
        {errores.general && !fueraDeRango ? (
          <Alert variant="destructive">
            <Ban className="size-4" />
            <AlertTitle>No se puede agregar la declaración</AlertTitle>
            <AlertDescription>{errores.general}</AlertDescription>
          </Alert>
        ) : null}

        {/* Casillas calculadas */}
        <section
          aria-label="Casillas calculadas automáticamente"
          aria-live="polite"
          className="grid gap-5 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700">
              Cálculo automático (solo lectura)
            </h3>
            <p className="text-xs text-slate-500">
              Los valores se actualizan cuando cambian los ingresos o las compras.
            </p>
          </div>

          <CampoCalculado
            etiqueta="Categoría"
            casilla="400"
            valor={dentroDeRango ? formatCategoria(dentroDeRango.categoria) : '—'}
            nota="Categoría calculada automáticamente según el mayor importe entre ingresos y compras."
          />
          <CampoCalculado
            etiqueta="Monto de cuota mensual"
            casilla="503"
            valor={dentroDeRango ? formatSoles(dentroDeRango.cuotaMensual) : '—'}
            nota="Cuota mensual calculada automáticamente según la categoría (S/ 20 o S/ 50)."
          />
          <CampoCalculado
            etiqueta="Interés moratorio"
            casilla="504"
            valor={formatSoles(0)}
            nota="Valor fijo S/ 0 en el escenario ordinario sin intereses."
          />
          <CampoCalculado
            etiqueta="Compensación de percepciones del IGV"
            casilla="509"
            valor="Función no implementada"
            nota="Funcionalidad no implementada: no se calcula ni se aplica compensación en esta versión."
          />
          <div className="sm:col-span-2">
            <CampoCalculado
              etiqueta="Importe a pagar"
              casilla="505"
              valor={dentroDeRango ? formatSoles(dentroDeRango.importeAPagar) : '—'}
              destacado
              nota="Importe calculado automáticamente: cuota mensual más interés moratorio, menos compensaciones."
            />
          </div>
        </section>
      </CardContent>

      <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onVolver}>
          Volver a la selección
        </Button>
        <Button onClick={onAgregarABandeja}>
          <ClipboardPlus className="size-4" aria-hidden="true" />
          Agregar a bandeja
        </Button>
      </CardFooter>
    </Card>
  )
}
