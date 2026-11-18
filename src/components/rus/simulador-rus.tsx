'use client'

/**
 * Orquestador del simulador: máquina de estados del flujo académico.
 *
 * Etapas: 1 Seleccione -> 2 Complete -> 3 Presente/Pague -> 4 Constancia.
 *
 * Este componente también dibuja la estructura general de la página
 * (cabecera con perfil y contador de bandeja, aviso de descargo permanente
 * en la parte superior y pie), y coordina las notificaciones del flujo:
 *
 * - «Cargando datos, espere un momento...» (en el formulario, al elegir período).
 * - «Sr. Contribuyente, el formulario se agregó a la Bandeja de
 *   Presentación/Pagos» + ventana «Usted añadió un formulario a la bandeja
 *   de pagos. Para continuar seleccione:» con «Volver al formulario» /
 *   «Ir a Presentar/Pagar».
 * - Confirmación de presentación Sí/No (en la bandeja).
 * - Mensajes diferenciados del pago: aprobado, rechazado y
 *   operación cancelada.
 *
 * La lógica de negocio vive en `src/lib/rus` (funciones puras); este
 * componente solo coordina el estado de la interfaz y delega las reglas.
 */

import { useCallback, useMemo, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { BarraEtapas } from '@/components/rus/barra-etapas'
import { Cabecera } from '@/components/rus/cabecera'
import { FormularioDeclaracion, type EstadoFormulario } from '@/components/rus/formulario-declaracion'
import { NotificacionDescartable } from '@/components/rus/notificacion-descartable'
import { PantallaPago } from '@/components/rus/pantalla-pago'
import { PantallaSeleccion } from '@/components/rus/pantalla-seleccion'
import { VistaBandeja } from '@/components/rus/vista-bandeja'
import { VistaConstancia } from '@/components/rus/vista-constancia'
import {
  MENSAJE_OPERACION_CANCELADA,
  intentarAgregarABandeja,
  procesarPagoSimulado,
} from '@/lib/rus/flujo'
import { AVISO_DESCARGO } from '@/lib/rus/perfil'
import { splitPeriodo } from '@/lib/rus/validacion'
import type {
  ConstanciaSimulada,
  Declaracion,
  ErroresValidacion,
  Etapa,
} from '@/lib/rus/tipos'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const FORMULARIO_INICIAL: EstadoFormulario = {
  periodoMes: '',
  periodoAnio: '',
  rectificatoria: false,
  ingresosTexto: '',
  comprasTexto: '',
}

/** Mensaje exigido al agregar correctamente un formulario a la bandeja. */
const MENSAJE_FORMULARIO_AGREGADO =
  'Sr. Contribuyente, el formulario se agregó a la Bandeja de Presentación/Pagos.'

/** Texto de la ventana de continuación tras agregar un formulario. */
const TEXTO_DIALOGO_CONTINUAR =
  'Usted añadió un formulario a la bandeja de pagos. Para continuar seleccione:'

type SubVistaEtapaTres = 'bandeja' | 'pago'

export function SimuladorRus() {
  const [etapa, setEtapa] = useState<Etapa>(1)
  const [maxEtapaAlcanzada, setMaxEtapaAlcanzada] = useState<Etapa>(1)
  const [formulario, setFormulario] = useState<EstadoFormulario>(FORMULARIO_INICIAL)
  const [errores, setErrores] = useState<ErroresValidacion>({})
  const [bandeja, setBandeja] = useState<Declaracion[]>([])
  const [constancias, setConstancias] = useState<Record<string, ConstanciaSimulada>>({})
  const [secuenciaDeclaraciones, setSecuenciaDeclaraciones] = useState(1)
  const [secuenciaOperaciones, setSecuenciaOperaciones] = useState(1)
  const [subVistaEtapaTres, setSubVistaEtapaTres] = useState<SubVistaEtapaTres>('bandeja')
  const [idDeclaracionEnPago, setIdDeclaracionEnPago] = useState<string | null>(null)
  const [mensajeExitoBandeja, setMensajeExitoBandeja] = useState<string | null>(null)
  const [mensajeRechazoPago, setMensajeRechazoPago] = useState<string | null>(null)
  const [mensajeCancelacion, setMensajeCancelacion] = useState<string | null>(null)
  const [avisoEdicion, setAvisoEdicion] = useState<string | null>(null)
  const [dialogoPostAgregar, setDialogoPostAgregar] = useState(false)
  const [constanciaActual, setConstanciaActual] = useState<ConstanciaSimulada | null>(null)

  const irAEtapa = useCallback(
    (destino: Etapa) => {
      // La etapa 4 exige una constancia generada previamente.
      if (destino === 4 && !constanciaActual) return
      setEtapa(destino)
      if (destino === 3) {
        // Al volver a la etapa 3 por la barra se muestra siempre la bandeja
        // (los estados de cada declaración se conservan intactos).
        setSubVistaEtapaTres('bandeja')
        setIdDeclaracionEnPago(null)
        setMensajeRechazoPago(null)
      }
    },
    [constanciaActual],
  )

  const avanzarA = useCallback((destino: Etapa) => {
    setEtapa(destino)
    setMaxEtapaAlcanzada((actual) => (destino > actual ? destino : actual))
  }, [])

  const cambiarFormulario = useCallback((cambios: Partial<EstadoFormulario>) => {
    setFormulario((actual) => ({ ...actual, ...cambios }))
  }, [])

  const agregarABandeja = useCallback(() => {
    const resultado = intentarAgregarABandeja(
      {
        periodo:
          formulario.periodoMes && formulario.periodoAnio
            ? `${formulario.periodoMes}/${formulario.periodoAnio}`
            : '',
        rectificatoria: formulario.rectificatoria,
        ingresosTexto: formulario.ingresosTexto,
        comprasTexto: formulario.comprasTexto,
      },
      bandeja,
      secuenciaDeclaraciones,
      new Date(),
    )

    if (!resultado.aceptada) {
      setErrores(resultado.errores)
      return
    }

    setErrores({})
    setBandeja((actual) => [...actual, resultado.declaracion])
    setSecuenciaDeclaraciones((actual) => actual + 1)
    setMensajeExitoBandeja(MENSAJE_FORMULARIO_AGREGADO)
    setMensajeCancelacion(null)
    setAvisoEdicion(null)
    setSubVistaEtapaTres('bandeja')
    avanzarA(3)
    // Ventana de continuación: «Usted añadió un formulario a la bandeja de
    // pagos. Para continuar seleccione:» con los dos botones requeridos.
    setDialogoPostAgregar(true)
  }, [avanzarA, bandeja, formulario, secuenciaDeclaraciones])

  const declaracionEnPago = useMemo(
    () => bandeja.find((d) => d.id === idDeclaracionEnPago) ?? null,
    [bandeja, idDeclaracionEnPago],
  )

  const presentarPagar = useCallback(
    (id: string) => {
      setIdDeclaracionEnPago(id)
      setMensajeRechazoPago(null)
      setMensajeCancelacion(null)
      setSubVistaEtapaTres('pago')
    },
    [],
  )

  const simularPago = useCallback(
    (decision: 'aprobado' | 'rechazado') => {
      if (!declaracionEnPago) return
      const resultado = procesarPagoSimulado(
        declaracionEnPago,
        decision,
        new Date(),
        secuenciaOperaciones,
      )

      if (decision === 'aprobado' && resultado.constancia) {
        setBandeja((actual) =>
          actual.map((d) => (d.id === resultado.declaracion.id ? resultado.declaracion : d)),
        )
        setConstancias((actual) => ({
          ...actual,
          [resultado.declaracion.id]: resultado.constancia as ConstanciaSimulada,
        }))
        setSecuenciaOperaciones((actual) => actual + 1)
        setMensajeRechazoPago(null)
        setConstanciaActual(resultado.constancia)
      } else {
        // Pago simulado rechazado: mensaje diferenciado y actualización del
        // estado diferenciado en la bandeja («Pago simulado rechazado»),
        // sin constancia y con posibilidad de reintento o corrección.
        setMensajeRechazoPago(resultado.mensaje)
        setBandeja((actual) =>
          actual.map((d) => (d.id === resultado.declaracion.id ? resultado.declaracion : d)),
        )
      }
    },
    [declaracionEnPago, secuenciaOperaciones],
  )

  const generarConstancia = useCallback(() => {
    if (constanciaActual) avanzarA(4)
  }, [avanzarA, constanciaActual])

  const cancelarPago = useCallback(() => {
    // Operación cancelada: regresa a la bandeja conservando la declaración y
    // su estado; se muestra la notificación diferenciada de cancelación.
    setIdDeclaracionEnPago(null)
    setMensajeRechazoPago(null)
    setMensajeCancelacion(MENSAJE_OPERACION_CANCELADA)
    setSubVistaEtapaTres('bandeja')
  }, [])

  const verConstancia = useCallback(
    (id: string) => {
      const constancia = constancias[id]
      if (constancia) {
        setConstanciaActual(constancia)
        avanzarA(4)
      }
    },
    [avanzarA, constancias],
  )

  const volverAlFormulario = useCallback(() => {
    // Regresa a la etapa 2 conservando los datos del formulario (etapa ya
    // alcanzada: no eleva el progreso máximo).
    avanzarA(2)
  }, [avanzarA])

  /**
   * Carga una declaración NO aprobada en el formulario para corregirla antes
   * de confirmar el pago. Se retira temporalmente de la bandeja (evita el
   * error de período duplicado al volver a agregarla) y nunca aplica a
   * declaraciones con constancia.
   */
  const corregirDeclaracion = useCallback(
    (id: string) => {
      const declaracion = bandeja.find((d) => d.id === id)
      if (!declaracion || declaracion.estado === 'pago_aprobado') return

      const [mes, anio] = splitPeriodo(declaracion.periodo)
      setFormulario({
        periodoMes: mes,
        periodoAnio: anio,
        rectificatoria: declaracion.rectificatoria,
        ingresosTexto: declaracion.ingresos.toFixed(2),
        comprasTexto: declaracion.compras.toFixed(2),
      })
      setErrores({})
      setMensajeExitoBandeja(null)
      setMensajeCancelacion(null)
      setBandeja((actual) => actual.filter((d) => d.id !== id))
      setAvisoEdicion(
        `Editando la declaración del período ${declaracion.periodo}: los datos se cargaron en el formulario y se retiraron temporalmente de la bandeja. Presione «Agregar a bandeja» cuando termine de corregir.`,
      )
      avanzarA(2)
    },
    [avanzarA, bandeja],
  )

  const nuevaDeclaracion = useCallback(() => {
    setFormulario(FORMULARIO_INICIAL)
    setErrores({})
    setMensajeExitoBandeja(null)
    setMensajeRechazoPago(null)
    setMensajeCancelacion(null)
    setAvisoEdicion(null)
    setIdDeclaracionEnPago(null)
    setSubVistaEtapaTres('bandeja')
    avanzarA(2)
  }, [avanzarA])

  const irAPresentarPagarDesdeDialogo = useCallback(() => {
    setDialogoPostAgregar(false)
    setSubVistaEtapaTres('bandeja')
  }, [])

  const irAlFormularioDesdeDialogo = useCallback(() => {
    setDialogoPostAgregar(false)
    avanzarA(2)
  }, [avanzarA])

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      {/* Cabecera: título, bienvenida, perfil y contador de bandeja */}
      <Cabecera cantidadBandeja={bandeja.length} />

      {/* Aviso general de descargo: único aviso, visible en la parte superior */}
      <div
        role="alert"
        className="no-print border-b border-amber-300 bg-amber-50 text-amber-900"
      >
        <div className="mx-auto flex w-full max-w-5xl items-start gap-2.5 px-4 py-3 sm:px-6">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-xs font-medium sm:text-sm">{AVISO_DESCARGO}</p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6">
          <BarraEtapas
            etapaActual={etapa}
            maxEtapaAlcanzada={maxEtapaAlcanzada}
            onSeleccionar={irAEtapa}
          />

          {etapa === 1 ? <PantallaSeleccion onContinuar={() => avanzarA(2)} /> : null}

          {etapa === 2 ? (
            <FormularioDeclaracion
              formulario={formulario}
              errores={errores}
              aviso={avisoEdicion}
              onCerrarAviso={() => setAvisoEdicion(null)}
              onCambios={cambiarFormulario}
              onAgregarABandeja={agregarABandeja}
              onVolver={() => irAEtapa(1)}
            />
          ) : null}

          {etapa === 3 && subVistaEtapaTres === 'bandeja' ? (
            <VistaBandeja
              bandeja={bandeja}
              mensajeExito={mensajeExitoBandeja}
              mensajeCancelacion={mensajeCancelacion}
              onCerrarMensajeExito={() => setMensajeExitoBandeja(null)}
              onCerrarMensajeCancelacion={() => setMensajeCancelacion(null)}
              onPresentarPagar={presentarPagar}
              onCorregir={corregirDeclaracion}
              onVerConstancia={verConstancia}
              onNuevaDeclaracion={nuevaDeclaracion}
            />
          ) : null}

          {etapa === 3 && subVistaEtapaTres === 'pago' && declaracionEnPago ? (
            <PantallaPago
              declaracion={declaracionEnPago}
              mensajeRechazo={mensajeRechazoPago}
              onSimularPago={simularPago}
              onCancelar={cancelarPago}
              onGenerarConstancia={generarConstancia}
            />
          ) : null}

          {etapa === 4 && constanciaActual ? (
            <VistaConstancia
              constancia={constanciaActual}
              onVolverBandeja={() => irAEtapa(3)}
              onNuevaDeclaracion={nuevaDeclaracion}
            />
          ) : null}
        </div>

        {/* Ventana de continuación tras agregar un formulario (cerrable con
            Esc o clic fuera; no bloquea la aplicación permanentemente) */}
        <Dialog open={dialogoPostAgregar} onOpenChange={setDialogoPostAgregar}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Formulario agregado a la bandeja</DialogTitle>
              <DialogDescription>{TEXTO_DIALOGO_CONTINUAR}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={irAlFormularioDesdeDialogo}>
                Volver al formulario
              </Button>
              <Button onClick={irAPresentarPagarDesdeDialogo}>Ir a Presentar/Pagar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* Pie fijo al fondo (no flota sobre el contenido gracias a mt-auto) */}
      <footer className="no-print mt-auto border-t border-slate-300 bg-slate-200 text-slate-700">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-4 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-xs">
          <p className="font-medium">Formulario Virtual N.º 1611 — Nuevo RUS</p>
          <p>
            Sin conexión a SUNAT, bancos, Yape ni pasarelas de pago. No almacena información
            personal real.
          </p>
        </div>
      </footer>
    </div>
  )
}
