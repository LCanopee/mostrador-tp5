import {redirect} from 'next/navigation'
import Link from 'next/link'
import {currentUser} from '../../lib/session'
import {catalogo} from '../../lib/catalogo'
import AltaProducto from './AltaProducto'
import {db} from '../../db'
import {categorias} from '../../db/schema'
import {asc,eq} from 'drizzle-orm'
export default async function Productos({searchParams}: {searchParams: Promise<{q?: string | string[]}>}){
  const usuario=await currentUser()
  if(!usuario)redirect('/')
  const opciones=usuario.rol==='admin'?await db.select({id:categorias.id,nombre:categorias.nombre}).from(categorias).where(eq(categorias.activa,1)).orderBy(asc(categorias.nombre)):[]
  const {q} = await searchParams
  const busqueda = (Array.isArray(q) ? q[0] : q)?.trim() ?? ''
  const rows = await catalogo(busqueda)
  const moneda=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'})
  return <><aside><b>Mostrador</b><p>Productos</p></aside><main><Link href="/">Volver a ventas</Link><h1>Catálogo</h1>{usuario.rol==='admin' && <AltaProducto categorias={opciones}/>}
    <form action="/productos" method="get" role="search" key={busqueda}>
      <label htmlFor="busqueda">Buscar por código o nombre</label>
      <input type="search" id="busqueda" name="q" defaultValue={busqueda} placeholder="Ej. CAF-001 o arroz" />
      <button type="submit">Buscar</button>
      {busqueda && <Link href="/productos" style={{marginLeft: 12}}>Limpiar búsqueda</Link>}
    </form>
    {rows.length?<section style={{overflowX:'auto'}}><table><thead><tr>{['Código','Producto','Categoría','Precio','Existencia'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>{p.codigo}</td><td><Link href={'/productos/'+p.id}>{p.nombre}</Link></td><td>{p.categoria}</td><td>{moneda.format(p.precio/100)}</td><td>{p.stock}{p.stock<p.minimo?' · Bajo mínimo':''}</td></tr>)}</tbody></table></section>:<p>{busqueda ? 'No se encontraron productos para esa búsqueda.' : 'El catálogo está vacío.'}</p>}</main></>
}
