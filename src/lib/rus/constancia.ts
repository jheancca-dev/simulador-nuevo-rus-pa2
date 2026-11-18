/**
 * Generación de la constancia académica simulada (etapa 4).
 *
 * Funciones puras y deterministas:
 * - `generarNumeroOperacionSimulado(fecha, secuencia)` recibe la fecha y la
 *   secuencia como parámetros, así las pruebas no dependen del reloj.
 * - Todos los números de operación usan el prefijo SIM- y el texto de la
 *   constancia se identifica como académico, para que ningún documento pueda
 *   confundirse con un comprobante tributario auténtico de SUNAT.
 */

import { PERFIL_DEMOSTRACION } from './perfil'
import { formatFechaOperacion } from './formato'
import type { ConstanciaSimulada, Declaracion } from './tipos'

/** Estado exigido en la constancia tras un pago de prueba aprobado. */
export const ESTADO_CONSTANCIA = 'Pago simulado aprobado' as const

/**
 * Genera un número de operación FICTICIO con formato:
 *   SIM-1611-AAAAMMDD-NNNN
 * donde NNNN es la secuencia entregada por el llamador (4 dígitos).
 *
 * El prefijo "SIM" y el identificador "1611" referencian al simulador y al
 * formulario académico; no siguen ningún formato oficial de SUNAT ni de una
 * entidad financiera real.
 */
export function generarNumeroOperacionSimulado(fecha: Date, secuencia: number): string {
  const anio = String(fecha.getFullYear()).padStart(4, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  const secuenciaFormateada = String(Math.max(1, Math.floor(secuencia))).padStart(4, '0')
  return `SIM-1611-${anio}${mes}${dia}-${secuenciaFormateada}`
}

/**
 * Construye la constancia simulada a partir de una declaración que ya tiene
 * un pago de prueba aprobado. Esta función NO decide si se aprueba el pago:
 * esa decisión vive en `flujo.ts/procesarPagoSimulado`.
 *
 * Los datos del contribuyente provienen siempre del perfil de demostración
 * (`perfil.ts`), único módulo de datos de prueba, para evitar inconsistencias.
 */
export function generarConstanciaSimulada(
  declaracion: Declaracion,
  numeroOperacion: string,
  fechaOperacion: Date,
): ConstanciaSimulada {
  return {
    titulo: 'CONSTANCIA ACADÉMICA SIMULADA',
    formulario: 'Formulario Virtual N.º 1611 — Nuevo RUS',
    contribuyenteNombre: PERFIL_DEMOSTRACION.nombre,
    contribuyenteDni: PERFIL_DEMOSTRACION.dni,
    contribuyenteRuc: PERFIL_DEMOSTRACION.ruc,
    periodo: declaracion.periodo,
    ingresos: declaracion.ingresos,
    compras: declaracion.compras,
    categoria: declaracion.categoria,
    cuotaMensual: declaracion.cuotaMensual,
    interesMoratorio: declaracion.interesMoratorio,
    importePagado: declaracion.importeAPagar,
    fechaOperacion: formatFechaOperacion(fechaOperacion),
    numeroOperacion,
    estado: ESTADO_CONSTANCIA,
  }
}
