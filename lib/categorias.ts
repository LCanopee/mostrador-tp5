import {and, asc, eq} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {categorias, productos} from '../db/schema.ts'

export class ErrorCategoria extends Error {
  constructor(publicStatus: number, publicCode: string, message: string) {
    super(message)
    this.status = publicStatus
    this.code = publicCode
  }
  readonly status: number
  readonly code: string
}

export function categoriasActivas() {
  return db.select({id: categorias.id, nombre: categorias.nombre}).from(categorias)
    .where(eq(categorias.activa, 1)).orderBy(asc(categorias.nombre))
}

export async function guardarCategoria(rol: string, body: unknown, id?: number) {
  if (rol !== 'admin') throw new ErrorCategoria(403, 'SIN_PERMISO', 'Se requiere rol de administrador.')
  const invalido = () => new ErrorCategoria(422, 'VALIDACION', 'Revisá los campos de la categoría.')
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalido()
  const datos = body as Record<string, unknown>
  const campos = Object.keys(datos)
  if (!campos.length || campos.some(k => k !== 'nombre' && !(id !== undefined && k === 'activa'))) throw invalido()
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : undefined
  if (('nombre' in datos && !nombre) || ('activa' in datos && typeof datos.activa !== 'boolean')) throw invalido()
  const activa = datos.activa
  return db.transaction(async tx => {
    if (nombre) {
      const [otro] = await tx.select({id: categorias.id}).from(categorias).where(eq(categorias.nombre, nombre))
      if (otro && otro.id !== id) throw new ErrorCategoria(409, 'NOMBRE_DUPLICADO', 'Ya existe una categoría con ese nombre.')
    }
    if (id === undefined) {
      if (!nombre) throw invalido()
      const [nueva] = await tx.insert(categorias).values({nombre}).returning()
      return {id: nueva.id, nombre: nueva.nombre, activa: true}
    }
    if (!Number.isSafeInteger(id) || id < 1) throw invalido()
    if (activa === false) {
      const [producto] = await tx.select({id: productos.id}).from(productos)
        .where(and(eq(productos.categoria_id, id), eq(productos.activo, 1))).limit(1)
      if (producto) throw new ErrorCategoria(409, 'CATEGORIA_EN_USO', 'La categoría tiene productos activos.')
    }
    const [fila] = await tx.update(categorias).set({nombre, activa: activa === undefined ? undefined : Number(activa)})
      .where(eq(categorias.id, id)).returning()
    if (!fila) throw new ErrorCategoria(404, 'NO_ENCONTRADO', 'No se encontró la categoría.')
    return {id: fila.id, nombre: fila.nombre, activa: Boolean(fila.activa)}
  })
}
