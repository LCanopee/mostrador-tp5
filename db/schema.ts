import {sqliteTable, integer, text} from 'drizzle-orm/sqlite-core'

import {sql} from 'drizzle-orm'

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  email: text('email').notNull().unique(),
  nombre: text('nombre').notNull(),
  clave: text('clave').notNull(),
  rol: text('rol').notNull(),
  activo: integer('activo').notNull().default(1)
})

export const categorias = sqliteTable('categorias', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  nombre: text('nombre').notNull().unique(),
  activa: integer('activa').notNull().default(1)
})

export const productos = sqliteTable('productos', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  categoria_id: integer('categoria_id').notNull().references(()=>categorias.id),
  precio: integer('precio').notNull(),
  stock: integer('stock').notNull(),
  stock_minimo: integer('stock_minimo').notNull(),
  activo: integer('activo').notNull().default(1)
})

export const clientes = sqliteTable('clientes', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  nombre: text('nombre').notNull(),
  documento: text('documento').notNull().unique(),
  habilitado: integer('habilitado').notNull().default(1)
})

export const facturas = sqliteTable('facturas', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  cliente_id: integer('cliente_id').references(()=>clientes.id),
  usuario_id: integer('usuario_id').notNull().references(()=>usuarios.id),
  nombre_cliente: text('nombre_cliente').notNull(),
  forma_pago: text('forma_pago').notNull(),
  total: integer('total').notNull()
})

export const factura_items = sqliteTable('factura_items', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  factura_id: integer('factura_id').notNull().references(()=>facturas.id),
  producto_id: integer('producto_id').notNull().references(()=>productos.id),
  descripcion: text('descripcion').notNull(),
  cantidad: integer('cantidad').notNull(),
  precio: integer('precio').notNull()
})

export const movimientos_stock = sqliteTable('movimientos_stock', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  producto_id: integer('producto_id').notNull().references(()=>productos.id),
  usuario_id: integer('usuario_id').notNull().references(()=>usuarios.id),
  factura_id: integer('factura_id').references(()=>facturas.id),
  tipo: text('tipo').notNull(),
  cantidad: integer('cantidad').notNull(),
  existencia_resultante: integer('existencia_resultante').notNull(),
  motivo: text('motivo').notNull(),
  observacion: text('observacion')
})

export const movimientos_cuenta = sqliteTable('movimientos_cuenta', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  cliente_id: integer('cliente_id').notNull().references(()=>clientes.id),
  factura_id: integer('factura_id').notNull().references(()=>facturas.id),
  importe: integer('importe').notNull()
})

export const sesiones = sqliteTable('sesiones', {
  id: integer('id').primaryKey({autoIncrement:true}),
  creado: integer('creado').notNull().default(sql`(unixepoch())`),
  usuario_id: integer('usuario_id').notNull().references(()=>usuarios.id),
  token_hash: text('token_hash').notNull().unique(),
  vence: integer('vence').notNull()
})
