'use client'

/**
 * Etapa 4 «Constancia»: documento académico simulado.
 *
 * Se muestra únicamente tras un pago de prueba APROBADO. Incluye un encabezado
 * con el título exigido y una nota visible que impide confundirlo con un
 * comprobante tributario auténtico. El número de operación es ficticio (SIM-).
 */

import { Download, Printer } from 'lucide-react'
import { formatCategoria, formatSoles } from '@/lib/rus/formato'
import type { ConstanciaSimulada } from '@/lib/rus/tipos'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface VistaConstanciaProps {
  constancia: ConstanciaSimulada
  onVolverBandeja: () => void
  onNuevaDeclaracion: () => void
}

interface FilaConstancia {
  etiqueta: string
  valor: string
  completo?: boolean
  destacado?: boolean
  mono?: boolean
  esBadgeEstado?: boolean
}

/** Genera el contenido HTML descargable de la constancia (solo texto académico). */
function construirHtmlDescargable(constancia: ConstanciaSimulada): string {
  const filas: Array<[string, string]> = [
    ['Formulario', constancia.formulario],
    ['Período tributario', constancia.periodo],
    ['Total de ingresos brutos (casilla 507)', formatSoles(constancia.ingresos)],
    ['Total de adquisiciones o compras (casilla 607)', formatSoles(constancia.compras)],
    ['Categoría (casilla 400)', formatCategoria(constancia.categoria)],
    ['Cuota mensual (casilla 503)', formatSoles(constancia.cuotaMensual)],
    ['Interés moratorio (casilla 504)', formatSoles(constancia.interesMoratorio)],
    ['Importe pagado ficticiamente (casilla 505)', formatSoles(constancia.importePagado)],
    ['Fecha de la operación simulada', constancia.fechaOperacion],
    ['Número de operación (ficticio)', constancia.numeroOperacion],
    ['Estado', constancia.estado],
  ]

  const filasHtml = filas
    .map(
      ([etiqueta, valor]) =>
        `<tr><th scope="row" style="text-align:left;padding:6px 10px;background:#f1f5f9;border:1px solid #cbd5e1;">${etiqueta}</th><td style="padding:6px 10px;border:1px solid #cbd5e1;">${valor}</td></tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${constancia.titulo}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:24px;">
  <div style="border:2px solid #1d4e79;border-radius:8px;overflow:hidden;max-width:720px;">
    <div style="background:#1d4e79;color:#ffffff;padding:16px;text-align:center;">
      <h1 style="font-size:20px;margin:0;">${constancia.titulo}</h1>
      <p style="margin:4px 0 0;font-size:13px;">${constancia.formulario}</p>
    </div>
    <table style="border-collapse:collapse;width:100%;font-size:14px;">${filasHtml}</table>
    <p style="padding:12px 16px;font-size:11px;color:#64748b;margin:0;">
      Documento académico simulado con fines educativos. No es un comprobante tributario
      auténtico ni acredita operación alguna ante SUNAT.
    </p>
  </div>
</body>
</html>`
}

export function VistaConstancia({
  constancia,
  onVolverBandeja,
  onNuevaDeclaracion,
}: VistaConstanciaProps) {
  const guardarConstancia = () => {
    const html = construirHtmlDescargable(constancia)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `constancia-simulada-${constancia.numeroOperacion}.html`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(url)
  }

  const filas: FilaConstancia[] = [
    { etiqueta: 'Período tributario', valor: constancia.periodo, completo: true },
    {
      etiqueta: 'Total de ingresos brutos (casilla 507)',
      valor: formatSoles(constancia.ingresos),
    },
    {
      etiqueta: 'Total de adquisiciones o compras (casilla 607)',
      valor: formatSoles(constancia.compras),
    },
    { etiqueta: 'Categoría (casilla 400)', valor: formatCategoria(constancia.categoria) },
    { etiqueta: 'Cuota mensual (casilla 503)', valor: formatSoles(constancia.cuotaMensual) },
    { etiqueta: 'Interés moratorio (casilla 504)', valor: formatSoles(constancia.interesMoratorio) },
    {
      etiqueta: 'Importe pagado ficticiamente (casilla 505)',
      valor: formatSoles(constancia.importePagado),
      completo: true,
      destacado: true,
    },
    { etiqueta: 'Fecha de la operación simulada', valor: constancia.fechaOperacion },
    { etiqueta: 'Número de operación (ficticio)', valor: constancia.numeroOperacion, mono: true },
    { etiqueta: 'Estado', valor: constancia.estado, completo: true, esBadgeEstado: true },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Alert className="no-print border-emerald-300 bg-emerald-50 text-emerald-900">
        <AlertTitle>Constancia disponible</AlertTitle>
        <AlertDescription>
          Su pago de prueba fue registrado con estado «Pago simulado aprobado». Puede imprimir o
          guardar esta constancia académica simulada.
        </AlertDescription>
      </Alert>

      {/* Documento de la constancia */}
      <Card
        id="area-constancia"
        className="overflow-hidden border-2 border-primary/60 p-0 shadow-sm"
      >
        <div className="bg-primary px-4 py-5 text-center text-primary-foreground sm:px-6">
          <h2 className="text-base font-bold tracking-wide sm:text-xl">{constancia.titulo}</h2>
          <p className="mt-1 text-xs text-sky-100 sm:text-sm">{constancia.formulario}</p>
        </div>

        <CardContent className="p-4 sm:p-6">
          <dl className="grid gap-2.5 sm:grid-cols-2">
            {filas.map((fila) => (
              <div
                key={fila.etiqueta}
                className={cn(
                  'rounded-md border border-slate-200 bg-slate-50 px-3 py-2',
                  fila.completo && 'sm:col-span-2',
                  fila.destacado && 'border-primary/40 bg-primary/5',
                )}
              >
                <dt className="text-[11px] font-medium text-slate-500 sm:text-xs">
                  {fila.etiqueta}
                </dt>
                <dd
                  className={cn(
                    'mt-0.5 text-sm font-semibold text-slate-900',
                    fila.destacado && 'text-base text-primary',
                    fila.mono && 'font-mono text-[13px]',
                  )}
                >
                  {fila.esBadgeEstado ? (
                    <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      {fila.valor}
                    </Badge>
                  ) : (
                    fila.valor
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Documento académico simulado con fines educativos. No es un comprobante tributario
            auténtico y no acredita operación alguna ante SUNAT.
          </p>
        </CardContent>
      </Card>

      {/* Acciones (no se imprimen) */}
      <div className="no-print flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onVolverBandeja}>
          Volver a la bandeja
        </Button>
        <Button variant="outline" onClick={onNuevaDeclaracion}>
          Nueva declaración
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          Imprimir
        </Button>
        <Button onClick={guardarConstancia}>
          <Download className="size-4" aria-hidden="true" />
          Guardar constancia
        </Button>
      </div>
    </div>
  )
}
