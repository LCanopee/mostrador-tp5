import {currentUser} from '../../../../../lib/session'
import {ajustarStock, ErrorStock} from '../../../../../lib/stock'
export async function POST(req: Request,{params}:{params:Promise<{id:string}>}) {
  const usuario=await currentUser()
  if (!usuario) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  let body:unknown
  try {body=await req.json()} catch {return Response.json({error:{code:'JSON_INVALIDO',message:'JSON inválido.'}},{status:400})}
  try {
    const movimiento=await ajustarStock(usuario,Number((await params).id),body)
    return Response.json(movimiento,{status:201})
  } catch(e) {
    if (e instanceof ErrorStock) return Response.json({error:{code:e.code,message:e.message}},{status:e.status})
    throw e
  }
}
