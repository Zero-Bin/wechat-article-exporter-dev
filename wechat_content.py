#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import requests
from bs4 import BeautifulSoup
import warnings
warnings.filterwarnings('ignore')

def fetch_wechat_article(url):
    """
    抓取微信公众号文章内容
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        
        # 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 查找文章内容区域
        content_div = soup.find('div', id='js_content')
        if content_div:
            # 提取文本内容
            content_text = content_div.get_text(strip=True)
            return content_text
        else:
            return "错误: 未找到文章内容区域"
    except Exception as e:
        return f"内容抓取失败: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("错误: 缺少URL参数")
        sys.exit(1)
        
    url = sys.argv[1]
    content = fetch_wechat_article(url)
    print(content)