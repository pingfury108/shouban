import { useState } from 'react'
import ImageProcessor from './components/ImageProcessor'

function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">手办生成工具</h1>
          <p className="text-lg text-base-content/70">
            上传照片，AI 帮你生成手办效果图
          </p>
        </div>
        <ImageProcessor />
      </div>
    </div>
  )
}

export default App
