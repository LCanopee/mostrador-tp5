import {asc,eq} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {facturas,factura_items} from '../db/schema.ts'
import {numeroFactura} from './ficha-cliente.ts'

// RF-V7: el comprobante lee los importes y descripciones guardados al vender.
export async function obtenerFactura(id:number) {
  if (!Number.isSafeInteger(id) || id<1) return null
  const [[f],lineas]=await db.batch([
    db.select().from(facturas).where(eq(facturas.id,id)),
    db.select().from(factura_items).where(eq(factura_items.factura_id,id)).orderBy(asc(factura_items.id))
  ])
  if (!f) return null
  const pago = f.forma_pago==='CONTADO'
    ? {forma:'contado' as const,montoRecibido:f.monto_recibido,vuelto:f.monto_recibido===null ? null : f.monto_recibido-f.total}
    : f.forma_pago==='TARJETA'
      ? {forma:'tarjeta' as const,tarjeta:{tipo:f.tarjeta_tipo,marca:f.tarjeta_marca,ultimos4:f.tarjeta_ultimos4}}
      : {forma:'cuenta_corriente' as const}
  return {id:f.id,puntoVenta:1,numero:f.id,numeroFormateado:numeroFactura(f.id),estado:'emitida',
    fecha:new Date(f.creado*1000).toISOString(),vendedor:{id:f.usuario_id,nombre:f.nombre_vendedor},
    cliente:{id:f.cliente_id,nombre:f.nombre_cliente,tipoDoc:f.tipo_doc_cliente,nroDoc:f.documento_cliente,domicilio:f.domicilio_cliente},
    items:lineas.map(l=>({productoId:l.producto_id,codigo:l.codigo_producto,descripcion:l.descripcion,cantidad:l.cantidad,
      precioUnitario:l.precio,subtotal:l.cantidad*l.precio})),total:f.total,pago,
    ...(pago.forma==='cuenta_corriente'?{saldoCliente:f.saldo_cliente_venta}:{})}
}
