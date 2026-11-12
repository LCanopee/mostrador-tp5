'use client'
export default function Imprimir({texto='Imprimir recibo'}:{texto?:string}) {return <button onClick={()=>window.print()}>{texto}</button>}
