import * as nodejieba from 'nodejieba';

// 定义场景和关键词的映射规则
const sceneRules: Record<string, string[]> = {
  '扩产情况': ['投资建设', '将建设', '计划在', '项目公示', '已决定投资'],
  '投产情况': ['项目落地', '进入投产阶段', '投产'],
  '开工情况': ['开工'],
  '破产清算情况': ['离场', '破产'],
  '收购情况': ['收购'],
  '项目中止情况': ['暂停'],
  '设备进场情况': ['设备进场', '安装调试']
};

/**
 * 从文章内容中提取关键词（只识别场景规则中定义的关键词）
 * @param text 
 */
export function extractKeywords(text: string): string[] {
  console.log(`[关键词提取] 开始提取关键词，文本长度: ${text.length}`);
  
  // 收集所有场景规则中的关键词
  const allKeywords: string[] = [];
  for (const scene in sceneRules) {
    allKeywords.push(...sceneRules[scene]);
  }
  
  // 从文章中查找匹配的关键词
  const foundKeywords = new Set<string>();
  for (const keyword of allKeywords) {
    // 检查文章中是否包含该关键词
    if (text.includes(keyword)) {
      foundKeywords.add(keyword);
    }
  }
  
  const result = Array.from(foundKeywords);
  console.log(`[关键词提取] 提取到的场景关键词:`, result);
  return result;
}

/**
 * 根据关键词识别场景
 * @param keywords 
 */
export function identifyScenes(keywords: string[]): string[] {
  console.log(`[场景识别] 开始识别场景，关键词:`, keywords);
  const scenes = new Set<string>();
  for (const keyword of keywords) {
    for (const scene in sceneRules) {
      if (sceneRules[scene].includes(keyword)) {
        scenes.add(scene);
      }
    }
  }
  const result = Array.from(scenes);
  console.log(`[场景识别] 识别到的场景:`, result);
  return result;
}