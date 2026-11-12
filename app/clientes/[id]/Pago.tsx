'use client'
import {useState,type FormEvent} from 'react'
import {useRouter} from 'next/navigation'

export default function Pago({id,saldo}:{id:number;saldo:number}) {
  const [ocupado,esperar]=useState(false)
  const [mensaje,avisar]=useState('')
  const router=useRouter()
  async function enviar(e:FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d=new FormData(e.currentTarget)
    esperar(true); avisar('')
    try {
      const res=await fetch('/api/clientes/'+id+'/pagos',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({importe:Math.round(Number(d.get('importe'))*100),medio:d.get('medio'),observacion:d.get('observacion')})})
      const data=await res.json()
      if (!res.ok) throw Error(data.error.message)
      router.push('/pagos/'+data.id)
      router.refresh()
    } catch(e) { avisar(e instanceof Error?e.message:'No se pudo registrar el pago.'); esperar(false) }
  }
  return <details><summary>Registrar pago</summary><form onSubmit={enviar}><fieldset disabled={ocupado}>
    <label>Importe en pesos<input required type="number" min="0.01" step="0.01" max={(saldo/100).toFixed(2)} name="importe"/></label>
    <label>Medio de pago<select name="medio"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta_debito">Tarjeta de débito</option></select></label>
    <label>Observación (opcional)<input name="observacion"/></label><button>Confirmar pago</button></fieldset><p role="status">{mensaje}</p></form></details>
}
