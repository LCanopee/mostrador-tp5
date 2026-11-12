import {and,asc,count,desc,eq,gte,lt,or,sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {facturas,clientes,usuarios} from '../db/schema.ts'
import {numeroFactura} from './ficha-cliente.ts'

export class FiltroFacturaInvalido extends Error {}
function entero(valor:string|null,defecto?:number) {
  if (!valor) return defecto
  const n=Number(valor)
  if (!Number.isSafeInteger(n) || n<1) throw new FiltroFacturaInvalido('Ingresá un identificador o página válidos.')
  return n
}
function fecha(valor:string|null) {
  if (!valor) return undefined
  const ms=Date.parse(valor+'T00:00:00-03:00')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || !Number.isFinite(ms) || new Date(ms).toISOString().slice(0,10)!==valor)
    throw new FiltroFacturaInvalido('Ingresá una fecha válida.')
  return ms/1000
}
export function opcionesFiltrosFactura() {
  return db.batch([
    db.select({id:clientes.id,nombre:clientes.nombre}).from(clientes).orderBy(asc(clientes.nombre)),
    db.select({id:usuarios.id,nombre:usuarios.nombre}).from(usuarios).orderBy(asc(usuarios.nombre))
  ])
}

// RF-V8: el listado y el total emitido usan los mismos filtros antes de paginar.
export async function listarFacturas(params:URLSearchParams) {
  const desde=fecha(params.get('desde')), hasta=fecha(params.get('hasta'))
  if (desde!==undefined && hasta!==undefined && desde>hasta) throw new FiltroFacturaInvalido('Desde debe ser anterior o igual a Hasta.')
  const cliente=entero(params.get('clienteId')), vendedor=entero(params.get('vendedorId'))
  const page=entero(params.get('page'),1)!, pageSize=Math.min(100,entero(params.get('pageSize'),20)!)
  const forma=params.get('forma'), estado=params.get('estado')
  if (forma && !['contado','tarjeta','cuenta_corriente'].includes(forma)) throw new FiltroFacturaInvalido('Forma de pago inválida.')
  if (estado && !['emitida','anulada'].includes(estado)) throw new FiltroFacturaInvalido('Estado inválido.')
  const q=params.get('q')?.trim()
  const numero=q?.match(/^(?:0001-)?(\d+)$/)
  const filtro=and(desde===undefined?undefined:gte(facturas.creado,desde),hasta===undefined?undefined:lt(facturas.creado,hasta+86400),
    cliente?eq(facturas.cliente_id,cliente):undefined,vendedor?eq(facturas.usuario_id,vendedor):undefined,
    forma?eq(facturas.forma_pago,forma.toUpperCase()):undefined,estado==='anulada'?sql`0`:undefined,
    q?or(numero?eq(facturas.id,Number(numero[1])):undefined,sql`instr(lower(${facturas.nombre_cliente}),lower(${q}))>0`):undefined)
  const [[resumen],filas]=await db.batch([
    db.select({total:count(),totalEmitido:sql<number>`coalesce(sum(${facturas.total}),0)`}).from(facturas).where(filtro),
    db.select({id:facturas.id,creado:facturas.creado,nombre:facturas.nombre_cliente,clienteId:facturas.cliente_id,
      vendedorId:facturas.usuario_id,vendedor:facturas.nombre_vendedor,forma:facturas.forma_pago,total:facturas.total})
      .from(facturas).where(filtro).orderBy(desc(facturas.creado),desc(facturas.id))
      .limit(pageSize).offset(Math.min(Number.MAX_SAFE_INTEGER,(page-1)*pageSize))
  ])
  const data=filas.map(f=>({id:f.id,numero:f.id,numeroFormateado:numeroFactura(f.id),fecha:new Date(f.creado*1000).toISOString(),
    cliente:{id:f.clienteId,nombre:f.nombre},vendedor:{id:f.vendedorId,nombre:f.vendedor},forma:f.forma.toLowerCase(),total:f.total,estado:'emitida'}))
  return {data,page,pageSize,...resumen}
}
