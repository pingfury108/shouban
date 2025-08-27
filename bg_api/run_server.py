#!/usr/bin/env python3
"""
启动 FastAPI 服务器
"""
import os
import uvicorn
from dotenv import load_dotenv
from bg_api import app

# 加载环境变量
load_dotenv()

if __name__ == "__main__":
    # 从环境变量获取配置，如果不存在则使用默认值
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )