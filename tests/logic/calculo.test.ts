import { describe, expect, it } from 'vitest'
import {
  CUOTA_CATEGORIA_1,
  CUOTA_CATEGORIA_2,
  LIMITE_CATEGORIA_1,
  LIMITE_CATEGORIA_2,
  calcularCategoriaYCuota,
  calcularImporteAPagar,
  redondearADosDecimales,
} from '@/lib/rus/calculo'
import { formatSoles } from '@/lib/rus/formato'

/**
 * Pruebas unitarias de las reglas del Nuevo RUS (categorías ordinarias).
 * Cubren los casos 1 a 6 exigidos en el enunciado y casos límite adicionales.
 */
describe('Reglas del Nuevo RUS: categoría y cuota', () => {
  it('Caso 1: ingresos S/ 1 325 y compras S/ 1 825 -> Categoría 1 con cuota S/ 20', () => {
    const resultado = calcularCategoriaYCuota(1325, 1825)
    expect(resultado).toEqual({
      estado: 'dentro_de_rango',
      categoria: 1,
      cuotaMensual: 20,
      importeAPagar: 20,
    })
  })

  it('Caso 2: ingresos S/ 6 000 y compras S/ 2 000 -> Categoría 2 con cuota S/ 50', () => {
    const resultado = calcularCategoriaYCuota(6000, 2000)
    expect(resultado).toEqual({
      estado: 'dentro_de_rango',
      categoria: 2,
      cuotaMensual: 50,
      importeAPagar: 50,
    })
  })

  it('Caso 2 (inverso): compras S/ 6 000 e ingresos S/ 2 000 -> Categoría 2', () => {
    const resultado = calcularCategoriaYCuota(2000, 6000)
    expect(resultado).toMatchObject({ estado: 'dentro_de_rango', categoria: 2 })
  })

  it('Caso 3: valor límite S/ 5 000 -> Categoría 1', () => {
    expect(calcularCategoriaYCuota(5000, 0)).toMatchObject({ categoria: 1, cuotaMensual: 20 })
    expect(calcularCategoriaYCuota(0, 5000)).toMatchObject({ categoria: 1, cuotaMensual: 20 })
    expect(calcularCategoriaYCuota(5000, 5000)).toMatchObject({ categoria: 1, cuotaMensual: 20 })
  })

  it('Caso 4: valor S/ 5 000.01 -> Categoría 2', () => {
    expect(calcularCategoriaYCuota(5000.01, 0)).toMatchObject({ categoria: 2, cuotaMensual: 50 })
    expect(calcularCategoriaYCuota(0, 5000.01)).toMatchObject({ categoria: 2, cuotaMensual: 50 })
  })

  it('Caso 5: valor límite S/ 8 000 -> Categoría 2 (sigue dentro de rango)', () => {
    expect(calcularCategoriaYCuota(8000, 0)).toMatchObject({ categoria: 2, cuotaMensual: 50 })
    expect(calcularCategoriaYCuota(0, 8000)).toMatchObject({ categoria: 2, cuotaMensual: 50 })
  })

  it('Caso 6: valor S/ 8 000.01 -> fuera de rango', () => {
    const resultado = calcularCategoriaYCuota(8000.01, 0)
    expect(resultado.estado).toBe('fuera_de_rango')
    if (resultado.estado === 'fuera_de_rango') {
      expect(resultado.motivo).toContain('8 000')
    }
  })

  it('Caso 6 (inverso): compras S/ 8 000.01 -> fuera de rango aunque los ingresos sean bajos', () => {
    expect(calcularCategoriaYCuota(100, 8000.01).estado).toBe('fuera_de_rango')
  })

  it('La categoría usa el MAYOR importe (no la suma) entre ingresos y compras', () => {
    // 3000 + 3000 = 6000 sumados, pero el mayor importe es 3000 -> Categoría 1.
    expect(calcularCategoriaYCuota(3000, 3000)).toMatchObject({ categoria: 1, cuotaMensual: 20 })
  })

  it('Valores cero: 0 y 0 es válido y conduce a Categoría 1 (decisión documentada)', () => {
    expect(calcularCategoriaYCuota(0, 0)).toMatchObject({ categoria: 1, cuotaMensual: 20 })
  })

  it('Rechaza montos negativos (precondición) lanzando error', () => {
    expect(() => calcularCategoriaYCuota(-1, 100)).toThrow()
    expect(() => calcularCategoriaYCuota(100, -0.01)).toThrow()
  })

  it('Rechaza valores no finitos lanzando error', () => {
    expect(() => calcularCategoriaYCuota(Number.NaN, 100)).toThrow()
    expect(() => calcularCategoriaYCuota(Number.POSITIVE_INFINITY, 100)).toThrow()
  })
})

describe('Constantes de negocio', () => {
  it('Límites y cuotas corresponden a las reglas definidas', () => {
    expect(LIMITE_CATEGORIA_1).toBe(5000)
    expect(LIMITE_CATEGORIA_2).toBe(8000)
    expect(CUOTA_CATEGORIA_1).toBe(20)
    expect(CUOTA_CATEGORIA_2).toBe(50)
  })
})

describe('Casilla 505: importe a pagar', () => {
  it('Es la cuota cuando interés y compensación son 0 (versión simulada)', () => {
    expect(calcularImporteAPagar(20)).toBe(20)
    expect(calcularImporteAPagar(50)).toBe(50)
  })

  it('Mantiene la fórmula general cuota + interés − compensación', () => {
    expect(calcularImporteAPagar(50, 5)).toBe(55)
    expect(calcularImporteAPagar(50, 5, 10)).toBe(45)
  })

  it('Nunca es negativo', () => {
    expect(calcularImporteAPagar(20, 0, 100)).toBe(0)
  })
})

describe('Funciones auxiliares', () => {
  it('redondearADosDecimales evita errores de coma flotante', () => {
    expect(redondearADosDecimales(5000.005)).toBe(5000.01)
    expect(redondearADosDecimales(1825)).toBe(1825)
  })

  it('formatSoles presenta montos legibles en es-PE', () => {
    expect(formatSoles(20)).toBe('S/ 20.00')
    expect(formatSoles(1325.5)).toBe('S/ 1 325.50')
    expect(formatSoles(0)).toBe('S/ 0.00')
  })
})
