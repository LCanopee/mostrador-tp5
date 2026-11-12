import {and, asc, count, eq, ne, or, sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {usuarios, sesiones} from '../db/schema.ts'
import {hashPassword} from './password.ts'

export class ErrorUsuario extends Error {
  readonly status: number
  readonly code: string
  constructor(status:number, code:string, mensaje:string) {
    super(mensaje)
    this.status = status
    this.code = code
  }
}
type Actor = {id:number; rol:string} | null
function exigirAdmin(actor:Actor): asserts actor is NonNullable<Actor> {
  if (!actor) throw new ErrorUsuario(401,'NO_AUTENTICADO','Iniciá sesión.')
  if (actor.rol !== 'admin') throw new ErrorUsuario(403,'SIN_PERMISO','Se requiere rol administrador.')
}
const visibles = {id:usuarios.id, nombre:usuarios.nombre, email:usuarios.email, rol:usuarios.rol, activo:usuarios.activo}
function positivo(valor:string|null, base:number) {
  const n = Number(valor)
  return Number.isSafeInteger(n) && n > 0 ? n : base
}

// RF-U4: lista paginada de datos públicos de las cuentas.
export async function listarUsuarios(actor:Actor, params:URLSearchParams) {
  exigirAdmin(actor)
  const q = params.get('q')?.trim()
  const estado = params.get('activo')
  const page = positivo(params.get('page'),1)
  const pageSize = Math.min(100,positivo(params.get('pageSize'),20))
  const filtro = and(estado === 'true' || estado === 'false' ? eq(usuarios.activo,Number(estado === 'true')) : undefined,
    q ? or(sql`instr(lower(${usuarios.nombre}),lower(${q})) > 0`,sql`instr(lower(${usuarios.email}),lower(${q})) > 0`) : undefined)
  const [totales, filas] = await db.batch([
    db.select({total:count()}).from(usuarios).where(filtro),
    db.select(visibles).from(usuarios).where(filtro).orderBy(asc(usuarios.nombre),asc(usuarios.id))
      .limit(pageSize).offset(Math.min(Number.MAX_SAFE_INTEGER,(page-1)*pageSize))
  ])
  return {data:filas.map(u=>({...u,activo:Boolean(u.activo)})), total:totales[0].total, page, pageSize}
}

// RF-U4: altas, edición parcial y baja lógica conservando el historial del usuario.
export async function guardarUsuario(actor:Actor, body:unknown, id?:number) {
  exigirAdmin(actor)
  const invalido = () => new ErrorUsuario(422,'VALIDACION','Revisá el nombre, email, rol y los campos enviados.')
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalido()
  const d = body as Record<string,unknown>
  const campos = Object.keys(d)
  const alta = id === undefined
  const permitidos = ['nombre','email','rol',alta ? 'password' : 'activo']
  if (!campos.length || campos.some(k=>!permitidos.includes(k))) throw invalido()
  const nombre = typeof d.nombre === 'string' ? d.nombre.trim() : undefined
  const email = typeof d.email === 'string' ? d.email.trim().toLowerCase() : undefined
  const rol = d.rol
  if ((('nombre' in d || alta) && !nombre) ||
      (('email' in d || alta) && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
      (('rol' in d || alta) && rol !== 'admin' && rol !== 'vendedor') ||
      ('activo' in d && typeof d.activo !== 'boolean')) throw invalido()
  if (id === actor.id && (d.activo === false || rol === 'vendedor')) {
    throw new ErrorUsuario(422,'OPERACION_SOBRE_SI_MISMO','Tu cuenta debe seguir activa y con rol administrador.')
  }
  const rolValido = rol === 'admin' || rol === 'vendedor' ? rol : undefined
  const duplicado = () => new ErrorUsuario(409,'EMAIL_DUPLICADO','Ya hay una cuenta con ese email.')
  if (alta) {
    if (typeof d.password !== 'string' || d.password.length < 8) throw new ErrorUsuario(422,'VALIDACION','La contraseña debe tener al menos 8 caracteres.')
    const [nuevo] = await db.insert(usuarios).values({nombre:nombre!,email:email!,rol:rolValido!,clave:hashPassword(d.password)})
      .onConflictDoNothing({target:usuarios.email}).returning(visibles)
    if (!nuevo) throw duplicado()
    return {...nuevo,activo:true}
  }
  if (!Number.isSafeInteger(id) || id < 1) throw new ErrorUsuario(404,'NO_ENCONTRADO','Usuario inexistente.')
  return db.transaction(async tx=>{
    if (email) {
      const [otro] = await tx.select({id:usuarios.id}).from(usuarios).where(and(eq(usuarios.email,email),ne(usuarios.id,id)))
      if (otro) throw duplicado()
    }
    const [u] = await tx.update(usuarios).set({nombre,email,rol:rolValido,activo:'activo' in d ? Number(d.activo) : undefined})
      .where(eq(usuarios.id,id)).returning(visibles)
    if (!u) throw new ErrorUsuario(404,'NO_ENCONTRADO','Usuario inexistente.')
    if (!u.activo) await tx.delete(sesiones).where(eq(sesiones.usuario_id,id))
    return {...u,activo:Boolean(u.activo)}
  })
}
