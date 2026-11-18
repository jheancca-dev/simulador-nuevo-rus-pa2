/**
 * Reglas de cálculo del Nuevo RUS (categorías ordinarias 1 y 2).
 *
 * Funciones puras y deterministas: no dependen de React, del DOM ni del reloj,
 * por lo que pueden probarse automáticamente con Vitest.
 *
 * Reglas implementadas (versión académica):
 * - Categoría 1: ingresos Y compras mensuales como máximo S/ 5 000. Cuota: S/ 20.
 * - Categoría 2: el mayor importe entre ingresos y compras supera S/ 5 000
 *   sin superar S/ 8 000. Cuota: S/ 50.
 * - Fuera de rango: ingresos o compras superan S/ 8 000. Se impide continuar.
 *
 * Decisión explícita del prototipo: la categoría se determina con el MAYOR
 * importe entre ingresos y compras (nunca con la suma de ambos).
 * La categoría especial del Nuevo RUS queda fuera del alcance de esta versión.
 */

import type { CategoriaRus, ResultadoCalculo } from './tipos'

/** Límite superior (inclusive) de la Categoría 1. */
export const LIMITE_CATEGORIA_1 = 5000

/** Límite superior (inclusive) de la Categoría 2. */
export const LIMITE_CATEGORIA_2 = 8000

/** Cuota mensual de la Categoría 1 (casilla 503). */
export const CUOTA_CATEGORIA_1 = 20

/** Cuota mensual de la Categoría 2 (casilla 503). */
export const CUOTA_CATEGORIA_2 = 50

/**
 * Casilla 504. En esta versión solo se simulan declaraciones ordinarias
 * sin intereses moratorios, por lo que el valor es fijo en 0.
 */
export const INTERES_MORATORIO_SIMULADO = 0

/**
 * Casilla 509 (compensación de percepciones del IGV). Función NO implementada
 * en esta versión: no se aplican descuentos ficticios, valor fijo en 0.
 */
export const COMPENSACION_PERCEPCIONES_NO_IMPLEMENTADA = 0

/**
 * Redondea a dos decimales para evitar errores de coma flotante al comparar
 * importes monetarios (p. ej. 5000.01 + 0.004 debe seguir siendo 5000.01).
 */
export function redondearADosDecimales(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/**
 * Calcula la categoría, la cuota mensual y el importe a pagar.
 *
 * Precondición: `ingresos` y `compras` deben ser números finitos y no negativos
 * (la validación de entrada se hace en `validacion.ts`). Si se incumple, la
 * función lanza un error para evitar cálculos silenciosamente incorrectos.
 */
export function calcularCategoriaYCuota(ingresos: number, compras: number): ResultadoCalculo {
  if (!Number.isFinite(ingresos) || !Number.isFinite(compras)) {
    throw new Error('Los montos deben ser números finitos.')
  }
  if (ingresos < 0 || compras < 0) {
    throw new Error('Los montos no pueden ser negativos.')
  }

  const ingresosRedondeado = redondearADosDecimales(ingresos)
  const comprasRedondeado = redondearADosDecimales(compras)
  const mayorImporte = Math.max(ingresosRedondeado, comprasRedondeado)

  if (mayorImporte > LIMITE_CATEGORIA_2) {
    return {
      estado: 'fuera_de_rango',
      motivo:
        'Los ingresos o las compras superan S/ 8 000.00. La declaración no corresponde al flujo ordinario del Nuevo RUS (Categorías 1 y 2).',
    }
  }

  // Con mayorImporte <= 8000: categoría 2 si supera 5000, categoría 1 en caso contrario.
  // Nota: si mayorImporte <= 5000, AMBOS montos son <= 5000 (regla de la Categoría 1).
  const categoria: CategoriaRus = mayorImporte > LIMITE_CATEGORIA_1 ? 2 : 1
  const cuotaMensual = categoria === 1 ? CUOTA_CATEGORIA_1 : CUOTA_CATEGORIA_2

  return {
    estado: 'dentro_de_rango',
    categoria,
    cuotaMensual,
    importeAPagar: calcularImporteAPagar(cuotaMensual),
  }
}

/**
 * Casilla 505 (importe a pagar) = cuota (503) + interés moratorio (504) −
 * compensación de percepciones del IGV (509).
 *
 * En esta versión 504 = 0 y 509 = 0 (función no implementada), por lo que el
 * importe coincide con la cuota. La función mantiene la fórmula general para
 * que quede documentada la relación entre casillas.
 */
export function calcularImporteAPagar(
  cuotaMensual: number,
  interesMoratorio: number = INTERES_MORATORIO_SIMULADO,
  compensacionPercepciones: number = COMPENSACION_PERCEPCIONES_NO_IMPLEMENTADA,
): number {
  const importe = cuotaMensual + interesMoratorio - compensacionPercepciones
  return Math.max(0, redondearADosDecimales(importe))
}
