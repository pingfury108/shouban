import { useState } from 'react'
import ImageProcessor from './components/ImageProcessor'

function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        <ImageProcessor />
      </div>
    </div>
  )
}

export default App
