from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Annotated
import os
import logging
import base64
from dotenv import load_dotenv
from .openroute_client import OpenRouteClient
from .auth import AuthService

# 加载环境变量
load_dotenv()

# 配置日志
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 初始化认证服务
POCKETBASE_URL = os.getenv("POCKETBASE_URL", "http://127.0.0.1:8090")
COLLECTION_NAME = os.getenv("POCKETBASE_COLLECTION", "shouban")

auth_service = AuthService(
    pb_url=POCKETBASE_URL,
    collection_name=COLLECTION_NAME
)

app = FastAPI(
    title="图片处理 API",
    description="使用 OpenRoute API 和 Gemini 模型处理图片",
    version="1.0.0"
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)

logger.info("FastAPI 应用初始化完成")


# 认证依赖函数
async def verify_api_key(x_api_key: Annotated[str, Header(alias="X-API-Key")]) -> dict:
    """验证请求头中的 API 密钥"""
    logger.info(f"开始验证请求头中的 API 密钥")
    
    if not x_api_key:
        logger.warning("请求头中缺少 X-API-Key")
        raise HTTPException(
            status_code=401,
            detail="Missing X-API-Key header"
        )
    
    # 使用认证服务验证 API 密钥
    result = await auth_service.verify_api_key(x_api_key)
    
    if not result["valid"]:
        logger.warning(f"API 密钥验证失败: {result.get('error')}")
        raise HTTPException(
            status_code=401,
            detail=result.get("error", "Invalid API key")
        )
    
    logger.info(f"API 密钥验证成功，用户ID: {result.get('user_id')}")
    return result


class ImageProcessResponse(BaseModel):
    """图片处理响应模型"""
    success: bool
    message: str
    result: Optional[dict] = None
    generated_images: Optional[List[dict]] = None
    error: Optional[str] = None


@app.post("/process-image")
async def process_image(
    file: UploadFile = File(..., description="要处理的图片文件"),
    prompt: str = Form(..., description="处理提示词"),
    auth_result: dict = Depends(verify_api_key)
):
    """
    处理图片接口 - 直接返回生成的图片文件
    
    需要在请求头中包含有效的 X-API-Key（PocketBase 记录 ID）
    接受图片文件和提示词，通过 OpenRoute API 调用 Gemini 模型处理图片，直接返回生成的图片
    """
    logger.info(f"收到图片处理请求，记录ID: {auth_result.get('record_id')}")
    logger.info(f"当前使用次数: {auth_result.get('count', 0)}")
    logger.info(f"文件名: {file.filename}")
    logger.info(f"文件类型: {file.content_type}")
    logger.info(f"提示词长度: {len(prompt)} 字符")
    
    # 验证文件类型
    if not file.content_type or not file.content_type.startswith('image/'):
        logger.warning(f"无效的文件类型: {file.content_type}")
        raise HTTPException(
            status_code=400,
            detail="上传的文件必须是图片格式"
        )
    
    # 从环境变量获取 API 密钥
    api_key = os.getenv("OPENROUTE_API_KEY")
    if not api_key:
        logger.error("未设置 OPENROUTE_API_KEY 环境变量")
        raise HTTPException(
            status_code=500,
            detail="服务器配置错误：未设置 OpenRoute API 密钥"
        )
    else:
        logger.info("OpenRoute API 密钥已获取")
        logger.debug(f"API 密钥前缀: {api_key[:10]}...")  # 只显示前10位用于调试
    
    try:
        # 读取图片数据
        logger.info("开始读取图片数据...")
        image_bytes = await file.read()
        logger.info(f"图片读取完成，大小: {len(image_bytes)} 字节")
        
        # 使用固定的模型
        model = "google/gemini-2.5-flash-image-preview:free"
        logger.info(f"使用模型: {model}")
        
        # 使用 OpenRoute 客户端处理图片
        logger.info("创建 OpenRoute 客户端...")
        async with OpenRouteClient(api_key=api_key) as client:
            logger.info("开始调用 OpenRoute API...")
            result = await client.process_image(
                image_bytes=image_bytes,
                prompt=prompt,
                model=model
            )
            logger.info("OpenRoute API 调用完成")
        
        # 检查是否有生成的图片
        if result and "generated_images" in result and result["generated_images"]:
            generated_images = result["generated_images"]
            logger.info(f"找到 {len(generated_images)} 张生成的图片")
            
            # 返回第一张生成的图片
            first_image = generated_images[0]
            image_format = first_image.get("format", "png")
            image_data = first_image.get("data", "")
            
            if image_data:
                # 解码 base64 数据为图片字节
                try:
                    image_bytes = base64.b64decode(image_data)
                    logger.info(f"成功解码图片，大小: {len(image_bytes)} 字节")
                    
                    # 直接返回图片文件（使用次数由前端记录）
                    return Response(
                        content=image_bytes,
                        media_type=f"image/{image_format}",
                        headers={
                            "Content-Disposition": f"inline; filename=generated_image.{image_format}",
                            "Cache-Control": "no-cache",
                            "X-Usage-Count": str(auth_result.get('count', 0))
                        }
                    )
                    
                except Exception as decode_error:
                    logger.error(f"解码图片数据失败: {decode_error}")
                    raise HTTPException(
                        status_code=500,
                        detail="生成的图片数据格式错误"
                    )
            else:
                logger.error("图片数据为空")
                raise HTTPException(
                    status_code=500,
                    detail="未能获取到图片数据"
                )
        else:
            logger.warning("未找到生成的图片")
            raise HTTPException(
                status_code=500,
                detail="模型未生成图片，请尝试调整提示词"
            )
    
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
    except Exception as e:
        logger.error(f"处理图片时发生错误: {str(e)}")
        logger.error(f"错误类型: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail=f"图片处理失败: {str(e)}"
        )


@app.get("/record-info")
async def get_record_info(auth_result: dict = Depends(verify_api_key)):
    """获取当前记录信息"""
    record_id = auth_result.get("record_id")
    
    if record_id:
        record_info = await auth_service.get_record_info(record_id)
        if record_info:
            return {
                "success": True,
                "record": record_info
            }
    
    return {
        "success": False,
        "error": "Record not found"
    }


@app.get("/health")
async def health_check():
    """健康检查接口"""
    logger.info("健康检查请求")
    
    # 测试 PocketBase 连接
    pb_status = auth_service.test_connection()
    
    return {
        "status": "ok" if pb_status else "warning",
        "message": "服务运行正常",
        "pocketbase": "connected" if pb_status else "disconnected",
        "config": {
            "pocketbase_url": POCKETBASE_URL,
            "collection_name": COLLECTION_NAME
        }
    }


@app.get("/models")
async def list_models():
    """列出支持的模型"""
    logger.info("模型列表请求")
    return {
        "supported_models": [
            "google/gemini-2.5-flash-image-preview:free"
        ],
        "current_model": "google/gemini-2.5-flash-image-preview:free",
        "note": "当前版本仅支持 Gemini 2.5 Flash Image Preview 模型"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)