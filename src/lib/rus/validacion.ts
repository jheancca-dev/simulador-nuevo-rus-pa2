/**
 * Validación de entradas del formulario (etapa «Complete»).
 *
 * Funciones puras y deterministas, independientes de la interfaz.
 *
 * Tratamiento definido de los casos límite:
 * - Campo VACÍO (o solo espacios)      -> error de campo obligatorio.
 * - Valor NEGATIVO                     -> error específico (no se admiten negativos).
 * - Más de DOS decimales               -> error específico de decimales.
 * - Caracteres no numéricos / formato  -> error de formato (ejemplos incluidos).
 * - Valor CERO                         -> VÁLIDO: se trata como monto ingresado y
 *                                          sigue las reglas ordinarias (0 ≤ 5 000
 *                                          conduce a Categoría 1, cuota S/ 20).
 * - Separador decimal                  -> se aceptan punto (.) y coma (,).
 * - Separadores de miles               -> NO se aceptan (formato inválido).
 */

import { calcularCategoriaYCuota } from './calculo'
import type { ErroresValidacion } from './tipos'

/** Formato aceptado: dígitos con separador decimal opcional de 1 o 2 cifras. */
const PATRON_MONTO = /^\d+([.,]\d{1,2})?$/
/** Patrón auxiliar para dar un mensaje más específico cuando hay 3+ decimales. */
const PATRON_TRES_DECIMALES = /^\d+[.,]\d{3,}$/

export interface LecturaMonto {
  esValido: boolean
  /** Valor numérico normalizado (coma -> punto). null cuando es inválido. */
  valor: number | null
  /** Mensaje de error legible. null cuando es válido. */
  error: string | null
}

/**
 * Lee y valida el texto crudo de un campo monetario del formulario.
 * Es la única puerta de entrada de montos hacia la lógica de cálculo.
 */
export function leerMonto(texto: string): LecturaMonto {
  const limpio = texto.trim()

  if (limpio === '') {
    return {
      esValido: false,
      valor: null,
      error: 'Campo obligatorio: ingrese el monto en soles (S/).',
    }
  }

  if (limpio.startsWith('-')) {
    return {
      esValido: false,
      valor: null,
      error: 'No se admiten valores negativos: ingrese un monto mayor o igual a 0.',
    }
  }

  if (PATRON_TRES_DECIMALES.test(limpio)) {
    return {
      esValido: false,
      valor: null,
      error: 'Hasta dos decimales: use como máximo dos cifras después del punto o la coma.',
    }
  }

  if (!PATRON_MONTO.test(limpio)) {
    return {
      esValido: false,
      valor: null,
      error: 'Formato inválido: use solo números con hasta dos decimales (ejemplos: 1500 o 1500.50).',
    }
  }

  const valor = Number(limpio.replace(',', '.'))
  if (!Number.isFinite(valor)) {
    return {
      esValido: false,
      valor: null,
      error: 'Formato inválido: no se pudo interpretar el monto ingresado.',
    }
  }

  return { esValido: true, valor, error: null }
}

/** Patrón del período tributario: MM/AAAA con mes de 01 a 12. */
const PATRON_PERIODO = /^(0[1-9]|1[0-2])\/\d{4}$/

export interface LecturaPeriodo {
  esValido: boolean
  /** Período normalizado en formato MM/AAAA. null cuando es inválido. */
  valor: string | null
  error: string | null
}

/**
 * Valida el período tributario compuesto por los selectores de mes y año.
 * `mes` debe ser 'MM' o '' y `anio` 'AAAA' o '' según lo seleccionado.
 */
export function leerPeriodo(mes: string, anio: string): LecturaPeriodo {
  if (mes === '' && anio === '') {
    return {
      esValido: false,
      valor: null,
      error: 'Campo obligatorio: seleccione el mes y el año del período tributario.',
    }
  }
  if (mes === '') {
    return { esValido: false, valor: null, error: 'Campo obligatorio: seleccione el mes.' }
  }
  if (anio === '') {
    return { esValido: false, valor: null, error: 'Campo obligatorio: seleccione el año.' }
  }

  const periodo = `${mes}/${anio}`
  if (!PATRON_PERIODO.test(periodo)) {
    return {
      esValido: false,
      valor: null,
      error: 'Formato inválido: el período debe tener el formato MM/AAAA (por ejemplo, 03/2025).',
    }
  }

  return { esValido: true, valor: periodo, error: null }
}

/**
 * Valida una entrada completa y calcula sus valores (categoría, cuota, importe).
 * Devuelve los errores por campo, o los datos listos para la bandeja.
 *
 * Reglas de bloqueo:
 * - La declaración rectificatoria está fuera del alcance de esta versión.
 * - Ingresos o compras mayores a S/ 8 000 -> fuera de rango, no se permite continuar.
 */
export function validarEntradaDeclaracion(entrada: {
  periodo: string
  rectificatoria: boolean
  ingresosTexto: string
  comprasTexto: string
}): { esValida: boolean; errores: ErroresValidacion; datos: null } | {
  esValida: true
  errores: null
  datos: {
    periodo: string
    ingresos: number
    compras: number
    categoria: 1 | 2
    cuotaMensual: number
    interesMoratorio: number
    importeAPagar: number
  }
} {
  const errores: ErroresValidacion = {}

  const periodo = leerPeriodo(...splitPeriodo(entrada.periodo))
  if (!periodo.esValido) {
    errores.periodo = periodo.error ?? 'Período tributario inválido.'
  }

  if (entrada.rectificatoria) {
    errores.rectificatoria =
      'La declaración rectificatoria está fuera del alcance de esta versión. Solo se procesan declaraciones ordinarias.'
  }

  const ingresos = leerMonto(entrada.ingresosTexto)
  if (!ingresos.esValido) {
    errores.ingresos = ingresos.error
  }

  const compras = leerMonto(entrada.comprasTexto)
  if (!compras.esValido) {
    errores.compras = compras.error
  }

  // Si hay errores básicos (período, rectificatoria o montos), no se calcula
  // ni se permite continuar: la declaración queda bloqueada.
  if (Object.keys(errores).length > 0) {
    return { esValida: false, errores, datos: null }
  }

  try {
    const calculo = calcularCategoriaYCuota(ingresos.valor as number, compras.valor as number)
    if (calculo.estado === 'fuera_de_rango') {
      errores.general = calculo.motivo
      return { esValida: false, errores, datos: null }
    }

    return {
      esValida: true,
      errores: null,
      datos: {
        periodo: periodo.valor as string,
        ingresos: ingresos.valor as number,
        compras: compras.valor as number,
        categoria: calculo.categoria,
        cuotaMensual: calculo.cuotaMensual,
        interesMoratorio: 0,
        importeAPagar: calculo.importeAPagar,
      },
    }
  } catch {
    // Defensa adicional: montos negativos u otros valores no finitos.
    errores.general = 'No se pudo calcular la declaración con los montos ingresados.'
    return { esValida: false, errores, datos: null }
  }
}

/** Separa un período 'MM/AAAA' en [mes, anio]; devuelve ['', ''] si no aplica. */
export function splitPeriodo(periodo: string): [string, string] {
  const partes = periodo.split('/')
  if (partes.length !== 2) return ['', '']
  return [partes[0], partes[1]]
}
