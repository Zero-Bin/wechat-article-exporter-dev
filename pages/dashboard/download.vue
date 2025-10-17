<template>
  <div class="flex flex-col h-full">
    <Teleport defer to="#title">
      <h1 class="text-[28px] leading-[34px] text-slate-12 font-bold">文章导出 <span class="text-sm text-slate-10">导出本地已缓存的文章</span>
      </h1>
    </Teleport>
    <div class="flex flex-1 overflow-hidden">

      <!-- 公众号列表 -->
      <ul class="flex flex-col h-full w-fit overflow-y-scroll divide-y">
        <li v-for="accountInfo in sortedAccountInfos" :key="accountInfo.fakeid"
            class="relative px-4 pr-16 py-4 hover:bg-slate-3 hover:cursor-pointer transition"
            :class="{'bg-slate-3': selectedAccount === accountInfo.fakeid}" @click="toggleSelectedAccount(accountInfo)">
          <p>公众号:
            <span v-if="accountInfo.nickname" class="text-xl font-medium">{{ accountInfo.nickname }}</span>
          </p>
          <p>ID: <span class="font-mono">{{ accountInfo.fakeid }}</span></p>
          <UBadge   
            @click.stop="toggleSelectedAccount(accountInfo, true)" 
            variant="subtle"   
            color="green"   
            class="absolute top-4 right-2 cursor-pointer hover:bg-green-100"  
            :class="{'opacity-50': refreshingAccount === accountInfo.fakeid}"  
          >  
            {{ refreshingAccount === accountInfo.fakeid ? '刷新中...' : accountInfo.articles }}  
          </UBadge>  
        </li>
      </ul>

      <!-- 文章列表 -->
      <main class="flex-1 h-full overflow-y-scroll">
        <div v-if="loading" class="flex justify-center items-center mt-5">
          <Loader :size="28" class="animate-spin text-slate-500"/>
        </div>
        <div class="relative" v-else-if="selectedAccount">
          <div class="sticky top-0 z-50 bg-white flex justify-between items-center  px-4 h-[40px]">
            <div class="flex items-center space-x-4">
              <span>过滤条件:</span>
              <UInput v-model="query.title" placeholder="请输入标题过滤" color="blue"/>

              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton icon="i-heroicons-calendar-days-20-solid" color="gray">
                  {{ format(query.dateRange.start, 'yyyy-MM-dd') }} - {{ format(query.dateRange.end, 'yyyy-MM-dd') }}
                </UButton>

                <template #panel="{ close }">
                  <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                    <div class="hidden sm:flex flex-col py-4">
                      <UButton
                          v-for="(range, index) in ranges"
                          :key="index"
                          :label="range.label"
                          color="gray"
                          variant="ghost"
                          class="rounded-none px-6"
                          :class="[isRangeSelected(range.duration) ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
                          truncate
                          @click="selectRange(range.duration)"
                      />
                    </div>

                    <DatePicker v-model="query.dateRange" @close="close"/>
                  </div>
                </template>
              </UPopover>

              <USelectMenu class="w-40" color="blue" v-model="query.authors" :options="articleAuthors" multiple
                           placeholder="选择作者"/>

              <USelect v-model="query.isOriginal" :options="originalOptions" color="blue"/>

              <USelectMenu class="w-40" color="blue" v-model="query.albums" :options="articleAlbums" multiple
                           placeholder="选择合集"/>

              <UButton color="gray" variant="solid" @click="search">搜索</UButton>
            </div>
            <div class="space-x-2">
              <UButton color="black" variant="solid" class="disabled:bg-slate-4 disabled:text-slate-12"
                       :disabled="selectedArticles.length === 0 || excelBtnLoading" @click="excelExport">导出Excel
              </UButton>
              <UButton color="black" variant="solid" class="disabled:bg-slate-4 disabled:text-slate-12"
                       :disabled="selectedArticles.length === 0 || batchDownloadLoading" @click="doBatchDownload">
                <Loader v-if="batchDownloadLoading" :size="20" class="animate-spin"/>
                <span v-if="batchDownloadLoading">{{ batchDownloadPhase }}:
                  <span
                      v-if="batchDownloadPhase === '下载文章内容'">{{ batchDownloadedCount }}/{{
                      selectedArticleCount
                    }}</span>
                  <span
                      v-if="batchDownloadPhase === '打包'">{{ batchPackedCount }}/{{ batchDownloadedCount }}</span>
                </span>
                <span v-else>打包下载</span>
              </UButton>
            </div>
          </div>
          <table class="w-full border-collapse">
            <thead class="sticky top-[40px] z-10 h-[40px] bg-white">
            <tr>
              <th>
                <UCheckbox class="justify-center" :indeterminate="isIndeterminate" v-model="checkAll"
                           @change="onCheckAllChange" color="blue"/>
              </th>
              <th class="w-14">序号</th>
              <th>标题</th>
              <th class="w-52">发布日期</th>
              <th>作者</th>
              <th class="w-24">是否原创</th>
              <th class="w-36">所属合集</th>
              <th class="w-24">场景</th>
              <th class="w-24">关键词</th>
              <th class="w-12">原文</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(article, index) in displayedArticles" :key="article.aid">
              <td class="text-center" @click="toggleArticleCheck(article)">
                <UCheckbox class="justify-center" v-model="article.checked" color="blue"/>
              </td>
              <td class="text-center font-mono">{{ index + 1 }}</td>
              <td class="px-4 font-mono">{{ maxLen(article.title) }}</td>
              <td class="text-center font-mono">{{ formatTimeStamp(article.update_time) }}</td>
              <td class="text-center">{{ article.author_name }}</td>
              <td class="text-center">{{ article.copyright_stat === 1 && article.copyright_type === 1 ? '原创' : '' }}
              </td>
              <td>
                <p class="flex flex-wrap">
                  <span v-for="album in article.appmsg_album_infos" :key="album.id"
                        class="text-blue-600 mr-2">#{{ album.title }}</span>
                </p>
              </td>
              <td class="text-center">
                <span v-if="article.scenes && article.scenes.length">
                  <span v-for="scene in article.scenes" :key="scene" class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2">{{scene}}</span>
                </span>
                <span v-else>--</span>
              </td>
              <td class="text-center">
                <span v-if="article.keywords && article.keywords.length">
                  <span v-for="keyword in article.keywords" :key="keyword" class="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded mr-2">{{keyword}}</span>
                </span>
                <span v-else>--</span>
              </td>
              <td class="text-center">
                <a class="text-blue-500 underline" :href="article.link" target="_blank">
                  <UIcon name="i-heroicons-link-16-solid" class="w-5 h-5"/>
                </a>
              </td>
            </tr>
            </tbody>
          </table>
          <!-- 状态栏 -->
          <div class="sticky bottom-0 h-[40px] bg-white flex items-center px-4 space-x-10 border-t-2 font-mono">
            <span class="text-green-500">已选 {{ selectedArticles.length }} / {{ displayedArticles.length }}</span>
            <span class="text-rose-300"
                  v-if="deletedArticlesCount > 0">已隐藏 {{ deletedArticlesCount }} 条删除文章</span>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {getAllInfo, type Info} from '~/store/info'
import {getArticleCache} from "~/store/article";
import type {AppMsgEx, DownloadableArticle} from "~/types/types";
import {formatTimeStamp} from "~/utils";
import {Loader} from "lucide-vue-next";
import {sleep} from "@antfu/utils";
import {type Duration, format, isSameDay, sub} from 'date-fns'
import {useBatchDownload} from "~/composables/useBatchDownload";
import ExcelJS from "exceljs";
import {saveAs} from 'file-saver'
import { getArticleList } from '~/apis'  
  
// 添加刷新状态  
const refreshingAccount = ref('')  
const loginAccount = useLoginAccount()  
const toast = useToast()  
  
// 添加刷新最新文章的函数  
async function refreshArticles(info: Info) {  
  if (refreshingAccount.value) return  
    
  refreshingAccount.value = info.fakeid  
  const fakeid = info.fakeid  
    
  try {  
    console.log('开始刷新文章, fakeid:', fakeid)  
  
    // 1. 从云端获取该公众号的配置,检查上次刷新时间  
    const accountConfig = await $fetch(`/api/account/single?fakeid=${fakeid}`)  
    const now = Math.floor(Date.now() / 1000)  
    const lastRefreshTime = accountConfig?.lastRefreshTime || 0  
    const timeSinceLastRefresh = now - lastRefreshTime  
  
    console.log('上次刷新时间:', lastRefreshTime, '距今:', timeSinceLastRefresh, '秒')  
  
    let shouldRefreshFromWechat = false  
    let startTime = 0  
  
    // 2. 判断是否需要从微信接口刷新 (超过5分钟)  
    if (timeSinceLastRefresh > 300) {  
      shouldRefreshFromWechat = true  
      // 计算起始时间: 上次拉取时间往前一天，或首次拉取一个月  
      if (lastRefreshTime > 0) {  
        startTime = lastRefreshTime - 86400 // 往前一天  
      } else {  
        const oneMonthAgo = sub(new Date(), { months: 1 })  
        startTime = Math.floor(oneMonthAgo.getTime() / 1000)  
      }  
      console.log('需要从微信接口刷新, 起始时间:', new Date(startTime * 1000))  
    }  
  
    if (shouldRefreshFromWechat) {  
      // 3. 从微信接口拉取新数据  
      const allArticles: AppMsgEx[] = []  
      let begin = 0  
      let completed = false  
      while (!completed) {  
        const [fetchedArticles, isCompleted] = await getArticleList(fakeid, loginAccount.value.token, begin)  
        const recentArticles = fetchedArticles.filter(article => article.update_time >= startTime)  
        allArticles.push(...recentArticles)  
        const oldestArticle = fetchedArticles[fetchedArticles.length - 1]  
        if (oldestArticle && oldestArticle.update_time < startTime) {  
          completed = true  
        } else {  
          completed = isCompleted  
        }  
        if (!completed) {  
          begin += fetchedArticles.filter(article => article.itemidx === 1).length  
        }  
      }  
      console.log('从微信接口获取到', allArticles.length, '篇文章')  
  
      // 4. 同步到云端(去重)  
      if (allArticles.length > 0) {  
        await $fetch(`/api/articles/${fakeid}`, {  
          method: 'POST',  
          body: { articles: allArticles.map(article => ({ ...article, fakeid })) }  
        })  
        console.log('已同步到云端')  
      }  
  
      // 5. 更新该公众号的拉取时间  
      await $fetch('/api/account/single', {  
        method: 'POST',  
        body: { fakeid, lastRefreshTime: now }  
      })  
      console.log('已更新拉取时间')  
    }  
  
    // 6. 从云端加载完整数据  
    const serverArticles: AppMsgEx[] = await $fetch(`/api/articles/${fakeid}?limit=10000`) || []  
    console.log('从云端加载了', serverArticles.length, '篇文章')  
  
    // 调用/article-content API处理文章内容  
    const articlesWithContent = await Promise.all(serverArticles.map(async (article) => {  
      try {  
        const content = await $fetch('/api/article-content', {  
          method: 'POST',  
          body: {  
            url: article.link  
          }  
        })  
        return {  
          ...article,  
          scenes: content.scenes,  
          keywords: content.keywords  
        }  
      } catch (error) {  
        console.error('获取文章内容失败:', error)  
        return {  
          ...article,  
          scenes: [],  
          keywords: []  
        }  
      }  
    }))  
  
    if (articlesWithContent.length > 0) {  
      // 获取本地已有的文章ID  
      const localArticles = await getArticleCache(fakeid, Date.now())  
      const localArticleIds = new Set<string>()  
      localArticles.forEach(article => localArticleIds.add(article.aid))  
  
      // 筛选出云端有但本地没有的文章  
      const articlesToPut = articlesWithContent.filter(article => !localArticleIds.has(article.aid))  
      console.log('将新增到本地', articlesToPut.length, '篇文章')  
  
      // 更新 IndexedDB  
      const accountInfo = cachedAccountInfos.find(info => info.fakeid === fakeid)  
      const needsInfoUpdate = accountInfo && accountInfo.articles !== articlesWithContent.length  
  
      if (articlesToPut.length > 0 || needsInfoUpdate) {  
        const db = await openDatabase()  
        await new Promise<void>((resolve, reject) => {  
          const transaction = db.transaction(['article', 'info'], 'readwrite')  
          const articleStore = transaction.objectStore('article')  
          const infoStore = transaction.objectStore('info')  
  
          transaction.oncomplete = () => {  
            console.log('IndexedDB transaction completed successfully.')  
            resolve()  
          }  
          transaction.onerror = (event) => {  
            console.error('IndexedDB transaction error:', (event.target as IDBRequest).error)  
            reject((event.target as IDBRequest).error)  
          }  
  
          // 批量写入新文章  
          articlesToPut.forEach(article => {  
            const key = `${fakeid}:${article.aid}`  
            articleStore.put({ ...article, fakeid }, key)  
          })  
  
          // 更新公众号信息  
          if (needsInfoUpdate && accountInfo) {  
            const newInfo = {  
              ...accountInfo,  
              articles: articlesWithContent.length  
            }  
            infoStore.put(newInfo)  
          }  
        })  
      }  
  
      // 如果当前选中的是这个公众号,更新显示  
      if (selectedAccount.value === fakeid) {  
        articles.length = 0  
        deletedArticlesCount.value = articlesWithContent.filter(article => article.is_deleted).length  
        const sortedServerArticles = articlesWithContent.filter(article => !article.is_deleted)  
          .sort((a, b) => b.update_time - a.update_time)  
  
        articles.push(...sortedServerArticles.map(article => ({  
          ...article,  
          checked: false,  
          display: true,  
          author_name: article.author_name || '--',  
        })))  
  
        if (articles.length > 0) {  
          query.dateRange = {  
            start: new Date(articles[articles.length - 1].update_time * 1000),  
            end: new Date(articles[0].update_time * 1000),  
          }  
        }  
      }  
  
      toast.add({
        title: '刷新成功',
        description: shouldRefreshFromWechat 
          ? `[${selectedAccountName.value}]: 从微信接口刷新并加载了 ${articlesWithContent.length} 篇文章` 
          : `[${selectedAccountName.value}]: 从云端缓存加载了 ${articlesWithContent.length} 篇文章`,
        color: 'green',
        timeout: 5000 // 显示5秒
      })
    }  
  
  } catch (e: any) {  
    console.error('刷新文章失败:', e)  
    toast.add({  
      title: '刷新失败',  
      description: e.message || '无法刷新文章数据',  
      color: 'red'  
    })  
  } finally {  
    refreshingAccount.value = ''  
  }  
}

interface Article extends AppMsgEx {
  checked: boolean
  display: boolean
}

useHead({
  title: '数据导出 | 微信公众号文章导出'
})

// 添加这行  
const activeAccount = useActiveAccount()  

// 已缓存的公众号信息
const cachedAccountInfos = await getAllInfo()
const sortedAccountInfos = computed(() => {
  cachedAccountInfos.sort((a, b) => {
    return a.articles > b.articles ? -1 : 1
  })
  return cachedAccountInfos
})

const selectedAccount = ref('')
const selectedAccountName = ref('')

// 添加 onMounted 钩子  
onMounted(async () => {  
  if (activeAccount.value?.fakeid) {  
    const fakeid = activeAccount.value.fakeid  
    const accountInfo = cachedAccountInfos.find(info => info.fakeid === fakeid)  
      
    if (accountInfo) {  
      selectedAccount.value = fakeid  
      selectedAccountName.value = accountInfo.nickname || fakeid  
      await switchTableData(fakeid)  
    }  
  }  
})  

async function toggleSelectedAccount(info: Info, forceRefresh = false) {
  // 核心逻辑改变：无论是切换还是强制刷新，都执行后续操作
  selectedAccount.value = info.fakeid
  selectedAccountName.value = info.nickname || info.fakeid
  // 将 forceRefresh 标志传递给 switchTableData
  switchTableData(info.fakeid, forceRefresh).catch((e) => {
    console.error("切换或刷新账号失败:", e)
  })
}

const articles = reactive<Article[]>([])
const loading = ref(false)

const checkAll = ref(false)
const isIndeterminate = ref(false)

const displayedArticles = computed(() => {
  return articles.filter(article => article.display)
})
const selectedArticles = computed(() => {
  return articles.filter(article => article.checked && article.display)
})
const deletedArticlesCount = ref(0)

import { updateInfoCache } from '~/store/info'  
import { openDatabase } from '~/store/db'  
import { sub } from 'date-fns'  
  
async function switchTableData(fakeid: string, forceRefresh = false) {
  checkAll.value = false
  isIndeterminate.value = false
  loading.value = true
  articles.length = 0
  deletedArticlesCount.value = 0 // 重置删除计数

  try {
    console.log('开始加载文章, fakeid:', fakeid)

    // 1. 从云端获取该公众号的配置,检查上次刷新时间
    const accountConfig = await $fetch(`/api/account/single?fakeid=${fakeid}`)
    const now = Math.floor(Date.now() / 1000)
    const lastRefreshTime = accountConfig?.lastRefreshTime || 0
    const timeSinceLastRefresh = now - lastRefreshTime

    console.log('上次刷新时间:', lastRefreshTime, '距今:', timeSinceLastRefresh, '秒')

    let shouldRefreshFromWechat = false
    let startTime = 0

    // 2. 判断是否需要从微信接口刷新 (超过5分钟)
    if (forceRefresh || timeSinceLastRefresh > 300) {
      shouldRefreshFromWechat = true
      if (forceRefresh) {
          console.log('触发了强制刷新!')
      }
      shouldRefreshFromWechat = true
      // 计算起始时间: 上次拉取时间往前一天，或首次拉取一个月
      if (lastRefreshTime > 0) {
        startTime = lastRefreshTime - 86400 // 往前一天
      } else {
        const oneMonthAgo = sub(new Date(), { months: 1 })
        startTime = Math.floor(oneMonthAgo.getTime() / 1000)
      }
      console.log('需要从微信接口刷新, 起始时间:', new Date(startTime * 1000))
    }

    if (shouldRefreshFromWechat) {
      // 3. 从微信接口拉取新数据
      const allArticles: AppMsgEx[] = []
      let begin = 0
      let completed = false
      while (!completed) {
        const [fetchedArticles, isCompleted] = await getArticleList(fakeid, loginAccount.value.token, begin)
        const recentArticles = fetchedArticles.filter(article => article.update_time >= startTime)
        allArticles.push(...recentArticles)
        const oldestArticle = fetchedArticles[fetchedArticles.length - 1]
        if (oldestArticle && oldestArticle.update_time < startTime) {
          completed = true
        } else {
          completed = isCompleted
        }
        if (!completed) {
          begin += fetchedArticles.filter(article => article.itemidx === 1).length
        }
      }
      console.log('从微信接口获取到', allArticles.length, '篇文章')

      // 4. 同步到云端(去重)
      if (allArticles.length > 0) {
        await $fetch(`/api/articles/${fakeid}`, {
          method: 'POST',
          body: { articles: allArticles.map(article => ({ ...article, fakeid })) }
        })
        console.log('已同步到云端')
      }

      // 5. 更新该公众号的拉取时间
      await $fetch('/api/account/single', {
        method: 'POST',
        body: { fakeid, lastRefreshTime: now }
      })
      console.log('已更新拉取时间')
    }

    // 6. 从云端加载完整数据
    const serverArticles: AppMsgEx[] = await $fetch(`/api/articles/${fakeid}?limit=10000`) || []
    console.log('从云端加载了', serverArticles.length, '篇文章')

    if (serverArticles.length > 0) {
      // ==================== 核心修改：数据库操作部分 ====================

      // 首先，在所有事务之外，获取本地已有的文章ID
      const localArticles = await getArticleCache(fakeid, Date.now())
      const localArticleIds = new Set<string>()
      localArticles.forEach(article => localArticleIds.add(article.aid))

      // 筛选出云端有但本地没有的文章
      const articlesToPut = serverArticles.filter(article => !localArticleIds.has(article.aid))
      console.log('将新增到本地', articlesToPut.length, '篇文章')

      // 只有在需要写入新文章或更新公众号信息时，才启动事务
      const accountInfo = cachedAccountInfos.find(info => info.fakeid === fakeid)
      const needsInfoUpdate = accountInfo && accountInfo.articles !== serverArticles.length

      if (articlesToPut.length > 0 || needsInfoUpdate) {
        const db = await openDatabase()
        // 将所有数据库写入操作封装在一个单独的Promise中，以确保事务的原子性
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(['article', 'info'], 'readwrite')
          const articleStore = transaction.objectStore('article')
          const infoStore = transaction.objectStore('info')

          transaction.oncomplete = () => {
            console.log('IndexedDB transaction completed successfully.')
            resolve()
          }
          transaction.onerror = (event) => {
            console.error('IndexedDB transaction error:', (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
          }

          // 批量写入新文章 (不再使用await)
          articlesToPut.forEach(article => {
            const key = `${fakeid}:${article.aid}`
            articleStore.put({ ...article, fakeid }, key)
          })

          // 更新公众号信息 (不再使用await)
          if (needsInfoUpdate && accountInfo) {
            const newInfo = {
              ...accountInfo,
              articles: serverArticles.length // 直接设置为云端的总数
            }
            infoStore.put(newInfo)

            // --- 关键新增：同步更新前端UI的数据源 ---
            const index = cachedAccountInfos.findIndex(info => info.fakeid === fakeid)
            if (index !== -1) {
              cachedAccountInfos[index].articles = serverArticles.length
            }
            // --- 结束新增 ---
          }
        })
      }
      
      // =================================================================

      // 9. 显示文章列表
      deletedArticlesCount.value = serverArticles.filter(article => article.is_deleted).length
      // 在 push 之前，先对文章按 update_time 进行降序排序
      const sortedServerArticles = serverArticles.filter(article => !article.is_deleted)
        .sort((a, b) => b.update_time - a.update_time);

      articles.push(...sortedServerArticles.map(article => ({
        ...article,
        checked: false,
        display: true,
        author_name: article.author_name || '--',
      })))

      // 10. 更新日期范围
      if (articles.length > 0) {
        // articles 数组已经被降序排序，所以第一个元素是最新的，最后一个是最旧的
        query.dateRange = {
          start: new Date(articles[articles.length - 1].update_time * 1000), // <-- 取最后一个
          end: new Date(articles[0].update_time * 1000), // <-- 取第一个作为结束日期，更精确
        }
      }

      toast.add({
        title: '加载成功',
        description: shouldRefreshFromWechat 
          ? `[${selectedAccountName.value}]: 从微信接口刷新并加载了 ${serverArticles.length} 篇文章` 
          : `[${selectedAccountName.value}]: 从云端缓存加载了 ${serverArticles.length} 篇文章`,
        color: 'green',
        timeout: 5000 // 显示5秒
      })

    } else {
      console.log('云端无数据, 尝试从本地加载')
      // 降级到本地 IndexedDB
      const data = await getArticleCache(fakeid, Date.now())
      deletedArticlesCount.value = data.filter(article => article.is_deleted).length
      // 在 push 之前，也对本地数据进行降序排序
      const sortedLocalArticles = data.filter(article => !article.is_deleted)
        .sort((a, b) => b.update_time - a.update_time);

      articles.push(...sortedLocalArticles.map(article => ({
        ...article,
        checked: false,
        display: true,
        author_name: article.author_name || '--',
      })))
      toast.add({
        title: '加载成功',
        description: `[${selectedAccountName.value}]: 从浏览器本地缓存加载了 ${articles.length} 篇文章`,
        color: 'blue',
        timeout: 5000 // 显示5秒
      })
    }

  } catch (e: any) {
    console.error('加载文章失败:', e)
    toast.add({
      title: '加载文章失败',
      description: e.message || '无法加载文章数据',
      color: 'red'
    })
  } finally {
    loading.value = false
    // 重置筛选条件
    query.title = ''
    query.authors = []
    query.isOriginal = '所有'
    query.albums = []
  }
}


function maxLen(text: string, max = 35): string {
  if (text.length > max) {
    return text.slice(0, max) + '...'
  }
  return text
}

function toggleArticleCheck(article: Article) {
  article.checked = !article.checked

  if (articles.every(article => article.checked)) {
    // 全部选中
    checkAll.value = true
    isIndeterminate.value = false
  } else if (articles.every(article => !article.checked)) {
    // 全部取消选中
    checkAll.value = false
    isIndeterminate.value = false
  } else {
    //
    isIndeterminate.value = true
    checkAll.value = false
  }
}

function onCheckAllChange() {
  if (checkAll.value) {
    articles.forEach(article => {
      article.checked = true
      isIndeterminate.value = false
    })
  } else {
    articles.forEach(article => {
      article.checked = false
      isIndeterminate.value = false
    })
  }
}

const articleAuthors = computed(() => {
  return [...new Set(articles.map(article => article.author_name).filter(author => !!author))]
})
const articleAlbums = computed(() => {
  return [...new Set(articles.flatMap(article => article.appmsg_album_infos).map(album => album.title))]
})

function isRangeSelected(duration: Duration) {
  return isSameDay(query.dateRange.start, sub(new Date(), duration)) && isSameDay(query.dateRange.end, new Date())
}

function selectRange(duration: Duration) {
  query.dateRange = {start: sub(new Date(), duration), end: new Date()}
}

const ranges = [
  {label: '最近7天', duration: {days: 7}},
  {label: '最近14天', duration: {days: 14}},
  {label: '最近30天', duration: {days: 30}},
  {label: '最近3个月', duration: {months: 3}},
  {label: '最近6个月', duration: {months: 6}},
  {label: '最近1年', duration: {years: 1}},
  {label: '最近3年', duration: {years: 3}},
  {label: '最近5年', duration: {years: 5}},
  {label: '所有', duration: {years: 20}},
]
const originalOptions = ['原创', '非原创', '所有']

interface ArticleQuery {
  title: string
  dateRange: { start: Date, end: Date }
  authors: string[]
  isOriginal: '原创' | '非原创' | '所有'
  albums: string[]
}

const query = reactive<ArticleQuery>({
  title: '',
  dateRange: {start: sub(new Date(), {days: 14}), end: new Date()},
  authors: [],
  isOriginal: '所有',
  albums: [],
})

function search() {
  checkAll.value = false
  isIndeterminate.value = false

  articles.forEach(article => {
    article.display = true
    article.checked = false

    if (query.title && !article.title.includes(query.title)) {
      article.display = false
    }
    if (query.authors.length > 0 && !query.authors.includes(article.author_name)) {
      article.display = false
    }
    if (query.isOriginal === '原创' && (article.copyright_stat !== 1 || article.copyright_type !== 1)) {
      article.display = false
    }
    if (query.isOriginal === '非原创' && (article.copyright_stat === 1 && article.copyright_type === 1)) {
      article.display = false
    }
    if (new Date(article.update_time * 1000) < query.dateRange.start || new Date(article.update_time * 1000) > query.dateRange.end) {
      article.display = false
    }
    if (query.albums.length > 0 && article.appmsg_album_infos.every(album => !query.albums.includes(album.title))) {
      article.display = false
    }
  })
}

const {
  loading: batchDownloadLoading,
  phase: batchDownloadPhase,
  downloadedCount: batchDownloadedCount,
  packedCount: batchPackedCount,
  download: batchDownload,
} = useBatchDownload()
const selectedArticleCount = ref(0)

function doBatchDownload() {
  const articles: DownloadableArticle[] = selectedArticles.value.map(article => ({
    title: article.title,
    url: article.link,
    date: +article.update_time,
  }))
  selectedArticleCount.value = articles.length
  const filename = selectedAccountName.value
  batchDownload(articles, filename)
}

const excelBtnLoading = ref(false)

function excelExport() {
  excelBtnLoading.value = true

  const articles = selectedArticles.value.map(article => ({...article}))
  setTimeout(() => {
    exportToExcel(articles)
    excelBtnLoading.value = false
  }, 0)
}

async function exportToExcel(data: AppMsgEx[]) {
  // 创建工作簿和工作表
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // 设置表头
  worksheet.columns = [
    {header: '标题', key: 'title', width: 80},
    {header: '发布日期', key: 'update_time', width: 20},
    {header: '作者', key: 'author_name', width: 20},
    {header: '是否原创', key: 'copyright', width: 10},
    {header: '所属合集', key: 'album', width: 50},
    {header: '摘要', key: 'digest', width: 100},
    {header: '原文链接', key: 'link', width: 200},
    {header: '封面图链接', key: 'cover_img', width: 200},
    {header: '封面图链接(235_1)', key: 'cover_img_235_1', width: 200},
    {header: '封面图链接(16_9)', key: 'cover_img_16_9', width: 200},
    {header: '封面图链接(3_4)', key: 'cover_img_3_4', width: 200},
    {header: '封面图链接(1_1)', key: 'cover_img_1_1', width: 200},
  ];

  // 添加数据
  data.forEach(item => {
    worksheet.addRow({
      title: item.title,
      update_time: formatTimeStamp(item.update_time),
      author_name: item.author_name,
      copyright: item.copyright_stat === 1 && item.copyright_type === 1 ? '原创' : '',
      album: item.appmsg_album_infos.map(album => '#'+album.title).join(' '),
      digest: item.digest,
      link: item.link,
      cover_img: item.pic_cdn_url_235_1 || item.pic_cdn_url_16_9 || item.cover_img || item.cover,
      cover_img_235_1: item.pic_cdn_url_235_1,
      cover_img_16_9: item.pic_cdn_url_16_9,
      cover_img_3_4: item.pic_cdn_url_3_4,
      cover_img_1_1: item.pic_cdn_url_1_1,
    });
  });

  // 导出为 Excel 文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {type: 'application/octet-stream'});
  saveAs(blob, `${selectedAccountName.value}.xlsx`);
}
</script>

<style scoped>
table th {
  padding: 0.5rem 0.25rem;
}


table td {
  border: 1px solid #00002d17;
  padding: 0.25rem 0.5rem;
}

td:first-child,
th:first-child {
  border-left: none;
}

td:last-child,
th:last-child {
  border-right: none;
}

th {
  border: 1px solid #00002d17;
  border-top: none;
}

tr:nth-child(even) {
  background-color: #00005506;
}

tr:hover {
  background-color: #00005506;
}
</style>