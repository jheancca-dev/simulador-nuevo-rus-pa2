'use client'

/**
 * Etapa 3 «Presente/Pague» — vista de la bandeja temporal.
 *
 * Muestra las declaraciones agregadas con su estado («Agregado a bandeja» o
 * «Pago simulado aprobado») y permite revisar período, ingresos, compras,
 * categoría y cuota. El botón «Presentar/Pagar» abre primero una ventana de
 * confirmación con opciones Sí y No.
 */

import { CheckCircle2, ClipboardList, Plus } from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

interface VistaBandejaProps {
  bandeja: Declaracion[]
  mensajeExito: string | null
  onPresentarPagar: (id: string) => void
  onVerConstancia: (id: string) => void
  onNuevaDeclaracion: () => void
}

export function VistaBandeja({
  bandeja,
  mensajeExito,
  onPresentarPagar,
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
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {mensajeExito ? (
          <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900">
            <CheckCircle2 className="size-4" />
            <AlertTitle>Declaración agregada</AlertTitle>
            <AlertDescription>{mensajeExito}</AlertDescription>
          </Alert>
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
                      {declaracion.estado === 'pago_aprobado' ? (
                        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          {formatEstadoDeclaracion(declaracion.estado)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {formatEstadoDeclaracion(declaracion.estado)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {declaracion.estado === 'agregada_bandeja' ? (
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
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerConstancia(declaracion.id)}
                        >
                          Ver constancia
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onNuevaDeclaracion}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva declaración
        </Button>
      </CardFooter>
    </Card>
  )
}
