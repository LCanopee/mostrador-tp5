import {guardar} from './guardar'
import {currentUser} from '../../../lib/session'
import {listarClientes} from '../../../lib/clientes'

export async function GET(req:Request) {
  if (!await currentUser()) return Response.json({error:{code:'NO_AUTENTICADO',message:'Iniciá sesión.'}},{status:401})
  return Response.json(await listarClientes(new URL(req.url).searchParams))
}

export function POST(req:Request) { return guardar(req) }
