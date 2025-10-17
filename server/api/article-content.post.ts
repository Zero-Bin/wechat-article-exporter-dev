import { defineEventHandler, readBody } from 'h3'
import { processArticleContent } from '~/server/utils/content'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body
  
  if (!url) {
    throw new Error('缺少文章URL参数')
  }
  
  console.log(`[API] 开始处理文章内容: ${url}`)
  
  try {
    // 处理文章内容，识别关键词和场景
    const { scenes, keywords, content } = await processArticleContent(url)
    console.log(`[API] 文章处理完成，内容长度: ${content.length}, 关键词:`, keywords, '场景:', scenes)
    
    if (!content || content.startsWith('错误') || content.startsWith('内容抓取失败')) {
      throw new Error('无法解析文章内容')
    }
    
    return {
      success: true,
      content: content,
      scenes: scenes,
      keywords: keywords
    }
  } catch (error: any) {
    console.error('获取文章内容失败:', error)
    throw new Error(`获取文章内容失败: ${error.message}`)
  }
})