import Link from 'next/link'
import {notFound,redirect} from 'next/navigation'
import {currentUser} from '../../../lib/session'
import {obtenerFactura} from '../../../lib/comprobante'
import Imprimir from '../../pagos/[id]/Imprimir'

const ars=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'})
const pesos=(n:number)=>ars.format(n/100)
export default async function Factura({params}:{params:Promise<{id:string}>}) {
  if (!await currentUser()) redirect('/')
  const f=await obtenerFactura(Number((await params).id))
  if (!f) notFound()
  const {cliente,pago}=f
  return <main className="recibo"><header><strong>Mostrador</strong><p>Comprobante interno sin validez fiscal</p></header>
    <h1>Factura {f.numeroFormateado}</h1>
    <p>{new Date(f.fecha).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})}</p>
    <p>Vendedor: {f.vendedor.nombre ?? 'Usuario #'+f.vendedor.id}</p>
    <p>Comprador: {cliente.nombre} {cliente.nroDoc && <>· {cliente.tipoDoc} {cliente.nroDoc}</>}</p>
    {cliente.domicilio && <p>Domicilio: {cliente.domicilio}</p>}
    <table><thead><tr><th>Código</th><th>Descripción</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
    <tbody>{f.items.map(l=><tr key={l.productoId}><td>{l.codigo ?? '—'}</td><td>{l.descripcion}</td><td>{l.cantidad}</td>
      <td>{pesos(l.precioUnitario)}</td><td>{pesos(l.subtotal)}</td></tr>)}</tbody></table>
    <p><strong>Total: {pesos(f.total)}</strong></p>
    {pago.forma==='contado' && <p>Contado {pago.montoRecibido!==null && pago.vuelto!==null && <>· Recibido {pesos(pago.montoRecibido)} · Vuelto {pesos(pago.vuelto)}</>}</p>}
    {pago.forma==='tarjeta' && <p>Tarjeta {pago.tarjeta.tipo==='credito'?'de crédito':pago.tarjeta.tipo==='debito'?'de débito':''} {pago.tarjeta.marca} {pago.tarjeta.ultimos4 && ' · Terminada en '+pago.tarjeta.ultimos4}</p>}
    {pago.forma==='cuenta_corriente' && <p>Cuenta corriente {f.saldoCliente!=null && ' · Saldo después de la venta: '+pesos(f.saldoCliente)}</p>}
    <nav><Imprimir texto="Imprimir factura"/> <Link href="/ventas">Ver todas las facturas</Link> · <Link href="/">Nueva venta</Link></nav>
  </main>
}
