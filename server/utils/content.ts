import * as cheerio from 'cheerio';
import * as nodejieba from 'node-jieba';

// 定义场景和关键词的映射规则
const sceneRules: Record<string, string[]> = {
  '技术分享': ['技术', '架构', '代码', '开源', '前端', '后端', '数据库'],
  '产品设计': ['产品', '设计', '用户体验', '交互'],
  '行业动态': ['资讯', '趋势', '报告', '大会'],
  '运营增长': ['运营', '增长', '营销', '流量'],
};

// 加载自定义词典
// nodejieba.load({
//   dict: 'path/to/your/dict.txt',
// });

/**
 * 从文章内容中提取关键词
 * @param text 
 * @param topN 
 */
function extractKeywords(text: string, topN = 5): string[] {
  return nodejieba.extract(text, topN).map(item => item.word);
}

/**
 * 根据关键词识别场景
 * @param keywords 
 */
function identifyScenes(keywords: string[]): string[] {
  const scenes = new Set<string>();
  for (const keyword of keywords) {
    for (const scene in sceneRules) {
      if (sceneRules[scene].includes(keyword)) {
        scenes.add(scene);
      }
    }
  }
  return Array.from(scenes);
}

/**
 * 从文章URL抓取内容并进行分析
 * @param url 
 */
export async function processArticleContent(url: string): Promise<{ scenes: string[], keywords: string[] }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch article content from ${url}`);
      return { scenes: [], keywords: [] };
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 提取文章正文文本，这里选择 #js_content 这个常见的微信文章内容容器
    const articleText = $('#js_content').text();

    if (!articleText) {
      return { scenes: [], keywords: [] };
    }

    const keywords = extractKeywords(articleText);
    const scenes = identifyScenes(keywords);

    return { scenes, keywords };
  } catch (error) {
    console.error(`Error processing article content for ${url}:`, error);
    return { scenes: [], keywords: [] };
  }
}
