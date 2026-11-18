'use client'

/**
 * Orquestador del simulador: máquina de estados del flujo académico.
 *
 * Etapas: 1 Seleccione -> 2 Complete -> 3 Presente/Pague -> 4 Constancia.
 *
 * La lógica de negocio vive en `src/lib/rus` (funciones puras); este componente
 * solo coordina el estado de la interfaz y delega las reglas.
 */

import { useCallback, useMemo, useState } from 'react'
import { BarraEtapas } from '@/components/rus/barra-etapas'
import { FormularioDeclaracion, type EstadoFormulario } from '@/components/rus/formulario-declaracion'
import { PantallaPago } from '@/components/rus/pantalla-pago'
import { PantallaSeleccion } from '@/components/rus/pantalla-seleccion'
import { VistaBandeja } from '@/components/rus/vista-bandeja'
import { VistaConstancia } from '@/components/rus/vista-constancia'
import { intentarAgregarABandeja, procesarPagoSimulado } from '@/lib/rus/flujo'
import type {
  ConstanciaSimulada,
  Declaracion,
  ErroresValidacion,
  Etapa,
} from '@/lib/rus/tipos'

const FORMULARIO_INICIAL: EstadoFormulario = {
  periodoMes: '',
  periodoAnio: '',
  rectificatoria: false,
  ingresosTexto: '',
  comprasTexto: '',
}

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
  const [constanciaActual, setConstanciaActual] = useState<ConstanciaSimulada | null>(null)

  const irAEtapa = useCallback(
    (destino: Etapa) => {
      // La etapa 4 exige una constancia generada previamente.
      if (destino === 4 && !constanciaActual) return
      setEtapa(destino)
      if (destino === 3) setSubVistaEtapaTres('bandeja')
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
    setMensajeExitoBandeja(
      `La declaración del período ${resultado.declaracion.periodo} fue agregada a la bandeja. Revise los datos y presione «Presentar/Pagar».`,
    )
    setSubVistaEtapaTres('bandeja')
    avanzarA(3)
  }, [avanzarA, bandeja, formulario, secuenciaDeclaraciones])

  const declaracionEnPago = useMemo(
    () => bandeja.find((d) => d.id === idDeclaracionEnPago) ?? null,
    [bandeja, idDeclaracionEnPago],
  )

  const presentarPagar = useCallback(
    (id: string) => {
      setIdDeclaracionEnPago(id)
      setMensajeRechazoPago(null)
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
        setMensajeRechazoPago(resultado.mensaje)
      }
    },
    [declaracionEnPago, secuenciaOperaciones],
  )

  const generarConstancia = useCallback(() => {
    if (constanciaActual) avanzarA(4)
  }, [avanzarA, constanciaActual])

  const cancelarPago = useCallback(() => {
    // Regresar a la bandeja sin perder los datos de la declaración.
    setIdDeclaracionEnPago(null)
    setMensajeRechazoPago(null)
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

  const nuevaDeclaracion = useCallback(() => {
    setFormulario(FORMULARIO_INICIAL)
    setErrores({})
    setMensajeExitoBandeja(null)
    setMensajeRechazoPago(null)
    setIdDeclaracionEnPago(null)
    setSubVistaEtapaTres('bandeja')
    avanzarA(2)
  }, [avanzarA])

  return (
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
          onCambios={cambiarFormulario}
          onAgregarABandeja={agregarABandeja}
          onVolver={() => irAEtapa(1)}
        />
      ) : null}

      {etapa === 3 && subVistaEtapaTres === 'bandeja' ? (
        <VistaBandeja
          bandeja={bandeja}
          mensajeExito={mensajeExitoBandeja}
          onPresentarPagar={presentarPagar}
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
  )
}
