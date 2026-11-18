/**
 * Perfil precargado del contribuyente.
 *
 * Módulo ÚNICO y reutilizable: la cabecera, el resumen de la declaración, la
 * constancia y las pruebas leen de aquí para evitar inconsistencias entre
 * pantallas. No existe inicio de sesión real: el perfil está precargado.
 *
 * Los números de DNI y RUC son marcadores de prueba (solo ceros), destinados
 * exclusivamente a pruebas. Este módulo no consulta ni valida datos contra
 * SUNAT ni contra ningún servicio externo.
 */

/** Datos del contribuyente de pruebas. */
export interface PerfilContribuyente {
  /** Nombre completo del contribuyente. */
  nombre: string
  /** DNI de prueba (8 ceros). */
  dni: string
  /** RUC de prueba (11 ceros). */
  ruc: string
  /** Régimen tributario del contribuyente. */
  regimen: string
  /** Etiqueta del tipo de usuario. */
  tipoCuenta: string
}

/** Contribuyente precargado, compartido por toda la aplicación. */
export const PERFIL_DEMOSTRACION: PerfilContribuyente = {
  nombre: 'Pepe Lucho Pérez',
  dni: '00000000',
  ruc: '00000000000',
  regimen: 'Nuevo RUS',
  tipoCuenta: 'Contribuyente del Nuevo RUS',
}

/** Aviso general de descargo (único aviso visible, en la parte superior). */
export const AVISO_DESCARGO =
  'AVISO: Esta no es una aplicación oficial de SUNAT y no realiza declaraciones ni pagos reales.'
