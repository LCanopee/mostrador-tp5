import {currentUser} from '../../../lib/session'
import {listarFacturas,FiltroFacturaInvalido} from '../../../lib/listado-facturas'
export async function GET(req:Request) {
  if (!await currentUser()) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  try {return Response.json(await listarFacturas(new URL(req.url).searchParams))}
  catch(e) {
    if (!(e instanceof FiltroFacturaInvalido)) throw e
    return Response.json({error:{code:'VALIDACION',message:e.message}},{status:422})
  }
}
