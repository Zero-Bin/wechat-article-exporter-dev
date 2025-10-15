import {useKv} from "~/server/utils/kv";  
  
// 单个公众号的基本信息  
export interface AccountConfig {  
  fakeid: string  
  nickname: string  
  round_head_img: string  
  type: 'account' | 'author'  
  alias?: string  
  signature?: string  
  service_type?: number  
}  
  
// 登录公众号的配置(包含配置的公众号列表)  
export interface LoginAccountConfig {  
  loginFakeid: string  // 登录的公众号ID  
  configuredAccounts: AccountConfig[]  // 该登录公众号下配置的其他公众号列表  
  lastUpdated: number  
}  
  
/**  
 * 获取登录公众号的配置列表(基于登录公众号的 fakeid)  
 */  
export async function getLoginAccountConfig(loginFakeid: string): Promise<LoginAccountConfig | null> {  
  const kv = await useKv()  
  const {value: config} = await kv.get<LoginAccountConfig>(["login_account_config", loginFakeid])  
  return config  
}  
  
/**  
 * 保存登录公众号的配置列表  
 */  
export async function saveLoginAccountConfig(config: LoginAccountConfig): Promise<boolean> {  
  const kv = await useKv()  
  config.lastUpdated = Date.now()  
  const res = await kv.set(["login_account_config", config.loginFakeid], config)  
  return !!res.ok  
}  
  
/**  
 * 添加或更新登录公众号下的某个配置公众号  
 */  
export async function addOrUpdateConfiguredAccount(loginFakeid: string, account: AccountConfig): Promise<boolean> {  
  const kv = await useKv()  
    
  let loginConfig = await getLoginAccountConfig(loginFakeid)  
    
  if (!loginConfig) {  
    loginConfig = {  
      loginFakeid,  
      configuredAccounts: [account],  
      lastUpdated: Date.now()  
    }  
  } else {  
    const index = loginConfig.configuredAccounts.findIndex(a => a.fakeid === account.fakeid)  
    if (index >= 0) {  
      loginConfig.configuredAccounts[index] = account  
    } else {  
      loginConfig.configuredAccounts.push(account)  
    }  
    loginConfig.lastUpdated = Date.now()  
  }  
    
  return await saveLoginAccountConfig(loginConfig)  
}

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
