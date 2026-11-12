import {guardar} from '../guardar'
export async function PATCH(req: Request, {params}: {params: Promise<{id:string}>}) {
  return guardar(req, Number((await params).id))
}
