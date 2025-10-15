import {addOrUpdateConfiguredAccount} from "~/server/kv/config";  
  
export default defineEventHandler(async (event) => {  
  const body = await readBody(event)  
    
  if (!body.loginFakeid || !body.account) {  
    throw createError({statusCode: 400, message: 'loginFakeid and account are required'})  
  }  
    
  await addOrUpdateConfiguredAccount(body.loginFakeid, body.account)  
  return {success: true}  
})