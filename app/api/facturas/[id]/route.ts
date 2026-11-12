import {currentUser} from '../../../../lib/session'
import {obtenerFactura} from '../../../../lib/comprobante'
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}) {
  if (!await currentUser()) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  const f=await obtenerFactura(Number((await params).id))
  return f ? Response.json(f) : Response.json({error:{code:'NO_ENCONTRADO',message:'Factura inexistente.'}},{status:404})
}
