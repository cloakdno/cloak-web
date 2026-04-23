import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, KeyRound, Eye, EyeOff, Send, CheckCircle2, AlertCircle } from 'lucide-react'

interface ChangePasswordModalProps {
  onClose: () => void
  onSubmit: (payload: { oldPassword: string; newPassword: string }) => Promise<void>
  isSubmitting: boolean
  submitError: string
}

export function ChangePasswordModal({
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isPasswordLengthValid = newPassword.length >= 6 && newPassword.length <= 18

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!oldPassword.trim()) {
      setError('请输入当前密码')
      return
    }
    if (!newPassword.trim()) {
      setError('请输入新密码')
      return
    }
    if (!isPasswordLengthValid) {
      setError('新密码长度需为 6-18 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    if (oldPassword === newPassword) {
      setError('新密码不能与当前密码相同')
      return
    }
    try {
      await onSubmit({ oldPassword, newPassword })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch {
      // 错误由父组件统一处理并透传展示
    }
  }

  const handleClose = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
    onClose()
  }

  return (
    <AnimatePresence>
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
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <KeyRound size={20} className="text-purple-600" />
              <h3 className="font-semibold text-gray-800">修改密码</h3>
            </div>
            <button onClick={handleClose} className="text-gray-400 transition-colors hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {success ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">密码修改成功</h4>
              <p className="text-gray-500 text-sm">你的密码已成功更新，窗口即将关闭。</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* 当前密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">当前密码</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value)
                      if (error) setError('')
                    }}
                    disabled={isSubmitting || success}
                    placeholder="请输入当前密码"
                    className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 新密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (error) setError('')
                    }}
                    disabled={isSubmitting || success}
                    placeholder="请输入新密码"
                    className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* 密码长度要求 */}
                {newPassword.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${isPasswordLengthValid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                      <CheckCircle2 size={10} />
                    </div>
                    <span className={`text-xs ${isPasswordLengthValid ? 'text-green-600' : 'text-gray-400'}`}>
                      长度需为 6-18 位
                    </span>
                  </div>
                )}
              </div>

              {/* 确认新密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">确认新密码</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (error) setError('')
                    }}
                    disabled={isSubmitting || success}
                    placeholder="请再次输入新密码"
                    className={`w-full px-4 py-2.5 pr-11 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:bg-white transition-colors ${
                      confirmPassword.length > 0 && confirmPassword !== newPassword
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-purple-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <p className="text-red-500 text-xs mt-1">两次输入的密码不一致</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-500">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {!error && submitError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-500">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || success}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? '提交中...' : '确认修改'}
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center mb-2">遇到问题？联系客服协助修改</p>
                <a
                  href="https://t.me/nuoyea"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
                >
                  <Send size={14} />
                  联系 Telegram 客服
                </a>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
