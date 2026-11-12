import {hashPassword} from '../lib/password.ts'
export function seedPlan(adminPassword:string,sellerPassword:string){
  const statements:{sql:string,args:(string|number)[]}[]=[]
  function add(sql:string,...args:(string|number)[]){statements.push({sql,args})}
  for(const [email,nombre,rol,password] of [
    ['luis@mostrador.test','Luis','admin',adminPassword],
    ['ventas@mostrador.test','Vendedor','vendedor',sellerPassword]
  ]) add('INSERT INTO usuarios(email,nombre,rol,clave) VALUES(?,?,?,?) ON CONFLICT(email) DO NOTHING',email,nombre,rol,hashPassword(password))
  const groups=[
    ['Infusiones','Café molido 250 g','Té en hebras 100 g','Mate cocido','Yerba suave','Té verde','Manzanilla'],
    ['Almacén','Arroz','Fideos','Harina','Azúcar','Polenta','Sal fina'],
    ['Conservas','Tomate','Arvejas','Lentejas','Choclo','Duraznos','Atún'],
    ['Bebidas','Agua','Soda','Jugo de naranja','Jugo de manzana','Limonada','Agua tónica'],
    ['Galletitas','De agua','De avena','De chocolate','Integrales','De vainilla','De limón']
  ]
  for(const [g,[categoria,...items]] of groups.entries()){
    add('INSERT INTO categorias(nombre) VALUES(?) ON CONFLICT(nombre) DO NOTHING',categoria)
    for(const [i,nombre] of items.entries()){
      const codigo=g===0&&i===0?'CAF-001':g===0&&i===1?'TE-003':'PRO-'+(g*6+i+1)
      const precio=g===0&&i===0?650000:g===0&&i===1?420000:120000+i*15000
      const stock=g===0&&i===0?24:g===0&&i===1?18:i+3
      add('INSERT INTO productos(codigo,nombre,categoria_id,precio,stock,stock_minimo) SELECT ?,?,id,?,?,5 FROM categorias WHERE nombre=? ON CONFLICT(codigo) DO NOTHING',codigo,nombre,precio,stock,categoria)
      add("INSERT INTO movimientos_stock(producto_id,usuario_id,tipo,cantidad,existencia_resultante,motivo) SELECT p.id,u.id,'ingreso',p.stock,p.stock,'Stock inicial' FROM productos p,usuarios u WHERE changes()=1 AND p.codigo=? AND u.email=?",codigo,'luis@mostrador.test')
    }
  }
  for(let i=1;i<=10;i++)add('INSERT INTO clientes(nombre,documento) VALUES(?,?) ON CONFLICT(documento) DO NOTHING','Almacén '+i,String(30000000+i))
  return statements
}
