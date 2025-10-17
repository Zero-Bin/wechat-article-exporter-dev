import {useKv} from "~/server/utils/kv";  
import type {AppMsgEx} from "~/types/types";  
import {processArticleContent} from '~/server/utils/content';
  
export interface ArticleEntry extends AppMsgEx {  
  fakeid: string  
}  
  
/**  
 * 保存文章到服务端(批量)  
 */  
export async function saveArticles(fakeid: string, articles: ArticleEntry[]): Promise<boolean> {  
  const kv = await useKv()  
    
  // 去重:使用 Map 确保每个 aid 只保存一次  
  const uniqueArticles = new Map<string, ArticleEntry>()  
  for (const article of articles) {  
    uniqueArticles.set(article.aid, article)  
  }  
    
  const articleArray = Array.from(uniqueArticles.values())  
    
  // 处理文章内容，提取关键词和场景
  for (const article of articleArray) {
    if ((!article.scenes || article.scenes.length === 0) && (!article.keywords || article.keywords.length === 0) && article.link) {
      try {
        const {scenes, keywords} = await processArticleContent(article.link);
        article.scenes = scenes;
        article.keywords = keywords;
      } catch (error) {
        console.error(`处理文章内容失败: ${article.link}`, error);
        // 即使处理失败，也要确保字段存在
        if (!article.scenes) article.scenes = [];
        if (!article.keywords) article.keywords = [];
      }
    }
  }
  
  const batchSize = 50  
    
  for (let i = 0; i < articleArray.length; i += batchSize) {  
    const batch = articleArray.slice(i, i + batchSize)  
    const operations = batch.map(article => {  
      const key = ["articles", fakeid, article.aid]  
      return kv.set(key, article)  
    })  
    await Promise.all(operations)  
  }  
    
  return true  
}
  
/**  
 * 获取公众号的文章列表  
 */  
export async function getArticles(fakeid: string, limit: number = 1000): Promise<ArticleEntry[]> {  
  // if (process.dev) return []  
    
  const kv = await useKv()  
  const articles: ArticleEntry[] = []  
    
  const entries = kv.list<ArticleEntry>({prefix: ["articles", fakeid]})  
    
  for await (const entry of entries) {  
    articles.push(entry.value)  
    if (articles.length >= limit) break  
  }  
    
  return articles.sort((a, b) => b.update_time - a.update_time)  
}  
  
/**  
 * 获取文章统计信息  
 */  
export async function getArticleStats(fakeid: string): Promise<{count: number, completed: boolean}> {  
  // if (process.dev) return {count: 0, completed: false}  
    
  const kv = await useKv()  
  const {value: stats} = await kv.get<{count: number, completed: boolean}>(["article_stats", fakeid])  
  return stats || {count: 0, completed: false}  
}  
  
/**  
 * 更新文章统计信息  
 */  
export async function updateArticleStats(fakeid: string, count: number, completed: boolean): Promise<boolean> {  
  // if (process.dev) return true  
    
  const kv = await useKv()  
  const res = await kv.set(["article_stats", fakeid], {count, completed})  
  return !!res.ok  
}