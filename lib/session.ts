import {cookies} from 'next/headers'
import {createHash,randomBytes} from 'node:crypto'
import {eq,and,gt} from 'drizzle-orm'
import {db} from '../db'
import {usuarios,sesiones} from '../db/schema'
const digest=(v:string)=>createHash('sha256').update(v).digest('hex')
export async function currentUser(){
  const token=(await cookies()).get('sesion')?.value
  if(!token)return null
  const [u]=await db.select({id:usuarios.id,nombre:usuarios.nombre,rol:usuarios.rol}).from(sesiones).innerJoin(usuarios,eq(usuarios.id,sesiones.usuario_id)).where(and(eq(sesiones.token_hash,digest(token)),gt(sesiones.vence,Date.now()),eq(usuarios.activo,1)))
  return u??null
}
export async function start(id:number){
  const token=randomBytes(32).toString('hex')
  await db.insert(sesiones).values({usuario_id:id,token_hash:digest(token),vence:Date.now()+28800000})
  ;(await cookies()).set('sesion',token,{httpOnly:true,sameSite:'strict',path:'/',maxAge:28800,secure:process.env.NODE_ENV==='production'})
}
export async function end(){
  const jar=await cookies(), token=jar.get('sesion')?.value
  if(token)await db.delete(sesiones).where(eq(sesiones.token_hash,digest(token)))
  jar.delete('sesion')
}
