import {and, eq, gte, lte, sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {productos, movimientos_stock} from '../db/schema.ts'
import {motivosStock} from './motivos-stock.ts'

export class ErrorStock extends Error {
  status: number
  code: string
  constructor(status:number, code:string, message:string) {
    super(message)
    this.status=status
    this.code=code
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Cambio = {productoId:number; usuarioId:number; cantidad:number; tipo:'venta'|'ingreso'|'egreso'; motivo:string; facturaId?:number; observacion?:string}

// Regla 2: cada cambio de existencia genera un movimiento en la misma transacción.
export async function moverStock(tx:Tx, cambio:Cambio) {
  const {productoId,usuarioId,cantidad,tipo,motivo}=cambio
  const limites = cantidad<0 ? gte(productos.stock,-cantidad) : lte(productos.stock,Number.MAX_SAFE_INTEGER-cantidad)
  const [producto]=await tx.update(productos).set({stock:sql`${productos.stock} + ${cantidad}`})
    .where(and(eq(productos.id,productoId),limites,tipo==='venta'?eq(productos.activo,1):undefined)).returning()
  if (!producto) {
    const [actual]=await tx.select({id:productos.id}).from(productos).where(eq(productos.id,productoId))
    if (!actual) throw new ErrorStock(404,'NO_ENCONTRADO','Producto inexistente.')
    if (cantidad<0) throw new ErrorStock(409,'STOCK_INSUFICIENTE','La salida supera la existencia disponible o el producto no admite la venta.')
    throw new ErrorStock(422,'VALIDACION','La existencia resultante excede el máximo permitido.')
  }
  const [movimiento]=await tx.insert(movimientos_stock).values({
    producto_id:productoId, usuario_id:usuarioId, factura_id:cambio.facturaId, tipo, cantidad,
    existencia_resultante:producto.stock, motivo, observacion:cambio.observacion
  }).returning()
  return {producto,movimiento}
}

// RF-P4/P5: el operador indica una magnitud positiva. El servidor decide el signo.
export async function ajustarStock(usuario:{id:number;rol:string}, productoId:number, body:unknown) {
  if (usuario.rol!=='admin') throw new ErrorStock(403,'SIN_PERMISO','Se requiere rol administrador.')
  if (!Number.isSafeInteger(productoId) || productoId<1) throw new ErrorStock(404,'NO_ENCONTRADO','Producto inexistente.')
  if (!body || typeof body!=='object') throw new ErrorStock(422,'VALIDACION','Movimiento inválido.')
  const datos=body as Record<string,unknown>
  const {tipo,cantidad,motivo,observacion}=datos
  if (Object.keys(datos).some(k=>!['tipo','cantidad','motivo','observacion'].includes(k)) ||
    (tipo!=='ingreso' && tipo!=='egreso') || typeof cantidad!=='number' || !Number.isSafeInteger(cantidad) || cantidad<1 ||
    typeof motivo!=='string' || !motivosStock[tipo].includes(motivo) || (observacion!=null && typeof observacion!=='string'))
    throw new ErrorStock(422,'VALIDACION','Revisá el tipo, la cantidad y el motivo.')
  const {producto,movimiento}=await db.transaction(tx=>moverStock(tx,{productoId,usuarioId:usuario.id,tipo,
    cantidad:tipo==='egreso'?-cantidad:cantidad,motivo,observacion:observacion?.trim() || undefined}))
  return {id:movimiento.id,producto:{id:producto.id,codigo:producto.codigo},tipo,cantidad:movimiento.cantidad,
    existenciaResultante:producto.stock,motivo,observacion:movimiento.observacion,referencia:null,
    fecha:new Date(movimiento.creado*1000).toISOString(),usuario:{id:usuario.id,...('nombre' in usuario?{nombre:usuario.nombre}:{})}}
}
