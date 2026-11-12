import {argon2Sync,randomBytes,timingSafeEqual} from 'node:crypto'
function derive(password:string,nonce:Buffer){
  return argon2Sync('argon2id',{message:Buffer.from(password),nonce,parallelism:1,tagLength:32,memory:19456,passes:2})
}
export function hashPassword(password:string){
  const salt=randomBytes(16)
  return salt.toString('hex')+':'+derive(password,salt).toString('hex')
}
export function matches(password:string,hash:string){
  const [salt,digest]=hash.split(':')
  return timingSafeEqual(derive(password,Buffer.from(salt,'hex')),Buffer.from(digest,'hex'))
}
