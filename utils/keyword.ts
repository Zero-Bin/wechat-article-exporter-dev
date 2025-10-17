const scenes = {
  "扩产情况搜索": ["投资建设", "将建设", "计划在", "项目公示", "已决定投资"],
  "投产情况搜索": ["项目落地", "进入投产阶段", "投产"],
  "开工情况搜索": ["开工"],
  "破产清算情况搜索": ["离场", "破产"],
  "收购情况搜索": ["收购"],
  "项目中止情况搜索": ["暂停"],
  "设备进场情况搜索": ["设备进场", "安装调试"]
};

export function identifyKeywordsAndScene(content: string) {
  for (const [scene, keywords] of Object.entries(scenes)) {
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        return { scene, keyword };
      }
    }
  }

  return { scene: '', keyword: '' };
}