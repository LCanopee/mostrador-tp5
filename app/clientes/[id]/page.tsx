import Link from 'next/link'
import {notFound,redirect} from 'next/navigation'
import {eq} from 'drizzle-orm'
import {db} from '../../../db'
import {clientes} from '../../../db/schema'
import {currentUser} from '../../../lib/session'
import Formulario from '../Formulario'

export default async function Cliente({params}:{params:Promise<{id:string}>}) {
  if (!await currentUser()) redirect('/')
  const id=Number((await params).id)
  if (!Number.isSafeInteger(id) || id<1) notFound()
  const [cliente]=await db.select().from(clientes).where(eq(clientes.id,id))
  if (!cliente) notFound()
  return <><aside><b>Mostrador</b><p>Clientes</p></aside><main><Link href="/clientes">Volver a clientes</Link>
    <h1>{cliente.nombre}</h1><p>{cliente.tipo_doc} {cliente.documento}</p>
    <Formulario cliente={cliente}/></main></>
}
