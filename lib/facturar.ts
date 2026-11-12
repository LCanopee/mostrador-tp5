import {moverStock} from './stock.ts'
import {eq, sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {usuarios,clientes,facturas,factura_items,movimientos_cuenta} from '../db/schema.ts'
export class ErrorVenta extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status}}
function entero(n:unknown):n is number{return typeof n==='number'&&Number.isSafeInteger(n)&&n>0}
// RF-V6: el precio se toma del catálogo; un fallo revierte toda la operación.
export async function facturar(userId:number,body:Record<string,unknown>){
  const {clienteId,formaPago,lineas}=body
  if(!(clienteId===null||entero(clienteId))||typeof formaPago!=='string'||!['CONTADO','TARJETA','CUENTA_CORRIENTE'].includes(formaPago))throw new ErrorVenta(422,'Datos de venta inválidos')
  if(!Array.isArray(lineas)||!lineas.length||lineas.length>200||lineas.some(l=>!entero(l?.id)||!entero(l?.cantidad))||new Set(lineas.map(l=>l.id)).size!==lineas.length)throw new ErrorVenta(422,'Revisá los renglones')
  const permitidos = ['clienteId','formaPago','lineas']
  let tarjeta: {tipo:string; marca:string; ultimos4:string} | undefined
  let recibido: number | undefined
  if (formaPago === 'CONTADO') {
    permitidos.push('montoRecibido')
    if (body.montoRecibido !== undefined) {
      const n = body.montoRecibido
      if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) throw new ErrorVenta(422,'Monto recibido inválido.')
      recibido = n
    }
  }
  if (formaPago === 'TARJETA') {
    permitidos.push('tarjeta')
    const t = body.tarjeta as Record<string,unknown> | null
    if (!t || typeof t !== 'object' || Object.keys(t).some(k=>!['tipo','marca','ultimos4'].includes(k)) ||
        (t.tipo !== 'debito' && t.tipo !== 'credito') || typeof t.marca !== 'string' ||
        !/^[\p{L}][\p{L} .-]{0,39}$/u.test(t.marca.trim()) || typeof t.ultimos4 !== 'string' || !/^\d{4}$/.test(t.ultimos4)) {
      throw new ErrorVenta(422,'Ingresá tipo, marca y únicamente los últimos cuatro dígitos.')
    }
    tarjeta = {tipo:t.tipo,marca:t.marca.trim(),ultimos4:t.ultimos4}
  }
  if (Object.keys(body).some(k=>!permitidos.includes(k)) || lineas.some(l=>Object.keys(l).some(k=>k!=='id' && k!=='cantidad'))) {
    throw new ErrorVenta(422,'Hay campos que no corresponden a la venta.')
  }
  return db.transaction(async tx=>{
    const [cliente]=clienteId?await tx.select().from(clientes).where(eq(clientes.id,clienteId)):[]
    if(cliente && !cliente.activo) throw new ErrorVenta(422,'El cliente está dado de baja.')
    if(clienteId&&!cliente)throw new ErrorVenta(404,'Cliente inexistente')
    if(formaPago==='CUENTA_CORRIENTE'&&!cliente?.habilitado)throw new ErrorVenta(422,'Seleccioná un cliente habilitado')
    const [vendedor]=await tx.select({nombre:usuarios.nombre}).from(usuarios).where(eq(usuarios.id,userId))
    const [venta]=await tx.insert(facturas).values({cliente_id:clienteId,usuario_id:userId,nombre_cliente:cliente?.nombre??'Consumidor final',nombre_vendedor:vendedor.nombre,tipo_doc_cliente:cliente?.tipo_doc,documento_cliente:cliente?.documento,domicilio_cliente:cliente?.domicilio,forma_pago:formaPago,total:0}).returning()
    let total=0
    for(const {id,cantidad} of lineas){
      const {producto:p}=await moverStock(tx,{productoId:id,usuarioId:userId,facturaId:venta.id,tipo:'venta',cantidad:-cantidad,motivo:'Venta'})
      total+=p.precio*cantidad
      if(!Number.isSafeInteger(total))throw new ErrorVenta(422,'Importe fuera de rango')
      await tx.insert(factura_items).values({factura_id:venta.id,producto_id:id,cantidad,precio:p.precio,descripcion:p.nombre,codigo_producto:p.codigo})
    }
    let saldoCliente: number | null = null
    if (formaPago==='CUENTA_CORRIENTE' && cliente) {
      const [cuenta] = await tx.select({saldo:sql<number>`coalesce(sum(${movimientos_cuenta.importe}),0)`}).from(movimientos_cuenta).where(eq(movimientos_cuenta.cliente_id,cliente.id))
      saldoCliente=cuenta.saldo+total
      if (cliente.limite_credito !== null && saldoCliente > cliente.limite_credito) throw new ErrorVenta(422,'La venta supera el límite de crédito del cliente.')
    }
    const montoRecibido = formaPago === 'CONTADO' ? recibido ?? total : null
    if (montoRecibido !== null && montoRecibido < total) throw new ErrorVenta(422,'El monto recibido no cubre el total.')
    await tx.update(facturas).set({total,saldo_cliente_venta:saldoCliente,monto_recibido:montoRecibido,tarjeta_tipo:tarjeta?.tipo,
      tarjeta_marca:tarjeta?.marca,tarjeta_ultimos4:tarjeta?.ultimos4}).where(eq(facturas.id,venta.id))
    if(formaPago==='CUENTA_CORRIENTE'&&clienteId)await tx.insert(movimientos_cuenta).values({cliente_id:clienteId,factura_id:venta.id,importe:total})
    return {numero:venta.id,total,...(montoRecibido !== null ? {montoRecibido,vuelto:montoRecibido-total} : {})}
  })
}
