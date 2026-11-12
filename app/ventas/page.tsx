import Link from 'next/link'
import {redirect} from 'next/navigation'
import {currentUser} from '../../lib/session'
import {listarFacturas,opcionesFiltrosFactura,FiltroFacturaInvalido} from '../../lib/listado-facturas'

const moneda=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'})
export default async function Facturas({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!await currentUser()) redirect('/')
  const entrada=await searchParams
  const p=new URLSearchParams()
  for(const k of ['q','desde','hasta','clienteId','vendedorId','forma','estado','page']){
    const v=entrada[k]
    if(typeof v==='string' && v.trim()) p.set(k,v.trim())
  }
  const [clientes,vendedores]=await opcionesFiltrosFactura()
  let aviso=''
  const lista=await listarFacturas(p).catch(e=>{
    if (!(e instanceof FiltroFacturaInvalido)) throw e
    aviso=e.message
    return null
  })
  function enlace(n:number) {
    const q=new URLSearchParams(p)
    q.set('page',String(n))
    return '/ventas?'+q.toString()
  }
  return <><aside><b>Mostrador</b><p>Facturas</p></aside><main><Link href="/">Volver a ventas</Link><h1>Facturas</h1>
    <form action="/ventas" role="search" key={p.toString()}>
      <label>Número o nombre del comprador<input name="q" type="search" defaultValue={p.get('q')??''}/></label>
      <label>Desde<input name="desde" type="date" defaultValue={p.get('desde')??''}/></label>
      <label>Hasta<input name="hasta" type="date" defaultValue={p.get('hasta')??''}/></label>
      <label>Cliente<select name="clienteId" defaultValue={p.get('clienteId')??''}><option value="">Todos</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
      <label>Vendedor<select name="vendedorId" defaultValue={p.get('vendedorId')??''}><option value="">Todos</option>{vendedores.map(v=><option key={v.id} value={v.id}>{v.nombre}</option>)}</select></label>
      <label>Forma de pago<select name="forma" defaultValue={p.get('forma')??''}><option value="">Todas</option><option value="contado">Contado</option><option value="tarjeta">Tarjeta</option><option value="cuenta_corriente">Cuenta corriente</option></select></label>
      <label>Estado<select name="estado" defaultValue={p.get('estado')??''}><option value="">Todos</option><option value="emitida">Emitida</option><option value="anulada">Anulada</option></select></label>
      <button>Buscar</button> <Link href="/ventas">Limpiar filtros</Link>
    </form>
    {aviso && <p role="alert">{aviso}</p>}
    {lista && <><p>{lista.total} facturas · Total emitido: <strong>{moneda.format(lista.totalEmitido/100)}</strong></p>
      {lista.data.length ? <section style={{overflowX:'auto'}}><table><thead><tr>{['Número','Fecha y hora','Comprador','Vendedor','Forma de pago','Total'].map(t=><th key={t}>{t}</th>)}</tr></thead>
      <tbody>{lista.data.map(f=><tr key={f.id}><td><Link href={'/ventas/'+f.id}>{f.numeroFormateado}</Link></td>
        <td>{new Date(f.fecha).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})}</td><td>{f.cliente.nombre}</td>
        <td>{f.vendedor.nombre??'Usuario #'+f.vendedor.id}</td><td>{f.forma.replaceAll('_',' ')}</td><td>{moneda.format(f.total/100)}</td></tr>)}</tbody></table></section>
        : <p>No hay facturas en esta página para los filtros elegidos.</p>}
      <nav aria-label="Páginas de facturas">{lista.page>1 && <Link href={enlace(lista.data.length?lista.page-1:1)}>{lista.data.length?'Anterior':'Primera página'} </Link>}
        {lista.data.length>0 && <span>Página {lista.page} de {Math.ceil(lista.total/lista.pageSize)} </span>}
        {lista.page*lista.pageSize<lista.total && <Link href={enlace(lista.page+1)}>Siguiente</Link>}</nav></>}
  </main></>
}
