import {and, asc, count, desc, eq, gt, or, sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {clientes, movimientos_cuenta} from '../db/schema.ts'

function positivo(valor:string|null, defecto:number) {
  const n = Number(valor)
  return Number.isSafeInteger(n) && n > 0 ? n : defecto
}

// RF-C1/C6: cada saldo suma los movimientos firmados del cliente en centavos.
export async function listarClientes(params:URLSearchParams) {
  const q = params.get('q')?.trim()
  const documento = q?.replace(/[.\s-]/g,'')
  const conDeuda = params.get('conDeuda') === 'true'
  const page = positivo(params.get('page'),1)
  const pageSize = Math.min(100,positivo(params.get('pageSize'),20))
  const cuentas = db.select({
    id:clientes.id, nombre:clientes.nombre, documento:clientes.documento, activo:clientes.activo,
    saldo:sql<number>`coalesce(sum(${movimientos_cuenta.importe}), 0)`.as('saldo')
  }).from(clientes).leftJoin(movimientos_cuenta,eq(clientes.id,movimientos_cuenta.cliente_id))
    .groupBy(clientes.id).as('cuentas')
  const estado = params.get('activo')
  const filtro = and(estado === 'todos' ? undefined : eq(cuentas.activo,estado === 'false' ? 0 : 1),conDeuda ? gt(cuentas.saldo,0) : undefined, q ? or(
    sql`instr(lower(${cuentas.nombre}),lower(${q})) > 0`,
    documento ? sql`instr(replace(replace(replace(${cuentas.documento},'.',''),'-',''),' ',''),${documento}) > 0` : undefined
  ) : undefined)
  const porSaldo = params.get('orden') === 'saldo' || (conDeuda && params.get('orden') !== 'nombre')
  const [resumen,data] = await db.batch([
    db.select({total:count(), importe:sql<number>`coalesce(sum(${cuentas.saldo}),0)`}).from(cuentas).where(filtro),
    db.select().from(cuentas).where(filtro)
      .orderBy(...(porSaldo ? [desc(cuentas.saldo)] : []),asc(cuentas.nombre),asc(cuentas.id))
      .limit(pageSize).offset(Math.min(Number.MAX_SAFE_INTEGER,(page-1)*pageSize))
  ])
  return {data,total:resumen[0].total,page,pageSize,...(conDeuda ? {totalAdeudado:resumen[0].importe} : {})}
}
