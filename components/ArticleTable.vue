<template>
  <div class="relative pb-24 pt-2 bg-zinc-200">
    <div class="container mx-auto">
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-md shadow-md">
          <thead>
            <tr class="bg-gray-100">
              <th class="py-3 px-4 text-left">序号</th>
              <th class="py-3 px-4 text-left">标题</th>
              <th class="py-3 px-4 text-left">发布日期</th>
              <th class="py-3 px-4 text-left">原文</th>
              <th class="py-3 px-4 text-left">场景</th>
              <th class="py-3 px-4 text-left">关键词</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(article, index) in articleList" 
              :key="article.aid" 
              class="border-b border-gray-200 hover:bg-gray-50"
            >
              <td class="py-3 px-4">{{ index + 1 }}</td>
              <td class="py-3 px-4">
                <a :href="article.link" target="_blank" class="text-blue-600 hover:underline">{{ article.title }}</a>
              </td>
              <td class="py-3 px-4">{{ formatTimeStamp(article.update_time) }}</td>
              <td class="py-3 px-4">
                <button 
                  @click="fetchArticleContent(article)" 
                  :disabled="article.fetchingContent"
                  class="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                >
                  {{ article.fetchingContent ? '获取中...' : '获取内容' }}
                </button>
                <span v-if="article.content" class="ml-2 text-green-600">✓ 已获取</span>
              </td>
              <td class="py-3 px-4">
                <div class="scene-keyword-container">
                  <el-tag v-for="scene in article.scenes" :key="scene" type="primary" style="margin-right: 5px;">
                    {{ scene }}
                  </el-tag>
                  <span v-if="!article.scenes || article.scenes.length === 0">--</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="scene-keyword-container">
                  <el-tag v-for="keyword in article.keywords" :key="keyword" type="success" style="margin-right: 5px;">
                    {{ keyword }}
                  </el-tag>
                  <span v-if="!article.keywords || article.keywords.length === 0">--</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-element-visibility="onElementVisibility"></div>
    <p v-if="loading" class="flex justify-center items-center mt-2 py-2">
      <Loader :size="28" class="animate-spin text-slate-500"/>
    </p>
    <p v-else-if="noMoreData" class="text-center mt-2 py-2 text-slate-400">已全部加载完毕</p>
  </div>
</template>

<script setup lang="ts">
import type { AppMsgEx } from "~/types/types";
import { Loader } from "lucide-vue-next";
import { vElementVisibility } from "@vueuse/components";
import { getArticleList } from '~/apis';
import { formatTimeStamp } from "~/utils";

interface Props {
  hideDeleted?: boolean
}
withDefaults(defineProps<Props>(), {
  hideDeleted: false,
})

const toast = useToast();

const keyword = ref('');
let begin = ref(0);
const articleList = reactive<AppMsgEx[]>([]);

const loginAccount = useLoginAccount();
const activeAccount = useActiveAccount();

defineExpose({
  init,
});

const loading = ref(false);
const noMoreData = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const fakeid = activeAccount.value?.fakeid!;
    const [articles, completed] = await getArticleList(fakeid, loginAccount.value.token, begin.value, keyword.value);
    
    // 为每篇文章获取场景和关键词数据
    const articlesWithKeywords = await Promise.all(articles.map(async article => {
      try {
        console.log(`[前端] 开始获取文章内容: ${article.title}`);
        const response = await $fetch('/api/article-content', {
          method: 'POST',
          body: {
            url: article.link
          }
        });
        console.log(`[前端] 文章内容获取完成: ${article.title}`, response);
        return {
          ...article,
          content: response.content || '',
          scenes: response.scenes || [],
          keywords: response.keywords || [],
          fetchingContent: false
        };
      } catch (e) {
        console.error(`获取文章 ${article.title} 内容失败:`, e);
        return {
          ...article,
          content: '',
          scenes: [],
          keywords: [],
          fetchingContent: false
        };
      }
    }));
    
    articleList.push(...articlesWithKeywords);
    noMoreData.value = completed;
    const count = articles.filter(article => article.itemidx === 1).length;
    begin.value += count;
  } catch (e: any) {
    alert(e.message);
    console.error(e);
    if (e.message === 'session expired') {
      navigateTo('/login');
    }
  } finally {
    loading.value = false;
  }
}

/**
 * 获取文章内容并识别关键词和场景
 */
async function fetchArticleContent(article: any) {
  if (article.content || article.fetchingContent) return;
  
  article.fetchingContent = true;
  try {
    console.log(`[前端] 开始获取单篇文章内容: ${article.title}`);
    // 调用后端API获取文章内容、场景和关键词
    const response = await $fetch('/api/article-content', {
      method: 'POST',
      body: {
        url: article.link
      }
    });
    console.log(`[前端] 单篇文章内容获取完成: ${article.title}`, response);
    
    article.content = response.content;
    article.scenes = response.scenes || [];
    article.keywords = response.keywords || [];
    
    toast.add({
      title: `成功获取文章内容并识别关键词`,
      timeout: 3000,
    });
  } catch (e: any) {
    console.error(e);
    toast.add({
      title: `获取文章内容失败: ${e.message}`,
      timeout: 3000,
    });
  } finally {
    article.fetchingContent = false;
  }
}

/**
 * 初始化
 */
function init(query: string) {
  articleList.length = 0;
  begin.value = 0;
  noMoreData.value = false;
  keyword.value = query;

  if (bottomElementIsVisible.value) {
    loadData();
  }
}

// 判断是否触底
const bottomElementIsVisible = ref(false);

function onElementVisibility(visible: boolean) {
  bottomElementIsVisible.value = visible;
  if (visible && !noMoreData.value) {
    loadData();
  }
}
</script>