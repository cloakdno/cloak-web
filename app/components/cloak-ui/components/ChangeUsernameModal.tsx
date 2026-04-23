import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PenLine, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ChangeUsernameModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
}

export function ChangeUsernameModal({ isOpen, onClose, username }: ChangeUsernameModalProps) {
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = () => {
    if (!newName.trim()) {
      setError('请输入新用户名')
      return
    }
    if (newName.trim().length < 2) {
      setError('用户名至少 2 个字符')
      return
    }
    if (newName.trim() === username) {
      setError('新用户名与当前用户名相同')
      return
    }
    setError('')
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setNewName('')
      onClose()
    }, 1500)
  }

  const handleClose = () => {
    setNewName('')
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <PenLine size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-800">修改用户名</h3>
              </div>
              <button onClick={handleClose} className="text-gray-400 transition-colors hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <label className="mb-1 block text-sm text-gray-500">当前用户名</label>
                <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">{username}</p>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">新用户名</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    setError('')
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition-all focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="输入新用户名"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-500">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={16} />
                    用户名修改成功
                  </div>
                  <p className="ml-6 mt-1.5 text-xs text-green-600/80">下次登录时请使用新用户名</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={success}
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:bg-purple-300"
                >
                  确认修改
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
