import asyncio
import logging
import os
from datetime import datetime
from typing import Optional
from pocketbase import PocketBase
from pocketbase.client import ClientResponseError

# 配置日志
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AuthService:
    """PocketBase 认证服务"""
    
    def __init__(self, pb_url: str, collection_name: str = "shouban"):
        self.pb = PocketBase(pb_url)
        self.collection_name = collection_name
        logger.info(f"PocketBase 认证服务初始化完成: {pb_url}")
        logger.info(f"认证集合: {collection_name}")
    
    async def verify_api_key(self, api_key: str) -> dict:
        """
        验证 API 密钥（使用记录 ID 作为 key）
        
        Args:
            api_key: API 密钥（实际上是 PocketBase 记录的 ID）
            
        Returns:
            验证结果字典
        """
        try:
            logger.info(f"开始验证 API 密钥: {api_key[:10]}...")
            logger.debug(f"PocketBase URL: {self.pb.base_url}")
            logger.debug(f"集合名称: {self.collection_name}")
            
            # 直接通过 ID 获取记录
            # 集合包含字段：exp_time, count 等
            logger.debug(f"准备请求: GET /{self.collection_name}/{api_key}")
            
            record = self.pb.collection(self.collection_name).get_one(api_key)
            logger.info(f"找到记录: {record.id}")
            logger.debug(f"记录详情: {record.__dict__}")
            
            # 检查过期时间
            exp_time_str = getattr(record, 'exp_time', None)
            logger.debug(f"过期时间字段值: {exp_time_str}")
            
            if exp_time_str:
                # 解析过期时间（PocketBase 使用 ISO 8601 格式）
                try:
                    # 处理不同的时间格式
                    if exp_time_str.endswith('Z'):
                        exp_time = datetime.fromisoformat(exp_time_str.replace('Z', '+00:00'))
                    elif '+' in exp_time_str or exp_time_str.endswith('00'):
                        exp_time = datetime.fromisoformat(exp_time_str)
                    else:
                        # 假设是 UTC 时间
                        exp_time = datetime.fromisoformat(exp_time_str + '+00:00')
                    
                    current_time = datetime.now(exp_time.tzinfo)
                    logger.debug(f"过期时间: {exp_time}, 当前时间: {current_time}")
                    
                    if current_time > exp_time:
                        logger.warning(f"API 密钥已过期: {exp_time}")
                        return {
                            "valid": False,
                            "error": "API key expired",
                            "exp_time": exp_time_str
                        }
                    
                    logger.info(f"API 密钥有效，过期时间: {exp_time}")
                except ValueError as e:
                    logger.error(f"解析过期时间失败: {e}")
                    return {
                        "valid": False,
                        "error": "Invalid expiration time format"
                    }
            else:
                logger.info("记录没有设置过期时间")
            
            # 获取使用次数
            count = getattr(record, 'count', 0)
            logger.info(f"API 使用次数: {count}")
            
            # 返回验证成功结果
            result = {
                "valid": True,
                "record_id": record.id,
                "collection_id": getattr(record, 'collectionId', None),
                "collection_name": getattr(record, 'collectionName', None),
                "exp_time": exp_time_str,
                "count": count,
                "created": getattr(record, 'created', None),
                "updated": getattr(record, 'updated', None)
            }
            
            # 动态获取记录的所有字段
            for key, value in record.__dict__.items():
                if not key.startswith('_') and key not in result:
                    result[key] = value
            
            logger.debug(f"验证成功，返回结果: {result}")
            return result
            
        except ClientResponseError as e:
            logger.error(f"PocketBase 客户端响应错误:")
            logger.error(f"  状态码: {e.status}")
            logger.error(f"  响应数据: {e.data}")
            logger.error(f"  URL: {e.url}")
            logger.error(f"  原始异常: {e.original_error}")
            
            if e.status == 404:
                logger.warning(f"API 密钥不存在: {api_key}")
                return {
                    "valid": False,
                    "error": "Invalid API key"
                }
            elif e.status == 0:
                logger.error("连接错误：无法连接到 PocketBase 服务器")
                return {
                    "valid": False,
                    "error": "Unable to connect to PocketBase server"
                }
            else:
                return {
                    "valid": False,
                    "error": f"Database error: {e.status} - {e.data}"
                }
        except Exception as e:
            logger.error(f"验证 API 密钥时发生未知错误:")
            logger.error(f"  错误类型: {type(e).__name__}")
            logger.error(f"  错误消息: {str(e)}")
            logger.error(f"  PocketBase URL: {self.pb.base_url}")
            logger.error(f"  集合名称: {self.collection_name}")
            
            # 如果是连接相关的错误
            if "Connection refused" in str(e) or "ConnectError" in str(e):
                logger.error("连接被拒绝：请检查 PocketBase 是否运行在指定地址")
                return {
                    "valid": False,
                    "error": "PocketBase server connection refused"
                }
            
            return {
                "valid": False,
                "error": f"Verification error: {str(e)}"
            }
    
    def test_connection(self) -> bool:
        """
        测试 PocketBase 连接
        
        Returns:
            连接是否成功
        """
        try:
            logger.info(f"测试 PocketBase 连接: {self.pb.base_url}")
            
            # 尝试获取应用健康状态
            health = self.pb.health_check()
            logger.info(f"PocketBase 连接测试成功: {health}")
            return True
            
        except ClientResponseError as e:
            logger.error(f"PocketBase 连接测试失败 - 客户端响应错误:")
            logger.error(f"  状态码: {e.status}")
            logger.error(f"  响应数据: {e.data}")
            logger.error(f"  URL: {e.url}")
            logger.error(f"  原始异常: {e.original_error}")
            return False
            
        except Exception as e:
            logger.error(f"PocketBase 连接测试失败 - 未知错误:")
            logger.error(f"  错误类型: {type(e).__name__}")
            logger.error(f"  错误消息: {str(e)}")
            logger.error(f"  PocketBase URL: {self.pb.base_url}")
            
            if "Connection refused" in str(e) or "ConnectError" in str(e):
                logger.error("连接被拒绝：请检查 PocketBase 是否在指定端口运行")
                logger.error("常见解决方案:")
                logger.error("  1. 确认 PocketBase 服务已启动")
                logger.error("  2. 检查端口是否正确（默认 8090）")
                logger.error("  3. 检查防火墙设置")
                logger.error("  4. 确认 POCKETBASE_URL 环境变量配置正确")
            
            return False
    
    async def get_record_info(self, record_id: str) -> Optional[dict]:
        """
        获取记录详细信息
        
        Args:
            record_id: 记录 ID
            
        Returns:
            记录信息字典或 None
        """
        try:
            logger.info(f"获取记录信息: {record_id}")
            record = self.pb.collection(self.collection_name).get_one(record_id)
            
            record_info = {
                "id": record.id,
                "collection_id": getattr(record, 'collectionId', None),
                "collection_name": getattr(record, 'collectionName', None),
                "created": getattr(record, 'created', None),
                "updated": getattr(record, 'updated', None)
            }
            
            # 动态获取记录的所有字段
            for key, value in record.__dict__.items():
                if not key.startswith('_') and key not in record_info:
                    record_info[key] = value
            
            logger.info(f"成功获取记录信息: {record.id}")
            return record_info
            
        except ClientResponseError as e:
            logger.error(f"获取记录信息失败: {e.status} - {e.data}")
            return None
        except Exception as e:
            logger.error(f"获取记录信息失败: {e}")
            return None