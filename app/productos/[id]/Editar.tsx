'use client'
import {useState, type FormEvent} from 'react'
import {useRouter} from 'next/navigation'

type Producto = {id:number; codigo:string; nombre:string; categoria_id:number; precio:number; stock_minimo:number; activo:number}
export default function Editar({p, categorias}: {p:Producto; categorias:{id:number; nombre:string}[]}) {
  const router = useRouter()
  const [ocupado, esperar] = useState(false)
  const [mensaje, avisar] = useState('')
  async function guardar(datos: Record<string,unknown>) {
    esperar(true)
    avisar('')
    try {
      const res = await fetch('/api/productos/' + p.id, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)})
      if (!res.ok) throw Error((await res.json()).error.message)
      avisar('Cambios guardados.')
      router.refresh()
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.') }
    finally { esperar(false) }
  }
  function editar(e:FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const centavos = Math.round(Number(d.get('precio')) * 100)
    void guardar({codigo:d.get('codigo'),descripcion:d.get('descripcion'),categoriaId:Number(d.get('categoriaId')),
      precio:centavos,stockMinimo:Number(d.get('stockMinimo'))})
  }
  return <section><details><summary>Editar producto</summary>
    <form onSubmit={editar}><fieldset disabled={ocupado}>
      <label>Código<input required name="codigo" defaultValue={p.codigo}/></label>
      <label>Descripción<input required name="descripcion" defaultValue={p.nombre}/></label>
      <label>Categoría<select required name="categoriaId" defaultValue={p.categoria_id}>
        {!categorias.some(c=>c.id===p.categoria_id) && <option value={p.categoria_id}>Categoría inactiva</option>}
        {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
      <label>Precio en pesos<input required name="precio" type="number" min="0.01" step="0.01" defaultValue={(p.precio/100).toFixed(2)}/></label>
      <label>Stock mínimo<input required name="stockMinimo" type="number" min="0" defaultValue={p.stock_minimo}/></label>
      <button>Guardar cambios</button></fieldset></form></details>
    <button type="button" disabled={ocupado} onClick={() => {
      if (!p.activo || window.confirm('¿Dar de baja ' + p.nombre + '? Dejará de ofrecerse en ventas.')) void guardar({activo:!p.activo})
    }}>{p.activo ? 'Dar de baja' : 'Reactivar'}</button>
    <p role="status">{mensaje}</p></section>
}
