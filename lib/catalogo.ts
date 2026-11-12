import { and, asc, eq, or, sql } from 'drizzle-orm'
import { db } from '../db'
import { productos, categorias } from '../db/schema'

export function catalogo(busqueda = '') {
  const texto = busqueda.trim()
  const coincide = texto ? or(
    sql`instr(lower(${productos.codigo}), lower(${texto})) > 0`,
    sql`instr(lower(${productos.nombre}), lower(${texto})) > 0`
  ) : undefined

  return db.select({
    id: productos.id,
    codigo: productos.codigo,
    nombre: productos.nombre,
    precio: productos.precio,
    stock: productos.stock,
    minimo: productos.stock_minimo,
    categoria: categorias.nombre
  }).from(productos)
    .innerJoin(categorias, eq(productos.categoria_id, categorias.id))
    .where(and(eq(productos.activo, 1), coincide))
    .orderBy(asc(productos.nombre))
}
