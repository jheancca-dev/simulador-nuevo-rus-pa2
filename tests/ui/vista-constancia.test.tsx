// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VistaConstancia } from '@/components/rus/vista-constancia'
import type { ConstanciaSimulada } from '@/lib/rus/tipos'

const constancia: ConstanciaSimulada = {
  titulo: 'CONSTANCIA',
  formulario: 'Formulario Virtual N.º 1611 — Nuevo RUS',
  contribuyenteNombre: 'Pepe Lucho Pérez',
  contribuyenteDni: '00000000',
  contribuyenteRuc: '00000000000',
  periodo: '03/2025',
  ingresos: 6000,
  compras: 2000,
  categoria: 2,
  cuotaMensual: 50,
  interesMoratorio: 0,
  importePagado: 50,
  fechaOperacion: '18/11/2026 13:00:00',
  numeroOperacion: 'SIM-1611-20261118-0001',
  estado: 'Pago aprobado',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('VistaConstancia: datos y controles del comprobante de prueba', () => {
  it('muestra los datos del contribuyente, categoría 2 e importe de S/ 50', () => {
    render(
      <VistaConstancia
        constancia={constancia}
        onVolverBandeja={vi.fn()}
        onNuevaDeclaracion={vi.fn()}
      />,
    )

    expect(screen.getByText('Pepe Lucho Pérez')).toBeInTheDocument()
    expect(screen.getByText('00000000')).toBeInTheDocument()
    expect(screen.getByText('00000000000')).toBeInTheDocument()
    expect(screen.getByText('03/2025')).toBeInTheDocument()
    expect(screen.getByText('Categoría 2')).toBeInTheDocument()
    expect(screen.getAllByText('S/ 50.00').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('SIM-1611-20261118-0001')).toBeInTheDocument()
    expect(screen.getByText('Pago aprobado')).toBeInTheDocument()
  })

  it('permite volver a la bandeja sin crear una nueva declaración', async () => {
    const usuario = userEvent.setup()
    const onVolverBandeja = vi.fn()
    const onNuevaDeclaracion = vi.fn()
    render(
      <VistaConstancia
        constancia={constancia}
        onVolverBandeja={onVolverBandeja}
        onNuevaDeclaracion={onNuevaDeclaracion}
      />,
    )

    await usuario.click(screen.getByRole('button', { name: 'Volver a la bandeja' }))
    expect(onVolverBandeja).toHaveBeenCalledOnce()
    expect(onNuevaDeclaracion).not.toHaveBeenCalled()
  })

  it('permite iniciar una nueva declaración mediante su botón', async () => {
    const usuario = userEvent.setup()
    const onNuevaDeclaracion = vi.fn()
    render(
      <VistaConstancia
        constancia={constancia}
        onVolverBandeja={vi.fn()}
        onNuevaDeclaracion={onNuevaDeclaracion}
      />,
    )

    await usuario.click(screen.getByRole('button', { name: 'Nueva declaración' }))
    expect(onNuevaDeclaracion).toHaveBeenCalledOnce()
  })
})
