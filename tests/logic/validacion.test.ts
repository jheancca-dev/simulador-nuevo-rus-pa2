import { describe, expect, it } from 'vitest'
import { leerMonto, leerPeriodo, validarEntradaDeclaracion } from '@/lib/rus/validacion'

/**
 * Pruebas unitarias de validación de entradas.
 * Cubren los casos 7 y 8 exigidos en el enunciado y el tratamiento
 * expresamente definido de campos vacíos, ceros y datos inválidos.
 */
describe('Validación de montos (casillas 507 y 607)', () => {
  it('Caso 7: rechaza ingresos negativos con mensaje específico', () => {
    const lectura = leerMonto('-100')
    expect(lectura.esValido).toBe(false)
    expect(lectura.valor).toBeNull()
    expect(lectura.error).toContain('negativos')
  })

  it('Caso 8: rechaza campos vacíos (obligatorios)', () => {
    expect(leerMonto('').esValido).toBe(false)
    expect(leerMonto('   ').esValido).toBe(false)
    expect(leerMonto('').error).toContain('obligatorio')
  })

  it('Acepta enteros y hasta dos decimales', () => {
    expect(leerMonto('1325')).toEqual({ esValido: true, valor: 1325, error: null })
    expect(leerMonto('1325.50')).toEqual({ esValido: true, valor: 1325.5, error: null })
    expect(leerMonto('1325,50')).toEqual({ esValido: true, valor: 1325.5, error: null })
    expect(leerMonto('0')).toEqual({ esValido: true, valor: 0, error: null })
    expect(leerMonto('0.00')).toEqual({ esValido: true, valor: 0, error: null })
  })

  it('Acepta cero como valor válido (decisión documentada)', () => {
    const lectura = leerMonto('0')
    expect(lectura.esValido).toBe(true)
    expect(lectura.valor).toBe(0)
  })

  it('Rechaza más de dos decimales', () => {
    expect(leerMonto('1500.505').error).toContain('dos decimales')
    expect(leerMonto('1500,505').esValido).toBe(false)
  })

  it('Rechaza formatos inválidos (letras, símbolos, miles, punto final)', () => {
    expect(leerMonto('12a').esValido).toBe(false)
    expect(leerMonto('1,234.50').esValido).toBe(false)
    expect(leerMonto('12.').esValido).toBe(false)
    expect(leerMonto('S/ 100').esValido).toBe(false)
    expect(leerMonto('10 000').esValido).toBe(false)
  })

  it('Los mensajes de error son específicos y accionables', () => {
    expect(leerMonto('abc').error).toContain('1500')
  })
})

describe('Validación del período tributario (MM/AAAA)', () => {
  it('Rechaza período vacío como campo obligatorio', () => {
    const lectura = leerPeriodo('', '')
    expect(lectura.esValido).toBe(false)
    expect(lectura.error).toContain('obligatorio')
  })

  it('Rechaza período incompleto indicando lo que falta', () => {
    expect(leerPeriodo('03', '').error).toContain('año')
    expect(leerPeriodo('', '2025').error).toContain('mes')
  })

  it('Rechaza meses fuera de rango (13) o formatos incorrectos', () => {
    expect(leerPeriodo('13', '2025').esValido).toBe(false)
    expect(leerPeriodo('3', '2025').esValido).toBe(false)
    expect(leerPeriodo('03', '25').esValido).toBe(false)
  })

  it('Acepta períodos válidos y los normaliza', () => {
    expect(leerPeriodo('03', '2025')).toEqual({ esValido: true, valor: '03/2025', error: null })
    expect(leerPeriodo('12', '2024')).toEqual({ esValido: true, valor: '12/2024', error: null })
  })
})

describe('Validación de la declaración completa (caso 9)', () => {
  const base = {
    periodo: '03/2025',
    rectificatoria: false,
    ingresosTexto: '1325',
    comprasTexto: '1825',
  }

  it('Acepta una declaración válida y devuelve los datos calculados', () => {
    const resultado = validarEntradaDeclaracion(base)
    expect(resultado.esValida).toBe(true)
    if (resultado.esValida) {
      expect(resultado.datos).toEqual({
        periodo: '03/2025',
        ingresos: 1325,
        compras: 1825,
        categoria: 1,
        cuotaMensual: 20,
        interesMoratorio: 0,
        importeAPagar: 20,
      })
    }
  })

  it('Bloquea declaraciones inválidas acumulando errores por campo', () => {
    const resultado = validarEntradaDeclaracion({
      periodo: '',
      rectificatoria: false,
      ingresosTexto: '',
      comprasTexto: '-5',
    })
    expect(resultado.esValida).toBe(false)
    if (!resultado.esValida) {
      expect(resultado.errores.periodo).toBeTruthy()
      expect(resultado.errores.ingresos).toContain('obligatorio')
      expect(resultado.errores.compras).toContain('negativos')
      expect(resultado.errores.general).toBeUndefined()
    }
  })

  it('Bloquea la declaración rectificatoria (fuera de alcance)', () => {
    const resultado = validarEntradaDeclaracion({ ...base, rectificatoria: true })
    expect(resultado.esValida).toBe(false)
    if (!resultado.esValida) {
      expect(resultado.errores.rectificatoria).toContain('rectificatoria')
    }
  })

  it('Bloquea montos fuera de rango (mayores a S/ 8 000) con aviso general', () => {
    const resultado = validarEntradaDeclaracion({ ...base, ingresosTexto: '8000.01' })
    expect(resultado.esValida).toBe(false)
    if (!resultado.esValida) {
      expect(resultado.errores.general).toContain('8 000')
    }
  })
})
