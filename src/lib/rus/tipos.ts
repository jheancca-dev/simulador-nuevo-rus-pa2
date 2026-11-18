/**
 * Tipos compartidos del Simulador Académico del Formulario Virtual N.º 1611 (Nuevo RUS).
 *
 * Este módulo NO contiene lógica ni acceso a la interfaz: solo contratos de datos
 * para que las funciones de negocio y los componentes visuales hablen el mismo idioma.
 */

/** Categorías ordinarias del Nuevo RUS incluidas en esta versión del simulador. */
export type CategoriaRus = 1 | 2

/** Etapas del flujo simulado, en el mismo orden que la barra superior. */
export type Etapa = 1 | 2 | 3 | 4

/**
 * Estado de una declaración dentro de la bandeja temporal.
 *
 * Estados diferenciados del prototipo:
 * - «Agregado a bandeja»: declaración registrada, aún sin intento de pago.
 * - «Pago simulado rechazado»: el pago de prueba fue rechazado; puede
 *   reintentarse o corregirse, pero NUNCA genera constancia.
 * - «Pago simulado aprobado»: pago de prueba aprobado; constancia disponible.
 *
 * La «operación cancelada» no es un estado persistente: al cancelar se regresa
 * a la bandeja conservando la declaración con su último estado y se muestra la
 * notificación `MENSAJE_OPERACION_CANCELADA` (ver `flujo.ts`).
 */
export type EstadoDeclaracion =
  | 'agregada_bandeja' // «Agregado a bandeja»: aún sin pago simulado.
  | 'pago_rechazado' // «Pago simulado rechazado»: sin constancia, admite reintento.
  | 'pago_aprobado' // «Pago simulado aprobado»: constancia disponible.

/** Decisión posible en la pantalla de pago de prueba (completamente ficticia). */
export type DecisionPago = 'aprobado' | 'rechazado' | 'cancelado'

/** Datos tal como los ingresa el usuario en la etapa «Complete». */
export interface EntradaDeclaracion {
  /** Período tributario en formato MM/AAAA. */
  periodo: string
  /** true si el usuario marca «Sí» en declaración rectificatoria (fuera de alcance). */
  rectificatoria: boolean
  /** Texto crudo del campo casilla 507 (total de ingresos brutos). */
  ingresosTexto: string
  /** Texto crudo del campo casilla 607 (total de adquisiciones o compras). */
  comprasTexto: string
}

/** Resultado del cálculo de categoría y cuota (función pura, determinista). */
export type ResultadoCalculo =
  | {
      estado: 'dentro_de_rango'
      categoria: CategoriaRus
      /** Cuota mensual (casilla 503). */
      cuotaMensual: number
      /** Importe a pagar (casilla 505): cuota + interés − compensación. */
      importeAPagar: number
    }
  | {
      estado: 'fuera_de_rango'
      /** Motivo legible del bloqueo. */
      motivo: string
    }

/** Errores de validación por campo (cadenas vacías = campo sin error). */
export interface ErroresValidacion {
  periodo?: string
  rectificatoria?: string
  ingresos?: string
  compras?: string
  /** Error general que no corresponde a un único campo (p. ej. fuera de rango). */
  general?: string
}

/** Declaración registrada en la bandeja temporal (en memoria, sin persistencia). */
export interface Declaracion {
  /** Identificador interno del simulador, p. ej. DECL-0001. */
  id: string
  periodo: string
  rectificatoria: boolean
  /** Casilla 507. */
  ingresos: number
  /** Casilla 607. */
  compras: number
  /** Casilla 400. */
  categoria: CategoriaRus
  /** Casilla 503. */
  cuotaMensual: number
  /** Casilla 504. En esta versión siempre es 0 (declaraciones ordinarias sin intereses). */
  interesMoratorio: number
  /** Casilla 505. */
  importeAPagar: number
  estado: EstadoDeclaracion
  /** Fecha ISO de cuando se agregó a la bandeja. */
  fechaAgregadoISO: string
}

/** Resultado del intento de agregar una declaración a la bandeja. */
export type IntentoAgregar =
  | { aceptada: true; declaracion: Declaracion }
  | { aceptada: false; errores: ErroresValidacion }

/** Resultado ficticio registrado tras usar la pantalla de pago de prueba. */
export interface ResultadoPagoSimulado {
  aprobado: boolean
  /** Fecha ISO de la operación simulada. */
  fechaOperacionISO: string
  /** Número de operación ficticio con prefijo SIM-, p. ej. SIM-1611-20250115-0001. */
  numeroOperacion: string
  mensaje: string
}

/** Constancia académica simulada (etapa 4). */
export interface ConstanciaSimulada {
  titulo: 'CONSTANCIA ACADÉMICA SIMULADA'
  formulario: 'Formulario Virtual N.º 1611 — Nuevo RUS'
  /** Nombre del contribuyente ficticio (tomado del perfil de demostración). */
  contribuyenteNombre: string
  /** DNI de demostración (marcador no válido). */
  contribuyenteDni: string
  /** RUC de demostración (marcador no válido). */
  contribuyenteRuc: string
  periodo: string
  /** Casilla 507. */
  ingresos: number
  /** Casilla 607. */
  compras: number
  /** Casilla 400. */
  categoria: CategoriaRus
  /** Casilla 503. */
  cuotaMensual: number
  /** Casilla 504. */
  interesMoratorio: number
  /** Casilla 505: importe pagado ficticiamente. */
  importePagado: number
  /** Fecha legible de la operación simulada (dd/mm/aaaa hh:mm:ss). */
  fechaOperacion: string
  /** Número de operación ficticio con prefijo SIM-. */
  numeroOperacion: string
  estado: 'Pago simulado aprobado'
}

/** Resultado de procesar un pago simulado sobre una declaración de la bandeja. */
export interface ResultadoProcesarPago {
  /** null cuando el pago es rechazado (nunca se genera constancia). */
  constancia: ConstanciaSimulada | null
  declaracion: Declaracion
  mensaje: string
}
