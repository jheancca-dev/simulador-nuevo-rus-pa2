/**
 * Funciones de formato para la interfaz (español - Perú).
 * Funciones puras y deterministas (no usan Date.now() ni Math.random()).
 */

/** Formatea un monto como soles peruanos: 1325.5 -> "S/ 1 325.50". */
export function formatSoles(monto: number): string {
  const montoRedondeado = Math.round((monto + Number.EPSILON) * 100) / 100
  const partes = montoRedondeado.toFixed(2).split('.')
  const entero = partes[0]
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `S/ ${conMiles}.${partes[1]}`
}

/** Formatea una fecha como "dd/mm/aaaa hh:mm:ss" (hora local, 24 horas). */
export function formatFechaOperacion(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const aaaa = String(fecha.getFullYear()).padStart(4, '0')
  const hh = String(fecha.getHours()).padStart(2, '0')
  const mi = String(fecha.getMinutes()).padStart(2, '0')
  const ss = String(fecha.getSeconds()).padStart(2, '0')
  return `${dd}/${mm}/${aaaa} ${hh}:${mi}:${ss}`
}

/** Etiqueta legible de la categoría: 1 -> "Categoría 1". */
export function formatCategoria(categoria: 1 | 2): string {
  return `Categoría ${categoria}`
}

/** Etiqueta legible del estado de una declaración en la bandeja. */
export function formatEstadoDeclaracion(
  estado: 'agregada_bandeja' | 'pago_rechazado' | 'pago_aprobado',
): string {
  if (estado === 'pago_aprobado') return 'Pago aprobado'
  if (estado === 'pago_rechazado') return 'Pago rechazado'
  return 'Agregado a bandeja'
}
