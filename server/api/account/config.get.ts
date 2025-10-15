import {getLoginAccountConfig} from "~/server/kv/config";  
  
export default defineEventHandler(async (event) => {  
  const query = getQuery(event)  
  const loginFakeid = query.loginFakeid as string  
    
  if (!loginFakeid) {  
    throw createError({statusCode: 400, message: 'loginFakeid is required'})  
  }  
    
  return await getLoginAccountConfig(loginFakeid)  
})