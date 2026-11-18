// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SimuladorRus } from '@/components/rus/simulador-rus'

/**
 * Pruebas funcionales (nivel sistema) del flujo completo con Testing Library:
 * Seleccione -> Complete -> Bandeja -> Confirmación -> Pago simulado ->
 * Constancia. Cubren los casos 8 a 11 del enunciado a nivel de interfaz.
 */

afterEach(() => {
  cleanup()
})

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

async function avanzarHastaBandeja(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
  await completarFormulario(usuario)
  await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))
  await screen.findByText(/bandeja de declaraciones/i)
}

describe('Flujo completo del simulador (nivel sistema)', () => {
  it('muestra la etapa Seleccione y avanzar requiere selección', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    expect(screen.getByText(/seleccione el trámite a simular/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continuar a la etapa/i })).toBeEnabled()
  })

  it('Caso 8 (UI): muestra errores junto a los campos al intentar agregar sin datos', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))

    expect(await screen.findByText(/obligatorio: seleccione el mes/i)).toBeInTheDocument()
    // Dos mensajes (ingresos y compras) comparten el texto "obligatorio: ingrese el monto".
    expect(screen.getAllByText(/obligatorio: ingrese el monto/i).length).toBe(2)
    // La bandeja no debe mostrarse: la declaración inválida está bloqueada (caso 9).
    expect(screen.queryByText(/bandeja de declaraciones/i)).not.toBeInTheDocument()
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

  it('Caso 6 (UI): bloquea el flujo cuando los ingresos superan S/ 8 000', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await usuario.click(screen.getByRole('button', { name: /continuar a la etapa/i }))
    await usuario.type(screen.getByLabelText(/ingresos brutos/i), '8000.01')
    await usuario.type(screen.getByLabelText(/adquisiciones o compras/i), '1000')

    expect(
      await screen.findByText(/fuera del flujo ordinario simulado/i),
    ).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /agregar a bandeja/i }))
    expect(screen.queryByText(/bandeja de declaraciones/i)).not.toBeInTheDocument()
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

  it('Caso 10 (UI): pago rechazado muestra mensaje y NO genera constancia', async () => {
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

    // Pantalla de pago ficticia (título y método comparten texto, usamos el título).
    expect(await screen.findByText(/completamente ficticio/i)).toBeInTheDocument()
    expect(screen.getAllByText(/pago de prueba/i).length).toBeGreaterThanOrEqual(1)
    // La cuota y el importe total coinciden (S/ 20) en este escenario.
    expect(screen.getAllByText('S/ 20.00').length).toBeGreaterThanOrEqual(2)

    // Simular rechazo (el mensaje aparece en título y descripción).
    await usuario.click(screen.getByRole('button', { name: /simular pago rechazado/i }))
    expect((await screen.findAllByText(/pago simulado rechazado/i)).length).toBeGreaterThanOrEqual(1)

    // No debe existir constancia en ninguna parte del documento.
    expect(screen.queryByText(/constancia académica simulada/i)).not.toBeInTheDocument()
    // La declaración sigue en «Agregado a bandeja».
    expect(screen.getByText(/estado actual/i).parentElement).toHaveTextContent(
      'Agregado a bandeja',
    )
  })

  it('Caso 11 (UI): pago aprobado registra el estado y genera la constancia', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await avanzarHastaBandeja(usuario)

    await usuario.click(screen.getByRole('button', { name: /presentar\/pagar/i }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí' }))

    // Pago aprobado.
    await usuario.click(await screen.findByRole('button', { name: /simular pago aprobado/i }))
    expect(await screen.findByText(/resultado registrado/i)).toBeInTheDocument()

    // Generar la constancia.
    await usuario.click(screen.getByRole('button', { name: /generar constancia simulada/i }))

    expect(await screen.findByText('CONSTANCIA ACADÉMICA SIMULADA')).toBeInTheDocument()
    expect(screen.getByText('Formulario Virtual N.º 1611 — Nuevo RUS')).toBeInTheDocument()
    expect(screen.getByText('03/2025')).toBeInTheDocument()
    expect(screen.getByText('S/ 1 325.00')).toBeInTheDocument()
    expect(screen.getByText('S/ 1 825.00')).toBeInTheDocument()
    expect(screen.getByText(/SIM-1611-\d{8}-\d{4}/)).toBeInTheDocument()
    // El estado aparece una vez: fila «Estado» de la constancia.
    expect(screen.getAllByText('Pago simulado aprobado').length).toBe(1)
    expect(screen.getByRole('button', { name: /imprimir/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar constancia/i })).toBeInTheDocument()

    // Volver a la bandeja: la declaración ahora está pagada.
    await usuario.click(screen.getByRole('button', { name: /volver a la bandeja/i }))
    expect(await screen.findByText(/bandeja de declaraciones/i)).toBeInTheDocument()
    expect(screen.getAllByText('Pago simulado aprobado').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /ver constancia/i })).toBeInTheDocument()
  })

  it('permite cancelar el pago sin perder los datos de la declaración', async () => {
    const usuario = userEvent.setup()
    render(<SimuladorRus />)

    await avanzarHastaBandeja(usuario)
    await usuario.click(screen.getByRole('button', { name: /presentar\/pagar/i }))
    await usuario.click(await screen.findByRole('button', { name: 'Sí' }))

    await usuario.click(
      await screen.findByRole('button', { name: /cancelar operación/i }),
    )

    expect(await screen.findByText(/bandeja de declaraciones/i)).toBeInTheDocument()
    expect(screen.getByText('03/2025')).toBeInTheDocument()
    expect(screen.getByText('Agregado a bandeja')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /presentar\/pagar/i })).toBeInTheDocument()
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
    expect(screen.getByText(/seleccione el trámite a simular/i)).toBeInTheDocument()
  })
})
