import { useState, useRef, useEffect } from 'react'
import ImageViewer from './ImageViewer'

const ImageProcessor = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
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
    setImagePreview('')
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
        <div className="card bg-base-200 shadow-2xl border border-base-300">
          <div className="card-body">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/10 shadow-lg' 
                  : 'border-base-300 hover:border-primary hover:bg-base-300/50 hover:shadow-md'
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
              
              <div className="space-y-6">
                <div className="text-8xl drop-shadow-md">📷</div>
                <div>
                  <div className="text-2xl font-medium mb-2">上传人物照片</div>
                  <div className="text-base text-base-content/60">
                    拖拽照片到此处或点击选择文件
                  </div>
                  <div className="text-sm text-base-content/50 mt-2">
                    支持 JPG、PNG、GIF 等格式，建议图片清晰度较高
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 步骤2: 确认和配置 */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 原图预览 */}
          <div className="card bg-base-200 shadow-2xl border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">📸 原始照片</h3>
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="原始照片" 
                  className="w-full h-auto max-h-96 object-contain rounded-lg shadow-lg border border-base-300/50 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewImage({ src: imagePreview, title: '原始照片' })}
                />
                <button 
                  className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 shadow-md hover:shadow-lg transition-shadow"
                  onClick={resetToUpload}
                >
                  ✕
                </button>
              </div>
              <div className="mt-4">
                <div className="text-sm text-success mb-2">✅ {selectedImage?.name}</div>
                <button 
                  className="btn btn-outline btn-sm w-full shadow-sm hover:shadow-md transition-shadow"
                  onClick={resetToUpload}
                >
                  重新选择照片
                </button>
              </div>
            </div>
          </div>

          {/* 配置区域 */}
          <div className="card bg-base-200 shadow-2xl border border-base-300">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">⚙️ 生成配置</h3>
              
              {/* 提示词配置 */}
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">手办生成提示词</span>
                    <span className="label-text-alt cursor-pointer hover:text-primary transition-colors" onClick={() => {
                      setPrompt(presetPrompts["默认手办"])
                    }}>恢复默认</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-32 text-sm shadow-sm focus:shadow-md transition-shadow"
                    placeholder="描述你想要的手办效果..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                {/* 预设选项 - 动态生成按钮 */}
                {Object.keys(presetPrompts).length > 0 && (
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">快速选择</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(presetPrompts).map(([name, promptText]) => (
                        <button 
                          key={name}
                          className="btn btn-sm btn-outline shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => setPrompt(promptText)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 生成按钮 */}
              <div className="card-actions justify-end mt-6">
                <button
                  className={`btn btn-primary btn-lg w-full shadow-lg hover:shadow-xl transition-shadow ${isProcessing ? 'loading' : ''}`}
                  onClick={handleProcess}
                  disabled={isProcessing || !selectedImage || !prompt.trim()}
                >
                  {isProcessing ? '正在生成手办...' : '🎯 生成手办效果'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 步骤3: 结果展示 */}
      {step === 3 && (
        <div className="space-y-6">
          {/* 对比展示 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 原图 */}
            <div className="card bg-base-200 shadow-2xl border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">📸 原始照片</h3>
                <img 
                  src={imagePreview} 
                  alt="原始照片" 
                  className="w-full h-auto max-h-96 object-contain rounded-lg shadow-lg border border-base-300/50 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewImage({ src: imagePreview, title: '原始照片' })}
                />
              </div>
            </div>

            {/* 生成结果 */}
            <div className="card bg-base-200 shadow-2xl border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">✨ 手办效果</h3>
                {result && result.type === 'image' ? (
                  <img 
                    src={result.imageUrl} 
                    alt="生成的手办效果图" 
                    className="w-full h-auto max-h-96 object-contain rounded-lg shadow-lg border border-base-300/50 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImage({ src: result.imageUrl, title: '手办效果图' })}
                  />
                ) : (
                  <div className="bg-base-100 rounded-lg p-4 shadow-inner">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm">
                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="card bg-base-200 shadow-2xl border border-base-300">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {result && result.type === 'image' && (
                  <a 
                    href={result.imageUrl}
                    download="手办效果图.png"
                    className="btn btn-success btn-lg flex-1 sm:flex-initial shadow-lg hover:shadow-xl transition-shadow"
                  >
                    💾 下载手办图片
                  </a>
                )}
                <button 
                  className="btn btn-outline btn-lg flex-1 sm:flex-initial shadow-sm hover:shadow-md transition-shadow"
                  onClick={goBackToConfirm}
                >
                  🔄 重新生成
                </button>
                <button 
                  className="btn btn-ghost btn-lg flex-1 sm:flex-initial shadow-sm hover:shadow-md transition-shadow"
                  onClick={resetToUpload}
                >
                  🆕 上传新照片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
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