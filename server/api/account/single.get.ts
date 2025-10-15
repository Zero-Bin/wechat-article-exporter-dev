import {getAccountConfig} from "~/server/kv/config";  
  
export default defineEventHandler(async (event) => {  
  const query = getQuery(event)  
  const fakeid = query.fakeid as string  
    
  if (!fakeid) {  
    throw createError({statusCode: 400, message: 'fakeid is required'})  
  }  
    
  return await getAccountConfig(fakeid)  
})