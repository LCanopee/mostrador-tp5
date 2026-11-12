# Mostrador — TP5 de Programación IV

Primera etapa de la migración a TypeScript, Next.js App Router, Drizzle y SQLite/libSQL. Node 24.14 o posterior y pnpm 10.22.0. Los comandos se ejecutan desde la carpeta que contiene package.json.

## Arranque local (PowerShell)

```powershell
pnpm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

Si Windows tiene Corepack pero no el comando pnpm, usar `corepack pnpm` en lugar de `pnpm`. Abrir http://localhost:3001. Ingresar con luis@mostrador.test (administrador) o ventas@mostrador.test (vendedor), usando ADMIN_PASSWORD o SELLER_PASSWORD según el rol. Las claves del ejemplo son solo para desarrollo. Configurar claves propias antes de inicializar una base remota. El seed preserva las contraseñas y existencias ya creadas.

## Base, migraciones y prueba

SQLite local usa mostrador.sqlite. Para Turso, configurar TURSO_DATABASE_URL y TURSO_AUTH_TOKEN fuera del repositorio. El esquema está en db/schema.ts. Para evolucionarlo: modificar el esquema, ejecutar pnpm run db:generate, revisar el SQL y aplicarlo con pnpm run db:migrate. Cada migración debe quedar versionada, incluidos sus metadatos.

El seed carga 2 cuentas, 5 categorías, 30 productos con sus movimientos iniciales y 10 clientes ficticios. Entrar a «Catálogo de productos» después de iniciar sesión. El café CAF-001 empieza en 24 unidades y $6.500; el té TE-003 empieza en 18 unidades y $4.200. El carrito previo se adaptó a SQLite y conserva la confirmación transaccional básica.

## Estado de la entrega

Base y catálogo iniciales. Quedan gestión por rol, altas y edición, filtros y paginación, ajustes manuales, interfaz shadcn/ui y Tailwind, y completar el contrato de API del TP5. También faltan cuenta corriente completa, facturación ampliada, tablero, las 50 facturas de prueba y publicación en Vercel/Turso. Las pruebas de migración SQL y seed se hicieron con SQLite de Node; falta verificar compilación y recorrido real con las dependencias de Drizzle instaladas.
