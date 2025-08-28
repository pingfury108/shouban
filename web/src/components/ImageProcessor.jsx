import { useState, useRef, useEffect, useCallback } from 'react'
import ImageViewer from './ImageViewer'
import wechatQR from '../assets/wechat-qr.jpg'

// Toast 通知组件
const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000) // 4秒后自动关闭
    return () => clearTimeout(timer)
  }, [onClose])

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '❌'
    }
  }

  const getColor = () => {
    switch (type) {
      case 'success': return 'alert-success'
      case 'warning': return 'alert-warning' 
      case 'info': return 'alert-info'
      default: return 'alert-error'
    }
  }

  return (
    <div className="toast toast-bottom toast-end">
      <div className={`alert ${getColor()} shadow-lg max-w-md`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getIcon()}</span>
          <span className="text-sm">{message}</span>
          <button
            className="btn btn-ghost btn-xs btn-circle ml-2"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// API设置模态框组件
const ApiSettingsModal = ({ onSave, onClose, currentKey }) => {
  const [inputKey, setInputKey] = useState(currentKey || '')

  const handleSave = () => {
    if (inputKey.trim()) {
      onSave(inputKey.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">用户设置</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              用户名
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="请输入您的用户名"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex gap-3">
            <button
              className="btn btn-outline flex-1"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleSave}
              disabled={!inputKey.trim()}
            >
              保存
            </button>
          </div>

          {/* 购买用户名提示 */}
          <div className="bg-info/10 border border-info/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-info text-lg">💡</div>
              <div className="flex-1">
                <h4 className="font-medium text-info mb-2">如何获取用户名？</h4>
                <p className="text-sm text-base-content/70 mb-3">
                  需要购买用户名才能使用手办生成功能。请添加微信好友并备注"手办用户名"。
                </p>
                
                {/* 微信二维码 */}
                <div className="bg-white rounded-lg p-3 inline-block border border-base-300/30">
                  <img 
                    src={wechatQR} 
                    alt="微信二维码" 
                    className="w-32 h-32 object-contain"
                    style={{ imageRendering: 'crisp-edges' }}
                    onError={(e) => {
                      console.error('二维码图片加载失败')
                      e.target.style.display = 'none'
                      e.target.nextElementSibling.style.display = 'block'
                    }}
                  />
                  <div 
                    className="w-32 h-32 bg-base-200 rounded flex items-center justify-center text-sm text-base-content/60"
                    style={{ display: 'none' }}
                  >
                    二维码加载失败
                    <br />
                    请联系管理员
                  </div>
                  <p className="text-xs text-center text-base-content/60 mt-2">
                    扫码添加微信好友
                  </p>
                </div>
                
                <div className="mt-3 text-sm text-base-content/60">
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <span>添加微信好友</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <span>备注"手办用户名"</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <span>获取专属用户名</span>
                  </p>
                </div>
                
                {/* 价格信息 */}
                <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-success mb-1">💰 购买价格</div>
                    <div className="text-2xl font-bold text-primary mb-1">¥1/天</div>
                    <div className="text-sm text-base-content/70">20次调用配额</div>
                    <div className="text-xs text-base-content/60 mt-1">超值优惠，每天仅需一元</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ImageProcessor = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [prompt, setPrompt] = useState("turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Make the PVC material look clear, and set the scene indoors if possible");
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [step, setStep] = useState(1) // 1: 上传, 2: 确认, 3: 结果
  const [previewImage, setPreviewImage] = useState(null) // 预览放大的图片
  const [apiKey, setApiKey] = useState('') // 用户名
  const [showApiSettings, setShowApiSettings] = useState(false) // 显示用户设置
  const [toast, setToast] = useState(null) // Toast 通知状态
  const [isInitialized, setIsInitialized] = useState(false) // 初始化状态
  const [dailyUsage, setDailyUsage] = useState({ count: 0, limit: 0 }) // 每日使用次数
  const [userDailyLimit, setUserDailyLimit] = useState(0) // 用户每日限额，从API获取
  
  const fileInputRef = useRef(null)

  // 从API获取用户每日使用限额
  const fetchUserDailyLimit = useCallback(async (username) => {
    if (!username) {
      setUserDailyLimit(0)
      return 0
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8097'
      const response = await fetch(`${apiUrl}/record-info`, {
        method: 'GET',
        headers: {
          'X-API-Key': username
        }
      })

      if (response.ok) {
        const data = await response.json()
        // API 返回的数据结构: { success: true, record: { count: 3, ... } }
        const limit = data.record?.count || 0
        setUserDailyLimit(limit)
        return limit
      } else {
        console.warn('获取用户限额失败，设置为0')
        setUserDailyLimit(0)
        return 0
      }
    } catch (error) {
      console.error('请求用户限额失败:', error)
      setUserDailyLimit(0)
      return 0
    }
  }, [])

  // 获取今天的日期字符串 (YYYY-MM-DD)
  const getTodayString = useCallback(() => {
    const today = new Date()
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0')
  }, [])

  // 获取用户今日使用次数
  const getDailyUsage = useCallback((username) => {
    if (!username) return { count: 0, date: getTodayString() }
    
    const storageKey = `shouban_usage_${username}`
    const stored = localStorage.getItem(storageKey)
    
    if (!stored) {
      return { count: 0, date: getTodayString() }
    }
    
    try {
      const data = JSON.parse(stored)
      const today = getTodayString()
      
      // 如果不是今天的数据，重置计数
      if (data.date !== today) {
        return { count: 0, date: today }
      }
      
      return data
    } catch (error) {
      console.error('解析使用次数数据失败:', error)
      return { count: 0, date: getTodayString() }
    }
  }, [getTodayString])

  // 更新用户今日使用次数
  const updateDailyUsage = useCallback((username) => {
    if (!username) return false
    
    const current = getDailyUsage(username)
    const newCount = current.count + 1
    const today = getTodayString()
    
    const newData = {
      count: newCount,
      date: today
    }
    
    const storageKey = `shouban_usage_${username}`
    localStorage.setItem(storageKey, JSON.stringify(newData))
    
    // 更新状态
    setDailyUsage({ count: newCount, limit: userDailyLimit })
    
    return newCount <= userDailyLimit
  }, [getDailyUsage, getTodayString, userDailyLimit])

  // 检查用户是否还有使用次数
  const canUseService = useCallback((username) => {
    if (!username || userDailyLimit === 0) return false
    
    const usage = getDailyUsage(username)
    return usage.count < userDailyLimit
  }, [getDailyUsage, userDailyLimit])

  // 获取剩余次数
  const getRemainingUsage = useCallback((username) => {
    if (!username) return 0
    
    const usage = getDailyUsage(username)
    return Math.max(0, userDailyLimit - usage.count)
  }, [getDailyUsage, userDailyLimit])

  // Toast 通知函数
  const showToast = (message, type = 'error') => {
    setToast({ message, type })
  }

  const hideToast = () => {
    setToast(null)
  }

  // 预设提示词配置 - 在这里添加新的预设即可自动生成按钮
  const presetPrompts = {
    "默认手办": "turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Make the PVC material look clear, and set the scene indoors if possible"
    // 在此添加更多预设，格式：
    // "名称": "提示词内容",
  }

  // 初始化用户名：从URL参数或localStorage获取
  useEffect(() => {
    // 从URL查询参数获取用户名
    const urlParams = new URLSearchParams(window.location.search)
    const keyFromUrl = urlParams.get('key') || urlParams.get('apikey') || urlParams.get('api_key') || urlParams.get('user') || urlParams.get('username')
    
    if (keyFromUrl) {
      // 如果URL中有用户名，保存到localStorage并设置状态
      localStorage.setItem('shouban_username', keyFromUrl)
      setApiKey(keyFromUrl)
      
      // 清除URL参数（可选）
      const newUrl = new URL(window.location)
      newUrl.searchParams.delete('key')
      newUrl.searchParams.delete('apikey') 
      newUrl.searchParams.delete('api_key')
      newUrl.searchParams.delete('user')
      newUrl.searchParams.delete('username')
      window.history.replaceState({}, '', newUrl)
    } else {
      // 从localStorage获取
      const savedKey = localStorage.getItem('shouban_username')
      if (savedKey) {
        setApiKey(savedKey)
      } else {
        // 如果没有用户名，不自动显示设置界面，让用户手动点击设置
        // setShowApiSettings(true) - 已移除自动弹窗
      }
    }
    
    // 标记初始化完成
    setIsInitialized(true)
  }, [])

  // 监听用户名变化，更新使用次数状态和获取用户限额
  useEffect(() => {
    if (apiKey) {
      // 获取用户限额
      fetchUserDailyLimit(apiKey).then(limit => {
        // 获取使用记录
        const usage = getDailyUsage(apiKey)
        setDailyUsage({ count: usage.count, limit })
      })
    } else {
      setDailyUsage({ count: 0, limit: 0 })
      setUserDailyLimit(0)
    }
  }, [apiKey, fetchUserDailyLimit, getDailyUsage])

  // 组件卸载时清理URL对象
  useEffect(() => {
    return () => {
      if (result && result.imageUrl) {
        URL.revokeObjectURL(result.imageUrl)
      }
    }
  }, [result])

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)
      setError('')
      setStep(2) // 进入确认步骤
      
      // 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    } else {
      showToast('请选择有效的图片文件', 'warning')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleProcess = async () => {
    if (!selectedImage) {
      showToast('请先选择图片', 'warning')
      return
    }
    
    if (!prompt.trim()) {
      showToast('请输入处理提示词', 'warning')
      return
    }

    if (!apiKey.trim()) {
      showToast('请先设置用户名', 'warning')
      return
    }

    // 检查使用次数限制
    if (!canUseService(apiKey)) {
      if (userDailyLimit === 0) {
        showToast('当前账户暂无使用权限，请联系管理员', 'warning')
      } else {
        showToast(`今日使用次数已达上限(${userDailyLimit}次)，请明天再试`, 'warning')
      }
      return
    }

    setIsProcessing(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedImage)
      formData.append('prompt', prompt)

      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8097'
      const response = await fetch(`${apiUrl}/process-image`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey
        },
        body: formData,
      })

      if (response.ok) {
        // 检查响应类型
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.startsWith('image/')) {
          // 直接返回的是图片文件
          const imageBlob = await response.blob()
          const imageUrl = URL.createObjectURL(imageBlob)
          setResult({ imageUrl, type: 'image' })
          setStep(3) // 进入结果展示步骤
          
          // 成功生成后更新使用次数
          updateDailyUsage(apiKey)
          const remaining = getRemainingUsage(apiKey) - 1 // 减1因为刚刚使用了一次
          
          showToast(`手办效果图生成成功! 今日还可使用${remaining}次`, 'success')
        } else {
          // 如果是JSON响应（兼容旧版本）
          const data = await response.json()
          if (data.success) {
            setResult(data.result)
            setStep(3)
            
            // 成功生成后更新使用次数
            updateDailyUsage(apiKey)
            const remaining = getRemainingUsage(apiKey) - 1
            
            showToast(`手办效果图生成成功! 今日还可使用${remaining}次`, 'success')
          } else {
            showToast(data.error || '处理失败', 'error')
          }
        }
      } else {
        // 处理HTTP错误
        if (response.status === 401) {
          showToast('用户名无效或已过期，请检查用户设置', 'error')
        } else {
          const errorData = await response.json().catch(() => ({}))
          showToast(errorData.detail || `请求失败: ${response.status}`, 'error')
        }
      }
    } catch (err) {
      showToast('请求失败：' + err.message, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetToUpload = () => {
    // 清理生成的图片URL
    if (result && result.imageUrl) {
      URL.revokeObjectURL(result.imageUrl)
    }
    
    setSelectedImage(null)
    setImagePreview(null)
    setResult(null)
    setError('')
    setStep(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const goBackToConfirm = () => {
    setResult(null)
    setError('')
    setStep(2)
  }

  // 保存用户名
  const saveApiKey = (key) => {
    const trimmedKey = key.trim()
    if (trimmedKey) {
      localStorage.setItem('shouban_username', trimmedKey)
      setApiKey(trimmedKey)
      setShowApiSettings(false)
      showToast('用户名设置成功!', 'success')
    }
  }

  // 清除用户名
  const clearApiKey = () => {
    localStorage.removeItem('shouban_username')
    setApiKey('')
    setShowApiSettings(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 初始化加载状态 */}
      {!isInitialized && (
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <span className="text-base text-base-content/70">正在初始化...</span>
          </div>
        </div>
      )}

      {/* 主要内容 - 只在初始化完成后显示 */}
      {isInitialized && (
        <>
          {/* API设置模态框 */}
          {showApiSettings && <ApiSettingsModal onSave={saveApiKey} onClose={() => setShowApiSettings(false)} currentKey={apiKey} />}

          {/* 顶部工具栏 - 更subtle的设计 */}
      <div className="flex justify-between items-start mb-2">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-base-content mb-2">手办生成工具</h1>
          <p className="text-base text-base-content/60">上传照片，AI 帮你生成手办效果图</p>
        </div>
        <div className="flex items-center gap-1 ml-4">
          {!apiKey && (
            <div className="flex items-center gap-1 text-xs text-warning mr-2">
              <span>⚠️</span>
              <span>需要设置用户名</span>
            </div>
          )}
          <button
            className="btn btn-xs btn-ghost btn-circle opacity-50 hover:opacity-100"
            onClick={() => setShowApiSettings(true)}
            title={apiKey ? '管理用户设置' : '设置用户名'}
          >
            ⚙️
          </button>
          {apiKey && (
            <button
              className="btn btn-xs btn-ghost btn-circle opacity-50 hover:opacity-100 text-error"
              onClick={clearApiKey}
              title="清除用户名"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="flex justify-center mb-8">
        <div className="steps steps-horizontal w-full max-w-md">
          <div className={`step step-neutral text-sm ${step >= 1 ? 'step-primary' : ''}`}>
            <span className="hidden sm:inline">上传图片</span>
            <span className="sm:hidden">上传</span>
          </div>
          <div className={`step step-neutral text-sm ${step >= 2 ? 'step-primary' : ''}`}>
            <span className="hidden sm:inline">确认生成</span>
            <span className="sm:hidden">确认</span>
          </div>
          <div className={`step step-neutral text-sm ${step >= 3 ? 'step-primary' : ''}`}>
            <span className="hidden sm:inline">查看结果</span>
            <span className="sm:hidden">结果</span>
          </div>
        </div>
      </div>

      {/* 步骤1: 上传图片 */}
      {step === 1 && (
        <div
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer max-w-2xl mx-auto ${
            isDragging 
              ? 'border-primary bg-primary/10 shadow-xl' 
              : 'border-base-300 hover:border-primary hover:bg-base-100/80 hover:shadow-lg'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-8">
            <div className="text-9xl drop-shadow-lg">📷</div>
            <div className="space-y-3">
              <div className="text-3xl font-semibold text-base-content">上传人物照片</div>
              <div className="text-lg text-base-content/70">
                拖拽照片到此处或点击选择文件
              </div>
              <div className="text-base text-base-content/50">
                支持 JPG、PNG、GIF 等格式，建议图片清晰度较高
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 步骤2: 确认和配置 */}
      {step === 2 && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* 原图预览 */}
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-semibold text-base-content">📸 确认原始照片</h3>
            <div className="relative inline-block">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="原始照片" 
                  className="max-w-full max-h-80 object-contain rounded-xl shadow-lg border border-base-300/30 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
                  onClick={() => setPreviewImage({ src: imagePreview, title: '原始照片' })}
                />
              ) : (
                <div className="w-full max-w-xs mx-auto h-40 bg-base-200 rounded-xl flex items-center justify-center border border-base-300/30">
                  <div className="flex flex-col items-center gap-2">
                    <div className="loading loading-spinner loading-md text-base-content/50"></div>
                    <span className="text-sm text-base-content/50">加载中...</span>
                  </div>
                </div>
              )}
              <button 
                className="absolute -top-3 -right-3 w-8 h-8 bg-base-100 border border-base-300 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:bg-error hover:text-error-content transition-all duration-200"
                onClick={resetToUpload}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-success font-medium">✅ {selectedImage?.name}</div>
              <button 
                className="px-6 py-2 bg-base-200 hover:bg-base-300 rounded-lg transition-colors duration-200 text-sm font-medium"
                onClick={resetToUpload}
              >
                重新选择照片
              </button>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-base-300 to-base-300"></div>
            <div className="text-lg font-semibold text-base-content">⚙️ 生成配置</div>
            <div className="flex-1 h-px bg-gradient-to-r from-base-300 via-base-300 to-transparent"></div>
          </div>
            
          {/* 配置区域 */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-base font-medium text-base-content">
                  手办生成提示词
                </label>
                <button 
                  className="text-sm text-base-content/60 hover:text-primary transition-colors cursor-pointer" 
                  onClick={() => setPrompt(presetPrompts["默认手办"])}
                >
                  恢复默认
                </button>
              </div>
              <textarea
                className="w-full h-32 p-4 border border-base-300 rounded-xl bg-base-50 focus:bg-base-100 focus:border-primary focus:outline-none resize-none transition-all duration-200"
                placeholder="描述你想要的手办效果..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* 预设选项 */}
            {Object.keys(presetPrompts).length > 0 && (
              <div>
                <label className="block text-base font-medium text-base-content mb-3">
                  快速选择预设
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(presetPrompts).map(([name, promptText]) => (
                    <button 
                      key={name}
                      className="px-4 py-2 bg-base-200 hover:bg-primary hover:text-primary-content rounded-lg transition-all duration-200 text-sm font-medium"
                      onClick={() => setPrompt(promptText)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 生成按钮 */}
            <div className="pt-4">
              <button
                className={`relative w-full max-w-md mx-auto block py-4 px-6 font-medium text-base rounded-xl shadow-lg transition-all duration-300 overflow-hidden ${
                  isProcessing 
                    ? 'bg-primary/80 cursor-not-allowed' 
                    : (apiKey && canUseService(apiKey))
                      ? 'bg-gradient-to-r from-primary to-primary-focus hover:from-primary-focus hover:to-primary text-primary-content hover:shadow-xl transform hover:-translate-y-1 active:scale-95' 
                      : 'bg-base-300 text-base-content/50 cursor-not-allowed'
                }`}
                onClick={handleProcess}
                disabled={isProcessing || !selectedImage || !prompt.trim() || !apiKey || !canUseService(apiKey)}
              >
                {/* 背景动画效果 */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-focus to-primary bg-[length:200%_100%] animate-pulse"></div>
                )}
                
                {/* 按钮内容 */}
                <div className="relative flex items-center justify-center gap-3">
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-content/30 border-t-primary-content rounded-full animate-spin"></div>
                      <span className="text-primary-content">正在生成手办...</span>
                      <div className="flex gap-1 ml-2">
                        <div className="w-1 h-1 bg-primary-content/60 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-1 h-1 bg-primary-content/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-1 h-1 bg-primary-content/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🎯</span>
                      <span>生成手办效果</span>
                      {apiKey && (
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </>
                  )}
                </div>
                
                {/* 进度条效果（可选） */}
                {isProcessing && (
                  <div className="absolute bottom-0 left-0 h-1 bg-primary-content/20 w-full">
                    <div className="h-full bg-primary-content/60 animate-pulse w-0" style={{animation: 'progress 3s ease-in-out infinite'}}></div>
                  </div>
                )}
              </button>
              
              {/* 使用次数显示 */}
              {apiKey && (
                <div className="text-center mt-3 p-2 bg-base-200/50 rounded-lg">
                  {userDailyLimit === 0 ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-error">
                      <span>⚠️</span>
                      <span className="font-medium">当前账户暂无使用权限</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-base-content/60">今日已用:</span>
                          <span className={`font-medium ${dailyUsage.count >= dailyUsage.limit ? 'text-error' : 'text-success'}`}>
                            {dailyUsage.count}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-base-content/20"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-base-content/60">剩余:</span>
                          <span className={`font-medium ${dailyUsage.count >= dailyUsage.limit ? 'text-error' : 'text-primary'}`}>
                            {Math.max(0, dailyUsage.limit - dailyUsage.count)}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-base-content/20"></div>
                        <div className="flex items-center gap-2">
                          <span className="text-base-content/60">限额:</span>
                          <span className="font-medium text-base-content">
                            {dailyUsage.limit}
                          </span>
                        </div>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="mt-2">
                        <div className="w-full bg-base-300 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              dailyUsage.count >= dailyUsage.limit ? 'bg-error' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, (dailyUsage.count / dailyUsage.limit) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {!apiKey && (
                <div className="text-center mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning font-medium flex items-center justify-center gap-2">
                    <span>⚠️</span>
                    <span>请先设置用户名才能生成图片</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 步骤3: 结果展示 */}
      {step === 3 && (
        <div className="space-y-8">
          {/* 对比展示 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 原图 */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-base-content mb-2">原始照片</h3>
                <span className="inline-block text-sm text-base-content/60 bg-base-300/50 px-3 py-1 rounded-full">原图</span>
              </div>
              <div className="relative group flex justify-center">
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="原始照片" 
                      className="max-w-full max-h-96 w-auto h-auto rounded-2xl shadow-xl border border-base-300/20 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 object-contain"
                      onClick={() => setPreviewImage({ src: imagePreview, title: '原始照片' })}
                    />
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewImage({ src: imagePreview, title: '原始照片' })}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium pointer-events-none">
                        点击放大查看
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-xs mx-auto h-40 bg-base-200 rounded-2xl flex items-center justify-center border border-base-300/20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="loading loading-spinner loading-md text-base-content/50"></div>
                      <span className="text-sm text-base-content/50">加载中...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 生成结果 */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-base-content mb-2">手办效果</h3>
                <span className="inline-block text-sm text-white bg-primary px-3 py-1 rounded-full">AI 生成</span>
              </div>
              <div className="relative group flex justify-center">
                {result && result.type === 'image' ? (
                  <>
                    <img 
                      src={result.imageUrl} 
                      alt="生成的手办效果图" 
                      className="max-w-full max-h-96 w-auto h-auto rounded-2xl shadow-xl border border-base-300/20 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 object-contain"
                      onClick={() => setPreviewImage({ src: result.imageUrl, title: '手办效果图' })}
                    />
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewImage({ src: result.imageUrl, title: '手办效果图' })}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium pointer-events-none">
                        点击放大查看
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-base-100 rounded-2xl p-8 min-h-80 flex items-center justify-center border border-base-300/20 w-full">
                    <div className="text-center text-base-content/60">
                      <pre className="whitespace-pre-wrap text-sm">
                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent"></div>
            <div className="text-sm text-base-content/40">操作选项</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent"></div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            {result && result.type === 'image' && (
              <a 
                href={result.imageUrl}
                download="手办效果图.png"
                className="btn btn-success btn-lg px-8 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-initial"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载图片
              </a>
            )}
            <button 
              className="btn btn-outline btn-lg px-8 transform hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-initial"
              onClick={goBackToConfirm}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新生成
            </button>
            <button 
              className="btn btn-ghost btn-lg px-8 transform hover:-translate-y-0.5 transition-all duration-200 flex-1 sm:flex-initial"
              onClick={resetToUpload}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              上传新照片
            </button>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <ImageViewer
          src={previewImage.src}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
      </>
      )}
    </div>
  )
}

export default ImageProcessor