'use client'
import Formulario from './clientes/Formulario'
import React,{useEffect,useState,useRef} from 'react'


type Producto={id:number;codigo:string;nombre:string;precio:number;stock:number}
type Cliente={id:number;nombre:string;documento:string;habilitado:number;limiteCredito:number|null;saldo:number}
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
  return <><aside><b>mostrador</b><small>Gestión comercial</small>{user&&<p>Ventas</p>}</aside><main>{user?<><header><a href="/clientes">Clientes</a> · {user.rol==='admin' && <><a href="/usuarios">Usuarios</a> · </>}<a href="/productos">Catálogo de productos</a> · {user.nombre} <button onClick={logout}>Cerrar sesión</button></header><Venta/></>:<><h1>Iniciar sesión</h1><form onSubmit={login}><label>Email<input type="email" name="acceso" autoComplete="username" required/></label><label>Contraseña<input type="password" name="contrasena" autoComplete="current-password" required/></label><button disabled={busy}>Ingresar</button></form></>}{error&&<p role="alert">{error}</p>}</main></>
}
// RF-V3: el selector de venta conserva todos los productos disponibles.
async function opcionesParaVenta<T>(recurso:'productos'|'clientes') {
  const opciones: T[] = []
  for (let page = 1; ; page++) {
    const lote = await api<{data: T[]; total: number}>(recurso + '?pageSize=100&page=' + page)
    opciones.push(...lote.data)
    if (!lote.data.length || opciones.length >= lote.total) return opciones
  }
}
function Venta(){
  const [products,setProducts]=useState<Producto[]>([]),[clients,setClients]=useState<Cliente[]>([]),[selected,select]=useState('')
  const [cart,setCart]=useState<Record<number,number>>({}),[client,setClient]=useState(''),[pay,setPay]=useState('CONTADO')
  const [message,notify]=useState(''),[busy,setBusy]=useState(false)
  async function load(){
    const [p,c]=await Promise.all([opcionesParaVenta<Producto>('productos'),opcionesParaVenta<Cliente>('clientes')])
    setProducts(p);setClients(c);select(String(p[0]?.id??''))
  }
  useEffect(()=>{load().catch(err=>notify(err instanceof Error?err.message:'Error inesperado'))},[])
  const [efectivo,setEfectivo]=useState('')
  const [tipo,setTipo]=useState('debito')
  const [marca,setMarca]=useState('')
  const [ultimos4,setUltimos4]=useState('')
  const comprador=clients.find(c=>String(c.id)===client)
  const [textoCliente,buscarCliente]=useState('')
  const [textoProducto,buscarProducto]=useState('')
  const [unidades,cambiarUnidades]=useState('1')
  const dialogo=useRef<HTMLDialogElement>(null)
  const normalizar=(s:string)=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  const consulta=normalizar(textoCliente)
  const documento=consulta.replace(/[.\s-]/g,'')
  const compradores=clients.filter(c=>String(c.id)===client || normalizar(c.nombre).includes(consulta) ||
    (documento && c.documento.replace(/[.\s-]/g,'').includes(documento)))
  const termino=normalizar(textoProducto)
  const opciones=products.filter(p=>normalizar(p.codigo).includes(termino)||normalizar(p.nombre).includes(termino))
  const producto=opciones.find(p=>String(p.id)===selected) ?? opciones[0]
  function agregar(e:React.FormEvent) {
    e.preventDefault()
    if (!producto) return
    const n=Number(unidades)
    if (!Number.isSafeInteger(n) || n<1) {notify('Ingresá una cantidad entera positiva.');return}
    quantity(producto,(cart[producto.id] ?? 0)+n)
  }
  const lines=products.filter(p=>cart[p.id]>0)
  const total=lines.reduce((sum,p)=>sum+p.precio*cart[p.id],0)
  const recibido=efectivo === '' ? total : Math.round(Number(efectivo)*100)
  const disponible=comprador && comprador.limiteCredito !== null ? comprador.limiteCredito-comprador.saldo : null
  const pagoValido=pay==='CONTADO' ? Number.isSafeInteger(recibido) && recibido>=total :
    pay==='TARJETA' ? Boolean(marca.trim() && /^\d{4}$/.test(ultimos4)) :
    Boolean(comprador?.habilitado && (disponible===null || total<=disponible))
  function quantity(p:Producto|undefined,n:number){
    if(!p)return
    if(!Number.isSafeInteger(n)||n<0||n>p.stock){notify('Cantidad inválida. Stock disponible: '+p.stock);return}
    setCart(prev=>({...prev,[p.id]:n}));notify('')
  }
  async function confirm(){
    setBusy(true);notify('')
    try{
      const sale=await api<{numero:number;total:number;vuelto?:number}>('ventas','POST',{clienteId:client?Number(client):null,formaPago:pay,...(pay==='CONTADO' ? {montoRecibido:recibido} : pay==='TARJETA' ? {tarjeta:{tipo,marca,ultimos4}} : {}),lineas:lines.map(p=>({id:p.id,cantidad:cart[p.id]}))})
      setEfectivo('');setTipo('debito');setMarca('');setUltimos4('');setCart({});setClient('');setPay('CONTADO');buscarCliente('');buscarProducto('');cambiarUnidades('1')
      const receipt='Comprobante #'+sale.numero+' · '+pesos(sale.total)+(sale.vuelto!==undefined?' · Vuelto '+pesos(sale.vuelto):'')
      notify(receipt)
      try{await load()}catch{notify(receipt+' · Recargá para actualizar el catálogo.')}
    }catch(err){notify(err instanceof Error?err.message:'Error inesperado')}finally{setBusy(false)}
  }
  return <><h1>Crear una venta</h1><fieldset disabled={busy}><div className="grid"><section>
    <h2>Comprador</h2>
    <label>Buscar cliente por nombre o documento<input type="search" value={textoCliente} onChange={e=>buscarCliente(e.target.value)}/></label>
    <label>Cliente<select value={client} onChange={e=>{setClient(e.target.value);if(pay==='CUENTA_CORRIENTE' && !clients.find(c=>String(c.id)===e.target.value)?.habilitado)setPay('CONTADO')}}>
      <option value="">Consumidor final</option>{compradores.map(c=><option key={c.id} value={c.id}>{c.nombre} · {c.documento}</option>)}</select></label>
    <button type="button" onClick={()=>dialogo.current?.showModal()}>Nuevo cliente</button>
    <dialog ref={dialogo} aria-labelledby="alta-comprador"><h2 id="alta-comprador">Nuevo cliente</h2>
      <Formulario alCrear={c=>{
        setClients(prev=>[...prev,{id:c.id,nombre:c.nombre,documento:c.nroDoc,habilitado:Number(c.cuentaCorriente),limiteCredito:c.limiteCredito,saldo:0}])
        setClient(String(c.id));if(pay==='CUENTA_CORRIENTE' && !c.cuentaCorriente)setPay('CONTADO');buscarCliente('');dialogo.current?.close()
      }}/>
      <button type="button" onClick={()=>dialogo.current?.close()}>Cerrar</button>
    </dialog>
    <h2>Productos</h2>
    <form onSubmit={agregar}>
      <label>Buscar por código o descripción<input type="search" value={textoProducto} onChange={e=>{buscarProducto(e.target.value);select('')}}/></label>
      <label>Producto<select value={producto?.id ?? ''} onChange={e=>select(e.target.value)}>
        {!opciones.length && <option value="">Sin coincidencias</option>}
        {opciones.map(p=><option key={p.id} value={p.id}>{p.codigo} · {p.nombre} · {pesos(p.precio)}</option>)}</select></label>
      {producto && <p>Existencia: {producto.stock} · En esta venta: {cart[producto.id] ?? 0}</p>}
      <label>Unidades a agregar<input type="number" min="1" step="1" required value={unidades} onChange={e=>cambiarUnidades(e.target.value)}/></label>
      <button disabled={!producto || producto.stock<1}>Agregar</button>
    </form>{lines.map(p=><div className="line" key={p.id}><strong>{p.nombre}</strong><span>Existencia: {p.stock}</span><label>Cantidad<input type="number" min="1" max={p.stock} value={cart[p.id]} onChange={e=>quantity(p,e.target.valueAsNumber)}/></label><span>{pesos(p.precio)} c/u · {pesos(p.precio*cart[p.id])}</span><button onClick={()=>quantity(p,0)}>Quitar</button></div>)}</section><section><h2>Resumen de venta</h2><p>Total <strong>{pesos(total)}</strong></p><label>Forma de pago<select value={pay} onChange={e=>setPay(e.target.value)}><option value="CONTADO">Contado</option><option value="TARJETA">Tarjeta</option><option value="CUENTA_CORRIENTE" disabled={!comprador?.habilitado}>Cuenta corriente</option></select></label>{pay==='CONTADO' && <><label>Monto recibido en pesos<input type="number" min="0" step="0.01" placeholder={(total/100).toFixed(2)} value={efectivo} onChange={e=>setEfectivo(e.target.value)}/></label>
      <p>{recibido>=total ? 'Vuelto: '+pesos(recibido-total) : 'Falta cobrar: '+pesos(total-recibido)}</p></>}
    {pay==='TARJETA' && <><label>Tipo de tarjeta<select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="debito">Débito</option><option value="credito">Crédito</option></select></label>
      <label>Marca<input value={marca} maxLength={40} onChange={e=>setMarca(e.target.value)}/></label>
      <label>Últimos cuatro dígitos<input inputMode="numeric" autoComplete="off" maxLength={4} value={ultimos4} onChange={e=>setUltimos4(e.target.value.replace(/\D/g,''))}/></label></>}
    {pay==='CUENTA_CORRIENTE' && comprador && <><p>Saldo actual: {pesos(comprador.saldo)} · Saldo con esta venta: {pesos(comprador.saldo+total)}</p>
      <p>{disponible===null?'Sin límite de crédito': 'Crédito disponible: '+pesos(disponible)}</p>{!pagoValido && <p>El total supera el crédito disponible.</p>}</>}
    <button disabled={!lines.length || !pagoValido} onClick={confirm}>Confirmar venta</button></section></div></fieldset><p role="status">{message}</p></>
}
