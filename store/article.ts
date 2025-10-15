import {openDatabase} from "~/store/db";  
import type {AppMsgEx, PublishListItem, PublishInfo} from "~/types/types";  
import {updateInfoCache} from "~/store/info";  
  
// 修改这里 - 正确获取 account  
const {account: activeAccount} = useActiveAccount()  

async function updateArticle(articleStore: IDBObjectStore, article: AppMsgEx, fakeid: string): Promise<IDBValidKey> {
    const key = `${fakeid}:${article.aid}`

    return new Promise((resolve, reject) => {
        const request = articleStore.put({...article, fakeid}, key)
        request.onsuccess = () => {
            resolve(request.result)
        }
        request.onerror = (evt) => {
            reject(evt)
        }
    })
}

function getAllKeys(store: IDBObjectStore): Promise<IDBValidKey[]> {
    const request = store.getAllKeys()
    return new Promise((resolve, reject) => {
        request.onsuccess = (evt) => {
            resolve(request.result)
        }
        request.onerror = (evt) => {
            reject(evt)
        }
    })
}


/**
 * 更新文章缓存
 * @param publishList 本次获取的文章列表
 * @param completed 是否已全部加载
 * @param fakeid 公众号id
 */
export async function updateArticleCache(publishList: PublishListItem[], isCompleted: boolean, fakeid: string) {  
    const db = await openDatabase()  
    const transaction = db.transaction(['article', 'info'], 'readwrite')  
    const articleStore = transaction.objectStore('article')  
    const infoStore = transaction.objectStore('info')  
  
    // 获取所有已存在的文章键  
    const existingKeys = new Set<string>()  
    const keysRequest = articleStore.getAllKeys()  
    await new Promise((resolve) => {  
        keysRequest.onsuccess = () => {  
            keysRequest.result.forEach(key => {  
                if (typeof key === 'string' && key.startsWith(`${fakeid}:`)) {  
                    existingKeys.add(key)  
                }  
            })  
            resolve(true)  
        }  
    })  
  
    let newMessageCount = 0  
    let newArticleCount = 0  
  
    for (const item of publishList) {  
        const publish_info: PublishInfo = JSON.parse(item.publish_info)  
        for (const article of publish_info.appmsgex) {  
            const key = `${fakeid}:${article.aid}`  
              
            // 只有当文章不存在时才计数  
            if (!existingKeys.has(key)) {  
                if (article.itemidx === 1) {  
                    newMessageCount++  
                }  
                newArticleCount++  
            }  
              
            await new Promise((resolve, reject) => {  
                const request = articleStore.put({...article, fakeid}, key)  
                request.onsuccess = () => resolve(true)  
                request.onerror = reject  
            })  
        }  
    }  
  
    const activeAccount = useActiveAccount()  
      
    // 只传入新增的计数  
    await updateInfoCache(infoStore, {  
        fakeid,  
        completed: isCompleted,  
        count: newMessageCount,  // 只传入新增的数量  
        articles: newArticleCount,  // 只传入新增的数量  
        nickname: activeAccount.value?.nickname,  
        round_head_img: activeAccount.value?.round_head_img,  
    })  
  
    return true  
}

/**
 * 检查是否存在指定时间之前的缓存
 * @param fakeid 公众号id
 * @param create_time 创建时间
 */
export async function hitCache(fakeid: string, create_time: number): Promise<boolean> {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
        const index = db.transaction('article').objectStore('article').index('fakeid_create_time')
        const range = IDBKeyRange.bound([fakeid], [fakeid, create_time], false, true)

        const request = index.openCursor(range)
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (cursor) {
                resolve(true)
            } else {
                resolve(false)
            }
        }
        request.onerror = (evt) => {
            reject(evt)
        }
    })
}

/**
 * 读取缓存中的指定时间之前的历史文章
 * @param fakeid 公众号id
 * @param create_time 创建时间
 */
export async function getArticleCache(fakeid: string, create_time: number): Promise<AppMsgEx[]> {
    const db = await openDatabase()
    const articles: AppMsgEx[] = []

    return new Promise((resolve, reject) => {
        const index = db.transaction('article').objectStore('article').index('fakeid_create_time')

        // 采用复合索引，参考:
        // 1. https://stackoverflow.com/questions/31403945/how-to-create-a-query-with-multiple-conditions-in-indexeddb
        // 2. https://blog.csdn.net/weixin_35482237/article/details/117864024

        const range = IDBKeyRange.bound([fakeid], [fakeid, create_time], false, true)
        const request = index.openCursor(range, 'prev')

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
            if (cursor) {
                articles.push(cursor.value)
                cursor.continue()
            } else {
                // done
                resolve(articles)
            }
        }
        request.onerror = (evt) => {
            reject(evt)
        }
    })
}
