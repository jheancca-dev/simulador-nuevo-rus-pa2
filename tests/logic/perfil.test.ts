import { describe, expect, it } from 'vitest'
import { AVISO_DESCARGO, PERFIL_DEMOSTRACION } from '@/lib/rus/perfil'
import { generarConstanciaSimulada } from '@/lib/rus/constancia'
import {
  MENSAJE_OPERACION_CANCELADA,
  intentarAgregarABandeja,
  procesarPagoSimulado,
} from '@/lib/rus/flujo'
import { formatEstadoDeclaracion } from '@/lib/rus/formato'
import type { Declaracion } from '@/lib/rus/tipos'

/**
 * Pruebas del perfil del contribuyente (datos precargados únicos), de los
 * estados diferenciados del pago y de las notificaciones exigidas.
 */

const FECHA_FIJA = new Date(2025, 0, 15, 9, 30, 45) // 15/01/2025 09:30:45 (hora local)

function crearDeclaracionEnBandeja(secuencia = 1): Declaracion {
  const resultado = intentarAgregarABandeja(
    {
      periodo: '03/2025',
      rectificatoria: false,
      ingresosTexto: '1325',
      comprasTexto: '1825',
    },
    [],
    secuencia,
    FECHA_FIJA,
  )
  if (!resultado.aceptada) throw new Error('La declaración de prueba debería ser válida')
  return resultado.declaracion
}

describe('Perfil del contribuyente: datos precargados', () => {
  it('Contiene exactamente el nombre, DNI, RUC, régimen y tipo de cuenta exigidos', () => {
    expect(PERFIL_DEMOSTRACION).toEqual({
      nombre: 'Pepe Lucho Pérez',
      dni: '00000000',
      ruc: '00000000000',
      regimen: 'Nuevo RUS',
      tipoCuenta: 'Contribuyente del Nuevo RUS',
    })
  })

  it('El DNI y el RUC son marcadores deliberadamente no válidos (solo ceros)', () => {
    expect(PERFIL_DEMOSTRACION.dni).toMatch(/^0{8}$/)
    expect(PERFIL_DEMOSTRACION.ruc).toMatch(/^0{11}$/)
  })

  it('El aviso general aclara que no es una aplicación oficial de SUNAT', () => {
    expect(AVISO_DESCARGO).toContain('no es una aplicación oficial')
    expect(AVISO_DESCARGO).toContain('SUNAT')
    expect(AVISO_DESCARGO).toContain('no realiza declaraciones ni pagos reales')
  })
})

describe('La constancia incluye los datos del contribuyente', () => {
  it('Constancia con nombre, DNI y RUC del contribuyente (caso 11 ampliado)', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const aprobado = procesarPagoSimulado(declaracion, 'aprobado', FECHA_FIJA, 1)

    expect(aprobado.constancia).not.toBeNull()
    expect(aprobado.constancia).toMatchObject({
      titulo: 'CONSTANCIA',
      formulario: 'Formulario Virtual N.º 1611 — Nuevo RUS',
      contribuyenteNombre: 'Pepe Lucho Pérez',
      contribuyenteDni: '00000000',
      contribuyenteRuc: '00000000000',
      estado: 'Pago aprobado',
    })
  })

  it('Los datos del contribuyente provienen siempre del módulo único del perfil', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const constancia = generarConstanciaSimulada(declaracion, 'SIM-1611-20250115-0001', FECHA_FIJA)

    expect(constancia.contribuyenteNombre).toBe(PERFIL_DEMOSTRACION.nombre)
    expect(constancia.contribuyenteDni).toBe(PERFIL_DEMOSTRACION.dni)
    expect(constancia.contribuyenteRuc).toBe(PERFIL_DEMOSTRACION.ruc)
  })
})

describe('Estados diferenciados del pago', () => {
  it('El rechazo marca «Pago rechazado» y NUNCA genera constancia (caso 10 ampliado)', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const rechazado = procesarPagoSimulado(declaracion, 'rechazado', FECHA_FIJA, 1)

    expect(rechazado.constancia).toBeNull()
    expect(rechazado.declaracion.estado).toBe('pago_rechazado')
    expect(rechazado.mensaje).toContain('rechazado')
  })

  it('Una declaración rechazada admite reintento y después genera constancia', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const rechazado = procesarPagoSimulado(declaracion, 'rechazado', FECHA_FIJA, 1)
    const reintento = procesarPagoSimulado(rechazado.declaracion, 'aprobado', FECHA_FIJA, 1)

    expect(reintento.constancia).not.toBeNull()
    expect(reintento.declaracion.estado).toBe('pago_aprobado')
  })

  it('La operación cancelada usa el mensaje diferenciado exigido', () => {
    expect(MENSAJE_OPERACION_CANCELADA).toContain('Operación cancelada')
    expect(MENSAJE_OPERACION_CANCELADA).toContain('se conserva en la bandeja')
    expect(MENSAJE_OPERACION_CANCELADA).toContain('no se generó constancia')
  })

  it('formatEstadoDeclaracion etiqueta los tres estados diferenciados', () => {
    expect(formatEstadoDeclaracion('agregada_bandeja')).toBe('Agregado a bandeja')
    expect(formatEstadoDeclaracion('pago_rechazado')).toBe('Pago rechazado')
    expect(formatEstadoDeclaracion('pago_aprobado')).toBe('Pago aprobado')
  })

  it('Un período duplicado sigue bloqueado aunque la bandeja tenga un rechazado', () => {
    const rechazada = crearDeclaracionEnBandeja(1)
    const conRechazo = procesarPagoSimulado(rechazada, 'rechazado', FECHA_FIJA, 1).declaracion

    const duplicado = intentarAgregarABandeja(
      {
        periodo: '03/2025',
        rectificatoria: false,
        ingresosTexto: '6000',
        comprasTexto: '2000',
      },
      [conRechazo],
      2,
      FECHA_FIJA,
    )

    expect(duplicado.aceptada).toBe(false)
    if (!duplicado.aceptada) {
      expect(duplicado.errores.periodo).toContain('03/2025')
    }
  })
})
