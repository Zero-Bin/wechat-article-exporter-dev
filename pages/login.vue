<template>
  <div class="flex flex-col items-center relative login__type__container login__type__container__scan">
    <h2 class="text-center text-2xl mb-5">登录微信公众平台</h2>
    <img :src="qrcodeSrc || 'https://res.wx.qq.com/mpres/zh_CN/htmledition/pages/login/loginpage/images/default_qrcode_2x6f3177.png'" alt="" class="block w-2/3 login__type__container__scan__qrcode">

    <div class="login__type__container__scan__info">
      <!-- 等待扫码 -->
      <div class="login__type__container__scan__info__inner" v-if="scanLoginType === 0">
        <p class="login__type__container__scan__info__desc">微信扫一扫，选择该微信下的</p>
        <p class="login__type__container__scan__info__desc">公众平台账号登录</p>
      </div>

      <!-- 扫码成功，可登录账号=1 -->
      <div class="login__type__container__scan__info__inner" v-else-if="scanLoginType === 1">
        <div class="login__type__container__scan_mask">
          <div class="login__type__container__scan_mask__inner">
            <mp-icon size="large" icon="success"></mp-icon>
            <h2 class="login__type__container__scan__info__title">扫码成功</h2>
          </div>
        </div>
        <p class="login__type__container__scan__info__desc">请在微信中确认账号登录</p>
        <a href="javascript:;" @click="refreshQrcode">重新扫码</a>
      </div>

      <!-- 扫码成功，可登录账号>1 -->
      <div class="login__type__container__scan__info__inner" v-else-if="scanLoginType === 2">
        <div class="login__type__container__scan_mask">
          <div class="login__type__container__scan_mask__inner">
            <mp-icon size="large" icon="success"></mp-icon>
            <h2 class="login__type__container__scan__info__title">扫码成功</h2>
          </div>
        </div>
        <p class="login__type__container__scan__info__desc">请在微信中选择账号登录</p>
        <a href="javascript:;" @click="refreshQrcode">重新扫码</a>
      </div>

      <!-- 没有可登录账号 -->
      <div class="login__type__container__scan__info__inner login__type__container__scan__noaccount" v-else-if="scanLoginType === 3">
        <div class="login__type__container__scan_mask">
          <div class="login__type__container__scan_mask__inner">
            <mp-icon size="large" icon="warnning"></mp-icon>
            <h2 class="login__type__container__scan__info__title">没有可登录账号</h2>
          </div>
        </div>
        <p class="login__type__container__scan__info__desc">
          该微信还未注册公众平台账号，<a href="https://mp.weixin.qq.com/cgi-bin/registermidpage?action=index&lang=zh_CN">现在去注册</a>
        </p>
        <a href="javascript:;" @click="refreshQrcode">重新扫码</a>
      </div>

      <!-- 登录失败 -->
      <div class="login__type__container__scan__info__inner" v-else-if="scanLoginType === 4">
        <div class="login__type__container__scan_mask">
          <div class="login__type__container__scan_mask__inner">
            <mp-icon size="large" icon="warnning"></mp-icon>
            <h2 class="login__type__container__scan__info__title">登录失败</h2>
          </div>
        </div>
        <p class="login__type__container__scan__info__desc">
          你可以<a href="javascript:;" @click="refreshQrcode">重新扫码</a>
          登录
        </p>
        <p class="login__type__container__scan__info__desc">或使用账号密码登录</p>
      </div>

      <!-- 二维码已过期 -->
      <div class="login__type__container__scan__info__inner" v-else-if="scanLoginType === 5">
        <div class="login__type__container__scan_mask">
          <div class="login__type__container__scan_mask__inner">
            <p class="login__type__container__scan_mask__info">二维码已过期</p>
            <p class="login__type__container__scan_mask__info">
              <a href="javascript:;" @click="refreshQrcode">点击刷新</a>
            </p>
          </div>
        </div>
        <p class="login__type__container__scan__info__desc">微信扫一扫，选择该微信下的</p>
        <p class="login__type__container__scan__info__desc">公众平台账号登录</p>
      </div>

      <!-- 二维码加载失败 -->
      <div class="login__type__container__scan__info__inner" v-else-if="scanLoginType === 6">
        <div class="login__type__container__scan_mask">
          <div class="login__type__container__scan_mask__inner">
            <p class="login__type__container__scan_mask__info">二维码加载失败</p>
            <p class="login__type__container__scan_mask__info">
              <a href="javascript:;" @click="refreshQrcode">点击刷新</a>
            </p>
          </div>
        </div>
        <p class="login__type__container__scan__info__desc">微信扫一扫，选择该微信下的</p>
        <p class="login__type__container__scan__info__desc">公众平台账号登录</p>
      </div>

      <!-- qq号需要绑定邮箱 -->
      <div class="login__type__container__scan__info__inner" v-else-if="scanLoginType === 7">
        <div class="login__type__container__scan_mask">
          <div class="login__type__container__scan_mask__inner">
            <mp-icon size="large" icon="success"></mp-icon>
            <h2 class="login__type__container__scan__info__title">扫码成功</h2>
          </div>
        </div>
        <p class="login__type__container__scan__info__desc">
          该账号尚未绑定邮箱，<a :href='qqBindMailUrl'>前往绑定邮箱</a>
        </p>
        <a href="javascript:;" @click="refreshQrcode">重新扫码</a>
      </div>
    </div>
    <!-- 新增注册指南部分 -->  
    <div class="mt-8 w-full max-w-2xl px-4">  
      <UAccordion :items="[{  
        label: '还没有公众号？查看注册指南',  
        icon: 'i-heroicons-information-circle',  
        defaultOpen: false,  
        slot: 'registration-guide'  
      }]">  
        <template #registration-guide>  
          <div class="prose prose-sm max-w-none">  
            <h3 class="text-lg font-semibold mb-3">个人公众号申请用户手册</h3>  
              
            <h4 class="text-base font-semibold mt-4 mb-2">注册前准备</h4>  
            <ul class="list-disc pl-5 space-y-1">  
              <li>一个未被微信注册过的邮箱地址</li>  
              <li>一个已实名认证的手机号</li>  
              <li>个人身份证（正反面照片）</li>  
            </ul>  
  
            <h4 class="text-base font-semibold mt-4 mb-2">注册步骤</h4>  
            <ol class="list-decimal pl-5 space-y-2">  
              <li>  
                <strong>访问微信公众平台官网：</strong>打开浏览器，输入  
                <a href="https://mp.weixin.qq.com/" target="_blank" class="text-blue-600 hover:underline">微信公众平台官网</a>  
                地址，点击右上角"立即注册"按钮。  
              </li>  
              <li><strong>选择账号类型：</strong>在注册页面，选择"订阅号"。</li>  
              <li>  
                <strong>填写基本信息：</strong>输入邮箱地址，点击"激活邮箱"以获取验证码。  
                将收到的6位验证码填入对应位置，并设置一个包含字母和数字的8-16位密码。  
                勾选《微信公众平台服务协议》后，点击"注册"。  
              </li>  
              <li><strong>选择注册地区：</strong>中国大陆用户直接点击"确定"继续。</li>  
              <li><strong>确认账号类型：</strong>再次确认选择的是"订阅号"，并点击"选择并继续"。</li>  
              <li>  
                <strong>主体信息登记：</strong>选择主体类型为"个人"，填写身份证姓名和号码，  
                并上传身份证正反面照片。使用绑定了银行卡的微信扫码进行身份验证，  
                完成管理员手机短信验证。  
              </li>  
              <li>  
                <strong>设置公众号信息：</strong>为公众号起一个名字，并编写功能介绍，  
                选择运营地区和服务类目，确认信息后点击"完成"提交审核。  
              </li>  
            </ol>  
  
            <h4 class="text-base font-semibold mt-4 mb-2">注册成功后的管理</h4>  
            <p class="text-sm text-gray-700">  
              注册成功后，可以通过扫码下载"公众号助手"APP或访问电脑端管理后台进行公众号的管理。  
              建议立即设置公众号头像、自动回复等基础功能，以提升用户体验。  
            </p>  
          </div>  
        </template>  
      </UAccordion>  
    </div>  
  </div>
</template>

<script setup lang="ts">
import type {LoginAccount, ScanLoginResult, StartLoginResult} from "~/types/types";
import { getArticleList } from '~/apis'  

const qrcodeSrc = ref('')
const scanLoginType = ref(0)
const qqBindMailUrl = ref('')


const isStopQrcodeTimer = ref(false)
const qrcodeRefreshTimes = ref(0)
const qrcodeTimer = ref<number | null>(null)
const sessionid = new Date().getTime().toString() + Math.floor(Math.random() * 100);
const hasStartLogin = ref(false)

const loginAccount = useLoginAccount()
const activeAccount = useActiveAccount()


useHead({
  title: '登录 | 微信公众号文章导出'
});

// 创建新的登录会话
async function newLoginSession(sid: string) {
  const {data, status, error} = await useFetch<StartLoginResult>(`/api/login/session/${sid}`, {
    method: 'POST'
  })

  if (status.value === 'success' && data.value?.base_resp.ret === 0) {
    return true
  }
  if (error.value) {
    throw error.value
  } else {
    throw new Error(data.value?.base_resp.err_msg)
  }
}

// 获取登录二维码
async function getQrcode() {
  isStopQrcodeTimer.value = false

  try {
    await newLoginSession(sessionid)
    hasStartLogin.value = true
    if (!isStopQrcodeTimer.value) {
      await refreshQrcode()
    }
  } catch (e) {
    scanLoginType.value = 6
  }
}

// 刷新二维码
async function refreshQrcode(e?: any) {
  if (typeof e === 'object' || !e) {
    qrcodeRefreshTimes.value = 0
  }
  stopCheckQrcode()

  if (qrcodeRefreshTimes.value >= 5) {
    scanLoginType.value = 5
  } else {
    scanLoginType.value = 0

    if (!hasStartLogin.value) {
      await getQrcode()
    } else {
      qrcodeSrc.value = `/api/login/getqrcode?rnd=${Math.random()}`
      qrcodeRefreshTimes.value++;
      startCheckQrcode()
    }
  }
}

// 检测二维码扫码状态
function startCheckQrcode(e?: any) {
  qrcodeTimer.value = window.setTimeout(checkQrcode, 1500)
}

function stopCheckQrcode() {
  isStopQrcodeTimer.value = true
  if (qrcodeTimer.value) {
    clearTimeout(qrcodeTimer.value);
    qrcodeTimer.value = null
  }
}

async function checkQrcode() {
  const result = await $fetch<ScanLoginResult>('/api/login/scan', {
    method: 'GET'
  })

  if (result.base_resp && result.base_resp.ret === 0) {
    switch (result.status) {
      case 1:
        await bizLogin()
        break
      case 2:
        await refreshQrcode()
        break
      case 3:
        await refreshQrcode(true)
        break
      case 4:
      case 6:
        if (result.acct_size === 1) {
          scanLoginType.value = 1
        } else if (result.acct_size > 1) {
          scanLoginType.value = 2
        } else {
          scanLoginType.value = 3
        }
        startCheckQrcode(true)
        break
      case 5:
        if (result.binduin) {
          qqBindMailUrl.value = "/cgi-bin/bizunbindqq?action=page&qq=".concat(result.binduin)
          scanLoginType.value = 7
        } else {
          scanLoginType.value = 4
        }
        break
      default:
        startCheckQrcode(true)
    }
  } else {
    scanLoginType.value = 6
  }
}

import { updateInfoCache } from '~/store/info'  
import { openDatabase } from '~/store/db'  

async function bizLogin() {
  try {
    const result = await $fetch<LoginAccount>('/api/login/bizlogin', {
      method: 'POST'
    })

    if (result.err) {
      // 使用更友好的UI提示，而不是alert
      useToast().add({ title: '登录失败', description: result.err, color: 'red' })
      return
    }

    if (result.token) {
      console.log('登录成功')
      loginAccount.value = result

      // 加载并同步该登录公众号下的所有配置公众号列表
      try {
        const loginConfig = await $fetch(`/api/account/config?loginFakeid=${result.fakeid}`)
        
        if (loginConfig && loginConfig.configuredAccounts.length > 0) {
          console.log(`加载了 ${loginConfig.configuredAccounts.length} 个配置公众号`)
          
          // --- 核心修复：将所有 IndexedDB 操作放在一个事务中 ---
          const db = await openDatabase()
          const transaction = db.transaction(['article', 'info'], 'readwrite')
          const articleStore = transaction.objectStore('article')
          const infoStore = transaction.objectStore('info')

          const updatePromises = loginConfig.configuredAccounts.map(account => {
            return new Promise<void>(async (resolve, reject) => {
              try {
                // 1. 在事务内查询已存在的信息
                const existingInfo = await new Promise<Info | undefined>((res, rej) => {
                  const request = infoStore.get(account.fakeid);
                  request.onsuccess = () => res(request.result);
                  request.onerror = () => rej(request.error);
                });

                // 2. 在事务内获取文章数
                const articleCount = await new Promise<number>((res, rej) => {
                  const index = articleStore.index('fakeid');
                  const request = index.count(account.fakeid);
                  request.onsuccess = () => res(request.result);
                  request.onerror = () => rej(request.error);
                });

                // 3. 构造并写入新信息
                const newInfo: Info = {
                  fakeid: account.fakeid,
                  nickname: account.nickname,
                  round_head_img: account.round_head_img,
                  completed: existingInfo?.completed || false,
                  count: existingInfo?.count || 0,
                  articles: articleCount,
                };
                
                const putRequest = infoStore.put(newInfo);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);

              } catch (e) {
                reject(e)
              }
            });
          });

          // 等待所有公众号信息更新完成
          await Promise.all(updatePromises);
          console.log('已同步所有配置公众号列表到 IndexedDB')

        } else {
          console.log('该登录公众号下暂无配置的公众号')
        }
      } catch (e) {
        console.warn('加载或同步配置列表失败:', e)
        // 即使配置加载失败，也应该继续执行登录流程
      }

      // 设置当前活动账号为登录的公众号
      activeAccount.value = {
        type: 'account',
        fakeid: result.fakeid,
        nickname: result.nickname,
        round_head_img: result.avatar,
        service_type: 1,
        alias: '',
        signature: '',
      }

      navigateTo('/', { replace: true })
    } else {
      useToast().add({ title: '登录异常', description: '系统繁忙，请稍后再试', color: 'orange' })
    }
  } catch (e: any) {
    console.error("bizLogin failed:", e);
    useToast().add({ title: '登录失败', description: e.data?.message || e.message || '网络错误，请检查连接', color: 'red' })
  }
}

onMounted(() => {
  getQrcode()
})

onUnmounted(() => {
  stopCheckQrcode()
})
</script>

<style scoped>
.login__type__container__scan .login__type__container__scan__qrcode {
  display: block;
  margin: 0 auto;
  width: 200px;
  height: 200px
}

.login__type__container__scan .login__type__container__scan__info__desc {
  color: #7E8081;
}

.login__type__container__scan .login__type__container__scan__info {
  text-align: center;
  margin: 10px 0;
}

.login__type__container__scan .login__type__container__scan__info__title {
  font-size: 16px;
  margin-top: 5px;
  font-weight: normal
}

.login__type__container__scan .login__type__container__scan_mask {
  display: table;
  position: absolute;
  left: 0;
  text-align: center;
  width: 200px;
  height: 200px;
  margin-top: -210px;
  background-color: rgba(255,255,255,0.96)
}

.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon {
  margin-top: 10px
}

.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon.weui-desktop-icon__large.weui-desktop-icon__normal,.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon.weui-desktop-icon__large.weui-desktop-icon.weui-desktop-icon__success,.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon.weui-desktop-icon__large.weui-desktop-icon.weui-desktop-icon__warnning,.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon.weui-desktop-icon__large.weui-desktop-icon.weui-desktop-icon__info,.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon.weui-desktop-icon__large.weui-desktop-icon.weui-desktop-icon__waiting {
  width: 40px;
  height: 40px
}

.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon.weui-desktop-icon__success path {
  fill: #07C160;
}

.login__type__container__scan .login__type__container__scan_mask .weui-desktop-icon.weui-desktop-icon__warnning path {
  fill: #E3E4E5;
}

.login__type__container__scan .login__type__container__scan_mask__inner {
  display: table-cell;
  vertical-align: middle
}

/* 在现有样式后添加 */  
  
.prose {  
  color: #374151;  
}  
  
.prose h3 {  
  color: #1f2937;  
  margin-bottom: 0.75rem;  
}  
  
.prose h4 {  
  color: #374151;  
  margin-top: 1rem;  
  margin-bottom: 0.5rem;  
}  
  
.prose ul, .prose ol {  
  margin-top: 0.5rem;  
  margin-bottom: 0.5rem;  
}  
  
.prose li {  
  margin-top: 0.25rem;  
  margin-bottom: 0.25rem;  
}  
  
.prose a {  
  color: #2563eb;  
  text-decoration: none;  
}  
  
.prose a:hover {  
  text-decoration: underline;  
}
</style>
