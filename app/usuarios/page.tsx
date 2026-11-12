import Link from 'next/link'
import {redirect} from 'next/navigation'
import {currentUser} from '../../lib/session'
import {listarUsuarios} from '../../lib/usuarios'
import Formulario from './Formulario'

export default async function Usuarios({searchParams}:{searchParams:Promise<Record<string,string | string[] | undefined>>}) {
  const actor = await currentUser()
  if (actor?.rol !== 'admin') redirect('/')
  const entrada = await searchParams
  const params = new URLSearchParams()
  for (const k of ['q','activo','page']) {
    const v = entrada[k]
    if (typeof v === 'string' && v) params.set(k,v)
  }
  const {data,total,page,pageSize} = await listarUsuarios(actor,params)
  function enlace(n:number) {
    const p = new URLSearchParams(params)
    p.set('page',String(n))
    return '/usuarios?'+p.toString()
  }
  return <><aside><b>Mostrador</b><p>Usuarios</p></aside><main><Link href="/">Volver a ventas</Link>
    <h1>Usuarios</h1><Formulario/>
    <form action="/usuarios" role="search"><label>Nombre o email<input name="q" defaultValue={params.get('q') ?? ''}/></label>
      <label>Estado<select name="activo" defaultValue={params.get('activo') ?? ''}>
        <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></label>
      <button>Buscar</button></form>
    {data.map(u=><Formulario key={u.id} cuenta={u} propia={u.id===actor.id}/>)}
    {!data.length && <p>No hay usuarios para esta búsqueda.</p>}
    <nav aria-label="Páginas de usuarios">{page>1 && <Link href={enlace(page-1)}>Anterior </Link>}
      {page*pageSize<total && <Link href={enlace(page+1)}>Siguiente</Link>}</nav>
  </main></>
}
