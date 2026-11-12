import {client} from '../db/index.ts'
import {seedPlan} from './fixtures.ts'
const admin=process.env.ADMIN_PASSWORD, seller=process.env.SELLER_PASSWORD
if(!admin || !seller || admin.length<8 || seller.length<8)throw Error('Configurá ambas contraseñas de prueba (mínimo 8 caracteres).')
try{await client.batch(seedPlan(admin,seller),'write');console.log('Catálogo y usuarios inicializados.')}finally{client.close()}
