import { and, asc, count, eq, or, sql } from 'drizzle-orm'
import { db } from '../db/index.ts'
import { productos, categorias } from '../db/schema.ts'

function enteroPositivo(valor: string | null, predeterminado: number) {
  const numero = Number(valor)
  return Number.isSafeInteger(numero) && numero > 0 ? numero : predeterminado
}

// RF-P1: el total y los renglones de la página comparten los filtros.
export async function catalogo(params: URLSearchParams, rol = 'vendedor') {
  const texto = params.get('q')?.trim()
  const categoriaId = params.get('categoriaId')
  const pageSize = Math.min(100, enteroPositivo(params.get('pageSize'), 20))
  const page = enteroPositivo(params.get('page'), 1)
  const coincide = texto ? or(
    sql`instr(lower(${productos.codigo}), lower(${texto})) > 0`,
    sql`instr(lower(${productos.nombre}), lower(${texto})) > 0`
  ) : undefined
  const filtro = and(rol === 'admin' && params.get('activo') === 'todos' ? undefined : eq(productos.activo, 1), coincide,
    categoriaId ? eq(productos.categoria_id, enteroPositivo(categoriaId, 0)) : undefined)
  const [conteo, data] = await db.batch([
    db.select({total: count()}).from(productos).where(filtro),
    db.select({
      id: productos.id, codigo: productos.codigo, nombre: productos.nombre,
      precio: productos.precio, stock: productos.stock, activo: productos.activo, minimo: productos.stock_minimo,
      categoria: categorias.nombre
    }).from(productos).innerJoin(categorias, eq(productos.categoria_id, categorias.id))
      .where(filtro).orderBy(asc(productos.nombre), asc(productos.id))
      .limit(pageSize).offset(Math.min(Number.MAX_SAFE_INTEGER, (page - 1) * pageSize))
  ])
  return {data, page, pageSize, total: conteo[0].total}
}
