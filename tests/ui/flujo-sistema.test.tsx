// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SimuladorRus } from '@/components/rus/simulador-rus'

/**
 * Pruebas funcionales (nivel sistema) del flujo completo con Testing Library:
 * Seleccione -> Complete -> Bandeja -> Confirmación -> Pago simulado ->
 * Constancia. Cubren los casos exigidos a nivel de interfaz y las mejoras:
 * contribuyente ficticio, contador de bandeja, notificaciones (carga, éxito,
 * continuación, cancelación), estados diferenciados y corrección de datos.
 */

afterEach(() => {
  cleanup()
})

/** Mensaje exigido para la notificación de formulario agregado. */
const MENSAJE_EXITO =
  'Sr. Contribuyente, el formulario se agregó a la Bandeja de Presentación/Pagos.'

async function completarFormulario(usuario: ReturnType<typeof userEvent.setup>) {
  // Período tributario: mes y año.
  await usuario.click(screen.getByRole('combobox', { name: 'Mes del período tributario' }))
  await usuario.click(screen.getByRole('option', { name: '03 - Marzo' }))
  await usuario.click(screen.getByRole('combobox', { name: 'Año del período tributario' }))
  await usuario.click(screen.getByRole('option', { name: '2025' }))

  // Montos.
  await usuario.type(screen.getByLabelText(/ingresos brutos/i), '1325')
  await usuario.type(screen.getByLabelText(/adquisiciones o compras/i), '1825')
}

/** Agrega una declaración válida y cierra la ventana de continuación. */
async function avanzarHastaBandeja(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
  await completarFormulario(usuario)
  await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))
  await usuario.click(await screen.findByRole('button', { name: /ir a presentar\/pagar/i }))
  await screen.findByText(/bandeja de declaraciones/i)
}

/** Llega a la pantalla de pago (tras confirmar Sí). */
async function avanzarHastaPago(usuario: ReturnType<typeof userEvent.setup>) {
  await avanzarHastaBandeja(usuario)
  await usuario.click(screen.getByRole('button', { name: /presentar\/pagar/i }))
  await usuario.click(await screen.findByRole('button', { name: 'Sí' }))
  await screen.findByText(/método de pago/i)
}

describe('Cabecera: contribuyente ficticio y contador de bandeja', () => {
  it('muestra la bienvenida del contribuyente, el aviso general y el contador discreto', () => {
    render(<SimuladorRus />)

    expect(screen.getByText(/bienvenido, pepe lucho pérez/i)).toBeInTheDocument()
    expect(
      screen.getByText(/aviso: esta no es una aplicación oficial de sunat/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Bandeja (0)')).toBeInTheDocument()
  })

  it('el «Perfil» muestra el nombre, el DNI y el RUC del contribuyente', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /perfil/i }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText('Pepe Lucho Pérez')).toBeInTheDocument()
    expect(within(dialogo).getByText('00000000')).toBeInTheDocument()
    expect(within(dialogo).getByText('00000000000')).toBeInTheDocument()
    expect(within(dialogo).getByText('Contribuyente del Nuevo RUS')).toBeInTheDocument()

    // Cierre correcto del diálogo.
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('el contador de la bandeja se actualiza al agregar una declaración', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    expect(screen.getByText('Bandeja (0)')).toBeInTheDocument()
    await avanzarHastaBandeja(usuario)
    expect(screen.getByText('Bandeja (1)')).toBeInTheDocument()
  })
})

describe('Flujo completo del simulador (nivel sistema)', () => {
  it('muestra la etapa Seleccione y avanzar requiere selección', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    expect(screen.getByText(/seleccione el trámite/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuar a la etapa/i })).toBeEnabled()
  })

  it('muestra brevemente «Cargando datos, espere un momento...» al seleccionar el período', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)
    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))

    // Al elegir el mes aparece el aviso de carga (solo visual y local).
    await usuario.click(screen.getByRole('combobox', { name: 'Mes del período tributario' }))
    await usuario.click(screen.getByRole('option', { name: '03 - Marzo' }))
    expect(
      await screen.findByText(/cargando datos, espere un momento/i),
    ).toBeInTheDocument()

    // El aviso se cierra solo y no bloquea la aplicación.
    await waitFor(
      () => {
        expect(
          screen.queryByText(/cargando datos, espere un momento/i),
        ).not.toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Al elegir el año vuelve a mostrarse brevemente.
    await usuario.click(screen.getByRole('combobox', { name: 'Año del período tributario' }))
    await usuario.click(screen.getByRole('option', { name: '2025' }))
    expect(
      await screen.findByText(/cargando datos, espere un momento/i),
    ).toBeInTheDocument()
  }, 10000)

  it('Caso 8 (UI): muestra errores junto a los campos al intentar agregar sin datos', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))

    expect(await screen.findByText(/obligatorio: seleccione el mes/i)).toBeInTheDocument()
    // Dos mensajes (ingresos y compras) comparten el texto "obligatorio: ingrese el monto".
    expect(screen.getAllByText(/obligatorio: ingrese el monto/i).length).toBe(2)
    // La declaración inválida está bloqueada (caso 9): no hay bandeja ni ventana.
    expect(screen.queryByText(/bandeja de declaraciones/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/usted añadió un formulario a la bandeja/i)).not.toBeInTheDocument()
  })

  it('calcula en vivo categoría y cuota mientras se escribe', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await usuario.type(screen.getByLabelText(/ingresos brutos/i), '6000')
    await usuario.type(screen.getByLabelText(/adquisiciones o compras/i), '2000')

    const seccion = await screen.findByRole('region', {
      name: /casillas calculadas automáticamente/i,
    })
    expect(within(seccion).getByText('Categoría 2')).toBeInTheDocument()
    expect(within(seccion).getAllByText('S/ 50.00').length).toBeGreaterThanOrEqual(2)
  })

  it('describe el tratamiento de cada casilla de solo lectura', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)
    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))

    const seccion = await screen.findByRole('region', {
      name: /casillas calculadas automáticamente/i,
    })
    expect(
      within(seccion).getByText(/categoría calculada automáticamente según el mayor importe/i),
    ).toBeInTheDocument()
    expect(
      within(seccion).getByText(/cuota mensual calculada automáticamente/i),
    ).toBeInTheDocument()
    expect(
      within(seccion).getByText(/valor fijo s\/ 0 en el escenario ordinario sin intereses/i),
    ).toBeInTheDocument()
    expect(
      within(seccion).getByText(/funcionalidad no implementada: no se calcula ni se aplica/i),
    ).toBeInTheDocument()
    expect(
      within(seccion).getByText(/importe calculado automáticamente/i),
    ).toBeInTheDocument()
  })

  it('Caso 6 (UI): bloquea el flujo cuando los ingresos superan S/ 8 000', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await usuario.type(screen.getByLabelText(/ingresos brutos/i), '8000.01')
    await usuario.type(screen.getByLabelText(/adquisiciones o compras/i), '1000')

    expect(
      await screen.findByText(/fuera del flujo ordinario/i),
    ).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))
    expect(screen.queryByText(/bandeja de declaraciones/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/usted añadió un formulario a la bandeja/i)).not.toBeInTheDocument()
  })

  it('Caso 9 (UI): la rectificatoria no se procesa en esta versión', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await completarFormulario(usuario)
    await usuario.click(screen.getByRole('radio', { name: 'Sí' }))

    expect(
      await screen.findByText(/rectificatoria está fuera del alcance/i),
    ).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))
    expect(screen.queryByText(/bandeja de declaraciones/i)).not.toBeInTheDocument()
  })

  it('al agregar muestra la notificación de éxito y la ventana de continuación, ambas cerrables', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await completarFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))

    // Notificación de éxito con el mensaje exigido.
    expect(await screen.findByText(MENSAJE_EXITO)).toBeInTheDocument()

    // Ventana de continuación con el texto y los dos botones exigidos.
    expect(
      screen.getByText(
        /usted añadió un formulario a la bandeja de pagos\. para continuar seleccione:/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver al formulario' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir a Presentar/Pagar' })).toBeInTheDocument()

    // Cierre correcto: ventana y luego notificación.
    await usuario.click(screen.getByRole('button', { name: 'Ir a Presentar/Pagar' }))
    await usuario.click(
      screen.getByRole('button', { name: /cerrar notificación de formulario agregado/i }),
    )
    await waitFor(() => {
      expect(screen.queryByText(MENSAJE_EXITO)).not.toBeInTheDocument()
    })
  })

  it('«Volver al formulario» conserva los datos ingresados', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await completarFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))

    await usuario.click(await screen.findByRole('button', { name: 'Volver al formulario' }))
    expect(await screen.findByText(/complete la declaración mensual/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ingresos brutos/i)).toHaveValue('1325')
    expect(screen.getByLabelText(/adquisiciones o compras/i)).toHaveValue('1825')
    // La declaración sigue en la bandeja (contador sin cambios).
    expect(screen.getByText('Bandeja (1)')).toBeInTheDocument()
  })

  it('permite corregir los datos de una declaración no aprobada antes de confirmar el pago', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)
    await avanzarHastaBandeja(usuario)
    expect(screen.getByText('Bandeja (1)')).toBeInTheDocument()

    // «Corregir datos» carga la declaración en el formulario y la retira de la bandeja.
    await usuario.click(screen.getByRole('button', { name: /corregir datos/i }))
    expect(await screen.findByText(/corrección de declaración/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ingresos brutos/i)).toHaveValue('1325.00')
    expect(screen.getByLabelText(/adquisiciones o compras/i)).toHaveValue('1825.00')
    expect(screen.getByText('Bandeja (0)')).toBeInTheDocument()

    // Cambia las compras y vuelve a agregar: sin error de período duplicado.
    const compras = screen.getByLabelText(/adquisiciones o compras/i)
    await usuario.clear(compras)
    await usuario.type(compras, '6000')
    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))
    await usuario.click(await screen.findByRole('button', { name: /ir a presentar\/pagar/i }))

    expect(await screen.findByText(/bandeja de declaraciones/i)).toBeInTheDocument()
    expect(screen.getByText('Bandeja (1)')).toBeInTheDocument()
    // El mayor importe ahora es S/ 6 000 -> Categoría 2 (cálculo reactivo).
    expect(screen.getByText('Categoría 2')).toBeInTheDocument()
  })

  it('Caso 10 (UI): pago rechazado muestra mensaje diferenciado y NO genera constancia', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)
    await avanzarHastaBandeja(usuario)

    // La bandeja muestra la declaración con estado «Agregado a bandeja».
    expect(screen.getByText('03/2025')).toBeInTheDocument()
    expect(screen.getByText('Agregado a bandeja')).toBeInTheDocument()

    // Confirmación previa: ventana con opciones Sí y No.
    await usuario.click(screen.getByRole('button', { name: /presentar\/pagar/i }))
    expect(
      await screen.findByText(/¿confirma presentar y pagar esta declaración\?/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sí' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Sí' }))

    // Pantalla de pago (alerta «Método de pago» y título «Pago»).
    expect(await screen.findByText(/método de pago/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^Pago$/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('S/ 20.00').length).toBeGreaterThanOrEqual(2)

    // Rechazo: mensajes diferenciados (título y estado).
    await usuario.click(screen.getByRole('button', { name: /rechazar pago/i }))
    expect(
      (await screen.findAllByText(/pago rechazado/i)).length,
    ).toBeGreaterThanOrEqual(1)

    // No debe existir constancia en ninguna parte del documento.
    expect(screen.queryByText(/constancia disponible/i)).not.toBeInTheDocument()
    const estadoActual = screen.getByText(/estado actual de la declaración/i)
    expect(estadoActual).toHaveTextContent('Pago rechazado')
  })

  it('tras un rechazo la bandeja marca «Pago rechazado», sin constancia, y el reintento aprobado sí la genera', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)
    await avanzarHastaPago(usuario)

    await usuario.click(screen.getByRole('button', { name: /rechazar pago/i }))
    // Cancelar la operación del pago rechazado regresa a la bandeja.
    await usuario.click(screen.getByRole('button', { name: /cancelar operación/i }))

    expect(
      await screen.findByText(/operación cancelada: la declaración se conserva/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Pago rechazado')).toBeInTheDocument()
    expect(screen.queryByText(/constancia disponible/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver constancia/i })).not.toBeInTheDocument()

    // Reintento: la declaración rechazada admite presentar/pagar nuevamente.
    await usuario.click(screen.getByRole('button', { name: /presentar\/pagar/i }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí' }))
    await usuario.click(await screen.findByRole('button', { name: /^pagar$/i }))
    await usuario.click(await screen.findByRole('button', { name: /generar constancia/i }))

    expect(await screen.findByText('CONSTANCIA')).toBeInTheDocument()
  })

  it('Caso 11 (UI): pago aprobado registra el estado y genera la constancia con el contribuyente', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)
    await avanzarHastaPago(usuario)

    // Pago aprobado: mensaje diferenciado de aprobación.
    await usuario.click(await screen.findByRole('button', { name: /^pagar$/i }))
    expect(
      (await screen.findAllByText(/pago aprobado/i)).length,
    ).toBeGreaterThanOrEqual(1)

    // Generar la constancia.
    await usuario.click(screen.getByRole('button', { name: /generar constancia/i }))

    expect(await screen.findByText('CONSTANCIA')).toBeInTheDocument()
    // El formulario aparece en la cabecera de la página y en la constancia.
    expect(
      screen.getAllByText('Formulario Virtual N.º 1611 — Nuevo RUS').length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Pepe Lucho Pérez')).toBeInTheDocument()
    expect(screen.getByText('00000000')).toBeInTheDocument()
    expect(screen.getByText('00000000000')).toBeInTheDocument()
    expect(screen.getByText('03/2025')).toBeInTheDocument()
    expect(screen.getByText('S/ 1 325.00')).toBeInTheDocument()
    expect(screen.getByText('S/ 1 825.00')).toBeInTheDocument()
    expect(screen.getByText(/SIM-1611-\d{8}-\d{4}/)).toBeInTheDocument()
    // El estado aparece una vez: fila «Estado» de la constancia.
    expect(screen.getAllByText('Pago aprobado').length).toBe(1)
    expect(screen.getByRole('button', { name: /imprimir/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar constancia/i })).toBeInTheDocument()

    // Volver a la bandeja: la declaración ahora está pagada.
    await usuario.click(screen.getByRole('button', { name: /volver a la bandeja/i }))
    expect(await screen.findByText(/bandeja de declaraciones/i)).toBeInTheDocument()
    expect(screen.getAllByText('Pago aprobado').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /ver constancia/i })).toBeInTheDocument()
  })

  it('permite cancelar el pago sin perder los datos y muestra la notificación de cancelación', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)
    await avanzarHastaPago(usuario)

    await usuario.click(screen.getByRole('button', { name: /cancelar operación/i }))

    expect(
      await screen.findByText(/operación cancelada: la declaración se conserva/i),
    ).toBeInTheDocument()
    expect(screen.getByText('03/2025')).toBeInTheDocument()
    expect(screen.getByText('Agregado a bandeja')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /presentar\/pagar/i })).toBeInTheDocument()
    expect(screen.queryByText(/constancia disponible/i)).not.toBeInTheDocument()

    // La notificación de cancelación es descartable.
    await usuario.click(
      screen.getByRole('button', { name: /cerrar notificación de operación cancelada/i }),
    )
    await waitFor(() => {
      expect(
        screen.queryByText(/operación cancelada: la declaración se conserva/i),
      ).not.toBeInTheDocument()
    })
  })

  it('la barra de etapas marca la etapa actual y permite volver atrás', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    const navegacion = screen.getByRole('navigation', {
      name: /etapas del proceso de declaración/i,
    })
    expect(
      within(navegacion).getByRole('listitem', { current: 'step' }),
    ).toHaveTextContent('1')

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await waitFor(() => {
      expect(
        within(navegacion).getByRole('listitem', { current: 'step' }),
      ).toHaveTextContent('2')
    })

    // Volver a la etapa 1 desde la barra.
    await usuario.click(
      within(navegacion).getByRole('button', { name: /ir a la etapa 1/i }),
    )
    expect(screen.getByText(/seleccione el trámite/i)).toBeInTheDocument()
  })
})
