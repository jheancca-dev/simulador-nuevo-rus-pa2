/**
 * Perfil académico precargado del contribuyente ficticio.
 *
 * Módulo ÚNICO y reutilizable: la cabecera, el resumen de la declaración, la
 * constancia y las pruebas leen de aquí para evitar inconsistencias entre
 * pantallas. No existe inicio de sesión real: el perfil está precargado.
 *
 * Los números de DNI y RUC son marcadores deliberadamente NO VÁLIDOS (solo
 * ceros), destinados exclusivamente a pruebas académicas. Este módulo no
 * consulta ni valida datos contra SUNAT ni contra ningún servicio externo.
 */

/** Datos del contribuyente ficticio de pruebas. */
export interface PerfilContribuyente {
  /** Nombre completo del contribuyente ficticio. */
  nombre: string
  /** DNI ficticio de demostración (8 ceros). */
  dni: string
  /** RUC ficticio de demostración (11 ceros). */
  ruc: string
  /** Régimen tributario simulado. */
  regimen: string
  /** Etiqueta del tipo de usuario académico. */
  tipoCuenta: string
}

/** Contribuyente académico precargado, compartido por toda la aplicación. */
export const PERFIL_DEMOSTRACION: PerfilContribuyente = {
  nombre: 'Pepe Lucho Pérez',
  dni: '00000000',
  ruc: '00000000000',
  regimen: 'Nuevo RUS',
  tipoCuenta: 'Contribuyente ficticio de pruebas',
}

/** Nota permanente sobre el carácter ficticio de los datos de prueba. */
export const NOTA_DATOS_FICTICIOS =
  'Los números de DNI y RUC son marcadores deliberadamente no válidos, destinados exclusivamente a pruebas académicas. No se consultan ni se validan contra SUNAT.'
