import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, X, ArrowRight, AlertCircle } from 'lucide-react'
import { extractHttpUrls, isValidUrl } from '../utils/shortlink'
import { FormatTip } from './FormatTip'

interface FileConvertProps {
  onConvert: (file: File, urls: string[]) => void
}

export function FileConvert({ onConvert }: FileConvertProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.txt')) {
      setError('仅支持 .txt 文件')
      setFile(null)
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('文件大小不能超过 10MB')
      setFile(null)
      return
    }
    setError('')
    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const clearFile = () => {
    setFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConvert = () => {
    if (!file) return
    setIsProcessing(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) {
        setError('文件为空或无法读取')
        setIsProcessing(false)
        return
      }

      const extractedUrls = extractHttpUrls(content)
      if (extractedUrls.length === 0) {
        setError('文件中未识别到有效链接，请确认链接包含 http:// 或 https:// 前缀')
        setIsProcessing(false)
        return
      }

      const validUrls: string[] = []
      extractedUrls.forEach((url) => {
        if (isValidUrl(url)) {
          validUrls.push(url)
        } else {
          return
        }
      })

      if (validUrls.length === 0) {
        setError('文件中未找到有效链接')
        setIsProcessing(false)
        return
      }

      onConvert(file, validUrls)
      setIsProcessing(false)
      clearFile()
    }

    reader.onerror = () => {
      setError('读取文件出错')
      setIsProcessing(false)
    }

    reader.readAsText(file)
  }

  return (
    <div className="w-full">
      <FormatTip />
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-purple-500 bg-purple-50' : error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-purple-300'}`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />
          <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-400 shadow-sm'}`}>
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">点击或拖拽 .txt 文件到此处</h3>
          <p className="text-gray-500 text-sm">每行一个链接，文件最大 10MB</p>
        </div>
      ) : (
        <div className="w-full h-64 border-2 border-purple-200 bg-purple-50 rounded-2xl flex flex-col items-center justify-center relative">
          <button
            onClick={clearFile}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-4 rounded-full bg-white text-purple-600 shadow-sm mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{file.name}</h3>
          <p className="text-gray-500 text-sm mb-6">{(file.size / 1024).toFixed(2)} KB</p>

          <button
            onClick={handleConvert}
            disabled={isProcessing}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            {isProcessing ? '处理中...' : '转换文件'} <ArrowRight size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm mt-4 justify-center">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
