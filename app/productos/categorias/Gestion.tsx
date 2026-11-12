'use client'
import {useState, type FormEvent} from 'react'
import {useRouter} from 'next/navigation'

export default function Gestion({categoria}: {categoria?: {id:number; nombre:string}}) {
  const router = useRouter()
  const [nombre, escribir] = useState(categoria?.nombre ?? '')
  const [mensaje, avisar] = useState('')
  const [ocupado, esperar] = useState(false)

  async function enviar(datos: {nombre:string} | {activa:false}) {
    esperar(true)
    avisar('')
    try {
      const ruta = categoria ? '/api/categorias/' + categoria.id : '/api/categorias'
      const res = await fetch(ruta, {method:categoria ? 'PATCH' : 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(datos)})
      if (!res.ok) throw Error((await res.json()).error.message)
      if (!categoria) escribir('')
      avisar('Cambios guardados.')
      router.refresh()
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo guardar.')
    } finally { esperar(false) }
  }
  function guardar(e: FormEvent) {
    e.preventDefault()
    void enviar({nombre})
  }
  return <form onSubmit={guardar}>
    <fieldset disabled={ocupado}><label>{categoria ? 'Nombre de ' + categoria.nombre : 'Nueva categoría'}
      <input required value={nombre} onChange={e => escribir(e.target.value)} />
    </label><button>{categoria ? 'Guardar nombre' : 'Crear categoría'}</button>
    {categoria && <button type="button" onClick={() => {
      if (window.confirm('¿Desactivar ' + categoria.nombre + '?')) void enviar({activa:false})
    }}>Desactivar</button>}</fieldset>
    {mensaje && <p role="status">{mensaje}</p>}
  </form>
}
