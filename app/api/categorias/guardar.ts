import {currentUser} from '../../../lib/session'
import {guardarCategoria, ErrorCategoria} from '../../../lib/categorias'

export async function guardar(req: Request, id?: number) {
  const usuario = await currentUser()
  if (!usuario) return Response.json({error:{code:'NO_AUTENTICADO', message:'Iniciá sesión.'}}, {status:401})
  if (usuario.rol !== 'admin') return Response.json({error:{code:'SIN_PERMISO', message:'Se requiere rol de administrador.'}}, {status:403})
  let datos: unknown
  try { datos = await req.json() }
  catch { return Response.json({error:{code:'JSON_INVALIDO', message:'El cuerpo debe ser JSON.'}}, {status:400}) }
  try {
    return Response.json(await guardarCategoria(usuario.rol, datos, id), {status:id === undefined ? 201 : 200})
  } catch (error) {
    if (!(error instanceof ErrorCategoria)) throw error
    return Response.json({error:{code:error.code, message:error.message}}, {status:error.status})
  }
}
