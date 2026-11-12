# Mostrador · Bitácora para la defensa

## 11 de noviembre de 2026 — Primera versión

El segundo parcial pide un sistema de ventas para un comercio. La operación que conecta los módulos es confirmar una venta. Debe guardar el comprobante, descontar existencias y, cuando corresponde, reflejar la deuda del cliente. Para la defensa conviene poder seguir esa operación desde el botón hasta las tablas.

### Pasos y decisiones

| Paso | Qué hicimos y por qué | Estado |
|---|---|---|
| 1. Interpretar el parcial | Leímos `parcial/segundo-parcial.md` y el prototipo `segundo-parcial-enunciado-y-mockup.html`. Elegimos seguir el diseño de Mostrador y su ejemplo del café y el té. | Revisado |
| 2. Elegir herramientas | La primera versión usó React con Vite. Por decisión de Luis, migramos la interfaz a Next.js con React y JavaScript. Express recibe las solicitudes de la API. MySQL guarda los datos y Workbench permite inspeccionarlos. La interfaz usa CSS propio. | Implementado en el código |
| 3. Crear la primera operación | Programamos acceso, selección de cliente y productos, edición del carrito y confirmación de venta. Trabajamos con centavos enteros para calcular los importes. | Sintaxis del servidor comprobada. Prueba integrada pendiente |
| 4. Preparar la PC | Luis extrajo la versión de Next.js, abrió la carpeta mostrador en VS Code y confirmó haber completado el paso de ejecutar schema.sql en Workbench. | Confirmado por Luis |
| 5. Conectar e inicializar | En PowerShell, desde mostrador, ejecutar `Copy-Item .env.example .env` si todavía no existe .env. Completar DB_USER, DB_PASSWORD y ADMIN_PASSWORD en privado. Ejecutar `npm install` y luego `npm run admin` una sola vez en la base recién creada. Este último comando crea el administrador y datos de ejemplo, incluidos los movimientos de stock inicial. | Indicado a Luis. Falta confirmar el resultado |
| 6. Probar en el navegador | Ejecutar `npm run dev`, abrir http://localhost:3000 e iniciar sesión. Anotar el resultado de la prueba de venta de abajo. | Pendiente |

### Para qué sirve cada paso y qué queremos demostrar

| Acción | Para qué se usa | Por qué la hacemos en Mostrador |
|---|---|---|
| Leer el enunciado y explorar la maqueta | Reconocer los requisitos y recorrer una venta de ejemplo. | Nos da un caso concreto para evaluar nuestra implementación: dos cafés y un té deben sumar $17.200. |
| Usar Next.js con React, Express y MySQL | React dibuja el carrito, Express recibe la confirmación y MySQL registra la operación. | El operador puede corregir cantidades antes de confirmar. Al confirmar, el servidor comprueba el stock disponible y guarda el resultado para la próxima sesión. |
| Calcular en centavos enteros | Multiplicar cantidades por precios y sumar subtotales con números enteros. | El importe que ve el operador debe coincidir al centavo con el del comprobante. |
| Ejecutar `schema.sql` en Workbench | Crear las siete tablas y las relaciones entre ellas. | Permite rastrear qué productos se vendieron en cada comprobante y qué movimiento descontó las unidades. |
| Configurar `.env` | Indicar al servidor a qué base conectarse y con qué usuario. Localizamos los nombres de las variables de conexión en la configuración del Portal Universitario. | Cada instalación puede tener credenciales distintas sin cambiar el código. El usuario de MySQL necesita acceso al esquema de Mostrador. La contraseña del administrador de Mostrador sirve para entrar a la aplicación. |
| Ejecutar `npm install` | Instalar las dependencias declaradas en `package.json`. | Prepara la PC para ejecutar el mismo proyecto que vamos a presentar. |
| Ejecutar `npm run admin` una vez | Crear el primer administrador, los productos de ejemplo y sus entradas iniciales de stock. | Nos permite iniciar sesión y probar la primera venta con cantidades conocidas. Falta confirmar el resultado en la PC de Luis. |
| Ejecutar `npm run dev` y probar la venta | Arrancar la aplicación y recorrer la operación desde el navegador. | Podemos verificar que el comprobante y la salida de stock se guardan juntos y que siguen en MySQL después de recargar. Prueba pendiente. |

### Cómo seguir una venta en el código

1. En **app/page.jsx**, el componente Venta muestra el carrito. La función quantity modifica cantidades y confirm envía las líneas a POST /api/ventas. El total visible ayuda al operador mientras arma el pedido.
2. En **server.js**, la ruta comprueba la sesión, la forma de pago y las cantidades. Lee y bloquea las filas de productos en MySQL y vuelve a calcular el importe con sus precios. Así, si dos operadores intentan vender la última unidad, el segundo debe esperar y comprobar qué stock quedó.
3. En **db.js**, transaction agrupa la operación. Si todo sale bien hace commit. Ante un error hace rollback para que no quede un comprobante o un descuento de stock a medias.
4. En **schema.sql** se ven las relaciones. ventas guarda el encabezado, detalles conserva descripción y precio al vender y movimientos registra la salida. Una venta a cuenta corriente queda identificada por cliente y forma de pago. El saldo previsto se obtiene sumando esas ventas y restando los pagos. La pantalla de cuenta y el registro de pagos siguen pendientes.

### Primera prueba para demostrar

Con los datos iniciales, agregar dos cafés a $6.500 y un té a $4.200. Elegir el cliente de ejemplo y cuenta corriente. El resultado esperado es un comprobante por $17.200, dos renglones y dos salidas. El café debe bajar de 24 a 22 y el té de 18 a 17. Recargar y consultar desde Workbench:

```sql
SELECT id, nombre_cliente, forma_pago, total FROM ventas ORDER BY id DESC;
SELECT codigo, stock FROM productos ORDER BY codigo;
SELECT producto_id, tipo, cantidad FROM movimientos WHERE origen = 'VENTA';
```

En MySQL el total esperado es **1720000 centavos**. Registrar aquí el número real del comprobante y el resultado cuando se ejecute la prueba.

### Ensayo de modificación en vivo

**Pedido posible:** “Mostrame el stock que quedaría después de vender la cantidad elegida”. En app/page.jsx, localizar la fila del carrito que ya muestra el nombre y el precio. Ahí están disponibles el stock actual (`p.stock`) y la cantidad elegida (`cart[p.id]`). Mostrar su diferencia junto al producto. Con 24 cafés y 2 seleccionados debe leerse 22. Al quitar el producto sin confirmar, MySQL debe seguir indicando 24. Es una previsión visual. La actualización definitiva ocurre al confirmar la venta en el servidor.

**Qué explicar si cambia el pedido:** cambiar un texto o la distribución lleva a app/page.jsx y app/globals.css. Cambiar una regla sobre qué ventas se admiten lleva también a server.js, porque cualquier solicitud a la API debe cumplirla. Agregar un dato que deba sobrevivir al cierre del navegador puede requerir modificar las tablas existentes, la API y el formulario.

### Próximas entradas

Para cada cambio nuevo, responder estas preguntas: **¿Qué hicimos? ¿Para qué sirve? ¿Por qué lo necesita este proyecto? ¿Cómo podemos demostrar que funciona?** Distinguir el resultado esperado de lo que efectivamente vimos al probarlo.

Registrar fecha, pedido, archivos o comandos utilizados, motivo de la decisión, prueba realizada, resultado observado y pendientes. Incluir tanto los cambios de código como los pasos que Luis confirme en su PC. Al 11/11 quedan pendientes la gestión completa de productos, clientes y usuarios, ajustes manuales de stock, pagos, historial de comprobantes y publicación.

### Diagnóstico de la inicialización
Luis completó npm install. Al ejecutar npm run admin, el inicializador se detuvo antes de conectarse a MySQL. Verificamos el archivo .env de la copia abierta en VS Code y Node leyó ADMIN_PASSWORD con longitud cero. La corrección es guardar una clave nueva de al menos 12 caracteres en ese archivo y repetir la inicialización. El usuario y la contraseña de DB deben pertenecer a la misma cuenta MySQL con acceso al esquema. La creación del administrador queda pendiente de confirmación.

### Segundo intento de inicialización
El inicializador superó la validación de ADMIN_PASSWORD. MySQL respondió con el error 1045 al autenticar a root en localhost. Eso confirma que el servidor respondió, pero en este intento no se ejecutaron las inserciones. El siguiente paso es identificar la cuenta de la conexión de Workbench que creó el esquema y configurar en .env el usuario y la contraseña correspondientes, o crear desde esa conexión un usuario propio de Mostrador. El objetivo es dar acceso al esquema para poder inicializar los datos. Pendiente de verificar.

### Cuenta de Workbench identificada
Luis ejecutó SELECT CURRENT_USER() y obtuvo root@localhost. La sesión de Workbench está autenticada como administrador. Se propone crear mostrador_app@localhost con permisos SELECT, INSERT y UPDATE solo sobre mostrador_parcial. El objetivo es que el servidor pueda consultar productos, registrar ventas y actualizar stock con credenciales propias. Pendientes: crear la cuenta, configurar DB_USER y DB_PASSWORD y verificar npm run admin.

### Cuenta propia creada
En la sesión local de Workbench se ejecutó CREATE USER con contraseña aleatoria generada por MySQL y GRANT SELECT, INSERT, UPDATE sobre mostrador_parcial. Ambas sentencias finalizaron correctamente. La cuenta sirve para conectar el servidor del proyecto con permisos limitados a su esquema. Pendientes: trasladar la credencial al .env de la instalación local y ejecutar npm run admin. La contraseña se omite de la documentación.

### Verificación posterior al alta de la cuenta
El nuevo intento devolvió 1045 para root. Leímos solo DB_USER de la copia de Mostrador que ejecuta Luis y comprobamos que tanto el archivo guardado como Node seguían indicando root. La cuenta mostrador_app todavía no se probó en ese intento. El próximo control es guardar sus datos en .env y mostrar únicamente DB_USER con Node antes de repetir la inicialización.

### Inicialización verificada en MySQL
La instalación que Luis tenía abierta usaba Vite y root. Se configuró la copia Next.js del espacio de trabajo con mostrador_app y se renovó la clave de esa cuenta. Se inicializó la base mediante Workbench con la misma estructura de datos y algoritmo de hash que admin.js. La consulta posterior al COMMIT devolvió 1 administrador luis, 2 productos, 2 movimientos de stock inicial y 1 cliente. No repetir npm run admin en esta base. Falta verificar la conexión desde la aplicación y el inicio de sesión en el navegador.

### TP5 · Primera migración a SQLite y TypeScript
Se pasó la interfaz a TSX y se sustituyó la API Express por Route Handlers. db/schema.ts describe las tablas. drizzle/0000_base.sql crea el esquema; scripts/seed.ts inicializa el catálogo y los roles. El objetivo es que otro integrante pueda reproducir el entorno local y que el despliegue use Turso con el mismo modelo. El catálogo está en /productos. Verificamos la migración SQL en SQLite de Node, los hashes de acceso, 30 productos, 5 categorías, 2 usuarios, 10 clientes, 30 movimientos y la repetición del seed sin duplicados. Se creó la base local con ese mismo SQL y datos. El entorno no pudo descargar pnpm/Drizzle: quedan pendientes el typecheck, la migración mediante el ejecutor oficial y la prueba del navegador.

### Instalación y prueba con Drizzle
Luis instaló las dependencias con Corepack y pnpm 10.22.0 en Mostrador. Ejecutamos los scripts de migración y seed con Drizzle sobre una base SQLite nueva y sobre la base local del proyecto. En ambas, la consulta con el ORM devolvió 30 productos. TypeScript pasó la comprobación sin emitir errores. Esta prueba demuestra que se puede reconstruir el catálogo desde cero y consultarlo con las dependencias reales. Queda validar el inicio de sesión y la pantalla del catálogo de esta versión en el navegador.
Prueba local: el registro de Next.js muestra la compilación de la página inicial y actividad de React en el navegador. SQLite contiene una sesión vigente. Falta confirmar visualmente la tabla de /productos.
Luis confirmó que el catálogo se muestra en /productos en su navegador. Esta comprobación completa la prueba manual de acceso al listado con la sesión iniciada.

### Hito 1 · Alta de productos y trazabilidad del stock inicial
En /productos el administrador usa Nuevo producto. AltaProducto.tsx recibe el precio en pesos y envía centavos a POST /api/productos. lib/alta-producto.ts verifica el rol, las cantidades y la categoría activa. El índice único impide repetir el código. La creación del producto y el ingreso de stock se guardan en una transacción: si falla el movimiento, también se revierte el alta. Con cero unidades no hay movimiento. La ficha enlazada desde el nombre muestra fecha argentina, cantidad, existencia resultante y usuario. Para defenderlo, crear una caja de arroz con 10 unidades, abrir su ficha y explicar el origen de esas 10. En SQLite de prueba verificamos alta, duplicado, vendedor rechazado, categoría inexistente, stock cero y reversión ante un fallo simulado. TypeScript pasó; prueba visual del formulario pendiente.

**Prueba manual completada por Luis.** SQLite confirma que ARR-010 (Caja de arroz) tiene 10 unidades, con una entrada de 10 por stock inicial, existencia resultante de 10 y usuario Luis.

## Preguntas para repasar antes de la defensa

| Tema | Pregunta posible | Dónde mostrarlo |
|---|---|---|
| Alta de productos | ¿Qué recorrido hace el dato desde que apretás Guardar hasta que aparece en el catálogo? | app/productos/AltaProducto.tsx, app/api/productos/route.ts y lib/alta-producto.ts |
| Permisos | Si un vendedor llama directamente a POST /api/productos, ¿qué lo impide y qué respuesta recibe? | lib/alta-producto.ts |
| Transacciones | Si se crea el producto pero falla el ingreso inicial, ¿qué queda guardado y cómo lo probaste? | crearProducto y prueba de reversión registrada arriba |
| Inventario | ¿Cómo demostramos de dónde vienen las 10 unidades de ARR-010 y quién las cargó? ¿Qué cambia si el stock inicial es cero? | Ficha de Caja de arroz y tabla movimientos_stock |
| Integridad | Si dos administradores envían el mismo código, ¿quién garantiza que sea único? | db/schema.ts y manejo de conflicto en crearProducto |
| Importes | ¿Cómo pasa un precio de 1.250,50 pesos a 125050 centavos y vuelve a mostrarse en pesos? | AltaProducto.tsx y app/productos/page.tsx |
| Migraciones y datos de prueba | ¿Qué diferencia hay entre db:migrate y db:seed? ¿Qué pasa si repetimos la carga? | scripts/migrate.ts, scripts/seed.ts y scripts/fixtures.ts |
| Modificación en vivo | Si el profesor pide agregar el campo marca y mostrarlo en el catálogo, ¿qué archivos tocarías y cómo comprobarías el cambio sobre productos existentes? | Esquema, migración, alta, consulta y pantalla del catálogo |

### Hito 1 · Ingresos y egresos manuales
En la ficha de cada producto, el administrador registra cantidad, motivo y observación opcional. El servidor verifica el rol y asigna el signo según el tipo de movimiento. La función moverStock en lib/stock.ts reúne la actualización de existencias y el registro de historial para ajustes, ventas y altas con stock inicial. La condición del UPDATE protege contra egresos por encima del stock. Se aplicó la migración para la observación. En una base aislada comprobamos 10 iniciales + 5 de reposición − 3 por rotura = 12. Un egreso de 13 fue rechazado y una venta posterior de 1 dejó 11. También se verificó el rechazo de un vendedor y de una cantidad negativa. TypeScript pasó. Prueba visual de ajustes pendiente.

Preguntas para la defensa: ¿Por qué el servidor decide el signo? ¿Cómo se evita que dos egresos agoten las mismas unidades? ¿Qué función comparten un ajuste y una venta para que el historial coincida con la existencia?

### Verificación manual del stock de ARR-010
Luis registró una reposición de 5 cajas y una rotura de 3. Consultamos la base SQLite para comprobar que ambas operaciones quedaron guardadas. El historial del producto 61 muestra 10 unidades iniciales, 15 tras la reposición y 12 tras la rotura. La ficha del producto en la base también registra 12.

Pregunta para la defensa: ¿cómo comprobarías que el stock actual coincide con el historial? Para ARR-010, sumá los movimientos con su signo (10 + 5 − 3) y compará el resultado con el stock guardado en productos.

### Puesta en marcha de la base remota en Turso
Luis ejecutó en PowerShell `node --env-file=.env.turso scripts/migrate.ts` y, tras finalizar con éxito, `node --env-file=.env.turso scripts/seed.ts`. La terminal confirmó las migraciones y la inicialización del catálogo y los usuarios. El primer comando aplica los cambios de estructura y el segundo carga los datos iniciales. Elegimos el archivo de entorno de Turso para que ambos operen sobre mostrador-tp5. Queda pendiente probar el acceso desde la app publicada.

Pregunta para la defensa: ¿cómo usa la aplicación el mismo esquema en tu PC y en internet? Las migraciones versionan la estructura. En db/index.ts el cliente usa TURSO_DATABASE_URL para seleccionar el destino y TURSO_AUTH_TOKEN para autenticarse en la base remota.

### Prueba de acceso en producción
Luis confirmó que pudo iniciar sesión como administrador en https://mostrador-tp5.vercel.app/ con la contraseña usada para inicializar el usuario en Turso. Queda por verificar el catálogo desde esa sesión.

Pregunta para la defensa: ¿por qué editar ADMIN_PASSWORD después del primer seed no cambia la contraseña del usuario? El seed usa esa variable al crear la cuenta. Si el correo ya existe, conserva el registro. El inicio de sesión comprueba la contraseña contra el hash guardado en la tabla usuarios.

### Búsqueda en el catálogo (RF-P1)
Luis confirmó que el catálogo publicado abrió correctamente. Para localizar artículos por código o nombre, agregamos un formulario en Productos. Al buscar, el navegador envía el texto en el parámetro q de la URL. La página y GET /api/productos usan la misma función catalogo para filtrar los productos activos en la base de datos. Limpiar la búsqueda vuelve al listado completo.

Pregunta para la defensa: ¿qué cambiarías para buscar también por categoría? En lib/catalogo.ts, agregarías el nombre de la categoría a las columnas comparadas. La consulta ya relaciona productos con categorías.

Pruebas locales: búsqueda por código con espacios y minúsculas, nombre parcial, texto inexistente, símbolo de porcentaje literal y catálogo completo. TypeScript pasó. Falta la prueba de la interfaz publicada con el buscador.

### Categorías del catálogo (RF-P7)
Desde Productos se abre Categorías. Ambos roles pueden consultar las categorías activas. El administrador puede crear, renombrar y desactivar. La API verifica el rol en el servidor. La baja cambia el campo activa para conservar las referencias históricas. Antes de confirmarla, el servicio busca productos activos de esa categoría dentro de la misma transacción.

Verificación en una base de prueba aislada: alta, nombre duplicado, edición, rechazo al vendedor, bloqueo de baja con producto activo y baja permitida al desactivar el producto. TypeScript pasó. Pendiente la prueba visual publicada.

Pregunta para la defensa: ¿qué pasa si se intenta desactivar una categoría que tiene un producto activo con stock cero? La API responde 409 CATEGORIA_EN_USO. La regla consulta el estado activo del producto independientemente de la cantidad disponible.

### Filtro por categoría y paginación (RF-P1)
El catálogo combina el texto y la categoría para ambos roles. La URL conserva los filtros al navegar y el formulario vuelve a la primera página al buscar. El servicio cuenta y consulta los productos con las mismas condiciones. Ordena por nombre e identificador para que dos nombres iguales tengan un orden estable. La API devuelve data, page, pageSize y total, con 20 productos por defecto y un máximo de 100 por página. Ventas recorre las páginas para seguir ofreciendo todo el catálogo.

Prueba local con 31 productos: primera página de 20, segunda sin identificadores repetidos, combinación de categoría y código, límite de tamaño y página fuera de rango. TypeScript pasó. Falta confirmar el recorrido publicado.

Pregunta para la defensa: ¿por qué se cuenta después de aplicar los filtros? El total permite calcular cuántas páginas tienen resultados para esa búsqueda.

### Edición y baja lógica de productos (RF-P2 y RF-P3)
En la ficha, el administrador puede editar código, descripción, categoría, precio y stock mínimo. PATCH /api/productos/{id} valida los campos, el rol, la categoría y la unicidad del código. La baja cambia el estado activo. El administrador puede incluir inactivos en el catálogo para consultar su historial y reactivarlos. La venta verifica el estado al confirmar, incluso si el producto ya estaba en el carrito.

En una base aislada emitimos una venta, cambiamos el precio y la descripción, dimos el producto de baja y comprobamos que el renglón de factura conservó los valores originales. El historial y el stock se conservaron, la siguiente venta fue rechazada y la reactivación volvió a permitirla. Verificamos además código duplicado, rechazo al vendedor y rechazo de cambios directos de existencia. TypeScript pasó. Pendiente prueba visual en Vercel.

Pregunta para la defensa: ¿cómo se conserva el precio original de una factura al editar o desactivar un producto? Al confirmar la venta se copian precio y descripción al renglón de factura. La baja lógica mantiene el producto y las referencias de los movimientos.

### Gestión de usuarios (RF-U4)
Desde Ventas o Productos, el administrador abre Usuarios para crear cuentas, editar nombre y email, asignar un rol y cambiar el estado. El listado permite buscar por nombre o email y filtrar por estado. Se conserva el identificador del usuario para que sus operaciones anteriores sigan vinculadas. La baja y la eliminación de sus sesiones se confirman en la misma transacción. El administrador tiene protegidos su propio rol y estado.

Pruebas con una base aislada: contraseña inicial verificada contra su hash, rechazo de email duplicado y llamadas de vendedor, protección de la cuenta propia, cambio de rol, baja con revocación de sesión, búsqueda por estado y reactivación. TypeScript pasó. Pendiente verificación visual en Vercel.

Pregunta para la defensa: ¿qué pasa si un vendedor ya tiene una pestaña abierta cuando se desactiva su cuenta? La pantalla puede seguir mostrando lo que tenía cargado. La próxima operación protegida requiere una sesión válida y un usuario activo.

### Listado de clientes y deudores (RF-C1 y RF-C6)
Desde Ventas se abre Clientes para consultar nombre, documento y saldo. El servicio agrupa los movimientos por cliente y suma sus importes en centavos. Una unión externa permite incluir a quienes aún no tienen movimientos, con saldo cero. La búsqueda admite documentos con puntos o guiones. Al elegir clientes con deuda, ordena por saldo descendente y calcula el total de todos los resultados filtrados antes de paginar. La pantalla de ventas lee la nueva respuesta paginada para mantener todos los clientes disponibles.

Pruebas en una base aislada: clientes sin movimientos, dos ventas en cuenta corriente a distintos clientes, orden por deuda, búsqueda por nombre y documento, consulta sin resultados y total mantenido al cambiar de página. TypeScript pasó. Pendiente prueba visual en Vercel.

Pregunta para la defensa: si hay veinte deudores y solo se muestran diez por página, ¿qué representa el total? Suma los saldos de todos los clientes que cumplen los filtros.

### Alta y edición de clientes (RF-C2)
Desde Clientes se crea una cuenta de cliente y se edita entrando por el nombre. La API exige sesión y admite ambos roles. La migración 0002 agrega tipo de documento, datos de contacto y límite de crédito opcional. Los registros anteriores conservan su identificador y reciben DNI como tipo predeterminado. El servidor normaliza los documentos y controla duplicados.

Prueba en base aislada: creamos un CUIT con guiones, rechazamos el mismo número sin guiones y editamos solo el teléfono. Una venta a crédito por el límite exacto pasó; una venta posterior se revirtió y quedó una sola factura. Con deuda se rechazó deshabilitar la cuenta corriente. TypeScript pasó y se aplicó la migración local.

Pregunta para la defensa: ¿por qué validar el límite dentro de la transacción de venta? La deuda y la venta deben confirmarse juntas. Si se supera el límite también se revierten los cambios de stock y el comprobante.

### Ficha y consulta de la cuenta corriente (RF-C3 y RF-C4)
En Clientes se entra por el nombre para ver contacto, saldo actual, crédito disponible cuando hay límite y seis facturas recientes. El historial de cuenta calcula el saldo de apertura sumando los movimientos anteriores a Desde. Después recorre los del período por fecha e identificador. Hasta incluye todo el día argentino. La ficha divide el resultado en páginas de veinte filas después de calcular los saldos.

Prueba aislada: 23 movimientos de $1. Con uno antes del período, 21 dentro y otro después, la apertura fue $1, el cierre $22 y el saldo actual $23. También verificamos el límite de seis facturas, el saldo cero de otro cliente, la fecha inválida y el cliente inexistente. TypeScript pasó. Queda verificar la pantalla en Vercel y agregar el registro de pagos y recibos.

Pregunta para la defensa: ¿por qué el saldo de cierre puede diferir del saldo actual? El cierre considera movimientos hasta el final del período elegido. El saldo actual también incluye los posteriores.

### Pagos y recibos (RF-C5)
Desde la ficha de un cliente con deuda y cuenta habilitada se registra el importe, medio y observación. El servidor consulta el saldo y guarda pago y crédito en una transacción. El número de recibo deriva del identificador del pago. Se conservan los nombres y el saldo posterior para que al reimprimir el recibo muestre los datos del momento del pago.

La migración 0003 conserva las referencias a facturas anteriores e incorpora referencias a pagos. En una base de prueba migramos una deuda existente de $100. Un pago de $40 dejó $60; un intento de $60,01 se rechazó; el pago final de $60 dejó saldo cero. Verificamos dos recibos consecutivos, tres movimientos y la consulta posterior del primer recibo con su saldo de $60. TypeScript pasó y la migración se aplicó en local. Pendientes la migración de Turso y la prueba visual en Vercel.

Pregunta para la defensa: ¿por qué el recibo de un pago parcial sigue mostrando deuda aunque hoy el saldo sea cero? Registra el saldo en el instante de ese pago; la ficha calcula el actual sumando todos los movimientos.

### Baja lógica de clientes (RF-C7)
La migración 0004 agrega el estado activo, inicialmente verdadero para las cuentas existentes. En la ficha se confirma la baja. La operación verifica el saldo dentro de la misma transacción y conserva el cliente, sus facturas y sus pagos. El listado permite consultar inactivos y volver a activarlos. La venta también comprueba el estado al confirmar para cubrir carritos abiertos antes de la baja.

Prueba en base aislada: una venta a crédito impidió la baja; al pagar la deuda se pudo desactivar. El cliente desapareció de la selección activa, el historial y el recibo siguieron accesibles, una venta directa fue rechazada y al reactivar se pudo volver a vender. TypeScript pasó y la migración se aplicó en SQLite local. Falta aplicarla en Turso y verificar Vercel.

Pregunta para la defensa: ¿por qué validar el estado en el servidor si el cliente ya no aparece en el selector? El usuario puede haber abierto la venta antes de la baja. La validación al confirmar aplica el estado vigente.

### Armado de la venta (RF-V2 a RF-V4)
La búsqueda de comprador admite nombre o documento. La opción inicial es Consumidor final. Nuevo cliente abre el formulario de Clientes dentro de un diálogo y usa el mismo POST. Al crearlo, la venta selecciona su identificador y conserva el carrito. Para los productos, se filtra por código o descripción, se elige la cantidad y se agrega con Enter. La columna de existencia permite comparar el stock con las unidades acumuladas.

Prueba de la lógica del componente con datos simulados: buscar cafe encontró Café, dos agregados dejaron dos unidades en un solo renglón, seleccionar el cliente recién creado conservó ambas unidades y agregar tres más con stock cuatro dejó intacto el carrito. También se comprobó la búsqueda de documento con puntos. TypeScript pasó. Pendiente la prueba visual publicada.

Pregunta para la defensa: ¿qué datos cambian al crear un cliente en una venta en curso? Se agrega al listado y se selecciona su id. Los renglones viven en el componente de venta y conservan sus cantidades mientras se abre y cierra el formulario.

### Formas de pago en ventas (RF-V5)
La venta de contado muestra el vuelto. Si se deja vacío el monto recibido se usa el total. Para tarjeta se solicita tipo, marca y los últimos cuatro dígitos. El cliente habilitado para cuenta corriente puede ver su saldo y crédito disponible; el servidor vuelve a calcular la deuda en la transacción. La migración 0005 agrega campos opcionales a las facturas para conservar los datos de cobro de las nuevas ventas.

En base aislada: $7.000 recibidos para una venta de $6.500 devolvieron $500. El pago exacto devolvió cero. La tarjeta conservó los ceros iniciales de los últimos cuatro dígitos. Una venta por el límite de crédito pasó. Los rechazos por efectivo insuficiente, datos adicionales de tarjeta, consumidor final a crédito y exceso de límite mantuvieron factura, stock y saldo sin cambios. TypeScript pasó. Pendientes migración remota y prueba visual.

Pregunta para la defensa: ¿por qué el servidor recalcula el vuelto y verifica el crédito? Usa el precio y el saldo vigentes al confirmar, aunque hayan cambiado desde que se abrió la pantalla.
