import type {AccountInfo, AuthorInfo} from "~/types/types";    
import {StorageSerializers, useDebounceFn} from "@vueuse/core";    
    
export default () => {    
  const localAccount = useLocalStorage<AccountInfo | AuthorInfo | null>('account', null, {    
    serializer: StorageSerializers.object    
  })    
      
  const loginAccount = useLoginAccount()    
    
  // 保存状态标记,防止重复保存  
  const isSaving = ref(false)  
  // 上次保存的配置,用于去重  
  const lastSavedConfig = ref<string>('')  
      
  // 保存配置到服务端(保存到登录公众号的配置列表中)      
  const saveConfigInternal = async (account: AccountInfo | AuthorInfo) => {      
    console.log('=== 开始保存配置 ===')    
    console.log('loginAccount.value?.fakeid:', loginAccount.value?.fakeid)    
          
    if (!loginAccount.value?.fakeid) {    
      console.warn('登录公众号 fakeid 不存在,跳过保存')    
      return      
    }  
      
    // 防止重复保存:检查是否正在保存  
    if (isSaving.value) {  
      console.log('正在保存中,跳过本次请求')  
      return  
    }  
          
    const requestBody = {    
      loginFakeid: loginAccount.value.fakeid,    
      account: {      
        fakeid: account.fakeid,      
        nickname: account.nickname,      
        round_head_img: account.round_head_img,      
        type: account.type,      
        ...(account.type !== 'author' && {      
          alias: (account as AccountInfo).alias,      
          signature: (account as AccountInfo).signature,      
          service_type: (account as AccountInfo).service_type,      
        })      
      }      
    }  
      
    // 去重:检查配置是否与上次相同  
    const configHash = JSON.stringify(requestBody)  
    if (configHash === lastSavedConfig.value) {  
      console.log('配置未变化,跳过保存')  
      return  
    }  
          
    console.log('请求体:', JSON.stringify(requestBody, null, 2))    
    console.log('请求 URL: /api/account/config')    
      
    // 设置保存状态  
    isSaving.value = true  
          
    try {      
      const response = await $fetch('/api/account/config', {      
        method: 'POST',      
        body: requestBody    
      })    
          
      console.log('保存成功,响应:', response)    
      console.log('=== 保存配置完成 ===')  
        
      // 更新上次保存的配置  
      lastSavedConfig.value = configHash  
    } catch (e: any) {    
      console.error('=== 保存配置失败 ===')    
      console.error('错误类型:', e.constructor.name)    
      console.error('错误消息:', e.message)    
      console.error('错误状态码:', e.statusCode)    
      console.error('错误响应:', e.data)    
      console.error('完整错误对象:', e)    
      console.error('堆栈跟踪:', e.stack)    
    } finally {  
      // 重置保存状态  
      isSaving.value = false  
    }  
  }  
    
  // 使用防抖,500ms 内只执行最后一次  
  const saveConfig = useDebounceFn(saveConfigInternal, 500)  
      
  // 监听配置变化,自动保存    
  watch(localAccount, (account) => {    
    if (account) {    
      saveConfig(account)    
    }    
  }, {deep: true})    
      
  return Object.assign(localAccount, {    
    account: localAccount,    
    saveConfig,    
  })    
}