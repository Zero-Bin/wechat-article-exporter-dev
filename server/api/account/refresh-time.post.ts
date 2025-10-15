import {getAccountConfig, saveAccountConfig} from "~/server/kv/config";  
  
export default defineEventHandler(async (event) => {  
  const body = await readBody(event)  
  const {fakeid, lastRefreshTime} = body  
    
  if (!fakeid || !lastRefreshTime) {  
    throw createError({statusCode: 400, message: 'fakeid and lastRefreshTime are required'})  
  }  
    
  // 获取现有配置  
  let config = await getAccountConfig(fakeid)  
    
  if (!config) {  
    // 如果配置不存在,创建新配置  
    config = {  
      fakeid,  
      nickname: '',  
      round_head_img: '',  
      type: 'account',  
      lastRefreshTime  
    }  
  } else {  
    // 更新刷新时间  
    config.lastRefreshTime = lastRefreshTime  
  }  
    
  await saveAccountConfig(config)  
    
  return {success: true}  
})