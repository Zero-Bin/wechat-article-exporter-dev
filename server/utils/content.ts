import path from "path";
import { fileURLToPath } from 'url';
import {execFile} from "child_process";
import {extractKeywords, identifyScenes} from "~/server/utils/keyword";

// 获取__dirname的ES模块兼容写法
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 从文章URL抓取内容并进行分析
 * @param url 
 */
async function fetchArticleContentByPython(link: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 检查是否为测试URL
    if (link.startsWith('http://localhost:3002/test')) {
      // 使用测试Python脚本
      const scriptPath = path.resolve(__dirname, '../../test_crawler.py');
      const pythonPath = 'python3';
      
      console.log(`[内容识别] 使用测试Python脚本: ${scriptPath}`);
      
      execFile(pythonPath, [scriptPath, link], { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          console.error('Python抓取失败:', error, stderr);
          return reject(error);
        }
        resolve(stdout.trim());
      });
    } else {
      // 使用原始的微信文章爬虫
      const scriptPath = path.resolve(__dirname, '../../wechat_content.py');
      // 首先尝试使用虚拟环境中的Python
      const venvPython = path.resolve(__dirname, '../../venv_wechat/bin/python');
      // 如果虚拟环境中的Python不存在，则使用系统Python
      const systemPython = 'python';
      
      // 检查虚拟环境中的Python是否存在
      execFile('test', ['-f', venvPython], (error) => {
        const pythonPath = error ? systemPython : venvPython;
        console.log(`[内容识别] 使用Python路径: ${pythonPath}`);
        
        execFile(pythonPath, [scriptPath, link], { encoding: 'utf8' }, (error, stdout, stderr) => {
          if (error) {
            console.error('Python抓取失败:', error, stderr);
            return reject(error);
          }
          resolve(stdout.trim());
        });
      });
    }
  });
}

export async function processArticleContent(url: string): Promise<{ scenes: string[], keywords: string[], content: string }> {
  console.log(`[内容识别] 开始处理文章: ${url}`);
  try {
    const articleText = await fetchArticleContentByPython(url);
    console.log(`[内容识别] Python爬虫返回内容长度: ${articleText.length}`);
    if (!articleText || articleText.startsWith('错误') || articleText.startsWith('内容抓取失败')) {
      console.warn(`[内容识别] 未提取到正文: ${url}`);
      return { scenes: [], keywords: [], content: articleText };
    }
    const keywords = extractKeywords(articleText);
    console.log(`[内容识别] 提取关键词:`, keywords);
    const scenes = identifyScenes(keywords);
    console.log(`[内容识别] 识别场景:`, scenes);
    return { scenes, keywords, content: articleText };
  } catch (error) {
    console.error(`[内容识别] 处理异常: ${url}`, error);
    return { scenes: [], keywords: [], content: '' };
  }
}