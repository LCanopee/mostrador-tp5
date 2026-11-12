CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  clave TEXT NOT NULL,
  rol TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX usuarios_email_unique ON usuarios(email);
--> statement-breakpoint
CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  nombre TEXT NOT NULL,
  activa INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX categorias_nombre_unique ON categorias(nombre);
--> statement-breakpoint
CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  precio INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  stock_minimo INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX productos_codigo_unique ON productos(codigo);
--> statement-breakpoint
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  nombre TEXT NOT NULL,
  documento TEXT NOT NULL,
  habilitado INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX clientes_documento_unique ON clientes(documento);
--> statement-breakpoint
CREATE TABLE facturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  cliente_id INTEGER REFERENCES clientes(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  nombre_cliente TEXT NOT NULL,
  forma_pago TEXT NOT NULL,
  total INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE factura_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  factura_id INTEGER NOT NULL REFERENCES facturas(id),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE movimientos_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  factura_id INTEGER REFERENCES facturas(id),
  tipo TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  existencia_resultante INTEGER NOT NULL,
  motivo TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE movimientos_cuenta (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  factura_id INTEGER NOT NULL REFERENCES facturas(id),
  importe INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  creado INTEGER NOT NULL DEFAULT (unixepoch()),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  token_hash TEXT NOT NULL,
  vence INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX sesiones_token_hash_unique ON sesiones(token_hash);
