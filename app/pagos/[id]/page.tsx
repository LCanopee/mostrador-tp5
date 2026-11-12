import Link from 'next/link'
import {notFound,redirect} from 'next/navigation'
import {obtenerPago} from '../../../lib/pagos'
import {currentUser} from '../../../lib/session'
import {ErrorCliente} from '../../../lib/guardar-cliente'
import Imprimir from './Imprimir'

const ars=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'})
export default async function Recibo({params}:{params:Promise<{id:string}>}) {
  if (!await currentUser()) redirect('/')
  const p=await obtenerPago(Number((await params).id)).catch(e=>{if(e instanceof ErrorCliente && e.status===404) notFound();throw e})
  return <main className="recibo"><h1>Recibo {p.numeroRecibo}</h1><p>Mostrador · Gestión comercial</p>
    <p>Fecha: {new Date(p.fecha).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})}</p>
    <p>Cliente: {p.cliente.nombre}</p><p>Recibió: {p.usuario.nombre}</p><p>Importe: <strong>{ars.format(p.importe/100)}</strong></p>
    <p>Medio: {p.medio==='tarjeta_debito'?'Tarjeta de débito':p.medio}</p>{p.observacion && <p>Observación: {p.observacion}</p>}
    <p>Saldo después del pago: {ars.format(p.saldoCliente/100)}</p>
    <nav><Imprimir/> <Link href={'/clientes/'+p.cliente.id}>Volver a la ficha</Link></nav></main>
}
