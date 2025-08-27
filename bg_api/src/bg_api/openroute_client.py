import base64
import logging
from typing import Optional
from openai import AsyncOpenAI
from PIL import Image

# 配置日志
logging.basicConfig(level=logging.DEBUG)  # 改为 DEBUG 级别
logger = logging.getLogger(__name__)


class OpenRouteClient:
    """OpenRoute API 客户端，使用 OpenAI SDK 调用图片处理服务"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://openrouter.ai/api/v1"):
        self.api_key = api_key
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key
        )
        logger.info(f"OpenRouteClient 初始化完成, base_url: {base_url}")
    
    async def __aenter__(self):
        logger.debug("OpenRouteClient 进入异步上下文")
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        logger.debug("OpenRouteClient 退出异步上下文")
        await self.client.close()
    
    def _encode_image_to_base64(self, image_bytes: bytes) -> str:
        """将图片字节转换为 base64 编码"""
        logger.debug(f"开始编码图片，大小: {len(image_bytes)} 字节")
        encoded = base64.b64encode(image_bytes).decode('utf-8')
        logger.debug(f"图片编码完成，base64 长度: {len(encoded)}")
        return encoded
    
    async def process_image(self, image_bytes: bytes, prompt: str, model: str = "google/gemini-2.5-flash-image-preview:free") -> dict:
        """
        调用 OpenRoute API 处理图片
        
        Args:
            image_bytes: 图片字节数据
            prompt: 处理提示词
            model: 使用的模型，默认为 google/gemini-2.5-flash-image-preview:free
            
        Returns:
            API 响应结果
        """
        logger.info(f"开始处理图片请求")
        logger.info(f"模型: {model}")
        logger.info(f"提示词: {prompt[:100]}..." if len(prompt) > 100 else f"提示词: {prompt}")
        logger.info(f"图片大小: {len(image_bytes)} 字节")
        
        try:
            # 将图片编码为 base64
            image_base64 = self._encode_image_to_base64(image_bytes)
            
            # 构建请求参数 - 尝试不同的图片生成参数
            request_params = {
                "extra_headers": {
                    "HTTP-Referer": "https://localhost:8000",
                    "X-Title": "Image Processing API",
                },
                "extra_body": {
                    # 尝试添加图片生成相关参数
                    "response_format": {"type": "text"},  # 明确要求文本格式
                    "stream": False,
                    "include_images": True,  # 尝试包含图片
                },
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"GENERATE IMAGE: {prompt}. Please create and return the actual image data/file, not just a description."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                # 尝试不同的参数
                "max_tokens": 4096,
                "temperature": 0.7,
                "top_p": 1.0,
            }
            
            logger.debug("请求参数构建完成（图片生成模式）")
            logger.debug(f"消息内容类型数量: {len(request_params['messages'][0]['content'])}")
            
            # 发送请求 - 直接使用 httpx 获取原始响应
            logger.info("发送图片生成请求到 OpenRouter API...")
            
            import httpx
            
            # 直接用 httpx 获取完整响应
            async with httpx.AsyncClient(timeout=60.0) as client:
                request_data = {
                    "model": model,
                    "messages": request_params["messages"],
                    "max_tokens": 4096,
                    "temperature": 0.7,
                }
                
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://localhost:8000",
                    "X-Title": "Image Processing API",
                }
                
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json=request_data,
                    headers=headers
                )
                
                if response.status_code != 200:
                    raise Exception(f"HTTP {response.status_code}: {response.text}")
                
                data = response.json()
                logger.info("收到 OpenRouter API 响应")
            
            # 记录响应基本信息
            logger.info(f"响应 ID: {data.get('id')}")
            logger.info(f"响应模型: {data.get('model')}")
            
            generated_images = []
            
            # 检查响应结构
            if "choices" in data and data["choices"]:
                choice = data["choices"][0]
                logger.info(f"完成原因: {choice.get('finish_reason')}")
                
                message = choice.get("message", {})
                content = message.get("content", "")
                logger.info(f"内容长度: {len(content)} 字符")
                
                # 检查消息中的所有字段
                logger.debug(f"消息字段: {list(message.keys())}")
                
                # 查找图片数据
                for key, value in message.items():
                    if key == "content":
                        continue
                    
                    logger.debug(f"消息字段 '{key}': {type(value)}")
                    
                    # 检查图片字段
                    if key == "images" and isinstance(value, list):
                        logger.info(f"发现图片列表: {len(value)} 个图片")
                        
                        for i, img in enumerate(value):
                            if isinstance(img, dict) and "image_url" in img:
                                img_url = img["image_url"].get("url", "")
                                if img_url.startswith("data:image/"):
                                    logger.info(f"找到图片 {i}: {len(img_url)} 字符")
                                    
                                    try:
                                        # 解析图片数据
                                        format_part, data_part = img_url.split(",", 1)
                                        img_format = format_part.split(";")[0].split("/")[1]
                                        
                                        generated_images.append({
                                            "format": img_format,
                                            "data": data_part,
                                            "url": img_url
                                        })
                                        
                                        logger.info(f"成功解析图片 {i}: 格式={img_format}, 数据长度={len(data_part)}")
                                    except Exception as e:
                                        logger.error(f"解析图片失败: {e}")
            
            # 记录 token 使用
            if "usage" in data:
                usage = data["usage"]
                logger.info(f"Token 使用 - 提示:{usage.get('prompt_tokens', 0)}, 完成:{usage.get('completion_tokens', 0)}, 总计:{usage.get('total_tokens', 0)}")
                
                # 检查 token 比例
                content_length = len(data["choices"][0]["message"].get("content", "")) if data["choices"] else 0
                completion_tokens = usage.get("completion_tokens", 0)
                if completion_tokens > 0:
                    ratio = content_length / completion_tokens
                    logger.info(f"字符/token 比例: {ratio:.2f}")
                    
                    if ratio < 0.5:
                        logger.warning("比例异常低！图片数据可能在其他位置")
            
            # 构建返回结果
            result = data.copy()  # 使用原始数据
            
            # 如果找到图片，添加到结果中
            if generated_images:
                result["generated_images"] = generated_images
                logger.info(f"添加 {len(generated_images)} 张生成的图片到响应")
            else:
                logger.warning("未找到图片数据！")
                # 输出完整响应用于调试
                logger.debug("完整响应数据:")
                logger.debug(data)
            
            logger.info("图片处理完成")
            return result
        
        except Exception as e:
            logger.error(f"OpenRoute API 请求失败: {str(e)}")
            logger.error(f"错误类型: {type(e).__name__}")
            raise Exception(f"OpenRoute API 请求失败: {str(e)}")