import {getArticleStats} from "~/server/kv/article";  
  
export default defineEventHandler(async (event) => {  
  const {fakeid} = event.context.params!  
  return await getArticleStats(fakeid)  
})