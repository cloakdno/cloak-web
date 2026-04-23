import React from 'react'
import { X } from 'lucide-react'
import { ShortLink } from '../types/index'
import { formatDate } from '../utils/shortlink'

interface VisitLogModalProps {
  link: ShortLink
  isOpen: boolean
  onClose: () => void
}

export function VisitLogModal({ link, isOpen, onClose }: VisitLogModalProps) {
  if (!isOpen || !link) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">访问日志</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-2">
          {link.visits.length === 0 ? (
            <p className="text-sm text-gray-500">暂无访问记录</p>
          ) : (
            link.visits.map((visit) => (
              <div key={visit.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-700">
                <p>{formatDate(visit.timestamp)} · {visit.country} · {visit.ip}</p>
                <p className="text-xs text-gray-500 mt-1">{visit.device} / {visit.browser} / {visit.referrer}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
