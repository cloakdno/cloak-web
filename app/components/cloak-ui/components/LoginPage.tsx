import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  VenetianMask,
  Server,
  Zap,
  Link,
  Layers,
  Rocket,
  LogIn,
  X,
  Send,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { createApiClient, getUserProfile, ApiError } from '@/app/lib/api'

interface LoginPageProps {
  onLogin: (username: string, password: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!password.trim()) {
      toast.error('请输入密码')
      return
    }

    setIsLoading(true)
    try {
      // 通过 BasicAuth 调用 GET /api/user/profile 验证凭证是否有效
      const client = createApiClient(username.trim(), password.trim())
      await getUserProfile(client)
      // 验证通过，将用户名和密码传给父组件持久化
      onLogin(username.trim(), password.trim())
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          toast.error('用户名或密码错误')
        } else if (err.status === 403) {
          toast.error('账户已被禁用或服务已过期')
        } else {
          toast.error(`登录失败：${err.message}`)
        }
      } else {
        toast.error('网络异常，请检查连接后重试')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { icon: <Server size={24} />, title: '高性能服务器', desc: '企业级服务器架构，稳定可靠' },
    { icon: <Zap size={24} />, title: 'Golang 高并发', desc: 'Go 语言开发，支持超高并发网络请求' },
    { icon: <Link size={24} />, title: '短链生成', desc: '一键将长链接转换为短链接' },
    { icon: <Layers size={24} />, title: '批量短链生成', desc: '支持批量转换和文件上传，高效便捷' },
    { icon: <Rocket size={24} />, title: '更多功能', desc: '持续更新中，敬请期待' },
  ]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* 左侧：功能亮点 */}
        <div className="lg:w-1/2 bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 p-8 sm:p-12 flex flex-col justify-center text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <VenetianMask size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Cloak</h1>
          </div>

          <h2 className="text-2xl font-bold mb-2">专业短链生成与管理平台</h2>
          <p className="text-purple-200 mb-8 text-sm">高性能、高并发，为你的链接保驾护航</p>

          <div className="space-y-5">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="p-2 bg-white/10 rounded-lg shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-purple-200 text-xs">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 右侧：登录表单 */}
        <div className="lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">欢迎回来</h2>
            <p className="text-gray-500 text-sm mb-8">登录你的账户以继续使用服务</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-60"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    验证中...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    登录
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotModal(true)}
                disabled={isLoading}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors disabled:opacity-60"
              >
                忘记密码？
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 忘记密码弹窗 */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">忘记密码</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={28} className="text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">请联系客服重置密码</h4>
              <p className="text-gray-500 text-sm mb-6">
                密码无法自助找回，请通过 Telegram 联系客服为你重置密码。
              </p>
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
    </div>
  )
}
