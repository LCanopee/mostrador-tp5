import {atender} from '../atender'
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}) {
  return atender(req,Number((await params).id))
}
