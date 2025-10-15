import {saveArticles, updateArticleStats} from "~/server/kv/article";  
  
export default defineEventHandler(async (event) => {  
  const {fakeid} = event.context.params!  
  const body = await readBody(event)  
    
  const articles = body.articles || []  
  const completed = body.completed || false  
    
  await saveArticles(fakeid, articles)  
  await updateArticleStats(fakeid, articles.length, completed)  
    
  return {success: true, count: articles.length}  
})
