// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VistaConstancia } from '@/components/rus/vista-constancia'
import type { ConstanciaSimulada } from '@/lib/rus/tipos'

const constancia: ConstanciaSimulada = {
  titulo: 'CONSTANCIA',
  formulario: 'Formulario Virtual N.º 1611 — Nuevo RUS',
  contribuyenteNombre: 'Pepe Lucho Pérez',
  contribuyenteDni: '00000000',
  contribuyenteRuc: '00000000000',
  periodo: '11/2026',
  ingresos: 6000,
  compras: 2000,
  categoria: 2,
  cuotaMensual: 50,
  interesMoratorio: 0,
  importePagado: 50,
  fechaOperacion: '18/11/2026 13:30:00',
  numeroOperacion: 'SIM-1611-20261118-0001',
  estado: 'Pago aprobado',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('VistaConstancia: imprimir y guardar', () => {
  it('al pulsar Imprimir invoca window.print una sola vez', async () => {
    const imprimir = vi.fn()
    vi.stubGlobal('print', imprimir)
    render(<VistaConstancia constancia={constancia} onVolverBandeja={vi.fn()} onNuevaDeclaracion={vi.fn()} />)

    await userEvent.setup().click(screen.getByRole('button', { name: /^imprimir$/i }))
    expect(imprimir).toHaveBeenCalledTimes(1)
  })

  it('al guardar prepara un HTML con datos de la constancia, aviso y nombre de archivo ficticio', async () => {
    const BlobOriginal = globalThis.Blob
    let htmlGenerado = ''
    class BlobInspeccion extends BlobOriginal {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options)
        htmlGenerado = (parts ?? []).map(String).join('')
      }
    }
    vi.stubGlobal('Blob', BlobInspeccion)

    const crearUrl = vi.fn().mockReturnValue('blob:prueba-constancia')
    const revocarUrl = vi.fn()
    vi.stubGlobal('URL', Object.assign(class URLDePrueba extends URL {}, {
      createObjectURL: crearUrl,
      revokeObjectURL: revocarUrl,
    }))
    const clickEnlace = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const append = vi.spyOn(document.body, 'appendChild')
    const remove = vi.spyOn(document.body, 'removeChild')

    render(<VistaConstancia constancia={constancia} onVolverBandeja={vi.fn()} onNuevaDeclaracion={vi.fn()} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /guardar constancia/i }))

    expect(crearUrl).toHaveBeenCalledTimes(1)
    expect(clickEnlace).toHaveBeenCalledTimes(1)
    expect(revocarUrl).toHaveBeenCalledWith('blob:prueba-constancia')
    const enlaces = append.mock.calls.map(([elemento]) => elemento).filter((elemento): elemento is HTMLAnchorElement => elemento instanceof HTMLAnchorElement)
    expect(enlaces).toHaveLength(1)
    expect(enlaces[0].download).toBe('constancia-SIM-1611-20261118-0001.html')
    expect(remove).toHaveBeenCalledWith(enlaces[0])
    expect(htmlGenerado).toContain('Pepe Lucho Pérez')
    expect(htmlGenerado).toContain('11/2026')
    expect(htmlGenerado).toContain('SIM-1611-20261118-0001')
    expect(htmlGenerado).toContain('no es un comprobante tributario auténtico')
  })
})
