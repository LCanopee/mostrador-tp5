import {createClient} from '@libsql/client'
import {drizzle} from 'drizzle-orm/libsql'
import * as schema from './schema.ts'
const url=process.env.TURSO_DATABASE_URL || 'file:mostrador.sqlite'
export const client=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN})
export const db=drizzle(client,{schema})
