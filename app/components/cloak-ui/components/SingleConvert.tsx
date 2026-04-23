import React, { useState } from 'react'
import { ArrowRight, Link as LinkIcon } from 'lucide-react'
import { isValidUrl } from '../utils/shortlink'

interface SingleConvertProps {
  onConvert: (url: string, options?: { onConfirm?: () => void }) => void
}

export function SingleConvert({ onConvert }: SingleConvertProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('请输入链接')
      return
    }

    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`
    }

    if (!isValidUrl(finalUrl)) {
      setError('请输入有效的链接')
      return
    }

    setError('')
    onConvert(finalUrl, {
      onConfirm: () => setUrl(''),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="hidden sm:block">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-gray-400">
            <LinkIcon size={20} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError('')
            }}
            placeholder="在此粘贴长链接（例如：https://example.com/very/long/path）"
            className={`w-full pl-12 pr-36 py-4 bg-white border-2 rounded-2xl text-lg focus:outline-none transition-colors ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'}`}
          />
          <button
            type="submit"
            disabled={!url.trim()}
            className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            转换 <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="sm:hidden space-y-3">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <LinkIcon size={18} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError('')
            }}
            placeholder="在此粘贴长链接..."
            className={`w-full pl-10 pr-4 py-3.5 bg-white border-2 rounded-xl text-base focus:outline-none transition-colors ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'}`}
          />
        </div>
        <button
          type="submit"
          disabled={!url.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          转换 <ArrowRight size={18} />
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mt-2 ml-2">{error}</p>}
    </form>
  )
}
