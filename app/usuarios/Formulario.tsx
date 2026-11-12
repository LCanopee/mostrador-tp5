'use client'
import {useState,type FormEvent} from 'react'
import {useRouter} from 'next/navigation'

type Cuenta = {id:number; nombre:string; email:string; rol:string; activo:boolean}
export default function Formulario({cuenta,propia=false}:{cuenta?:Cuenta; propia?:boolean}) {
  const router = useRouter()
  const [ocupado, esperar] = useState(false)
  const [mensaje, avisar] = useState('')
  async function enviar(e:FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const d = new FormData(form)
    const datos = cuenta ? {nombre:d.get('nombre'),email:d.get('email'),rol:propia ? cuenta.rol : d.get('rol'),activo:propia || d.has('activo')} : Object.fromEntries(d)
    if (cuenta?.activo && 'activo' in datos && datos.activo === false && !confirm('¿Desactivar esta cuenta y cerrar sus sesiones?')) return
    esperar(true)
    avisar('')
    try {
      const res = await fetch(cuenta ? '/api/usuarios/'+cuenta.id : '/api/usuarios',{
        method:cuenta ? 'PATCH' : 'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)})
      if (!res.ok) throw Error((await res.json()).error.message)
      if (!cuenta) form.reset()
      avisar(cuenta ? 'Cambios guardados.' : 'Cuenta creada.')
      router.refresh()
    } catch(e) { avisar(e instanceof Error ? e.message : 'Error al guardar.') }
    finally { esperar(false) }
  }
  return <details><summary>{cuenta ? cuenta.nombre+' · '+cuenta.rol+' · '+(cuenta.activo ? 'Activo' : 'Inactivo') : 'Crear usuario'}</summary>
    <form onSubmit={enviar}><fieldset disabled={ocupado}>
      <label>Nombre<input required name="nombre" defaultValue={cuenta?.nombre}/></label>
      <label>Email<input required type="email" name="email" defaultValue={cuenta?.email}/></label>
      <label>Rol<select name="rol" defaultValue={cuenta?.rol ?? 'vendedor'} disabled={propia}>
        <option value="vendedor">Vendedor</option><option value="admin">Administrador</option></select></label>
      {cuenta ? <label><input style={{width:'auto'}} type="checkbox" name="activo" disabled={propia} defaultChecked={cuenta.activo}/> Cuenta activa</label> :
        <label>Contraseña inicial<input name="password" required minLength={8} type="password" autoComplete="new-password"/></label>}
      <button>{cuenta ? 'Guardar cambios' : 'Crear cuenta'}</button></fieldset>
      <p role="status">{mensaje}</p></form></details>
}
