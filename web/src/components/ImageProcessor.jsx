import { useState, useRef, useEffect } from 'react'
import ImageViewer from './ImageViewer'

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
  
  const fileInputRef = useRef(null)

  // 预设提示词配置 - 在这里添加新的预设即可自动生成按钮
  const presetPrompts = {
    "默认手办": "turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Make the PVC material look clear, and set the scene indoors if possible"
    // 在此添加更多预设，格式：
    // "名称": "提示词内容",
  }

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
      setError('请选择有效的图片文件')
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
      setError('请先选择图片')
      return
    }
    
    if (!prompt.trim()) {
      setError('请输入处理提示词')
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
        } else {
          // 如果是JSON响应（兼容旧版本）
          const data = await response.json()
          if (data.success) {
            setResult(data.result)
            setStep(3)
          } else {
            setError(data.error || '处理失败')
          }
        }
      } else {
        // 处理HTTP错误
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.detail || `请求失败: ${response.status}`)
      }
    } catch (err) {
      setError('请求失败：' + err.message)
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
                <div className="w-full h-80 bg-base-200 rounded-xl flex items-center justify-center border border-base-300/30">
                  <span className="text-base-content/50">加载中...</span>
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
                className={`w-full max-w-md mx-auto block py-3 px-6 bg-primary hover:bg-primary-focus text-primary-content font-medium text-base rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 ${isProcessing ? 'loading' : ''}`}
                onClick={handleProcess}
                disabled={isProcessing || !selectedImage || !prompt.trim()}
              >
                {isProcessing ? '正在生成手办...' : '🎯 生成手办效果'}
              </button>
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
                  <div className="w-full max-w-md h-96 bg-base-200 rounded-2xl flex items-center justify-center border border-base-300/20">
                    <span className="text-base-content/50">加载中...</span>
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

      {/* 错误提示 */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-error">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <ImageViewer
          src={previewImage.src}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}

export default ImageProcessor