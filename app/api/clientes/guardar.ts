import {currentUser} from '../../../lib/session'
import {guardarCliente,ErrorCliente} from '../../../lib/guardar-cliente'

export async function guardar(req:Request,id?:number) {
  if (!await currentUser()) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  if (id !== undefined && (!Number.isSafeInteger(id) || id<1)) return Response.json({error:{code:'NO_ENCONTRADO',message:'Cliente inexistente.'}},{status:404})
  let datos:unknown
  try { datos = await req.json() }
  catch { return Response.json({error:{code:'JSON_INVALIDO',message:'Se esperaba JSON.'}},{status:400}) }
  try { return Response.json(await guardarCliente(datos,id),{status:id === undefined ? 201 : 200}) }
  catch(e) {
    if (!(e instanceof ErrorCliente)) throw e
    return Response.json({error:{code:e.code,message:e.message}},{status:e.status})
  }
}
