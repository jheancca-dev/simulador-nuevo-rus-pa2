'use client'

/**
 * Etapa 3 «Presente/Pague» — vista de la bandeja temporal.
 *
 * Muestra las declaraciones agregadas con sus estados diferenciados
 * («Agregado a bandeja», «Pago simulado rechazado», «Pago simulado aprobado»)
 * y permite revisar período, ingresos, compras, categoría y cuota.
 *
 * Notificaciones accesibles y descartables:
 * - Éxito: «Sr. Contribuyente, el formulario se agregó a la Bandeja de
 *   Presentación/Pagos».
 * - Operación cancelada: la declaración se conserva y no se genera constancia.
 *
 * Acciones por fila:
 * - «Presentar/Pagar» (Sí/No en ventana de confirmación) para declaraciones
 *   sin pago aprobado (incluye reintentos tras un rechazo).
 * - «Corregir datos»: regresa al formulario con los datos precargados antes
 *   de confirmar el pago.
 * - «Ver constancia»: solo tras un pago simulado aprobado.
 */

import { CheckCircle2, ClipboardList, PencilLine, Plus } from 'lucide-react'
import { PERFIL_DEMOSTRACION } from '@/lib/rus/perfil'
import { formatCategoria, formatEstadoDeclaracion, formatSoles } from '@/lib/rus/formato'
import type { Declaracion } from '@/lib/rus/tipos'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NotificacionDescartable } from '@/components/rus/notificacion-descartable'

interface VistaBandejaProps {
  bandeja: Declaracion[]
  /** Notificación de éxito al agregar (descartable). */
  mensajeExito: string | null
  /** Notificación de operación cancelada (descartable). */
  mensajeCancelacion: string | null
  onCerrarMensajeExito: () => void
  onCerrarMensajeCancelacion: () => void
  onPresentarPagar: (id: string) => void
  /** Corregir una declaración aún no aprobada desde el formulario. */
  onCorregir: (id: string) => void
  onVerConstancia: (id: string) => void
  onNuevaDeclaracion: () => void
}

/** Badge de estado diferenciado por resultado del pago simulado. */
function BadgeEstado({ estado }: { estado: Declaracion['estado'] }) {
  const etiqueta = formatEstadoDeclaracion(estado)

  if (estado === 'pago_aprobado') {
    return (
      <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        {etiqueta}
      </Badge>
    )
  }
  if (estado === 'pago_rechazado') {
    return (
      <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
        {etiqueta}
      </Badge>
    )
  }
  return <Badge variant="secondary">{etiqueta}</Badge>
}

export function VistaBandeja({
  bandeja,
  mensajeExito,
  mensajeCancelacion,
  onCerrarMensajeExito,
  onCerrarMensajeCancelacion,
  onPresentarPagar,
  onCorregir,
  onVerConstancia,
  onNuevaDeclaracion,
}: VistaBandejaProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ClipboardList className="size-5 text-primary" aria-hidden="true" />
          Bandeja de declaraciones
        </CardTitle>
        <CardDescription>
          Revise el período, los ingresos, las compras, la categoría y la cuota de cada declaración
          antes de presentarla.
        </CardDescription>
        {/* Datos del contribuyente ficticio de pruebas (perfil único precargado) */}
        <p className="text-xs text-slate-500">
          {PERFIL_DEMOSTRACION.tipoCuenta}:{' '}
          <span className="font-semibold text-slate-700">{PERFIL_DEMOSTRACION.nombre}</span> · DNI{' '}
          {PERFIL_DEMOSTRACION.dni} · RUC {PERFIL_DEMOSTRACION.ruc}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {mensajeExito ? (
          <NotificacionDescartable
            variante="exito"
            titulo={mensajeExito}
            descripcion="Revise los datos de la declaración antes de presentarla o pagarla."
            etiquetaCerrar="Cerrar notificación de formulario agregado"
            onCerrar={onCerrarMensajeExito}
          />
        ) : null}

        {mensajeCancelacion ? (
          <NotificacionDescartable
            variante="alerta"
            titulo={mensajeCancelacion}
            etiquetaCerrar="Cerrar notificación de operación cancelada"
            onCerrar={onCerrarMensajeCancelacion}
          />
        ) : null}

        {bandeja.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            La bandeja está vacía. Complete el formulario y presione «Agregar a bandeja».
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-md border border-slate-200">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-100">
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Ingresos (507)</TableHead>
                  <TableHead className="text-right">Compras (607)</TableHead>
                  <TableHead>Categoría (400)</TableHead>
                  <TableHead className="text-right">Cuota (503)</TableHead>
                  <TableHead className="text-right">Importe (505)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bandeja.map((declaracion) => (
                  <TableRow key={declaracion.id}>
                    <TableCell className="font-medium">{declaracion.periodo}</TableCell>
                    <TableCell className="text-right">{formatSoles(declaracion.ingresos)}</TableCell>
                    <TableCell className="text-right">{formatSoles(declaracion.compras)}</TableCell>
                    <TableCell>{formatCategoria(declaracion.categoria)}</TableCell>
                    <TableCell className="text-right">
                      {formatSoles(declaracion.cuotaMensual)}
                    </TableCell>
                    <TableCell className="font-semibold text-right">
                      {formatSoles(declaracion.importeAPagar)}
                    </TableCell>
                    <TableCell>
                      <BadgeEstado estado={declaracion.estado} />
                    </TableCell>
                    <TableCell className="text-right">
                      {declaracion.estado === 'pago_aprobado' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerConstancia(declaracion.id)}
                        >
                          Ver constancia
                        </Button>
                      ) : (
                        <div className="flex flex-col items-end gap-1.5">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm">Presentar/Pagar</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Confirma presentar y pagar esta declaración?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Período {declaracion.periodo} —{' '}
                                  {formatCategoria(declaracion.categoria)} — Importe a pagar:{' '}
                                  {formatSoles(declaracion.importeAPagar)}. Se abrirá la pantalla de
                                  pago de prueba (completamente ficticia).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onPresentarPagar(declaracion.id)}>
                                  Sí
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCorregir(declaracion.id)}
                            className="text-slate-600"
                          >
                            <PencilLine className="size-3.5" aria-hidden="true" />
                            Corregir datos
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
          Solo se genera constancia tras un pago simulado aprobado.
        </p>
        <Button variant="outline" onClick={onNuevaDeclaracion}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva declaración
        </Button>
      </CardFooter>
    </Card>
  )
}
