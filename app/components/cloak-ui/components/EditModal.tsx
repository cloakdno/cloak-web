import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ShortLink } from '../types'
import { isValidUrl } from '../utils/shortlink'

interface EditModalProps {
  link: ShortLink | null
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, newOriginalUrl: string) => void
}

export function EditModal({ link, isOpen, onClose, onSave }: EditModalProps) {
  const [originalUrl, setOriginalUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (link) {
      setOriginalUrl(link.originalUrl)
      setError('')
    }
  }, [link])

  if (!isOpen || !link) return null

  const handleSave = () => {
    if (!originalUrl.trim()) {
      setError('原始链接不能为空')
      return
    }

    let finalUrl = originalUrl.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`
    }

    if (!isValidUrl(finalUrl)) {
      setError('请输入有效的链接')
      return
    }

    onSave(link.id, finalUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">编辑原始链接</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              短链接（不可修改）
            </label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-purple-600 font-medium border border-gray-100">
              {link.shortUrl}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原始链接
            </label>
            <input
              type="text"
              value={originalUrl}
              onChange={(e) => {
                setOriginalUrl(e.target.value)
                if (error) setError('')
              }}
              placeholder="请输入原始链接"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 text-sm font-medium"
            >
              保存修改
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
