import {currentUser} from '../../../../lib/session'
import {editarProducto, ErrorProducto} from '../../../../lib/alta-producto'

export async function PATCH(req: Request, {params}: {params:Promise<{id:string}>}) {
  const usuario = await currentUser()
  if (!usuario) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}}, {status:401})
  if (usuario.rol !== 'admin') return Response.json({error:{code:'SIN_PERMISO',message:'Se requiere rol administrador.'}}, {status:403})
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({error:{code:'NO_ENCONTRADO',message:'Producto inexistente.'}}, {status:404})
  let body: unknown
  try { body = await req.json() }
  catch { return Response.json({error:{code:'JSON_INVALIDO',message:'El cuerpo debe ser JSON.'}}, {status:400}) }
  try { return Response.json(await editarProducto(usuario.rol,id,body)) }
  catch (error) {
    if (!(error instanceof ErrorProducto)) throw error
    return Response.json({error:{code:error.code,message:error.message}}, {status:error.status})
  }
}
