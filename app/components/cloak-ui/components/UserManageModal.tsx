import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCog, Link as LinkIcon, Calendar, KeyRound } from 'lucide-react'
import { UserProfileResponse } from '@/app/lib/api'

interface UserManageModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  profile: UserProfileResponse | null
  isLoading: boolean
  onChangeUsername: () => void
  onChangePassword: () => void
}

export function UserManageModal({
  isOpen,
  onClose,
  username,
  profile,
  isLoading,
  onChangeUsername,
  onChangePassword,
}: UserManageModalProps) {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  const apiDocsUrl = `${apiBaseUrl}/swagger/index.html#/`

  const createdAtLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : '--'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <UserCog size={20} className="text-purple-600" />
                <h3 className="font-semibold text-gray-800">账户信息</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xl font-bold text-purple-600">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{username}</h4>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      onClick={onChangeUsername}
                      className="text-xs text-purple-600 transition-colors hover:text-purple-700 hover:underline"
                    >
                      修改用户名
                    </button>
                    <span className="text-xs text-gray-300">|</span>
                    <button
                      onClick={onChangePassword}
                      className="text-xs text-purple-600 transition-colors hover:text-purple-700 hover:underline"
                    >
                      修改密码
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <LinkIcon size={16} className="mx-auto mb-1 text-gray-400" />
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? '--' : profile?.total_links ?? 0}
                  </p>
                  <p className="text-[11px] text-gray-500">总链接</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <Calendar size={16} className="mx-auto mb-1 text-gray-400" />
                  <p className="text-lg font-bold text-gray-900">
                    {isLoading ? '--' : profile?.registered_days ?? 0}
                    <span className="text-xs font-normal text-gray-400">天</span>
                  </p>
                  <p className="text-[11px] text-gray-500">已使用</p>
                </div>
              </div>

              <div className="mb-6 divide-y divide-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">注册时间</span>
                  <span className="text-sm font-medium text-gray-900">{createdAtLabel}</span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">API 文档</span>
                </div>
                <a
                  href={apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-purple-600 transition-colors hover:text-purple-700 hover:underline"
                >
                  查看 API 接入文档 →
                </a>
                <p className="mt-1.5 text-[11px] text-gray-400">支持通过 API 批量转换短链接</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
