import Link from 'next/link'
import {notFound,redirect} from 'next/navigation'
import {fichaCliente,cuentaCliente} from '../../../lib/ficha-cliente'
import {ErrorCliente} from '../../../lib/guardar-cliente'
import {currentUser} from '../../../lib/session'
import Formulario from '../Formulario'

const pesos=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'})
const importe=(centavos:number)=>pesos.format(centavos/100)
const fecha=(iso:string)=>new Date(iso).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})

export default async function Cliente({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!await currentUser()) redirect('/')
  const id=Number((await params).id)
  const c=await fichaCliente(id).catch(e=>{if(e instanceof ErrorCliente && e.status===404) notFound(); throw e})
  const entrada=await searchParams
  const filtro=new URLSearchParams()
  for(const k of ['desde','hasta']) if(typeof entrada[k]==='string' && entrada[k]) filtro.set(k,entrada[k])
  let aviso=''
  const cuenta=await cuentaCliente(id,filtro).catch(e=>{
    if (!(e instanceof ErrorCliente) || e.status!==422) throw e
    aviso=e.message
    return null
  })
  const paginas=Math.max(1,Math.ceil((cuenta?.movimientos.length ?? 0)/20))
  const n=Number(entrada.page)
  const pagina=Number.isSafeInteger(n) ? Math.min(paginas,Math.max(1,n)) : 1
  function enlace(n:number) {
    const p=new URLSearchParams(filtro)
    p.set('page',String(n))
    return '/clientes/'+id+'?'+p.toString()
  }
  return <><aside><b>Mostrador</b><p>Clientes</p></aside><main><Link href="/clientes">Volver a clientes</Link>
    <h1>{c.nombre}</h1><p>{c.tipoDoc} {c.nroDoc}</p>
    <p>{[c.domicilio,c.telefono,c.email].filter(Boolean).join(' · ')}</p>
    <p>Cuenta corriente {c.cuentaCorriente?'habilitada':'deshabilitada'} · Saldo actual <strong>{importe(c.saldo)}</strong></p>
    {c.limiteCredito!==null && <p>Límite {importe(c.limiteCredito)} · Disponible {importe(c.disponible!)}</p>}
    <Formulario cliente={{id,nombre:c.nombre,tipo_doc:c.tipoDoc,documento:c.nroDoc,email:c.email,domicilio:c.domicilio,telefono:c.telefono,habilitado:Number(c.cuentaCorriente),limite_credito:c.limiteCredito}}/>
    <h2>Últimas facturas</h2>
    {c.ultimasFacturas.length ? <table><thead><tr><th>Número</th><th>Fecha</th><th>Pago</th><th>Total</th></tr></thead>
      <tbody>{c.ultimasFacturas.map(f=><tr key={f.id}><td>{f.numeroFormateado}</td><td>{fecha(f.fecha)}</td><td>{f.formaPago.replaceAll('_',' ')}</td><td>{importe(f.total)}</td></tr>)}</tbody></table> : <p>Sin facturas.</p>}
    <h2>Movimientos de cuenta corriente</h2>
    <form><label>Desde<input type="date" name="desde" defaultValue={filtro.get('desde') ?? ''}/></label>
      <label>Hasta<input type="date" name="hasta" defaultValue={filtro.get('hasta') ?? ''}/></label>
      <button>Filtrar</button> <Link href={'/clientes/'+id}>Limpiar fechas</Link></form>
    {aviso && <p role="alert">{aviso}</p>}
    {cuenta && <><p>Saldo anterior al período: {importe(cuenta.saldoAnterior)}</p>
      {cuenta.movimientos.length ? <table><thead><tr>{['Fecha','Descripción','Débito','Crédito','Saldo'].map(t=><th key={t}>{t}</th>)}</tr></thead>
      <tbody>{cuenta.movimientos.slice((pagina-1)*20,pagina*20).map((m,i)=><tr key={i}><td>{fecha(m.fecha)}</td><td>{m.descripcion}</td><td>{m.tipo==='debito'?importe(m.importe):'—'}</td>
        <td>{m.tipo==='credito'?importe(m.importe):'—'}</td><td>{importe(m.saldo)}</td></tr>)}</tbody></table> : <p>Sin movimientos en este período.</p>}
      {paginas>1 && <nav>{pagina>1 && <Link href={enlace(pagina-1)}>Anterior </Link>}Página {pagina} de {paginas} {pagina<paginas && <Link href={enlace(pagina+1)}>Siguiente</Link>}</nav>}
      <p>Saldo al cierre del período: {importe(cuenta.saldo)}</p></>}
    </main></>
}
