import React, { useState } from 'react'
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { extractHttpUrls, isValidUrl } from '../utils/shortlink'
import { FormatTip } from './FormatTip'

interface BatchConvertProps {
  onConvert: (sourceText: string) => void
}

export function BatchConvert({ onConvert }: BatchConvertProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const extractedUrls = extractHttpUrls(text)
  const urlCount = extractedUrls.length
  const isOverLimit = urlCount > 10000

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('请至少输入一段包含链接的内容')
      return
    }

    if (urlCount === 0) {
      setError('未识别到有效链接，请确认链接包含 http:// 或 https:// 前缀')
      return
    }

    if (isOverLimit) {
      setError('每次批量转换最多 10000 条链接')
      return
    }

    const invalidUrls = extractedUrls.filter((url) => !isValidUrl(url))

    if (invalidUrls.length > 0) {
      setError(`识别到 ${invalidUrls.length} 条格式异常链接，请检查后重试`)
      return
    }

    setError('')
    // 提交用户的完整输入文本，链接提取由后端统一处理。
    onConvert(text)
    setText('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="w-full">
      <FormatTip />
      <div
        className={`rounded-2xl border-2 bg-white overflow-hidden transition-colors ${error || isOverLimit ? 'border-red-300' : isFocused ? 'border-purple-500' : 'border-gray-200'}`}
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) setError('')
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="在此粘贴内容，系统会自动提取其中的 http/https 链接..."
          className="w-full h-64 sm:h-80 p-4 bg-transparent text-base resize-none focus:outline-none font-mono border-none"
        />
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className={`text-sm font-medium px-3 py-1 rounded-lg ${isOverLimit ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
            已识别 {urlCount} / 10000
          </div>
          <button
            onClick={handleSubmit}
            disabled={urlCount === 0 || isOverLimit}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            批量转换 <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm mt-3">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm mt-3 bg-green-50 px-4 py-3 rounded-xl">
          <CheckCircle2 size={16} />
          <span>批量转换已提交，请在下方「转换记录」中查看结果</span>
        </div>
      )}
    </div>
  )
}
