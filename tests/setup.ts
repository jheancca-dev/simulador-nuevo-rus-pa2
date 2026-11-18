import '@testing-library/jest-dom/vitest'

// jsdom no implementa scrollIntoView ni las APIs de PointerEvent, que Radix UI
// (Select) usa al abrir y elegir opciones en las pruebas.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
    Element.prototype.setPointerCapture = () => {}
    Element.prototype.releasePointerCapture = () => {}
  }
}
