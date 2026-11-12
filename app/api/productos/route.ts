import {crearProducto,ErrorProducto} from '../../../lib/alta-producto'
import {currentUser} from '../../../lib/session'
import {catalogo} from '../../../lib/catalogo'
export async function GET(){
  if(!await currentUser())return Response.json({mensaje:'Iniciá sesión'},{status:401})
  return Response.json(await catalogo())
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  let body: unknown
  try { body = await req.json() }
  catch { return Response.json({error:{code:'JSON_INVALIDO',message:'El cuerpo debe ser JSON.'}},{status:400}) }
  try {
    const nuevo = await crearProducto(user,body)
    return Response.json(nuevo,{status:201})
  } catch(error) {
    if (error instanceof ErrorProducto) return Response.json({error:{code:error.code,message:error.message}},{status:error.status})
    throw error
  }
}
