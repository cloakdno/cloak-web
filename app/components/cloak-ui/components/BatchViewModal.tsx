import React, { useState } from 'react'
import { X, Copy, CheckCircle2, Download, Layers } from 'lucide-react'
import { ConversionGroup } from '../types'
import { BatchTextDetailResponse } from '@/app/lib/api'

interface BatchViewModalProps {
  group: ConversionGroup | null
  detail: BatchTextDetailResponse | null
  isLoading: boolean
  errorMessage: string | null
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}

export function BatchViewModal({
  group,
  detail,
  isLoading,
  errorMessage,
  isOpen,
  onClose,
  onDownload,
}: BatchViewModalProps) {
  const [copiedAll, setCopiedAll] = useState(false)
  if (!isOpen || !group) return null

  const recognizedCount =
    detail?.recognized_link_count ??
    group.links.find((link) => typeof link.recognizedLinkCount === 'number')
      ?.recognizedLinkCount ??
    group.links.length

  const textContent =
    detail?.converted_text ||
    group.links[0]?.convertedText ||
    group.links.map((l) => `${l.originalUrl} -> ${l.shortUrl}`).join('\n')

  const maxDisplayLines = 20
  const allLines = textContent.split(/\r?\n/)
  const displayTextContent =
    allLines.length > maxDisplayLines
      ? `${allLines.slice(0, maxDisplayLines).join('\n')}\n...`
      : textContent

  const handleCopyAll = () => {
    navigator.clipboard.writeText(textContent)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-orange-500" />
            <h3 className="font-semibold text-gray-800">批量转换详情</h3>
            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full font-medium">
              {recognizedCount} 条链接
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
              if (window.confirm('确定要下载转换结果文件吗？')) onDownload()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            下载 .txt
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="min-h-[300px] flex items-center justify-center text-sm text-gray-500">
              正在加载批量转换详情...
            </div>
          ) : errorMessage ? (
            <div className="min-h-[300px] flex items-center justify-center text-sm text-red-500 text-center px-6">
              {errorMessage}
            </div>
          ) : (
            <textarea
              readOnly
              value={displayTextContent}
              className="w-full h-full min-h-[300px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 resize-none focus:outline-none"
            />
          )}
        </div>
      </div>
    </div>
  )
}
