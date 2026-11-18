# Simulador Académico del Formulario Virtual N.º 1611 — Nuevo RUS

> **SIMULADOR ACADÉMICO** — No es una aplicación oficial de SUNAT. No realiza declaraciones ni
> pagos reales. No se conecta a sistemas de SUNAT, bancos, Yape ni pasarelas de pago.

Prototipo educativo desarrollado como proyecto universitario del curso **Pruebas y Calidad de
Software**. Simula un único proceso: la **declaración mensual del Nuevo RUS** mediante el
Formulario Virtual N.º 1611, desde el ingreso de información hasta la generación de una
constancia ficticia.

---

## Índice

1. [Instalación y ejecución](#1-instalación-y-ejecución)
2. [Pruebas automatizadas](#2-pruebas-automatizadas)
3. [Arquitectura del proyecto](#3-arquitectura-del-proyecto)
4. [Funciones principales](#4-funciones-principales)
5. [Requisitos funcionales](#5-requisitos-funcionales)
6. [Requisitos no funcionales](#6-requisitos-no-funcionales)
7. [Cobertura de los casos de prueba exigidos](#7-cobertura-de-los-casos-de-prueba-exigidos)
8. [Limitaciones del prototipo](#8-limitaciones-del-prototipo)

---

## 1. Instalación y ejecución

### Requisitos previos

- Node.js 20+ o Bun 1.2+ (entorno de desarrollo usado: Bun).
- Sin claves de API, sin base de datos y sin variables de entorno: el simulador funciona 100 %
  en memoria y no requiere configuración adicional.

### Pasos

```bash
# 1. Instalar dependencias
bun install          # o: npm install

# 2. Iniciar la aplicación en modo desarrollo
bun run dev          # o: npm run dev
# Abrir http://localhost:3000 en Chrome o Edge

# 3. Ejecutar las pruebas automatizadas
bun run test         # o: npm test

# 4. (Opcional) Pruebas en modo observación
bun run test:watch   # o: npm run test:watch

# 5. (Opcional) Verificación de calidad de código
bun run lint         # o: npm run lint
```

La aplicación es apta para publicarse como aplicación web (`npm run build` /
`npm run start` en un entorno con Next.js).

---

## 2. Pruebas automatizadas

Las pruebas usan **Vitest** (unitarias e integración) y **Testing Library** (funcionales, a
nivel de interfaz). Están organizadas así:

| Archivo | Tipo | Entorno |
| --- | --- | --- |
| `tests/logic/calculo.test.ts` | Unitarias (reglas de cálculo) | Node |
| `tests/logic/validacion.test.ts` | Unitarias (validación de entradas) | Node |
| `tests/logic/flujo.test.ts` | Integración (bandeja + pago + constancia) | Node |
| `tests/ui/flujo-sistema.test.tsx` | Funcionales / sistema (flujo completo en UI) | jsdom |

Comandos:

```bash
bun run test         # ejecuta todas las suites una vez (vitest run)
bun run test:watch   # modo observación para desarrollo (vitest)
```

**Estado de ejecución:** en el entorno de desarrollo de este proyecto se ejecutaron las suites
con `bun run test` obteniendo **54 pruebas aprobadas (4 archivos de prueba, 0 fallos)**. Los
resultados pueden reproducirse localmente con los comandos indicados.

### Resumen de cada suite

- **calculo.test.ts (18 pruebas):** categorías 1 y 2, límites de S/ 5 000 y S/ 8 000, valores
  entre límites, fuera de rango, regla del «mayor importe» (no la suma), valores cero, montos
  negativos rechazados, casilla 505 y utilidades de formato.
- **validacion.test.ts (15 pruebas):** campos obligatorios, negativos, más de dos decimales,
  formatos inválidos, separador decimal (punto o coma), período MM/AAAA y validación completa de
  la declaración.
- **flujo.test.ts (12 pruebas):** bloqueo de declaraciones inválidas, período duplicado,
  rectificatoria bloqueada, pago rechazado (sin constancia), reintento tras rechazo, pago
  aprobado (constancia completa) y número de operación determinista `SIM-…`.
- **flujo-sistema.test.tsx (9 pruebas):** recorren la interfaz real: selección, formulario con
  cálculo en vivo, errores junto a los campos, confirmación Sí/No, pago de prueba aprobado y
  rechazado, constancia y navegación entre etapas.

---

## 3. Arquitectura del proyecto

```
src/
├── app/
│   ├── layout.tsx                  # Metadatos e idioma (es)
│   ├── page.tsx                    # Página única: encabezado, advertencia, pie
│   └── globals.css                 # Tema institucional (azul/blanco/gris) + impresión
├── lib/rus/                        # LÓGICA DE NEGOCIO (independiente de la UI)
│   ├── tipos.ts                    # Contratos de datos (Declaracion, Constancia, etc.)
│   ├── calculo.ts                  # Reglas Nuevo RUS: categoría, cuota, importe
│   ├── validacion.ts               # Lectura/validación de montos y período
│   ├── constancia.ts               # Constancia simulada + número de operación SIM-
│   ├── flujo.ts                    # Integración: bandeja, pago simulado, actualización
│   └── formato.ts                  # Formato es-PE (soles, fechas, etiquetas)
└── components/
    ├── ui/                         # Componentes shadcn/ui reutilizados
    └── rus/                        # Componentes del simulador
        ├── simulador-rus.tsx       # Orquestador (máquina de estados de etapas)
        ├── barra-etapas.tsx        # Etapas: Seleccione/Complete/Presente/Pague/Constancia
        ├── pantalla-seleccion.tsx  # Etapa 1
        ├── formulario-declaracion.tsx # Etapa 2 (casillas 507/607 editables)
        ├── vista-bandeja.tsx       # Etapa 3 (bandeja + confirmación Sí/No)
        ├── pantalla-pago.tsx       # Etapa 3 (pago de prueba ficticio)
        └── vista-constancia.tsx    # Etapa 4 (imprimir/guardar)
tests/
├── setup.ts                        # Configuración común de pruebas
├── logic/                          # Pruebas unitarias y de integración
└── ui/                             # Pruebas funcionales con Testing Library
```

**Principios aplicados**

- *Lógica separada de la vista:* `src/lib/rus` no importa React ni el DOM; los componentes solo
  coordinan estado y delegan las reglas.
- *Funciones deterministas:* la fecha y la secuencia de operación se pasan como parámetros, por
  lo que las pruebas no dependen del reloj ni del azar.
- *Bandeja temporal en memoria:* al recargar la página se reinicia; no se almacena información
  personal.
- *Componentes reutilizables:* la interfaz usa shadcn/ui (Card, Alert, Dialog, Table, etc.) y
  pequeños componentes internos (`Casilla`, `CampoCalculado`, `MensajeError`).

---

## 4. Funciones principales

### `src/lib/rus/calculo.ts`

- **`calcularCategoriaYCuota(ingresos, compras)`** — Regla de negocio central. Usa el **mayor**
  importe entre ingresos y compras (nunca la suma):
  - mayor ≤ 5 000 → **Categoría 1**, cuota S/ 20;
  - 5 000 < mayor ≤ 8 000 → **Categoría 2**, cuota S/ 50;
  - mayor > 8 000 → `fuera_de_rango` con motivo legible.
- **`calcularImporteAPagar(cuota, interes, compensacion)`** — Casilla 505:
  `cuota + interés − compensación` (en esta versión interés = 0 y compensación = 0).

### `src/lib/rus/validacion.ts`

- **`leerMonto(texto)`** — Define expresamente el tratamiento de casos límite: vacío → error de
  obligatorio; negativo → error específico; 3+ decimales → error de decimales; formato inválido
  → error con ejemplos; **cero → válido**. Acepta coma o punto como separador decimal.
- **`leerPeriodo(mes, anio)`** — Valida el formato MM/AAAA (mes 01–12) y reporta qué falta.
- **`validarEntradaDeclaracion(entrada)`** — Agrega todas las validaciones y calcula los datos;
  bloquea la rectificatoria (fuera de alcance) y los montos fuera de rango.

### `src/lib/rus/flujo.ts`

- **`intentarAgregarABandeja(entrada, bandeja, secuencia, fecha)`** — Punto único de entrada a
  la bandeja: valida, impide duplicados de período y produce la declaración con estado
  «Agregado a bandeja».
- **`procesarPagoSimulado(declaracion, decision, fecha, secuencia)`** — Pago de prueba:
  - `aprobado` → cambia el estado a «Pago simulado aprobado» y genera la constancia;
  - `rechazado` → **constancia `null`**, mensaje de reintento, la declaración queda en la bandeja;
  - `cancelado` → lo maneja la interfaz regresando sin pérdida de datos.

### `src/lib/rus/constancia.ts`

- **`generarNumeroOperacionSimulado(fecha, secuencia)`** — Número ficticio determinista con
  formato `SIM-1611-AAAAMMDD-NNNN` (el prefijo evita confusión con comprobantes reales).
- **`generarConstanciaSimulada(declaracion, numero, fecha)`** — Construye el documento con
  título, formulario, período, montos, categoría, cuota, importe, fecha, número y estado.

### Componentes (`src/components/rus`)

- **`SimuladorRus`** — Máquina de estados: etapas 1–4, subvistas de la etapa 3 y mensajes.
- **`BarraEtapas`** — Progreso visual con `aria-current="step"`; permite volver a etapas ya
  alcanzadas.
- **`FormularioDeclaracion`** — Casillas 507 y 607 editables; 400, 503, 504, 505 y 509 de solo
  lectura con cálculo **en vivo**; errores junto a cada campo.
- **`VistaBandeja`** — Tabla revisable con estados diferenciados («Agregado a bandeja» /
  «Pago simulado aprobado») y ventana de confirmación **Sí/No** antes de pagar.
- **`PantallaPago`** — Pago completamente ficticio con tres acciones: aprobado, rechazado,
  cancelar. No solicita datos financieros.
- **`VistaConstancia`** — Documento académico simulado; botones Imprimir (CSS de impresión que
  aísla el documento) y Guardar (descarga un HTML académico).

---

## 5. Requisitos funcionales

| ID | Requisito |
| --- | --- |
| RF-01 | Mostrar en todas las pantallas la advertencia «SIMULADOR ACADÉMICO — No es una aplicación oficial de SUNAT. No realiza declaraciones ni pagos reales». |
| RF-02 | Presentar cuatro etapas (Seleccione, Complete, Presente/Pague, Constancia) con la etapa actual identificada y navegación atrás. |
| RF-03 | Etapa 1: seleccionar el único trámite incluido (declaración mensual del Nuevo RUS) y mostrar los trámites fuera de alcance. |
| RF-04 | Formulario con período tributario MM/AAAA (selectores de mes y año). |
| RF-05 | Mostrar «Declaración rectificatoria» Sí/No e indicar que está fuera de alcance; no procesar rectificatorias. |
| RF-06 | Casillas 507 (ingresos) y 607 (compras) editables con validación en línea. |
| RF-07 | Casilla 400: categoría calculada automáticamente (solo lectura). |
| RF-08 | Casilla 503: cuota mensual calculada (Categoría 1 → S/ 20; Categoría 2 → S/ 50). |
| RF-09 | Casilla 504: interés moratorio S/ 0 (declaraciones ordinarias sin intereses), solo lectura. |
| RF-10 | Casilla 509: compensación de percepciones del IGV mostrada como función no implementada. |
| RF-11 | Casilla 505: importe a pagar calculado, solo lectura. |
| RF-12 | Los valores calculados se actualizan al cambiar los datos de entrada. |
| RF-13 | Regla del mayor importe: categoría según `max(ingresos, compras)` sin sumar; no se implementa la categoría especial. |
| RF-14 | Fuera de rango (ingresos o compras > S/ 8 000): aviso en vivo e impedimento para continuar. |
| RF-15 | Validación: campos obligatorios, no negativos, numéricos, hasta dos decimales; tratamiento explícito de vacíos, ceros e inválidos. |
| RF-16 | «Agregar a bandeja»: valida, muestra errores junto a los campos y agrega con mensaje de confirmación. |
| RF-17 | Bandeja: revisión de período, ingresos, compras, categoría y cuota; botón «Presentar/Pagar» habilitado. |
| RF-18 | Ventana de confirmación con opciones Sí y No antes de presentar/pagar. |
| RF-19 | Pantalla de pago ficticia con importe total y opción «Pago de prueba» (aprobado / rechazado / cancelar). |
| RF-20 | Pago rechazado: mensaje y reintento, sin constancia. |
| RF-21 | Pago cancelado: regreso a la bandeja sin perder datos. |
| RF-22 | Pago aprobado: registro del resultado y generación de la constancia. |
| RF-23 | Estados diferenciados: «Agregado a bandeja» vs «Pago simulado aprobado». |
| RF-24 | Constancia con título «CONSTANCIA ACADÉMICA SIMULADA», formulario, período, ingresos, compras, categoría, cuota, importe pagado, fecha, número de operación ficticio y estado. |
| RF-25 | Opciones para imprimir y guardar la constancia. |

## 6. Requisitos no funcionales

| ID | Requisito |
| --- | --- |
| RNF-01 | Interfaz completamente en español. |
| RNF-02 | Mensajes de error claros, específicos y junto al campo correspondiente. |
| RNF-03 | Navegación por teclado (elementos nativos accesibles, etiquetas, `aria-*`, foco visible). |
| RNF-04 | Diseño adaptable (móvil y escritorio) con pies de tabla desplazables. |
| RNF-05 | Funcionamiento en Chrome y Edge. |
| RNF-06 | Sin almacenamiento de información personal real; la bandeja es temporal en memoria. |
| RNF-07 | Código legible y modular: lógica de negocio independiente de los componentes visuales. |
| RNF-08 | Funciones deterministas probables automáticamente (fecha y secuencia inyectadas). |
| RNF-09 | Pie de página fijo al final de la pantalla y sin solapamientos. |
| RNF-10 | Sin claves de API, sin servicios externos y sin dependencias de red. |

## 7. Cobertura de los casos de prueba exigidos

| N.º | Caso exigido | Dónde se prueba |
| --- | --- | --- |
| 1 | Ingresos 1 325 / compras 1 825 → cuota S/ 20 | `calculo.test.ts` · `flujo.test.ts` · `flujo-sistema.test.tsx` |
| 2 | Ingresos 6 000 / compras 2 000 → cuota S/ 50 | `calculo.test.ts` |
| 3 | Límite 5 000 → Categoría 1 | `calculo.test.ts` |
| 4 | 5 000.01 → Categoría 2 | `calculo.test.ts` |
| 5 | Límite 8 000 → Categoría 2 | `calculo.test.ts` |
| 6 | 8 000.01 → fuera de rango | `calculo.test.ts` · `flujo.test.ts` · `flujo-sistema.test.tsx` |
| 7 | Rechazo de ingresos negativos | `validacion.test.ts` · `flujo.test.ts` |
| 8 | Rechazo de campos vacíos | `validacion.test.ts` · `flujo-sistema.test.tsx` |
| 9 | Bloqueo de declaraciones inválidas | `flujo.test.ts` · `flujo-sistema.test.tsx` |
| 10 | No hay constancia con pago rechazado | `flujo.test.ts` · `flujo-sistema.test.tsx` |
| 11 | Constancia generada tras pago aprobado | `flujo.test.ts` · `flujo-sistema.test.tsx` |

## 8. Limitaciones del prototipo

- **Solo un proceso:** la declaración mensual ordinaria del Nuevo RUS. No hay rectificatorias,
  categoría especial ni otros formularios.
- **Casilla 509 no implementada:** se muestra pero no calcula descuentos.
- **Interés moratorio fijo en S/ 0:** solo escenarios ordinarios sin intereses.
- **Sin persistencia:** la bandeja vive en memoria; al recargar se pierde (decisión académica).
- **Pago 100 % ficticio:** no existen validaciones financieras; «aprobar» y «rechazar» son
  decisiones del usuario.
- **Números de operación ficticios** con prefijo `SIM-1611-`, deliberadamente distintos a los
  formatos oficiales.
- **Sin autenticación ni usuarios:** no hay inicio de sesión real.
- **Sin conexión externa:** no consulta SUNAT, bancos, Yape ni pasarelas de pago.
- **Reglas simplificadas:** se implementan exclusivamente las reglas del enunciado (categorías
  1 y 2); no se inventaron disposiciones tributarias adicionales.
- **Pruebas de extremo a extremo:** las suites cubren unidades, integración y flujo funcional de
  la interfaz con Vitest; una suite E2E externa (p. ej. Playwright) podría añadirse como trabajo
  futuro.

---

*Proyecto universitario del curso «Pruebas y Calidad de Software». Documento y aplicación con
fines exclusivamente educativos.*
