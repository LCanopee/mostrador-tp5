import {db} from '../../../db'
import {clientes} from '../../../db/schema'
import {currentUser} from '../../../lib/session'
export async function GET(){
  if(!await currentUser())return Response.json({mensaje:'Iniciá sesión'},{status:401})
  return Response.json(await db.select({id:clientes.id,nombre:clientes.nombre}).from(clientes))
}
