import {migrate} from 'drizzle-orm/libsql/migrator'
import {db,client} from '../db/index.ts'
try {await migrate(db,{migrationsFolder:'./drizzle'});console.log('Migraciones aplicadas.')} finally {client.close()}
