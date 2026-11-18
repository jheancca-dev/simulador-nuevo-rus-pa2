import { SimuladorRus } from '@/components/rus/simulador-rus'

/**
 * Página única del simulador. El orquestador <SimuladorRus /> (cliente) dibuja
 * toda la estructura: cabecera con el contribuyente de demostración y el
 * contador de bandeja, la advertencia académica permanente en todas las
 * etapas, el flujo de cuatro pasos y el pie.
 */
export default function Home() {
  return <SimuladorRus />
}
