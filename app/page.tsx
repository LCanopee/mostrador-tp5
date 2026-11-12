'use client'
import React,{useEffect,useState} from 'react'


type Producto={id:number;codigo:string;nombre:string;precio:number;stock:number}
type Cliente={id:number;nombre:string}
type Usuario={nombre:string;rol:string}
const pesos=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n/100)
async function api<T=unknown>(ruta:string,method='GET',body?:unknown):Promise<T>{
  const res=await fetch('/api/'+ruta,{method,headers:method==='GET'?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
  if(!res.ok)throw Error((await res.json().catch(()=>({}))).mensaje||'No se pudo conectar al servidor.')
  return res.status===204?null as T:res.json()
}
export default function App(){
  const [user,setUser]=useState<Usuario|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{api<Usuario>('sesion').then(setUser).catch(()=>{})},[])
  async function login(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    const data=Object.fromEntries(new FormData(e.currentTarget))
    setBusy(true);setError('')
    try{setUser(await api<Usuario>('sesion','POST',data))}catch(err){setError(err instanceof Error?err.message:'Error inesperado')}finally{setBusy(false)}
  }
  async function logout(){try{await api('sesion','DELETE',{});setUser(null);setError('')}catch(err){setError(err instanceof Error?err.message:'Error inesperado')}}
  return <><aside><b>mostrador</b><small>Gestión comercial</small>{user&&<p>Ventas</p>}</aside><main>{user?<><header>{user.rol==='admin' && <><a href="/usuarios">Usuarios</a> · </>}<a href="/productos">Catálogo de productos</a> · {user.nombre} <button onClick={logout}>Cerrar sesión</button></header><Venta/></>:<><h1>Iniciar sesión</h1><form onSubmit={login}><label>Email<input type="email" name="acceso" autoComplete="username" required/></label><label>Contraseña<input type="password" name="contrasena" autoComplete="current-password" required/></label><button disabled={busy}>Ingresar</button></form></>}{error&&<p role="alert">{error}</p>}</main></>
}
// RF-V3: el selector de venta conserva todos los productos disponibles.
async function productosParaVenta() {
  const productos: Producto[] = []
  for (let page = 1; ; page++) {
    const lote = await api<{data: Producto[]; total: number}>('productos?pageSize=100&page=' + page)
    productos.push(...lote.data)
    if (!lote.data.length || productos.length >= lote.total) return productos
  }
}
function Venta(){
  const [products,setProducts]=useState<Producto[]>([]),[clients,setClients]=useState<Cliente[]>([]),[selected,select]=useState('')
  const [cart,setCart]=useState<Record<number,number>>({}),[client,setClient]=useState(''),[pay,setPay]=useState('CONTADO')
  const [message,notify]=useState(''),[busy,setBusy]=useState(false)
  async function load(){
    const [p,c]=await Promise.all([productosParaVenta(),api<Cliente[]>('clientes')])
    setProducts(p);setClients(c);select(String(p[0]?.id??''))
  }
  useEffect(()=>{load().catch(err=>notify(err instanceof Error?err.message:'Error inesperado'))},[])
  const lines=products.filter(p=>cart[p.id]>0)
  const total=lines.reduce((sum,p)=>sum+p.precio*cart[p.id],0)
  function quantity(p:Producto|undefined,n:number){
    if(!p)return
    if(!Number.isSafeInteger(n)||n<0||n>p.stock){notify('Cantidad inválida. Stock disponible: '+p.stock);return}
    setCart(prev=>({...prev,[p.id]:n}));notify('')
  }
  async function confirm(){
    setBusy(true);notify('')
    try{
      const sale=await api<{numero:number;total:number}>('ventas','POST',{clienteId:client?Number(client):null,formaPago:pay,lineas:lines.map(p=>({id:p.id,cantidad:cart[p.id]}))})
      setCart({});setClient('');setPay('CONTADO')
      const receipt='Comprobante #'+sale.numero+' · '+pesos(sale.total)
      notify(receipt)
      try{await load()}catch{notify(receipt+' · Recargá para actualizar el catálogo.')}
    }catch(err){notify(err instanceof Error?err.message:'Error inesperado')}finally{setBusy(false)}
  }
  return <><h1>Crear una venta</h1><fieldset disabled={busy}><div className="grid"><section><h2>Cliente</h2><select aria-label="Cliente" value={client} onChange={e=>{setClient(e.target.value);if(!e.target.value)setPay('CONTADO')}}><option value="">Consumidor final</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select><h2>Productos</h2><select aria-label="Producto" value={selected} onChange={e=>select(e.target.value)}>{products.map(p=><option value={p.id} key={p.id}>{p.codigo} · {p.nombre} · {pesos(p.precio)}</option>)}</select><button disabled={!selected} onClick={()=>quantity(products.find(p=>p.id===Number(selected)),(cart[Number(selected)]||0)+1)}>Agregar</button>{lines.map(p=><div className="line" key={p.id}><strong>{p.nombre}</strong><label>Cantidad<input type="number" min="1" max={p.stock} value={cart[p.id]} onChange={e=>quantity(p,e.target.valueAsNumber)}/></label><span>{pesos(p.precio)} c/u · {pesos(p.precio*cart[p.id])}</span><button onClick={()=>quantity(p,0)}>Quitar</button></div>)}</section><section><h2>Resumen de venta</h2><p>Total <strong>{pesos(total)}</strong></p><label>Forma de pago<select value={pay} onChange={e=>setPay(e.target.value)}><option value="CONTADO">Contado</option><option value="TARJETA">Tarjeta</option><option value="CUENTA_CORRIENTE" disabled={!client}>Cuenta corriente</option></select></label><button disabled={!lines.length} onClick={confirm}>Confirmar venta</button></section></div></fieldset><p role="status">{message}</p></>
}
