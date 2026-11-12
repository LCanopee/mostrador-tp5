import {consultar} from '../../clientes/consultar'
import {obtenerPago} from '../../../../lib/pagos'
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}) {
  const id=Number((await params).id)
  return consultar(()=>obtenerPago(id))
}
