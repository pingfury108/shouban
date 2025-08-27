import { useState, useRef, useEffect } from 'react'

const ImageViewer = ({ src, title, onClose }) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  // 重置位置和缩放
  const resetTransform = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // 放大
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  // 缩小
  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1))
  }

  // 适应窗口
  const fitToWindow = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      
      const scaleX = (containerRect.width - 40) / img.naturalWidth
      const scaleY = (containerRect.height - 40) / img.naturalHeight
      const newScale = Math.min(scaleX, scaleY, 1)
      
      setScale(newScale)
      setPosition({ x: 0, y: 0 })
    }
  }

  // 鼠标滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const deltaScale = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.1, Math.min(scale * deltaScale, 5))
    
    // 计算缩放中心点
    const scaleChange = newScale - scale
    const newX = position.x - (mouseX - centerX) * scaleChange / scale
    const newY = position.y - (mouseY - centerY) * scaleChange / scale
    
    setScale(newScale)
    setPosition({ x: newX, y: newY })
  }

  // 鼠标拖拽
  const handleMouseDown = (e) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '=':
        case '+':
          e.preventDefault()
          zoomIn()
          break
        case '-':
          e.preventDefault()
          zoomOut()
          break
        case '0':
          e.preventDefault()
          resetTransform()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          fitToWindow()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, position, scale])

  // 初始化时适应窗口
  useEffect(() => {
    const timer = setTimeout(fitToWindow, 100)
    return () => clearTimeout(timer)
  }, [src])

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-7xl w-[95vw] h-[95vh] p-0 overflow-hidden">
        {/* 工具栏 */}
        <div className="flex justify-between items-center p-4 bg-base-200 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-base-content/60">
              {Math.round(scale * 100)}%
            </div>
            <div className="btn-group">
              <button 
                className="btn btn-sm btn-outline"
                onClick={zoomOut}
                title="缩小 (-)"
              >
                🔍-
              </button>
              <button 
                className="btn btn-sm btn-outline"
                onClick={zoomIn}
                title="放大 (+)"
              >
                🔍+
              </button>
              <button 
                className="btn btn-sm btn-outline"
                onClick={fitToWindow}
                title="适应窗口 (F)"
              >
                📐
              </button>
              <button 
                className="btn btn-sm btn-outline"
                onClick={resetTransform}
                title="原始大小 (0)"
              >
                🔄
              </button>
            </div>
            <a 
              href={src}
              download={`${title}.png`}
              className="btn btn-sm btn-success"
              title="下载图片"
            >
              💾
            </a>
            <button 
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
              title="关闭 (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 图片容器 */}
        <div 
          ref={containerRef}
          className="relative w-full h-[calc(100%-4rem)] bg-black/5 overflow-hidden cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              ref={imageRef}
              src={src} 
              alt={title}
              className="max-w-none transition-transform duration-100 select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              draggable={false}
            />
          </div>

          {/* 操作提示 */}
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs">
            <div>滚轮：缩放</div>
            <div>拖拽：移动</div>
            <div>快捷键：+ - 0 F ESC</div>
          </div>
        </div>
      </div>
      
      {/* 点击背景关闭 */}
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}

export default ImageViewer