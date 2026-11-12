'use client'
import {useState,type FormEvent} from 'react'
import {useRouter} from 'next/navigation'
type Cliente = {id:number;nombre:string;tipo_doc:string;documento:string;email:string|null;domicilio:string|null;telefono:string|null;habilitado:number;limite_credito:number|null}

export default function Formulario({cliente,alCrear}:{cliente?:Cliente;alCrear?:(c:{id:number;nombre:string;nroDoc:string})=>void}) {
  const router = useRouter()
  const [mensaje,avisar] = useState('')
  const [ocupado,esperar] = useState(false)
  async function enviar(e:FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form=e.currentTarget
    const d=new FormData(form)
    const limite=String(d.get('limiteCredito') ?? '')
    const datos={...Object.fromEntries(d),cuentaCorriente:d.has('cuentaCorriente'),limiteCredito:limite ? Math.round(Number(limite)*100) : null}
    esperar(true); avisar('')
    try {
      const res=await fetch(cliente ? '/api/clientes/'+cliente.id : '/api/clientes',{method:cliente ? 'PATCH' : 'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(datos)})
      if (!res.ok) throw Error((await res.json()).error.message)
      if (!cliente) form.reset()
      avisar(cliente ? 'Cambios guardados.' : 'Cliente creado.')
      if (alCrear) alCrear(await res.json())
      else router.refresh()
    } catch(e) {avisar(e instanceof Error ? e.message : 'No se pudo guardar.')}
    finally {esperar(false)}
  }
  const formulario = <form onSubmit={enviar}><fieldset disabled={ocupado}>
    <label>Nombre o razón social<input required name="nombre" defaultValue={cliente?.nombre}/></label>
    <label>Tipo de documento<select name="tipoDoc" defaultValue={cliente?.tipo_doc ?? 'DNI'}><option>DNI</option><option>CUIT</option></select></label>
    <label>Número de documento<input required name="nroDoc" defaultValue={cliente?.documento}/></label>
    <label>Domicilio<input name="domicilio" defaultValue={cliente?.domicilio ?? ''}/></label>
    <label>Teléfono<input type="tel" name="telefono" defaultValue={cliente?.telefono ?? ''}/></label>
    <label>Email<input type="email" name="email" defaultValue={cliente?.email ?? ''}/></label>
    <label><input type="checkbox" name="cuentaCorriente" style={{width:'auto'}} defaultChecked={Boolean(cliente?.habilitado)}/> Habilitar cuenta corriente</label>
    <label>Límite de crédito en pesos (opcional)<input type="number" min="0" step="0.01" name="limiteCredito" defaultValue={cliente?.limite_credito == null ? '' : (cliente.limite_credito/100).toFixed(2)}/></label>
    <button>Guardar cliente</button></fieldset><p role="status">{mensaje}</p></form>
  return alCrear ? formulario : <details><summary>{cliente ? 'Editar cliente' : 'Nuevo cliente'}</summary>{formulario}</details>
}
