import { describe, expect, it } from 'vitest'
import { generarNumeroOperacionSimulado } from '@/lib/rus/constancia'
import { intentarAgregarABandeja, procesarPagoSimulado } from '@/lib/rus/flujo'
import type { Declaracion } from '@/lib/rus/tipos'

/**
 * Pruebas de integración del flujo: validación -> bandeja -> pago simulado ->
 * constancia. Cubren los casos 9, 10 y 11 exigidos en el enunciado.
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

describe('Caso 9: bloqueo de declaraciones inválidas', () => {
  it('No agrega a la bandeja una declaración con campos vacíos', () => {
    const resultado = intentarAgregarABandeja(
      { periodo: '', rectificatoria: false, ingresosTexto: '', comprasTexto: '' },
      [],
      1,
      FECHA_FIJA,
    )
    expect(resultado.aceptada).toBe(false)
    if (!resultado.aceptada) {
      expect(resultado.errores.periodo).toBeTruthy()
      expect(resultado.errores.ingresos).toBeTruthy()
      expect(resultado.errores.compras).toBeTruthy()
    }
  })

  it('No agrega una declaración con ingresos negativos', () => {
    const resultado = intentarAgregarABandeja(
      { periodo: '03/2025', rectificatoria: false, ingresosTexto: '-100', comprasTexto: '500' },
      [],
      1,
      FECHA_FIJA,
    )
    expect(resultado.aceptada).toBe(false)
  })

  it('No agrega una declaración fuera de rango (ingresos > S/ 8 000)', () => {
    const resultado = intentarAgregarABandeja(
      { periodo: '03/2025', rectificatoria: false, ingresosTexto: '9000', comprasTexto: '500' },
      [],
      1,
      FECHA_FIJA,
    )
    expect(resultado.aceptada).toBe(false)
    if (!resultado.aceptada) {
      expect(resultado.errores.general).toContain('8 000')
    }
  })

  it('No agrega una declaración rectificatoria (fuera de alcance)', () => {
    const resultado = intentarAgregarABandeja(
      { periodo: '03/2025', rectificatoria: true, ingresosTexto: '1000', comprasTexto: '1000' },
      [],
      1,
      FECHA_FIJA,
    )
    expect(resultado.aceptada).toBe(false)
    if (!resultado.aceptada) {
      expect(resultado.errores.rectificatoria).toBeTruthy()
    }
  })

  it('No agrega un período duplicado en la bandeja', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const resultado = intentarAgregarABandeja(
      { periodo: '03/2025', rectificatoria: false, ingresosTexto: '6000', comprasTexto: '2000' },
      [declaracion],
      2,
      FECHA_FIJA,
    )
    expect(resultado.aceptada).toBe(false)
    if (!resultado.aceptada) {
      expect(resultado.errores.periodo).toContain('03/2025')
    }
  })

  it('Agrega una declaración válida con estado inicial «Agregado a bandeja»', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    expect(declaracion).toMatchObject({
      id: 'DECL-0001',
      periodo: '03/2025',
      ingresos: 1325,
      compras: 1825,
      categoria: 1,
      cuotaMensual: 20,
      interesMoratorio: 0,
      importeAPagar: 20,
      estado: 'agregada_bandeja',
    })
  })
})

describe('Caso 10: pago rechazado no genera constancia', () => {
  it('procesarPagoSimulado con decisión «rechazado» devuelve constancia null', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const resultado = procesarPagoSimulado(declaracion, 'rechazado', FECHA_FIJA, 1)

    expect(resultado.constancia).toBeNull()
    // Estado diferenciado: la declaración queda marcada como rechazada.
    expect(resultado.declaracion.estado).toBe('pago_rechazado')
    expect(resultado.mensaje).toContain('rechazado')
  })

  it('Tras un rechazo se puede volver a intentar el pago', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const rechazo = procesarPagoSimulado(declaracion, 'rechazado', FECHA_FIJA, 1)
    const reintento = procesarPagoSimulado(rechazo.declaracion, 'aprobado', FECHA_FIJA, 1)

    expect(reintento.constancia).not.toBeNull()
    expect(reintento.declaracion.estado).toBe('pago_aprobado')
  })

  it('Lanza error si se intenta pagar una declaración ya aprobada', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const aprobada = procesarPagoSimulado(declaracion, 'aprobado', FECHA_FIJA, 1).declaracion
    expect(() => procesarPagoSimulado(aprobada, 'aprobado', FECHA_FIJA, 2)).toThrow()
  })
})

describe('Caso 11: constancia generada tras un pago aprobado', () => {
  it('Genera la constancia con todos los datos exigidos', () => {
    const declaracion = crearDeclaracionEnBandeja(1)
    const resultado = procesarPagoSimulado(declaracion, 'aprobado', FECHA_FIJA, 1)

    expect(resultado.constancia).not.toBeNull()
    const constancia = resultado.constancia!

    expect(constancia.titulo).toBe('CONSTANCIA')
    expect(constancia.formulario).toBe('Formulario Virtual N.º 1611 — Nuevo RUS')
    expect(constancia.periodo).toBe('03/2025')
    expect(constancia.ingresos).toBe(1325)
    expect(constancia.compras).toBe(1825)
    expect(constancia.categoria).toBe(1)
    expect(constancia.cuotaMensual).toBe(20)
    expect(constancia.interesMoratorio).toBe(0)
    expect(constancia.importePagado).toBe(20)
    expect(constancia.fechaOperacion).toBe('15/01/2025 09:30:45')
    expect(constancia.numeroOperacion).toBe('SIM-1611-20250115-0001')
    expect(constancia.estado).toBe('Pago aprobado')
  })

  it('La categoría 2 produce una constancia con cuota S/ 50', () => {
    const resultado = intentarAgregarABandeja(
      {
        periodo: '05/2025',
        rectificatoria: false,
        ingresosTexto: '6000',
        comprasTexto: '2000',
      },
      [],
      2,
      FECHA_FIJA,
    )
    expect(resultado.aceptada).toBe(true)
    if (!resultado.aceptada) return

    const pago = procesarPagoSimulado(resultado.declaracion, 'aprobado', FECHA_FIJA, 1)
    expect(pago.constancia).toMatchObject({
      categoria: 2,
      cuotaMensual: 50,
      importePagado: 50,
    })
  })

  it('El número de operación es determinista y siempre ficticio (prefijo SIM-)', () => {
    expect(generarNumeroOperacionSimulado(FECHA_FIJA, 1)).toBe('SIM-1611-20250115-0001')
    expect(generarNumeroOperacionSimulado(FECHA_FIJA, 9999)).toBe('SIM-1611-20250115-9999')
    expect(generarNumeroOperacionSimulado(new Date(2024, 11, 31), 7)).toBe(
      'SIM-1611-20241231-0007',
    )
  })
})
