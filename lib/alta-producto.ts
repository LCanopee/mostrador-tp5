import {moverStock} from './stock.ts'
import {and, eq} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {categorias, productos} from '../db/schema.ts'

export class ErrorProducto extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}
function entero(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min
}

// RF-P2 y RF-P4: el alta y su entrada inicial se confirman juntas.
export async function crearProducto(usuario: {id:number; rol:string}, body: unknown) {
  if (usuario.rol !== 'admin') throw new ErrorProducto(403,'SIN_PERMISO','Solo el administrador puede crear productos.')
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ErrorProducto(422,'VALIDACION','Se esperaba un producto.')
  const datos = body as Record<string,unknown>
  const {codigo, descripcion, categoriaId, precio, stockMinimo, stockInicial = 0} = datos
  if (Object.keys(datos).some(k => !['codigo','descripcion','categoriaId','precio','stockMinimo','stockInicial'].includes(k))) {
    throw new ErrorProducto(422,'VALIDACION','Hay campos que no corresponden al alta.')
  }
  if (typeof codigo !== 'string' || !codigo.trim() || typeof descripcion !== 'string' || !descripcion.trim()
    || !entero(categoriaId,1) || !entero(precio,1) || !entero(stockMinimo,0) || !entero(stockInicial,0)) {
    throw new ErrorProducto(422,'VALIDACION','Revisá código, descripción, categoría, precio y cantidades.')
  }
  return db.transaction(async tx => {
    const [categoria] = await tx.select().from(categorias).where(and(eq(categorias.id,categoriaId),eq(categorias.activa,1)))
    if (!categoria) throw new ErrorProducto(422,'VALIDACION','Seleccioná una categoría activa.')
    const [nuevo] = await tx.insert(productos).values({
      codigo:codigo.trim().toUpperCase(), nombre:descripcion.trim(), categoria_id:categoriaId,
      precio, stock:0, stock_minimo:stockMinimo
    }).onConflictDoNothing({target:productos.codigo}).returning()
    if (!nuevo) throw new ErrorProducto(409,'CODIGO_DUPLICADO','Ya existe un producto con ese código.')
    if(stockInicial>0) await moverStock(tx,{productoId:nuevo.id,usuarioId:usuario.id,tipo:'ingreso',cantidad:stockInicial,motivo:'Stock inicial'})
    return {id:nuevo.id, codigo:nuevo.codigo, descripcion:nuevo.nombre, categoria:{id:categoria.id,nombre:categoria.nombre}, precio, existencia:stockInicial, stockMinimo, bajoMinimo:stockInicial<stockMinimo, activo:true}
  })
}

// RF-P2/P3: una edición no modifica existencias ni elimina referencias históricas.
export async function editarProducto(rol: string, id: number, body: unknown) {
  if (rol !== 'admin') throw new ErrorProducto(403, 'SIN_PERMISO', 'Se requiere rol administrador.')
  const invalido = () => new ErrorProducto(422, 'VALIDACION', 'Revisá los campos del producto.')
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalido()
  const datos = body as Record<string, unknown>
  const campos = Object.keys(datos)
  if (!campos.length || campos.some(c => !['codigo','descripcion','precio','categoriaId','stockMinimo','activo'].includes(c))) throw invalido()
  return db.transaction(async tx => {
    const [p] = await tx.select().from(productos).where(eq(productos.id,id))
    if (!p) throw new ErrorProducto(404,'NO_ENCONTRADO','Producto inexistente.')
    const cambios = {...{codigo:p.codigo, descripcion:p.nombre, categoriaId:p.categoria_id, precio:p.precio, stockMinimo:p.stock_minimo, activo:Boolean(p.activo)}, ...datos} as Record<string, unknown>
    const {codigo, descripcion, categoriaId, precio, stockMinimo, activo} = cambios
    if (typeof codigo !== 'string' || !codigo.trim() || typeof descripcion !== 'string' || !descripcion.trim() ||
        !entero(categoriaId,1) || !entero(precio,1) || !entero(stockMinimo,0) || typeof activo !== 'boolean') throw invalido()
    const [categoria] = await tx.select().from(categorias).where(eq(categorias.id,categoriaId))
    if (!categoria || (!categoria.activa && (activo || categoriaId !== p.categoria_id))) {
      throw new ErrorProducto(422,'VALIDACION','Seleccioná una categoría activa.')
    }
    const clave = codigo.trim().toUpperCase()
    const [otro] = await tx.select({id:productos.id}).from(productos).where(eq(productos.codigo,clave))
    if (otro && otro.id !== id) throw new ErrorProducto(409,'CODIGO_DUPLICADO','Ya existe ese código.')
    await tx.update(productos).set({codigo:clave,nombre:descripcion.trim(),categoria_id:categoriaId,
      precio,stock_minimo:stockMinimo,activo:Number(activo)}).where(eq(productos.id,id))
    return {id,codigo:clave,descripcion:descripcion.trim(),categoria:{id:categoriaId,nombre:categoria.nombre},
      precio,existencia:p.stock,stockMinimo,bajoMinimo:p.stock<stockMinimo,activo}
  })
}
