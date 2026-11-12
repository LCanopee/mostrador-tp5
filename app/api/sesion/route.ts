import {eq,and} from 'drizzle-orm'
import {db} from '../../../db'
import {usuarios} from '../../../db/schema'
import {currentUser,start,end} from '../../../lib/session'
import {matches} from '../../../lib/password'
export async function GET(){const u=await currentUser();return Response.json(u,{status:u?200:401})}
export async function POST(req:Request){
  const body=await req.json().catch(()=>null)
  if(typeof body?.acceso!=='string'||typeof body?.contrasena!=='string')return Response.json({mensaje:'Datos inválidos'},{status:422})
  const [u]=await db.select().from(usuarios).where(and(eq(usuarios.email,body.acceso.trim().toLowerCase()),eq(usuarios.activo,1)))
  if(!u||!matches(body.contrasena,u.clave))return Response.json({mensaje:'Acceso incorrecto'},{status:401})
  await start(u.id)
  return Response.json({nombre:u.nombre,rol:u.rol})
}
export async function DELETE(){await end();return new Response(null,{status:204})}
