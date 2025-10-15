import {getAccountConfig, saveAccountConfig} from "~/server/kv/config";  
  
export default defineEventHandler(async (event) => {  
  const body = await readBody(event)  
  const {fakeid, lastRefreshTime} = body  
    
  if (!fakeid) {  
    throw createError({statusCode: 400, message: 'fakeid is required'})  
  }  
    
  // 获取现有配置  
  let config = await getAccountConfig(fakeid)  
    
  if (!config) {  
    // 如果不存在,创建新配置  
    config = {  
      fakeid,  
      nickname: '',  
      round_head_img: '',  
      type: 'account',  
      lastRefreshTime  
    }  
  } else {  
    // 更新拉取时间  
    config.lastRefreshTime = lastRefreshTime  
  }  
    
  await saveAccountConfig(config)  
    
  return {success: true}  
})

// 扩展 AccountConfig 接口,添加刷新时间字段  
export interface AccountConfigWithRefresh extends AccountConfig {  
  lastRefreshTime?: number  // 上次从微信接口刷新的时间戳(秒)  
}  
  
/**  
 * 获取单个公众号的配置信息(基于公众号的 fakeid)  
 */  
export async function getAccountConfig(fakeid: string): Promise<AccountConfigWithRefresh | null> {  
  const kv = await useKv()  
  const {value: config} = await kv.get<AccountConfigWithRefresh>(["account_config", fakeid])  
  return config  
}  
  
/**  
 * 保存单个公众号的配置信息  
 */  
export async function saveAccountConfig(config: AccountConfigWithRefresh): Promise<boolean> {  
  const kv = await useKv()  
  const res = await kv.set(["account_config", config.fakeid], config)  
  return !!res.ok  
}  
  
/**  
 * 更新公众号的刷新时间  
 */  
export async function updateAccountRefreshTime(fakeid: string, refreshTime: number): Promise<boolean> {  
  const kv = await useKv()  
    
  let config = await getAccountConfig(fakeid)  
    
  if (!config) {  
    // 如果配置不存在,创建一个基本配置  
    config = {  
      fakeid,  
      nickname: '',  
      round_head_img: '',  
      type: 'account',  
      lastRefreshTime: refreshTime  
    }  
  } else {  
    config.lastRefreshTime = refreshTime  
  }  
    
  return await saveAccountConfig(config)  
}