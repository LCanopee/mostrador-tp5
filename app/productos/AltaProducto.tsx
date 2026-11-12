'use client'
import {useState, type FormEvent} from 'react'
import {useRouter} from 'next/navigation'

export default function AltaProducto({categorias}:{categorias:{id:number;nombre:string}[]}) {
  const router = useRouter()
  const [abierto, abrir] = useState(false)
  const [ocupado, guardar] = useState(false)
  const [mensaje, avisar] = useState('')
  async function enviar(e:FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    const [pesos, decimales=''] = String(datos.get('precio')).replace(',','.').split('.')
    const precio = Number(pesos + decimales.padEnd(2,'0'))
    guardar(true)
    avisar('')
    try {
      const res = await fetch('/api/productos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        codigo:datos.get('codigo'), descripcion:datos.get('descripcion'), categoriaId:Number(datos.get('categoria')),
        precio, stockMinimo:Number(datos.get('minimo')), stockInicial:Number(datos.get('inicial'))
      })})
      const r=await res.json()
      if (!res.ok) throw new Error(r.error?.message || 'Falló el alta.')
      avisar('Producto creado: '+r.codigo)
      abrir(false)
      router.refresh()
    } catch (error) { avisar(error instanceof Error ? error.message : 'No se pudo guardar el producto.') }
    finally { guardar(false) }
  }
  return <div>
    {!abierto && <button onClick={()=>{avisar('');abrir(true)}}>Nuevo producto</button>}
    {abierto && <form onSubmit={enviar}><h2>Nuevo producto</h2><fieldset disabled={ocupado}>
      <label>Código<input name="codigo" required autoFocus/></label>
      <label>Descripción<input name="descripcion" required/></label>
      <label>Categoría<select name="categoria" required defaultValue=""><option value="">Elegí una categoría</option>{categorias.map(c=><option value={c.id} key={c.id}>{c.nombre}</option>)}</select></label>
      <label>Precio en pesos<input name="precio" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" placeholder="1250,50"/></label>
      <label>Stock mínimo<input name="minimo" type="number" min="0" step="1" required defaultValue="0"/></label>
      <label>Stock inicial<input name="inicial" type="number" min="0" step="1" required defaultValue="0"/></label>
      <button type="submit">{ocupado?'Guardando…':'Guardar producto'}</button>{' '}
      <button type="button" onClick={()=>{abrir(false);avisar('')}}>Cancelar</button>
    </fieldset></form>}
    <p role="status">{mensaje}</p>
  </div>
}
