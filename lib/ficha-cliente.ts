import {numeroRecibo} from './pagos.ts'
import {and,asc,desc,eq,gte,lt,sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {clientes,facturas,movimientos_cuenta as mov} from '../db/schema.ts'
import {ErrorCliente} from './guardar-cliente.ts'

export const numeroFactura = (id:number) => '0001-'+String(id).padStart(8,'0')
const fechaISO = (s:number) => new Date(s*1000).toISOString()
const suma = {saldo:sql<number>`coalesce(sum(${mov.importe}),0)`}

function validarId(id:number) {
  if (!Number.isSafeInteger(id) || id < 1) throw new ErrorCliente(404,'NO_ENCONTRADO','Cliente inexistente.')
}

// RF-C3: incluye ventas de cualquier forma de pago, ordenadas de más reciente a más antigua.
export async function fichaCliente(id:number) {
  validarId(id)
  const [[c],[cuenta],ventas] = await db.batch([
    db.select().from(clientes).where(eq(clientes.id,id)),
    db.select(suma).from(mov).where(eq(mov.cliente_id,id)),
    db.select().from(facturas).where(eq(facturas.cliente_id,id)).orderBy(desc(facturas.creado),desc(facturas.id)).limit(6)
  ])
  if (!c) throw new ErrorCliente(404,'NO_ENCONTRADO','Cliente inexistente.')
  return {id:c.id,nombre:c.nombre,tipoDoc:c.tipo_doc,nroDoc:c.documento,domicilio:c.domicilio,telefono:c.telefono,email:c.email,
    cuentaCorriente:Boolean(c.habilitado),limiteCredito:c.limite_credito,saldo:cuenta.saldo,
    disponible:c.limite_credito===null ? null : c.limite_credito-cuenta.saldo,
    ultimasFacturas:ventas.map(f=>({id:f.id,numeroFormateado:numeroFactura(f.id),fecha:fechaISO(f.creado),total:f.total,formaPago:f.forma_pago}))}
}

function inicioDia(valor:string|null) {
  if (!valor) return undefined
  const ms=Date.parse(valor+'T00:00:00-03:00')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || !Number.isFinite(ms) || new Date(ms).toISOString().slice(0,10)!==valor)
    throw new ErrorCliente(422,'VALIDACION','Ingresá una fecha válida.')
  return ms/1000
}

// RF-C4: los movimientos anteriores al filtro forman el saldo de apertura.
export async function cuentaCliente(id:number, params:URLSearchParams) {
  validarId(id)
  const desde=inicioDia(params.get('desde')), hasta=inicioDia(params.get('hasta'))
  if (desde!==undefined && hasta!==undefined && desde>hasta) throw new ErrorCliente(422,'VALIDACION','Desde debe ser anterior o igual a Hasta.')
  const clienteId=eq(mov.cliente_id,id)
  const [[cliente],[apertura],filas]=await db.batch([
    db.select({id:clientes.id,nombre:clientes.nombre}).from(clientes).where(eq(clientes.id,id)),
    db.select(suma).from(mov).where(and(clienteId,desde===undefined ? sql`0` : lt(mov.creado,desde))),
    db.select().from(mov).where(and(clienteId,desde===undefined ? undefined : gte(mov.creado,desde),
      hasta===undefined ? undefined : lt(mov.creado,hasta+86400))).orderBy(asc(mov.creado),asc(mov.id))
  ])
  if (!cliente) throw new ErrorCliente(404,'NO_ENCONTRADO','Cliente inexistente.')
  let saldo=apertura.saldo
  const movimientos=filas.map(m=>{
    saldo+=m.importe
    return {fecha:fechaISO(m.creado),tipo:m.importe<0?'credito':'debito',importe:Math.abs(m.importe),
      descripcion:m.pago_id ? 'Recibo '+numeroRecibo(m.pago_id) : 'Factura '+numeroFactura(m.factura_id!),facturaId:m.factura_id,pagoId:m.pago_id,saldo}
  })
  return {cliente,saldoAnterior:apertura.saldo,movimientos,saldo}
}
