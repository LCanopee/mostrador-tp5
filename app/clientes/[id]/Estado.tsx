'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'

// RF-C7: el servidor comprueba el saldo nuevamente al confirmar la baja.
export default function Estado({id,activo}:{id:number;activo:boolean}) {
  const router=useRouter()
  const [ocupado,esperar]=useState(false)
  const [mensaje,avisar]=useState('')
  async function cambiar() {
    if (activo && !window.confirm('¿Dar de baja a este cliente? Dejará de aparecer en nuevas ventas.')) return
    esperar(true)
    avisar('')
    try {
      const res=await fetch('/api/clientes/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({activo:!activo})})
      if (!res.ok) throw Error((await res.json()).error.message)
      router.refresh()
      avisar(activo ? 'Cliente dado de baja.' : 'Cliente reactivado.')
    } catch(e) { avisar(e instanceof Error ? e.message : 'No se pudo actualizar el cliente.') }
    finally { esperar(false) }
  }
  return <div><p>Estado: {activo?'Activo':'Inactivo'}</p><button type="button" disabled={ocupado} onClick={cambiar}>
    {activo?'Dar de baja':'Reactivar cliente'}</button><p role="status">{mensaje}</p></div>
}
