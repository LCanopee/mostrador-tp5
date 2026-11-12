import {currentUser} from '../../../../../lib/session'
import {registrarPago} from '../../../../../lib/pagos'
import {ErrorCliente} from '../../../../../lib/guardar-cliente'

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}) {
  const usuario=await currentUser()
  if (!usuario) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  let body:unknown
  try {body=await req.json()} catch {return Response.json({error:{code:'JSON_INVALIDO',message:'Se esperaba JSON.'}},{status:400})}
  try {return Response.json(await registrarPago(Number((await params).id),usuario,body),{status:201})}
  catch(e) {
    if (!(e instanceof ErrorCliente)) throw e
    return Response.json({error:{code:e.code,message:e.message}},{status:e.status})
  }
}
