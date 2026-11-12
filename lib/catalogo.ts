import {eq,asc} from 'drizzle-orm'
import {db} from '../db'
import {productos,categorias} from '../db/schema'
// RF-P1: muestra los productos activos con su categoría y su existencia.
export function catalogo(){
  return db.select({id:productos.id,codigo:productos.codigo,nombre:productos.nombre,precio:productos.precio,stock:productos.stock,minimo:productos.stock_minimo,categoria:categorias.nombre}).from(productos).innerJoin(categorias,eq(productos.categoria_id,categorias.id)).where(eq(productos.activo,1)).orderBy(asc(productos.nombre))
}
