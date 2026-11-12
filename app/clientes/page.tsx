import Formulario from './Formulario'
import Link from 'next/link'
import {redirect} from 'next/navigation'
import {currentUser} from '../../lib/session'
import {listarClientes} from '../../lib/clientes'

const moneda = new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'})

export default async function Clientes({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if (!await currentUser()) redirect('/')
  const entrada = await searchParams
  const params = new URLSearchParams()
  for (const campo of ['q','page','conDeuda','orden']) {
    const valor = entrada[campo]
    if (typeof valor === 'string' && valor.trim()) params.set(campo,valor.trim())
  }
  const {data,total,totalAdeudado,page,pageSize} = await listarClientes(params)
  function enlace(n:number) {
    const destino = new URLSearchParams(params)
    destino.set('page',String(n))
    return '/clientes?'+destino.toString()
  }
  return <><aside><b>Mostrador</b><p>Clientes</p></aside><main>
    <Link href="/">Volver a ventas</Link><h1>Clientes</h1><Formulario/>
    <form method="get" action="/clientes" role="search" key={params.toString()}>
      <label>Nombre o documento<input type="search" name="q" defaultValue={params.get('q') ?? ''}/></label>
      <label>Mostrar<select name="conDeuda" defaultValue={params.get('conDeuda') ?? 'false'}>
        <option value="false">Todos los clientes</option><option value="true">Clientes con deuda</option></select></label>
      {params.has('orden') && <input type="hidden" name="orden" value={params.get('orden')!}/>}
      <button>Buscar</button> <Link href="/clientes">Limpiar filtros</Link>
    </form>
    {totalAdeudado !== undefined && <p>Total adeudado: <strong>{moneda.format(totalAdeudado/100)}</strong></p>}
    {data.length ? <section><table><thead><tr><th>Nombre</th><th>Documento</th><th>Saldo</th></tr></thead>
      <tbody>{data.map(c=><tr key={c.id}><td><Link href={'/clientes/'+c.id}>{c.nombre}</Link></td><td>{c.documento}</td><td>{moneda.format(c.saldo/100)}</td></tr>)}</tbody>
    </table></section> : <p>No hay clientes en esta página con los filtros seleccionados.</p>}
    <nav aria-label="Páginas de clientes">{page>1 && <Link href={enlace(page-1)}>Anterior </Link>}
      {data.length>0 && <span>Página {page} de {Math.ceil(total/pageSize)} </span>}
      {page*pageSize<total && <Link href={enlace(page+1)}>Siguiente</Link>}</nav>
  </main></>
}
