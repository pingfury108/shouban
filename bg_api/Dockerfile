FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制整个 bg_api 目录
COPY . ./

# 安装 Python 依赖
RUN pip install --no-cache-dir -e .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 设置环境变量
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1

# 启动命令
CMD ["python", "-m", "uvicorn", "bg_api.main:app", "--host", "0.0.0.0", "--port", "8000"]