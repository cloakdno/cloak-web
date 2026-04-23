"use client"

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from './components/Header'
import { TabSwitcher } from './components/TabSwitcher'
import { SingleConvert } from './components/SingleConvert'
import { BatchConvert } from './components/BatchConvert'
import { FileConvert } from './components/FileConvert'
import { HistoryTable } from './components/HistoryTable'
import { EditModal } from './components/EditModal'
import { LoginPage } from './components/LoginPage'
import { VisitLogModal } from './components/VisitLogModal'
import { ShortLink, ProxyMode } from './types/index'
import { createShortLink, generateMockVisits } from './utils/shortlink'
import { Send, ArrowRightLeft, Globe } from 'lucide-react'

type Tab = 'single' | 'batch' | 'file'

const STORAGE_KEY = 'cloak-links-history'
const AUTH_KEY = 'cloak-auth-user'

export function App() {
  const [user, setUser] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('single')
  const [proxyMode, setProxyMode] = useState<ProxyMode>('redirect')
  const [links, setLinks] = useState<ShortLink[]>([])
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [visitLogLink, setVisitLogLink] = useState<ShortLink | null>(null)
  const [pendingConvert, setPendingConvert] = useState<(() => void) | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_KEY)
    if (storedUser) {
      setUser(storedUser)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.length > 0) {
          setLinks(parsed)
          return
        }
      } catch (e) {
        console.error('Failed to parse stored links', e)
      }
    }

    const batchId1 = crypto.randomUUID()
    const batchId2 = crypto.randomUUID()
    const fileId1 = crypto.randomUUID()

    const singleUrls = [
      'https://github.com/golang/go',
      'https://www.google.com/search?q=golang+high+concurrency+web+framework',
      'https://docs.stripe.com/api/payment_intents/create?lang=go',
      'https://telegram.org/blog/channels-2-0',
      'https://www.binance.com/zh-CN/trade/BTC_USDT?type=spot',
    ]

    const batchUrls1 = [
      'https://www.cloudflare.com/learning/dns/what-is-dns/',
      'https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status',
      'https://www.notion.so/product/wikis?utm_source=google&utm_campaign=brand',
      'https://vercel.com/docs/deployments/overview',
    ]

    const batchUrls2 = [
      'https://nextjs.org/docs/getting-started',
      'https://vuejs.org/guide/introduction.html',
      'https://svelte.dev/docs/introduction',
    ]

    const fileUrls = [
      'https://www.figma.com/community/file/1234567890/design-system-template',
      'https://tailwindcss.com/docs/installation/using-postcss',
      'https://react.dev/learn/thinking-in-react',
      'https://vitejs.dev/guide/',
      'https://eslint.org/docs/latest/use/getting-started',
    ]

    const batchTime1 = Date.now() - 2 * 24 * 60 * 60 * 1000
    const batchTime2 = Date.now() - 4 * 24 * 60 * 60 * 1000
    const fileTime = Date.now() - 1 * 24 * 60 * 60 * 1000

    const demoLinks: ShortLink[] = [
      ...singleUrls.map((url) => {
        const link = createShortLink(url, 'single')
        link.visits = generateMockVisits(Math.floor(Math.random() * 30) + 3)
        link.createdAt = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        return link
      }),
      ...batchUrls1.map((url) => {
        const link = createShortLink(url, 'batch', batchId1)
        link.visits = generateMockVisits(Math.floor(Math.random() * 20) + 2)
        link.createdAt = batchTime1
        return link
      }),
      ...batchUrls2.map((url) => {
        const link = createShortLink(url, 'batch', batchId2)
        link.visits = generateMockVisits(Math.floor(Math.random() * 15) + 1)
        link.createdAt = batchTime2
        return link
      }),
      ...fileUrls.map((url) => {
        const link = createShortLink(url, 'file', fileId1)
        link.visits = generateMockVisits(Math.floor(Math.random() * 25) + 5)
        link.createdAt = fileTime
        return link
      }),
    ]

    setLinks(demoLinks)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  }, [links])

  const handleLogin = (username: string) => {
    setUser(username)
    localStorage.setItem(AUTH_KEY, username)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }

  const handleSingleConvert = (url: string) => {
    const shortLink = createShortLink(url, 'single', undefined, proxyMode)
    shortLink.status = 'converting'
    setLinks((prev) => [shortLink, ...prev])

    setTimeout(() => {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === shortLink.id
            ? {
                ...l,
                status: 'done' as const,
                visits: generateMockVisits(Math.floor(Math.random() * 20) + 1),
              }
            : l,
        ),
      )
    }, 800)
  }

  const handleBatchConvert = (urls: string[]) => {
    const batchId = crypto.randomUUID()
    const newLinks = urls.map((url) => {
      const link = createShortLink(url, 'batch', batchId, proxyMode)
      link.status = 'converting'
      return link
    })

    setLinks((prev) => [...newLinks, ...prev])

    setTimeout(() => {
      setLinks((prev) =>
        prev.map((l) =>
          l.batchId === batchId && l.status === 'converting'
            ? {
                ...l,
                status: 'done' as const,
                visits: generateMockVisits(Math.floor(Math.random() * 15)),
              }
            : l,
        ),
      )
    }, 1200)
  }

  const handleFileConvert = (urls: string[]) => {
    const batchId = crypto.randomUUID()
    const newLinks = urls.map((url) => {
      const link = createShortLink(url, 'file', batchId, proxyMode)
      link.status = 'converting'
      return link
    })

    setLinks((prev) => [...newLinks, ...prev])

    setTimeout(() => {
      setLinks((prev) =>
        prev.map((l) =>
          l.batchId === batchId && l.status === 'converting'
            ? {
                ...l,
                status: 'done' as const,
                visits: generateMockVisits(Math.floor(Math.random() * 10)),
              }
            : l,
        ),
      )
    }, 1500)
  }

  const handleDeleteGroup = (batchId: string) => {
    setLinks((prev) => prev.filter((link) => link.batchId !== batchId))
  }

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id))
  }

  const handleBulkDelete = (ids: string[]) => {
    setLinks((prev) => prev.filter((link) => !ids.includes(link.id)))
  }

  const handleEdit = (link: ShortLink) => {
    setEditingLink(link)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (id: string, newOriginalUrl: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id
          ? {
              ...link,
              originalUrl: newOriginalUrl,
            }
          : link,
      ),
    )
  }

  const handleToggleProxyMode = (ids: string[], newMode: ProxyMode) => {
    setLinks((prev) =>
      prev.map((link) =>
        ids.includes(link.id)
          ? {
              ...link,
              proxyMode: newMode,
            }
          : link,
      ),
    )
  }

  const handleViewLogs = (link: ShortLink) => {
    setVisitLogLink(link)
  }

  const handleRefresh = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setLinks(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored links', e)
      }
    }
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      <Header username={user} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 sm:pb-16">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 lg:p-10 mb-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-1 sm:mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {proxyMode === 'redirect' ? '短链生成' : '反向代理'}
              </h2>
              <button
                onClick={() => setProxyMode(proxyMode === 'redirect' ? 'proxy' : 'redirect')}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${proxyMode === 'redirect' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
              >
                {proxyMode === 'redirect' ? <ArrowRightLeft size={12} /> : <Globe size={12} />}
                {proxyMode === 'redirect' ? '跳转模式' : '代理模式'}
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {proxyMode === 'redirect'
                ? '将长链接转换为短链接，访问时直接跳转到目标地址。'
                : '将长链接转换为短链接，获取目标内容后返回，隐藏真实地址。'}
            </p>
          </div>

          <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

          <AnimatePresence mode="wait">
            {activeTab === 'single' && (
              <SingleConvert key="single" onConvert={(url) => setPendingConvert(() => () => handleSingleConvert(url))} />
            )}
            {activeTab === 'batch' && (
              <BatchConvert key="batch" onConvert={(urls) => setPendingConvert(() => () => handleBatchConvert(urls))} />
            )}
            {activeTab === 'file' && (
              <FileConvert key="file" onConvert={(urls) => setPendingConvert(() => () => handleFileConvert(urls))} />
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">转换记录</h2>
            <p className="text-purple-200">在此管理你的所有转换链接。</p>
          </div>

          <HistoryTable
            links={links}
            onDelete={handleDelete}
            onDeleteGroup={handleDeleteGroup}
            onBulkDelete={handleBulkDelete}
            onEdit={handleEdit}
            onViewLogs={handleViewLogs}
            onRefresh={handleRefresh}
            onToggleProxyMode={handleToggleProxyMode}
          />
        </div>
      </main>

      <footer className="w-full py-8 mt-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4">
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center backdrop-blur-sm">
            <p className="text-purple-100 text-sm">💼 提供全栈商业化落地服务（Web/App/链上/机器人）。只做能盈利的正经项目，不接业余折腾。</p>
          </div>
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-purple-200 text-sm">© 2026 Cloak. All rights reserved.</p>
            <a
              href="https://t.me/cloak_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              <Send size={16} />
              联系开发者 Telegram
            </a>
          </div>
        </div>
      </footer>

      <EditModal
        link={editingLink}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingLink(null)
        }}
        onSave={handleSaveEdit}
      />

      <VisitLogModal link={visitLogLink!} isOpen={!!visitLogLink} onClose={() => setVisitLogLink(null)} />

      <AnimatePresence>
        {pendingConvert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPendingConvert(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${proxyMode === 'redirect' ? 'bg-purple-100' : 'bg-violet-100'}`}>
                  {proxyMode === 'redirect' ? (
                    <ArrowRightLeft size={20} className="text-purple-600" />
                  ) : (
                    <Globe size={20} className="text-violet-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">确认转换</h3>
                  <p className="text-sm text-gray-500">请确认当前响应模式</p>
                </div>
              </div>
              <div
                className={`rounded-xl p-4 mb-5 ${proxyMode === 'redirect' ? 'bg-purple-50 border border-purple-100' : 'bg-violet-50 border border-violet-100'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {proxyMode === 'redirect' ? (
                    <ArrowRightLeft size={14} className="text-purple-600" />
                  ) : (
                    <Globe size={14} className="text-violet-600" />
                  )}
                  <span className={`text-sm font-semibold ${proxyMode === 'redirect' ? 'text-purple-700' : 'text-violet-700'}`}>
                    {proxyMode === 'redirect' ? '跳转模式' : '代理模式'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {proxyMode === 'redirect'
                    ? '访问短链时将直接 302 跳转到目标地址'
                    : '服务器获取目标内容后返回，隐藏真实地址'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingConvert(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    pendingConvert()
                    setPendingConvert(null)
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-colors ${proxyMode === 'redirect' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                >
                  确认转换
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
