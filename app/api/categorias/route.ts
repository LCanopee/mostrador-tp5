import {currentUser} from '../../../lib/session'
import {categoriasActivas} from '../../../lib/categorias'
import {guardar} from './guardar'

export async function GET() {
  if (!await currentUser()) return Response.json({error:{code:'NO_AUTENTICADO', message:'Iniciá sesión.'}}, {status:401})
  return Response.json(await categoriasActivas())
}
export function POST(req: Request) { return guardar(req) }
