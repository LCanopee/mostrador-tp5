import {cuentaCliente} from '../../../../../lib/ficha-cliente'
import {consultar} from '../../consultar'
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}) {
  const id=Number((await params).id)
  return consultar(()=>cuentaCliente(id,new URL(req.url).searchParams))
}
