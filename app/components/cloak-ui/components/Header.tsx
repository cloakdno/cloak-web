import React, { useEffect, useRef, useState } from 'react'
import {
  VenetianMask,
  Clock,
  X,
  Send,
  Sparkles,
  LogOut,
  UserCog,
  KeyRound,
  PenLine,
} from 'lucide-react'
import { ChangePasswordModal } from './ChangePasswordModal'
import { UserManageModal } from './UserManageModal'
import { ChangeUsernameModal } from './ChangeUsernameModal'
import { SystemExpiryResponse, UserProfileResponse } from '@/app/lib/api'

interface HeaderProps {
  username: string
  profile: UserProfileResponse | null
  expiryInfo: SystemExpiryResponse | null
  isExpiryLoading: boolean
  isProfileLoading: boolean
  onChangeUsername: (newUsername: string) => Promise<void>
  onChangePassword: (payload: { oldPassword: string; newPassword: string }) => Promise<void>
  usernameError: string
  passwordError: string
  isUpdatingUsername: boolean
  isUpdatingPassword: boolean
  onLogout: () => void
}

export function Header({
  username,
  profile,
  expiryInfo,
  isExpiryLoading,
  isProfileLoading,
  onChangeUsername,
  onChangePassword,
  usernameError,
  passwordError,
  isUpdatingUsername,
  isUpdatingPassword,
  onLogout,
}: HeaderProps) {
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatExpiryDate = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value.split('T')[0] || value
    }

    return parsed.toLocaleDateString('zh-CN')
  }

  const expiryLabel = (() => {
    if (isExpiryLoading) return '到期时间：加载中...'
    if (!expiryInfo) return '到期时间：--'
    if (expiryInfo.never_expires) return '到期时间：永不过期'
    if (expiryInfo.is_expired) return '到期时间：已过期'
    return `到期时间：${formatExpiryDate(expiryInfo.expiry_time_formatted || '--')}`
  })()

  const compactExpiryLabel = expiryLabel.replace('到期时间：', '到期：')

  return (
    <>
      <header className="w-full py-4 px-4 sm:py-6 sm:px-8 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white/20 p-1.5 sm:p-2 rounded-xl backdrop-blur-sm">
            <VenetianMask size={22} className="text-white sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Cloak</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <Clock size={14} className="text-purple-200" />
            <span className="text-purple-100">{expiryLabel}</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-purple-700 hover:bg-purple-50 px-3 py-1.5 sm:px-4 rounded-lg font-semibold transition-colors text-xs sm:text-sm whitespace-nowrap"
          >
            开通 / 续费
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center hover:bg-purple-300 transition-colors cursor-pointer"
            >
              <span className="text-sm font-bold text-white">{username.charAt(0).toUpperCase()}</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{username}</p>
                  <p className="text-xs text-gray-500">已登录</p>
                </div>
                <div className="sm:hidden px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{compactExpiryLabel}</span>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowUserModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserCog size={16} className="text-gray-400" />
                    用户管理
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowUsernameModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <PenLine size={16} className="text-gray-400" />
                    修改用户名
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      setShowPasswordModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <KeyRound size={16} className="text-gray-400" />
                    修改密码
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      onLogout()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-600" />
                <h3 className="font-semibold text-gray-800">开通 / 续费服务</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div>
                    <p className="font-semibold text-gray-800">新用户开通</p>
                    <p className="text-sm text-gray-500">首次开通服务</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">150U</p>
                    <p className="text-xs text-gray-500">/ 1年</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                  <div>
                    <p className="font-semibold text-gray-800">老用户续费</p>
                    <p className="text-sm text-gray-500">到期后续费</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">100U</p>
                    <p className="text-xs text-gray-500">/ 1年</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div>
                    <p className="font-semibold text-gray-800">代注册域名</p>
                    <p className="text-sm text-gray-500">需要我们注册域名</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">20U</p>
                    <p className="text-xs text-gray-500">/ 1年</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-400 mb-6">🚀 功能持续更新中，敬请期待更多新功能</p>

              <a
                href="https://t.me/nuoyea"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                <Send size={18} />
                联系 Telegram 客服
              </a>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSubmit={onChangePassword}
          isSubmitting={isUpdatingPassword}
          submitError={passwordError}
        />
      )}

      <UserManageModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        username={username}
        profile={profile}
        isLoading={isProfileLoading}
        onChangeUsername={() => {
          setShowUserModal(false)
          setShowUsernameModal(true)
        }}
        onChangePassword={() => {
          setShowUserModal(false)
          setShowPasswordModal(true)
        }}
      />

      <ChangeUsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        username={username}
        onSubmit={onChangeUsername}
        isSubmitting={isUpdatingUsername}
        submitError={usernameError}
      />
    </>
  )
}
