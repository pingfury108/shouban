#!/usr/bin/env python3
"""
测试图片处理 API 的简单脚本
"""
import asyncio
import os
import aiofiles
from dotenv import load_dotenv
from bg_api.openroute_client import OpenRouteClient

# 加载环境变量
load_dotenv()

async def test_image_processing():
    """测试图片处理功能"""
    
    # 从环境变量获取 API 密钥
    api_key = os.getenv("OPENROUTE_API_KEY")
    if not api_key:
        print("请在 .env 文件中设置 OPENROUTE_API_KEY")
        return
    
    image_path = "test_image.jpg"  # 替换为测试图片路径
    prompt = "请描述这张图片的内容"
    
    try:
        # 读取测试图片
        async with aiofiles.open(image_path, 'rb') as f:
            image_bytes = await f.read()
        
        # 使用客户端处理图片
        async with OpenRouteClient(api_key=api_key) as client:
            result = await client.process_image(
                image_bytes=image_bytes,
                prompt=prompt
            )
            
        print("处理成功！")
        print("响应:", result)
        
    except FileNotFoundError:
        print(f"找不到测试图片: {image_path}")
        print("请将测试图片放在当前目录下并重命名为 'test_image.jpg'")
    except Exception as e:
        print(f"处理失败: {e}")

if __name__ == "__main__":
    asyncio.run(test_image_processing())