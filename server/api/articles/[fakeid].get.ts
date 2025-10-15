import {getArticles} from "~/server/kv/article";  
  
export default defineEventHandler(async (event) => {  
  const {fakeid} = event.context.params!  
  const query = getQuery(event)  
  const limit = query.limit ? parseInt(query.limit as string) : 1000  
    
  return await getArticles(fakeid, limit)  
})
