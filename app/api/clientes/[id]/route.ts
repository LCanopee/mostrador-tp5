import {fichaCliente} from '../../../../lib/ficha-cliente'
import {consultar} from '../consultar'
import {guardar} from '../guardar'
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}) {
  return guardar(req,Number((await params).id))
}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}) {
  const id=Number((await params).id)
  return consultar(()=>fichaCliente(id))
}