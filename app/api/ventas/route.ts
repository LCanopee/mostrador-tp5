import {ErrorStock} from '../../../lib/stock'
import {currentUser} from '../../../lib/session'
import {facturar,ErrorVenta} from '../../../lib/facturar'
export async function POST(req:Request){
  const user=await currentUser()
  if(!user)return Response.json({mensaje:'Iniciá sesión'},{status:401})
  const data=await req.json().catch(()=>null)
  if(!data||typeof data!=='object')return Response.json({mensaje:'JSON inválido'},{status:400})
  try{return Response.json(await facturar(user.id,data),{status:201})}catch(e){
    if(e instanceof ErrorVenta || e instanceof ErrorStock)return Response.json({mensaje:e.message},{status:e.status})
    throw e
  }
}
