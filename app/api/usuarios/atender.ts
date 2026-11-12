import {currentUser} from '../../../lib/session'
import {ErrorUsuario, guardarUsuario, listarUsuarios} from '../../../lib/usuarios'

export async function atender(req:Request,id?:number) {
  try {
    const actor = await currentUser()
    if (!actor) throw new ErrorUsuario(401,'NO_AUTENTICADO','Iniciá sesión.')
    if (actor.rol !== 'admin') throw new ErrorUsuario(403,'SIN_PERMISO','Se requiere rol administrador.')
    if (req.method === 'GET') return Response.json(await listarUsuarios(actor,new URL(req.url).searchParams))
    let body:unknown
    try { body = await req.json() }
    catch { throw new ErrorUsuario(400,'JSON_INVALIDO','Se esperaba JSON válido.') }
    return Response.json(await guardarUsuario(actor,body,id),{status:req.method === 'POST' ? 201 : 200})
  } catch (e) {
    if (!(e instanceof ErrorUsuario)) throw e
    return Response.json({error:{code:e.code,message:e.message}},{status:e.status})
  }
}
