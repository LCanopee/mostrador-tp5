import {redirect} from 'next/navigation'
import Link from 'next/link'
import {currentUser} from '../../lib/session'
import {catalogo} from '../../lib/catalogo'
import AltaProducto from './AltaProducto'
import {categoriasActivas} from '../../lib/categorias'
export default async function Productos({searchParams}: {searchParams: Promise<Record<string,string | string[] | undefined>>}){
  const usuario=await currentUser()
  if(!usuario)redirect('/')
  const entrada = await searchParams
  const params = new URLSearchParams()
  for (const campo of ['q', 'categoriaId', 'page', 'pageSize']) {
    const valor = entrada[campo]
    const primero = Array.isArray(valor) ? valor[0] : valor
    if (primero?.trim()) params.set(campo, primero.trim())
  }
  const [opciones, {data: rows, total, page, pageSize}] = await Promise.all([categoriasActivas(), catalogo(params)])
  const busqueda = params.get('q') ?? ''
  const categoriaId = params.get('categoriaId') ?? ''
  const paginas = Math.max(1, Math.ceil(total / pageSize))
  function enlace(pagina: number) {
    const destino = new URLSearchParams(params)
    destino.set('page', String(pagina))
    return '/productos?' + destino.toString()
  }
  const moneda=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'})
  return <><aside><b>Mostrador</b><p>Productos</p></aside><main><Link href="/">Volver a ventas</Link><h1>Catálogo</h1><p><Link href="/productos/categorias">Categorías</Link></p>{usuario.rol==='admin' && <AltaProducto categorias={opciones}/>}
    <form action="/productos" method="get" role="search" key={JSON.stringify([busqueda, categoriaId])}>
      <label htmlFor="busqueda">Buscar por código o nombre</label>
      <input type="search" id="busqueda" name="q" defaultValue={busqueda} placeholder="Ej. CAF-001 o arroz" />
      <label htmlFor="categoriaId">Categoría</label>
      <select id="categoriaId" name="categoriaId" defaultValue={categoriaId}>
        <option value="">Todas las categorías</option>
        {opciones.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>
      {pageSize !== 20 && <input type="hidden" name="pageSize" value={pageSize} />}
      <button type="submit">Buscar</button>
      {(busqueda || categoriaId) && <Link href="/productos" style={{marginLeft: 12}}>Limpiar filtros</Link>}
    </form>
    {rows.length?<section style={{overflowX:'auto'}}><table><thead><tr>{['Código','Producto','Categoría','Precio','Existencia'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>{p.codigo}</td><td><Link href={'/productos/'+p.id}>{p.nombre}</Link></td><td>{p.categoria}</td><td>{moneda.format(p.precio/100)}</td><td>{p.stock}{p.stock<p.minimo?' · Bajo mínimo':''}</td></tr>)}</tbody></table></section>:<p>{page > paginas ? 'Esta página no contiene productos.' : busqueda || categoriaId ? 'No se encontraron productos con esos filtros.' : 'El catálogo está vacío.'}</p>}
    {page > paginas ? <Link href={enlace(1)}>Volver a la primera página</Link> :
      total > 0 && <nav aria-label="Páginas del catálogo">
        {page > 1 && <Link href={enlace(page - 1)}>Anterior</Link>}
        <span> Página {page} de {paginas} · {total} productos </span>
        {page < paginas && <Link href={enlace(page + 1)}>Siguiente</Link>}
      </nav>}
    </main></>
}
