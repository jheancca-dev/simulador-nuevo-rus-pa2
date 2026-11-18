/**
 * Funciones de flujo (nivel de integración entre módulos de negocio).
 *
 * Aquí se coordinan validación, cálculo, bandeja y pago simulado SIN tocar la
 * interfaz. Son funciones puras: reciben la bandeja y devuelven una nueva
 * bandeja (inmutabilidad) para que sean deterministas y fáciles de probar.
 */

import { generarConstanciaSimulada, generarNumeroOperacionSimulado } from './constancia'
import { validarEntradaDeclaracion } from './validacion'
import type {
  DecisionPago,
  Declaracion,
  EntradaDeclaracion,
  IntentoAgregar,
  ResultadoProcesarPago,
} from './tipos'

/**
 * Intenta validar y agregar una declaración a la bandeja temporal.
 *
 * Bloqueos implementados (devuelve `aceptada: false` con errores por campo):
 * 1. Período tributario vacío o inválido.
 * 2. Declaración rectificatoria (fuera del alcance de esta versión).
 * 3. Montos vacíos, negativos, con formato inválido o con más de dos decimales.
 * 4. Montos fuera del rango ordinario (mayores a S/ 8 000).
 * 5. Período duplicado: ya existe una declaración para el mismo MM/AAAA en la bandeja.
 *
 * `secuencia` es el número correlativo del simulador para el identificador
 * interno DECL-NNNN (el llamador controla el contador, lo que mantiene la
 * función determinista y probada sin dependencias globales).
 */
export function intentarAgregarABandeja(
  entrada: EntradaDeclaracion,
  bandeja: Declaracion[],
  secuencia: number,
  fechaAgregado: Date,
): IntentoAgregar {
  const validacion = validarEntradaDeclaracion(entrada)
  if (!validacion.esValida || validacion.datos === null) {
    return { aceptada: false, errores: validacion.errores ?? {} }
  }

  const duplicada = bandeja.some((d) => d.periodo === validacion.datos.periodo)
  if (duplicada) {
    return {
      aceptada: false,
      errores: {
        periodo: `Ya existe una declaración para el período ${validacion.datos.periodo} en la bandeja. Elimínela o elija otro período.`,
      },
    }
  }

  const secuenciaSegura = Math.max(1, Math.floor(secuencia))
  const declaracion: Declaracion = {
    id: `DECL-${String(secuenciaSegura).padStart(4, '0')}`,
    periodo: validacion.datos.periodo,
    rectificatoria: entrada.rectificatoria,
    ingresos: validacion.datos.ingresos,
    compras: validacion.datos.compras,
    categoria: validacion.datos.categoria,
    cuotaMensual: validacion.datos.cuotaMensual,
    interesMoratorio: validacion.datos.interesMoratorio,
    importeAPagar: validacion.datos.importeAPagar,
    estado: 'agregada_bandeja',
    fechaAgregadoISO: fechaAgregado.toISOString(),
  }

  return { aceptada: true, declaracion }
}

/**
 * Procesa la decisión tomada en la pantalla de pago de prueba.
 *
 * Comportamiento esperado (requisito del enunciado):
 * - 'aprobado'  -> registra el resultado, cambia el estado a «Pago simulado
 *                  aprobado» y genera la constancia simulada.
 * - 'rechazado' -> NO genera constancia; la declaración pasa al estado
 *                  «Pago simulado rechazado» y admite reintento o corrección.
 * - 'cancelado' -> lo maneja la interfaz: regresa a la bandeja sin perder
 *                  datos y muestra `MENSAJE_OPERACION_CANCELADA`.
 *
 * Garantía probada: un pago rechazado o cancelado jamás produce constancia;
 * solo la decisión 'aprobado' llega a `generarConstanciaSimulada`.
 *
 * `fechaOperacion` y `secuenciaOperacion` llegan como parámetros para que la
 * generación del número ficticio sea determinista en las pruebas.
 */
export function procesarPagoSimulado(
  declaracion: Declaracion,
  decision: Exclude<DecisionPago, 'cancelado'>,
  fechaOperacion: Date,
  secuenciaOperacion: number,
): ResultadoProcesarPago {
  if (declaracion.estado === 'pago_aprobado') {
    throw new Error('La declaración ya tiene un pago simulado aprobado.')
  }

  if (decision === 'rechazado') {
    return {
      constancia: null,
      declaracion: { ...declaracion, estado: 'pago_rechazado' },
      mensaje:
        'Pago simulado rechazado: no se generó constancia. Puede intentar el pago nuevamente, cancelar la operación o corregir los datos desde la bandeja.',
    }
  }

  const numeroOperacion = generarNumeroOperacionSimulado(fechaOperacion, secuenciaOperacion)
  const constancia = generarConstanciaSimulada(declaracion, numeroOperacion, fechaOperacion)

  return {
    constancia,
    declaracion: {
      ...declaracion,
      estado: 'pago_aprobado',
    },
    mensaje: 'Pago simulado aprobado: puede generar la constancia académica simulada.',
  }
}

/**
 * Notificación mostrada cuando el usuario cancela la operación de pago:
 * la declaración permanece en la bandeja con su último estado y sin constancia.
 */
export const MENSAJE_OPERACION_CANCELADA =
  'Operación cancelada: la declaración se conserva en la bandeja con sus datos y no se generó constancia.'

/**
 * Reemplaza (por id) una declaración dentro de la bandeja y devuelve la nueva
 * bandeja. Función auxiliar inmutable usada por los componentes React.
 */
export function actualizarDeclaracionEnBandeja(
  bandeja: Declaracion[],
  declaracionActualizada: Declaracion,
): Declaracion[] {
  return bandeja.map((d) => (d.id === declaracionActualizada.id ? declaracionActualizada : d))
}
