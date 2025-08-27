import { useState, useRef, useEffect } from 'react'

const ImageProcessor = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [prompt, setPrompt] = useState("turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Make the PVC material look clear, and set the scene indoors if possible");
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef(null)

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
        } else {
          // 如果是JSON响应（兼容旧版本）
          const data = await response.json()
          if (data.success) {
            setResult(data.result)
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

  const resetForm = () => {
    // 清理生成的图片URL
    if (result && result.imageUrl) {
      URL.revokeObjectURL(result.imageUrl)
    }
    
    setSelectedImage(null)
    setImagePreview('')
    setPrompt("turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Make the PVC material look clear, and set the scene indoors if possible");
    setResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 图片上传区域 */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">📸 上传照片</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-base-300 hover:border-primary hover:bg-base-300/50'
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
            
            {imagePreview ? (
              <div className="space-y-4">
                <img 
                  src={imagePreview} 
                  alt="预览" 
                  className="max-h-64 mx-auto rounded-lg shadow-md"
                />
                <div className="text-success font-medium">
                  ✅ 照片已选择：{selectedImage?.name}
                </div>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    resetForm()
                  }}
                >
                  重新选择
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl">📷</div>
                <div>
                  <div className="text-lg font-medium">点击上传或拖拽照片到此处</div>
                  <div className="text-sm text-base-content/60 mt-2">
                    上传人物照片，生成手办效果图
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 配置区域 */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="space-y-4">
            {/* 提示词输入 */}
            <div>
              <textarea
                className="textarea textarea-bordered w-full h-24 resize-none"
                placeholder="自定义手办生成效果（可选）"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="text-center">
        <button
          className={`btn btn-primary btn-lg px-8 ${isProcessing ? 'loading' : ''}`}
          onClick={handleProcess}
          disabled={isProcessing || !selectedImage || !prompt.trim()}
        >
          {isProcessing ? '生成中...' : '🎯 生成手办'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* 处理结果 */}
      {result && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">✨ 手办效果</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 原图 */}
              <div>
                <h3 className="font-medium mb-3">原始照片</h3>
                <div className="bg-base-100 rounded-lg p-4">
                  <img 
                    src={imagePreview} 
                    alt="原图" 
                    className="w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              </div>

              {/* 处理结果 */}
              <div>
                <h3 className="font-medium mb-3">手办效果图</h3>
                <div className="bg-base-100 rounded-lg p-4">
                  {result && result.type === 'image' ? (
                    <img 
                      src={result.imageUrl} 
                      alt="生成的手办效果图" 
                      className="w-full h-auto rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm">
                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 重新处理按钮 */}
            <div className="card-actions justify-center mt-6 gap-4">
              {result && result.type === 'image' && (
                <a 
                  href={result.imageUrl}
                  download="手办效果图.png"
                  className="btn btn-success"
                >
                  💾 下载图片
                </a>
              )}
              <button 
                className="btn btn-outline"
                onClick={resetForm}
              >
                生成新的手办
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageProcessor