'use client'

/**
 * Etapa 3 «Presente/Pague» — pantalla de pago local del prototipo.
 *
 * Ofrece el pago con tres acciones: aprobar, rechazar o cancelar. No
 * solicita números de tarjeta, claves bancarias, teléfonos Yape ni
 * información financiera personal, y no se conecta a ningún servicio real.
 */

import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react'
import { formatCategoria, formatEstadoDeclaracion, formatSoles } from '@/lib/rus/formato'
import { PERFIL_DEMOSTRACION } from '@/lib/rus/perfil'
import type { Declaracion } from '@/lib/rus/tipos'
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
import { Separator } from '@/components/ui/separator'

interface PantallaPagoProps {
  declaracion: Declaracion
  mensajeRechazo: string | null
  onSimularPago: (decision: 'aprobado' | 'rechazado') => void
  onCancelar: () => void
  onGenerarConstancia: () => void
}

export function PantallaPago({
  declaracion,
  mensajeRechazo,
  onSimularPago,
  onCancelar,
  onGenerarConstancia,
}: PantallaPagoProps) {
  const pagoAprobado = declaracion.estado === 'pago_aprobado'

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Wallet className="size-5 text-primary" aria-hidden="true" />
          Pago
        </CardTitle>
        <CardDescription>
          Revise el importe y elija una acción. No se realiza ningún cobro real.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Resumen de la declaración (con los datos del contribuyente precargado) */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <dl className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Contribuyente</dt>
              <dd className="font-medium">{PERFIL_DEMOSTRACION.nombre}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">DNI</dt>
              <dd className="font-medium">{PERFIL_DEMOSTRACION.dni}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">RUC</dt>
              <dd className="font-medium">{PERFIL_DEMOSTRACION.ruc}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Período tributario</dt>
              <dd className="font-medium">{declaracion.periodo}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Categoría (casilla 400)</dt>
              <dd className="font-medium">{formatCategoria(declaracion.categoria)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Cuota mensual (casilla 503)</dt>
              <dd className="font-medium">{formatSoles(declaracion.cuotaMensual)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">Interés moratorio (casilla 504)</dt>
              <dd className="font-medium">{formatSoles(declaracion.interesMoratorio)}</dd>
            </div>
          </dl>
          <Separator className="my-3" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-800">
              Importe total a pagar (casilla 505)
            </span>
            <span className="text-lg font-bold text-primary">
              {formatSoles(declaracion.importeAPagar)}
            </span>
          </div>
        </div>

        <Alert className="border-sky-200 bg-sky-50 text-sky-900">
          <ShieldCheck className="size-4" />
          <AlertTitle>Método de pago</AlertTitle>
          <AlertDescription>
            Este pago no utiliza dinero real, cuentas bancarias, tarjetas ni Yape. No se solicita
            información financiera personal y no se conecta con ninguna pasarela de pago.
          </AlertDescription>
        </Alert>

        {mensajeRechazo ? (
          <Alert variant="destructive">
            <XCircle className="size-4" />
            <AlertTitle>Pago rechazado</AlertTitle>
            <AlertDescription>
              {mensajeRechazo} La declaración se conserva en la bandeja.
            </AlertDescription>
          </Alert>
        ) : null}

        {pagoAprobado ? (
          <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900">
            <CheckCircle2 className="size-4" />
            <AlertTitle>Pago aprobado</AlertTitle>
            <AlertDescription>
              El estado de la declaración cambió de «Agregado a bandeja» a «Pago aprobado».
              Ya puede generar la constancia.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Acciones de pago */}
        <div className="grid gap-3 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-3">
          <Button
            disabled={pagoAprobado}
            onClick={() => onSimularPago('aprobado')}
            className="sm:col-span-1"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Pagar
          </Button>
          <Button
            variant="outline"
            disabled={pagoAprobado}
            onClick={() => onSimularPago('rechazado')}
            className="text-red-700"
          >
            <XCircle className="size-4" aria-hidden="true" />
            Rechazar pago
          </Button>
          <Button variant="ghost" onClick={onCancelar}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Cancelar operación
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Estado actual de la declaración:{' '}
          <span className="font-semibold">
            {formatEstadoDeclaracion(declaracion.estado)}
          </span>
        </p>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button onClick={onGenerarConstancia} disabled={!pagoAprobado}>
          Generar constancia
        </Button>
      </CardFooter>
    </Card>
  )
}
