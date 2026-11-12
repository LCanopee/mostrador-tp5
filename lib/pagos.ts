import {eq,sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {clientes,pagos,movimientos_cuenta} from '../db/schema.ts'
import {ErrorCliente} from './guardar-cliente.ts'

export const numeroRecibo=(id:number)=>'R 0001-'+String(id).padStart(8,'0')
function recibo(p:typeof pagos.$inferSelect) {
  return {id:p.id,numeroRecibo:numeroRecibo(p.id),fecha:new Date(p.creado*1000).toISOString(),
    cliente:{id:p.cliente_id,nombre:p.nombre_cliente},usuario:{id:p.usuario_id,nombre:p.nombre_usuario},
    importe:p.importe,medio:p.medio,observacion:p.observacion,saldoCliente:p.saldo_cliente}
}
export async function obtenerPago(id:number) {
  if (!Number.isSafeInteger(id) || id<1) throw new ErrorCliente(404,'NO_ENCONTRADO','Recibo inexistente.')
  const [p]=await db.select().from(pagos).where(eq(pagos.id,id))
  if (!p) throw new ErrorCliente(404,'NO_ENCONTRADO','Recibo inexistente.')
  return recibo(p)
}

// RF-C5: recibo y crédito se confirman juntos con el saldo verificado en la transacción.
export async function registrarPago(clienteId:number,usuario:{id:number;nombre:string},body:unknown) {
  const invalido=()=>new ErrorCliente(422,'VALIDACION','Revisá el importe, medio de pago y observación.')
  if (!body || typeof body!=='object' || Array.isArray(body)) throw invalido()
  const {importe,medio,observacion}=body as Record<string,unknown>
  if (typeof importe!=='number' || !Number.isSafeInteger(importe) || importe<=0 ||
      !['efectivo','transferencia','tarjeta_debito'].includes(String(medio)) || typeof medio!=='string' ||
      (observacion!=null && typeof observacion!=='string')) throw invalido()
  if (!Number.isSafeInteger(clienteId) || clienteId<1) throw new ErrorCliente(404,'NO_ENCONTRADO','Cliente inexistente.')
  return db.transaction(async tx=>{
    const [c]=await tx.select().from(clientes).where(eq(clientes.id,clienteId))
    if (!c) throw new ErrorCliente(404,'NO_ENCONTRADO','Cliente inexistente.')
    if (!c.habilitado) throw new ErrorCliente(422,'CUENTA_CORRIENTE_NO_HABILITADA','Cuenta corriente deshabilitada.')
    const [cuenta]=await tx.select({saldo:sql<number>`coalesce(sum(${movimientos_cuenta.importe}),0)`})
      .from(movimientos_cuenta).where(eq(movimientos_cuenta.cliente_id,clienteId))
    if (importe>cuenta.saldo) throw new ErrorCliente(422,'PAGO_SUPERA_DEUDA','El pago supera el saldo adeudado.')
    const [p]=await tx.insert(pagos).values({cliente_id:clienteId,usuario_id:usuario.id,nombre_cliente:c.nombre,
      nombre_usuario:usuario.nombre,importe,medio,observacion:observacion?.trim() || null,saldo_cliente:cuenta.saldo-importe}).returning()
    await tx.insert(movimientos_cuenta).values({cliente_id:clienteId,pago_id:p.id,importe:-importe,creado:p.creado})
    return recibo(p)
  })
}
