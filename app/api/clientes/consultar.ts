import {currentUser} from '../../../lib/session'
import {ErrorCliente} from '../../../lib/guardar-cliente'

export async function consultar(lectura:()=>Promise<unknown>) {
  if (!await currentUser()) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  try {return Response.json(await lectura())}
  catch(e) {
    if (!(e instanceof ErrorCliente)) throw e
    return Response.json({error:{code:e.code,message:e.message}},{status:e.status})
  }
}
