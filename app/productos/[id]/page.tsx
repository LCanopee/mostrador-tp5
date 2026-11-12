import Editar from './Editar'
import {categoriasActivas} from '../../../lib/categorias'
import Ajuste from './Ajuste'
import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'
import {desc, eq} from 'drizzle-orm'
import {db} from '../../../db'
import {productos,movimientos_stock,usuarios} from '../../../db/schema'
import {currentUser} from '../../../lib/session'

export default async function Ficha({params}:{params:Promise<{id:string}>}) {
  const usuario=await currentUser()
  if (!usuario) redirect('/')
  const id=Number((await params).id)
  if (!Number.isSafeInteger(id) || id<1) notFound()
  const [p]=await db.select().from(productos).where(eq(productos.id,id))
  if (!p) notFound()
  const opciones = usuario.rol === 'admin' ? await categoriasActivas() : []
  const movimientos=await db.select({m:movimientos_stock,usuario:usuarios.nombre}).from(movimientos_stock)
    .innerJoin(usuarios,eq(usuarios.id,movimientos_stock.usuario_id)).where(eq(movimientos_stock.producto_id,id))
    .orderBy(desc(movimientos_stock.creado),desc(movimientos_stock.id))
  return <><aside><b>Mostrador</b><p>Productos</p></aside><main><Link href="/productos">Volver al catálogo</Link>
    <h1>{p.nombre}</h1>{!p.activo && <p>Producto inactivo</p>}{usuario.rol==='admin' && <Editar p={p} categorias={opciones}/>}<p>{p.codigo} · Existencia actual: {p.stock}</p>{usuario.rol==='admin' && <Ajuste id={id} stock={p.stock}/>}<h2>Historial de stock</h2>
    {movimientos.length ? <section style={{overflowX:'auto'}}><table><thead><tr>{['Fecha','Tipo','Motivo','Cantidad','Existencia resultante','Usuario','Factura'].map(s=><th key={s}>{s}</th>)}</tr></thead>
    <tbody>{movimientos.map(({m,usuario})=><tr key={m.id}><td>{new Date(m.creado*1000).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})}</td><td>{m.tipo}</td><td>{m.motivo}{m.observacion && <small>{m.observacion}</small>}</td><td>{m.cantidad}</td><td>{m.existencia_resultante}</td><td>{usuario}</td><td>{m.factura_id??'—'}</td></tr>)}</tbody></table></section> : <p>Sin movimientos de stock.</p>}
  </main></>
}
