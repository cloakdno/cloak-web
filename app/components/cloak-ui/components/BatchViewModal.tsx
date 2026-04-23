import React, { useState } from 'react'
import { X, Copy, CheckCircle2, Download, Layers } from 'lucide-react'
import { ConversionGroup } from '../types'

interface BatchViewModalProps {
  group: ConversionGroup | null
  isOpen: boolean
  onClose: () => void
}

export function BatchViewModal({
  group,
  isOpen,
  onClose,
}: BatchViewModalProps) {
  const [copiedAll, setCopiedAll] = useState(false)
  if (!isOpen || !group) return null

  const textContent = group.links
    .map((l) => `${l.originalUrl} -> ${l.shortUrl}`)
    .join('\n')

  const handleCopyAll = () => {
    navigator.clipboard.writeText(textContent)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([textContent], {
      type: 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cloak-batch-${group.batchId.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-orange-500" />
            <h3 className="font-semibold text-gray-800">批量转换详情</h3>
            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full font-medium">
              {group.links.length} 条链接
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copiedAll ? (
              <CheckCircle2 size={14} className="text-green-500" />
            ) : (
              <Copy size={14} />
            )}
            {copiedAll ? '已复制' : '复制全部'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('确定要下载转换结果文件吗？')) handleDownload()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            下载 .txt
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <textarea
            readOnly
            value={textContent}
            className="w-full h-full min-h-[300px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 resize-none focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
