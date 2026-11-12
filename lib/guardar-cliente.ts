import {eq,sql} from 'drizzle-orm'
import {db} from '../db/index.ts'
import {clientes,movimientos_cuenta} from '../db/schema.ts'

export class ErrorCliente extends Error {
  status:number
  code:string
  constructor(status:number,code:string,message:string) { super(message); this.status=status; this.code=code }
}
const invalido = (mensaje:string) => new ErrorCliente(422,'VALIDACION',mensaje)
function textoOpcional(valor:unknown) {
  if (valor == null) return null
  if (typeof valor !== 'string') throw invalido('Revisá los datos de contacto.')
  return valor.trim() || null
}

// RF-C2: la edición parcial conserva los campos omitidos y normaliza el documento.
export async function guardarCliente(body:unknown,id?:number) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalido('Se esperaba un cliente.')
  const d = body as Record<string,unknown>
  const campos = Object.keys(d)
  if (!campos.length || campos.some(k=>!(id !== undefined && k === 'activo') && !['tipoDoc','nroDoc','nombre','telefono','domicilio','email','cuentaCorriente','limiteCredito'].includes(k))) throw invalido('Campos de cliente inválidos.')
  return db.transaction(async tx=>{
    const [previo] = id === undefined ? [] : await tx.select().from(clientes).where(eq(clientes.id,id))
    if (id !== undefined && !previo) throw new ErrorCliente(404,'NO_ENCONTRADO','Cliente inexistente.')
    const valor = (campo:string, anterior:unknown) => campo in d ? d[campo] : anterior
    const tipoDoc = valor('tipoDoc',previo?.tipo_doc)
    const nombre = textoOpcional(valor('nombre',previo?.nombre))
    const documento = textoOpcional(valor('nroDoc',previo?.documento))?.replace(/[.\s-]/g,'')
    const email = textoOpcional(valor('email',previo?.email))
    const domicilio = textoOpcional(valor('domicilio',previo?.domicilio))
    const telefono = textoOpcional(valor('telefono',previo?.telefono))
    const activo = valor('activo', previo ? Boolean(previo.activo) : true)
    if (typeof activo !== 'boolean') throw invalido('Estado de cliente inválido.')
    const habilitado = valor('cuentaCorriente',Boolean(previo?.habilitado))
    const limite = valor('limiteCredito',previo?.limite_credito ?? null)
    if (!nombre) throw invalido('Ingresá el nombre o razón social.')
    if ((tipoDoc !== 'DNI' && tipoDoc !== 'CUIT') || !documento || !(tipoDoc==='DNI' ? /^\d{7,8}$/ : /^\d{11}$/).test(documento)) throw invalido('Revisá el tipo y el número de documento.')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw invalido('Email inválido.')
    if (typeof habilitado !== 'boolean' || (limite !== null && (typeof limite !== 'number' || !Number.isSafeInteger(limite) || limite<0))) throw invalido('Revisá la cuenta corriente y su límite.')
    const [otro] = await tx.select({id:clientes.id}).from(clientes).where(sql`replace(replace(replace(${clientes.documento},'.',''),'-',''),' ','') = ${documento}`)
    if (otro && otro.id !== id) throw new ErrorCliente(409,'DOCUMENTO_DUPLICADO','Ya existe un cliente con ese documento.')
    if (previo && (!activo || (previo.habilitado && !habilitado))) {
      const [cuenta] = await tx.select({saldo:sql<number>`coalesce(sum(${movimientos_cuenta.importe}),0)`}).from(movimientos_cuenta).where(eq(movimientos_cuenta.cliente_id,previo.id))
      if (cuenta.saldo !== 0) throw new ErrorCliente(422,'SALDO_PENDIENTE','El cliente tiene saldo pendiente.')
    }
    const datos = {activo:Number(activo),tipo_doc:tipoDoc,documento,nombre,email,domicilio,telefono,habilitado:Number(habilitado),limite_credito:limite}
    const [fila] = id === undefined ? await tx.insert(clientes).values(datos).returning({id:clientes.id}) :
      await tx.update(clientes).set(datos).where(eq(clientes.id,id)).returning({id:clientes.id})
    return {id:fila.id,activo,tipoDoc,nroDoc:documento,nombre,email,domicilio,telefono,cuentaCorriente:habilitado,limiteCredito:limite}
  })
}
