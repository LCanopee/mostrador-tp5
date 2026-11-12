import {moverStock} from './stock.ts'
import {eq} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {clientes,facturas,factura_items,movimientos_cuenta} from '../db/schema.ts'
export class ErrorVenta extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status}}
function entero(n:unknown):n is number{return typeof n==='number'&&Number.isSafeInteger(n)&&n>0}
// RF-V6: el precio se toma del catálogo; un fallo revierte toda la operación.
export async function facturar(userId:number,body:Record<string,unknown>){
  const {clienteId,formaPago,lineas}=body
  if(!(clienteId===null||entero(clienteId))||typeof formaPago!=='string'||!['CONTADO','TARJETA','CUENTA_CORRIENTE'].includes(formaPago))throw new ErrorVenta(422,'Datos de venta inválidos')
  if(!Array.isArray(lineas)||!lineas.length||lineas.length>200||lineas.some(l=>!entero(l?.id)||!entero(l?.cantidad))||new Set(lineas.map(l=>l.id)).size!==lineas.length)throw new ErrorVenta(422,'Revisá los renglones')
  return db.transaction(async tx=>{
    const [cliente]=clienteId?await tx.select().from(clientes).where(eq(clientes.id,clienteId)):[]
    if(clienteId&&!cliente)throw new ErrorVenta(404,'Cliente inexistente')
    if(formaPago==='CUENTA_CORRIENTE'&&!cliente?.habilitado)throw new ErrorVenta(422,'Seleccioná un cliente habilitado')
    const [venta]=await tx.insert(facturas).values({cliente_id:clienteId,usuario_id:userId,nombre_cliente:cliente?.nombre??'Consumidor final',forma_pago:formaPago,total:0}).returning()
    let total=0
    for(const {id,cantidad} of lineas){
      const {producto:p}=await moverStock(tx,{productoId:id,usuarioId:userId,facturaId:venta.id,tipo:'venta',cantidad:-cantidad,motivo:'Venta'})
      total+=p.precio*cantidad
      if(!Number.isSafeInteger(total))throw new ErrorVenta(422,'Importe fuera de rango')
      await tx.insert(factura_items).values({factura_id:venta.id,producto_id:id,cantidad,precio:p.precio,descripcion:p.nombre})
    }
    await tx.update(facturas).set({total}).where(eq(facturas.id,venta.id))
    if(formaPago==='CUENTA_CORRIENTE'&&clienteId)await tx.insert(movimientos_cuenta).values({cliente_id:clienteId,factura_id:venta.id,importe:total})
    return {numero:venta.id,total}
  })
}
