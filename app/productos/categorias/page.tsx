import Link from 'next/link'
import {redirect} from 'next/navigation'
import {currentUser} from '../../../lib/session'
import {categoriasActivas} from '../../../lib/categorias'
import Gestion from './Gestion'

export default async function Categorias() {
  const usuario = await currentUser()
  if (!usuario) redirect('/')
  const filas = await categoriasActivas()
  return <><aside><b>Mostrador</b><p>Productos</p></aside><main>
    <Link href="/productos">Volver al catálogo</Link><h1>Categorías</h1>
    {usuario.rol === 'admin' && <Gestion />}
    <h2>Categorías activas</h2>
    {filas.length === 0 && <p>No hay categorías activas.</p>}
    {filas.map(c => usuario.rol === 'admin' ? <Gestion key={c.id + ':' + c.nombre} categoria={c} /> : <p key={c.id}>{c.nombre}</p>)}
  </main></>
}
