'use client'
import {useState,type FormEvent} from 'react'
import {useRouter} from 'next/navigation'
import {motivosStock} from '../../../lib/motivos-stock'

export default function Ajuste({id,stock}:{id:number;stock:number}){
  const router=useRouter()
  const [abierto,abrir]=useState(false)
  const [tipo,elegir]=useState<'ingreso'|'egreso'>('ingreso')
  const [ocupado,guardar]=useState(false)
  const [mensaje,avisar]=useState('')
  async function enviar(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    const datos=new FormData(e.currentTarget)
    guardar(true);avisar('')
    try {
      const resp=await fetch('/api/productos/'+id+'/movimientos',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tipo,cantidad:Number(datos.get('cantidad')),motivo:datos.get('motivo'),observacion:datos.get('observacion')})})
      const r=await resp.json()
      if(!resp.ok) throw Error(r.error?.message || 'Error al registrar.')
      avisar('Movimiento registrado. Existencia: '+r.existenciaResultante)
      abrir(false);router.refresh()
    } catch(e){avisar(e instanceof Error?e.message:'Error al registrar.')}
    finally{guardar(false)}
  }
  return <div>{abierto?<form onSubmit={enviar}><h2>Movimiento de stock</h2><fieldset disabled={ocupado}>
    <label>Tipo<select value={tipo} onChange={e=>elegir(e.target.value as typeof tipo)}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></label>
    <label>Cantidad<input type="number" name="cantidad" min="1" step="1" max={tipo==='egreso'?stock:undefined} required/></label>
    <label>Motivo<select name="motivo" key={tipo}>{motivosStock[tipo].map(m=><option key={m}>{m}</option>)}</select></label>
    <label>Observación (opcional)<input name="observacion"/></label>
    <button>Registrar</button>{' '}<button type="button" onClick={()=>abrir(false)}>Cancelar</button>
    </fieldset></form>:<button onClick={()=>{abrir(true);avisar('')}}>Registrar movimiento</button>}
    <p role="status">{mensaje}</p></div>
}
