"use client"

import React, { useEffect, useRef, useState } from 'react'
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
import { ShortLink, ProxyMode, ConversionGroup } from './types/index'
import { createShortLink, extractHttpUrls, generateMockVisits } from './utils/shortlink'
import { 
  createApiClient, 
  ApiClient, 
  ApiError,
  convertSingleLink,
  getUserProfile,
  getSystemExpiry,
  submitBatchTextConvert,
  getBatchTextDetail,
  submitDocumentFileConvert,
  listConversions,
  searchConversions,
  deleteLink,
  deleteBatchText,
  deleteDocumentFile,
  updateUsername,
  updatePassword,
  updateLinkOriginalUrl,
  updateLinkResponseMode,
  updateBatchTextResponseMode,
  updateDocumentFileResponseMode,
  BatchTextDetailResponse,
  SystemExpiryResponse,
  UserProfileResponse,
  downloadDocumentFile,
  mapSingleLinkConvertResponse,
  mapConversionRecordToShortLink,
} from '@/app/lib/api'
import { Send, ArrowRightLeft, Globe } from 'lucide-react'

type Tab = 'single' | 'batch' | 'file'

const STORAGE_KEY = 'cloak-links-history'
/** localStorage key，值为 JSON 序列化的 { username: string; password: string } */
const AUTH_KEY = 'cloak-auth-user'
const BATCH_POLL_INTERVAL_MS = 3000
const BATCH_POLL_MAX_ATTEMPTS = 40

export function App() {
  const [user, setUser] = useState<string | null>(null)
  const [authPassword, setAuthPassword] = useState<string | null>(null)
  /** 已认证的 API 客户端，登录后创建，登出时清除 */
  const [apiClient, setApiClient] = useState<ApiClient | null>(null)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [expiryInfo, setExpiryInfo] = useState<SystemExpiryResponse | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isExpiryLoading, setIsExpiryLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('single')
  const [proxyMode, setProxyMode] = useState<ProxyMode>('redirect')
  const [links, setLinks] = useState<ShortLink[]>([])
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [visitLogLink, setVisitLogLink] = useState<ShortLink | null>(null)
  const [pendingConvert, setPendingConvert] = useState<(() => void) | null>(null)
  const batchPollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const batchPollingAttemptsRef = useRef(0)

  const stopBatchPolling = () => {
    if (batchPollingTimerRef.current) {
      clearInterval(batchPollingTimerRef.current)
      batchPollingTimerRef.current = null
    }
    batchPollingAttemptsRef.current = 0
  }

  const startBatchPolling = (client: ApiClient) => {
    stopBatchPolling()

    batchPollingTimerRef.current = setInterval(async () => {
      try {
        batchPollingAttemptsRef.current += 1

        const response = await listConversions(client, { page: 1, size: 100 })
        const mappedLinks = response.items.map(mapConversionRecordToShortLink)
        setLinks(mappedLinks)

        const hasProcessing = mappedLinks.some((link) => link.status === 'converting')
        const reachMaxAttempts =
          batchPollingAttemptsRef.current >= BATCH_POLL_MAX_ATTEMPTS

        if (!hasProcessing || reachMaxAttempts) {
          stopBatchPolling()
        }
      } catch (err) {
        console.error('Batch polling failed:', err)
        stopBatchPolling()
      }
    }, BATCH_POLL_INTERVAL_MS)
  }

  useEffect(() => {
    return () => {
      stopBatchPolling()
    }
  }, [])

  useEffect(() => {
    // 从 localStorage 恢复登录凭证（JSON 格式：{ username, password }）
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      if (raw) {
        const { username: u, password: p } = JSON.parse(raw) as { username: string; password: string }
        if (u && p) {
          queueMicrotask(() => {
            setUser(u)
            setAuthPassword(p)
            setApiClient(createApiClient(u, p))
          })
        }
      }
    } catch {
      // 旧格式或损坏数据，忽略并清除
      localStorage.removeItem(AUTH_KEY)
    }
  }, [])

  useEffect(() => {
    // 仅在未登录（无 apiClient）时加载演示数据，已登录用户的历史由服务端加载
    if (apiClient) return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [apiClient])

  useEffect(() => {
    if (!apiClient) return

    const loadProfile = async () => {
      setIsProfileLoading(true)
      try {
        const profileResponse = await getUserProfile(apiClient)
        setProfile(profileResponse)
        setUser(profileResponse.username)
      } catch (err) {
        console.error('Failed to load user profile:', err)
        setProfile(null)
      } finally {
        setIsProfileLoading(false)
      }
    }

    void loadProfile()
  }, [apiClient])

  useEffect(() => {
    if (!apiClient) return

    const loadExpiry = async () => {
      setIsExpiryLoading(true)
      try {
        const expiryResponse = await getSystemExpiry(apiClient)
        setExpiryInfo(expiryResponse)
      } catch (err) {
        console.error('Failed to load expiry info:', err)
        setExpiryInfo(null)
      } finally {
        setIsExpiryLoading(false)
      }
    }

    void loadExpiry()
  }, [apiClient])

  useEffect(() => {
    if (!successMessage) return

    const timer = window.setTimeout(() => {
      setSuccessMessage('')
    }, 2500)

    return () => window.clearTimeout(timer)
  }, [successMessage])

  // 当登录成功（apiClient 存在）时，从服务端加载历史记录
  useEffect(() => {
    if (!apiClient) return

    // 异步加载服务端历史
    const loadHistoryFromServer = async () => {
      try {
        const response = await listConversions(apiClient, { page: 1, size: 100 })
        const mappedLinks = response.items.map(mapConversionRecordToShortLink)
        setLinks(mappedLinks)
      } catch (err) {
        console.error('Failed to load history from server:', err)
        // 加载失败时保留当前列表或显示空列表
        setLinks([])
      }
    }

    loadHistoryFromServer()
  }, [apiClient])

  useEffect(() => {
    // 登录态历史由服务端驱动，避免把“搜索结果子集”持久化到本地缓存。
    if (apiClient) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  }, [apiClient, links])

  const handleLogin = (username: string, pw: string) => {
    setUser(username)
    setAuthPassword(pw)
    setApiClient(createApiClient(username, pw))
    // 将用户名和密码序列化为 JSON 持久化，供下次刷新恢复 session
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username, password: pw }))
  }

  const handleLogout = () => {
    stopBatchPolling()
    setUser(null)
    setAuthPassword(null)
    setApiClient(null)
    setProfile(null)
    setExpiryInfo(null)
    localStorage.removeItem(AUTH_KEY)
  }

  const handleChangeUsername = async (newUsername: string) => {
    if (!apiClient || !authPassword) {
      throw new Error('API client not initialized')
    }

    setUsernameError('')
    setIsUpdatingUsername(true)
    try {
      const response = await updateUsername(apiClient, { username: newUsername })
      const nextUsername = response.profile.username
      setUser(nextUsername)
      setProfile(response.profile)

      const nextClient = createApiClient(nextUsername, authPassword)
      setApiClient(nextClient)
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ username: nextUsername, password: authPassword }),
      )
      setSuccessMessage('用户名修改成功')
    } catch (err) {
      console.error('Failed to update username:', err)
      const message =
        err instanceof ApiError ? `${err.message} (${err.code})` : '修改用户名失败'
      setUsernameError(message)
      throw err
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const handleChangePassword = async (payload: {
    oldPassword: string
    newPassword: string
  }) => {
    if (!apiClient || !user) {
      throw new Error('API client not initialized')
    }

    setPasswordError('')
    setIsUpdatingPassword(true)
    try {
      await updatePassword(apiClient, {
        old_password: payload.oldPassword,
        new_password: payload.newPassword,
      })

      setAuthPassword(payload.newPassword)
      const nextClient = createApiClient(user, payload.newPassword)
      setApiClient(nextClient)
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ username: user, password: payload.newPassword }),
      )
      setSuccessMessage('密码修改成功')
    } catch (err) {
      console.error('Failed to update password:', err)
      const message =
        err instanceof ApiError ? `${err.message} (${err.code})` : '修改密码失败'
      setPasswordError(message)
      throw err
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleSingleConvert = async (url: string) => {
    // 若未登录或无 API 客户端，不处理
    if (!apiClient) {
      console.error('API client not initialized')
      return
    }

    // 生成临时短链对象，用于展示"转换中"状态
    const tempLink = createShortLink(url, 'single', undefined, proxyMode)
    tempLink.status = 'converting'
    const tempId = tempLink.id
    setLinks((prev) => [tempLink, ...prev])

    try {
      // 调用真实 API
      const apiResponse = await convertSingleLink(apiClient, {
        url,
        response_mode: proxyMode,
      })

      // 将 API 响应映射为 UI ShortLink
      const realLink = mapSingleLinkConvertResponse(
        apiResponse,
        crypto.randomUUID(), // 为单链接分配独立的 batchId
        'single'
      )
      realLink.id = tempId // 保持临时 ID 以便更新

      // 更新为真实数据，标记为完成
      setLinks((prev) =>
        prev.map((l) =>
          l.id === tempId
            ? { ...realLink, status: 'done' as const }
            : l
        )
      )
    } catch (err) {
      // 转换失败时从列表移除临时项
      setLinks((prev) => prev.filter((l) => l.id !== tempId))

      // 提示错误信息
      let errorMsg = '转换失败，请重试'
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          errorMsg = '认证过期，请重新登录'
        } else {
          errorMsg = `${err.message} (${err.code})`
        }
      }
      // 使用 window.alert 提示（后续可改为 Toast 组件）
      window.alert(errorMsg)
      console.error('Single link conversion failed:', err)
    }
  }

  const handleBatchConvert = async (sourceText: string) => {
    if (!apiClient) {
      console.error('API client not initialized')
      return
    }

    const urls = extractHttpUrls(sourceText)
    const batchId = crypto.randomUUID()
    const newLinks = urls.map((url) => {
      const link = createShortLink(url, 'batch', batchId, proxyMode)
      link.status = 'converting'
      return link
    })

    setLinks((prev) => [...newLinks, ...prev])

    try {
      // 批量文本转换接口要求 source_text，需提交用户完整输入内容。
      const apiResponse = await submitBatchTextConvert(apiClient, {
        source_text: sourceText,
        response_mode: proxyMode,
      })

      // 提交成功后以服务端历史为准刷新列表，避免继续依赖旧接口的逐条返回结构。
      const refreshed = await listConversions(apiClient, { page: 1, size: 100 })
      const mappedLinks = refreshed.items.map(mapConversionRecordToShortLink)
      setLinks(mappedLinks)

      // 自动轮询任务状态，直到 processing 全部结束或达到最大轮询次数。
      if (mappedLinks.some((link) => link.status === 'converting')) {
        startBatchPolling(apiClient)
      }

      window.alert(
        `批量任务已提交：识别 ${apiResponse.recognized_link_count} 条链接，生成 ${apiResponse.conversion_record_count} 条记录。`,
      )
    } catch (err) {
      // 批量接口整体失败时，回滚本次临时占位项。
      setLinks((prev) => prev.filter((link) => link.batchId !== batchId))

      let errorMsg = '批量转换失败，请重试'
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          errorMsg = '认证过期，请重新登录'
        } else {
          errorMsg = `${err.message} (${err.code})`
        }
      }
      window.alert(errorMsg)
      console.error('Batch convert failed:', err)
    }
  }

  const handleFileConvert = async (file: File, urls: string[]) => {
    if (!apiClient) {
      console.error('API client not initialized')
      return
    }

    const batchId = crypto.randomUUID()
    const newLinks = urls.map((url) => {
      const link = createShortLink(url, 'file', batchId, proxyMode)
      link.status = 'converting'
      return link
    })

    setLinks((prev) => [...newLinks, ...prev])

    try {
      await submitDocumentFileConvert(apiClient, file, proxyMode)

      const refreshed = await listConversions(apiClient, { page: 1, size: 100 })
      const mappedLinks = refreshed.items.map(mapConversionRecordToShortLink)
      setLinks(mappedLinks)

      if (mappedLinks.some((link) => link.status === 'converting')) {
        startBatchPolling(apiClient)
      }

      window.alert(`文件任务已提交：本地预检识别 ${urls.length} 条链接，最终结果以后端任务为准。`)
    } catch (err) {
      setLinks((prev) => prev.filter((link) => link.batchId !== batchId))

      let errorMsg = '文件转换失败，请重试'
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          errorMsg = '认证过期，请重新登录'
        } else {
          errorMsg = `${err.message} (${err.code})`
        }
      }
      window.alert(errorMsg)
      console.error('Document file convert failed:', err)
    }
  }

  const handleDeleteGroup = async (batchId: string) => {
    const groupLinks = links.filter((link) => link.batchId === batchId)
    const taskLink = groupLinks.find(
      (link) => link.source !== 'single' && typeof link.taskId === 'number',
    )

    if (!apiClient || !taskLink || typeof taskLink.taskId !== 'number') {
      setLinks((prev) => prev.filter((link) => link.batchId !== batchId))
      return
    }

    try {
      if (taskLink.source === 'batch') {
        await deleteBatchText(apiClient, taskLink.taskId)
      } else if (taskLink.source === 'file') {
        await deleteDocumentFile(apiClient, taskLink.taskId)
      }

      setLinks((prev) => prev.filter((link) => link.batchId !== batchId))
    } catch (err) {
      console.error('Failed to delete group:', err)
      let errorMsg = '删除失败，请重试'
      if (err instanceof ApiError) {
        errorMsg = `${err.message} (${err.code})`
      }
      window.alert(errorMsg)
    }
  }

  const handleDelete = async (id: string) => {
    if (!apiClient) return

    // 查找要删除的链接的 shortCode
    const linkToDelete = links.find((l) => l.id === id)
    if (!linkToDelete) {
      console.error('Link not found for deletion:', id)
      return
    }

    try {
      // 调用后端删除 API
      await deleteLink(apiClient, linkToDelete.shortCode)

      // 删除成功后，从本地列表中移除
      setLinks((prev) => prev.filter((link) => link.id !== id))
    } catch (err) {
      console.error('Failed to delete link:', err)
      let errorMsg = '删除失败，请重试'
      if (err instanceof ApiError) {
        if (err.status === 404) {
          errorMsg = '链接不存在'
        } else {
          errorMsg = `${err.message} (${err.code})`
        }
      }
      window.alert(errorMsg)
    }
  }

  const handleBulkDelete = (ids: string[]) => {
    setLinks((prev) => prev.filter((link) => !ids.includes(link.id)))
  }

  const handleEdit = (link: ShortLink) => {
    setEditingLink(link)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async (id: string, newOriginalUrl: string) => {
    if (!apiClient) return

    // 查找要编辑的链接
    const linkToEdit = links.find((l) => l.id === id)
    if (!linkToEdit) {
      console.error('Link not found for edit:', id)
      return
    }

    try {
      // 调用后端更新原始 URL API
      await updateLinkOriginalUrl(apiClient, linkToEdit.shortCode, {
        original_url: newOriginalUrl,
      })

      // 更新本地列表
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
    } catch (err) {
      console.error('Failed to update link:', err)
      let errorMsg = '更新失败，请重试'
      if (err instanceof ApiError) {
        errorMsg = `${err.message} (${err.code})`
      }
      window.alert(errorMsg)
    }
  }

  const handleToggleProxyMode = async (ids: string[], newMode: ProxyMode) => {
    if (!apiClient) return

    try {
      const selectedLinks = ids
        .map((id) => links.find((link) => link.id === id))
        .filter((link): link is ShortLink => !!link)

      const taskLink =
        selectedLinks.length === 1 &&
        selectedLinks[0].source !== 'single' &&
        typeof selectedLinks[0].taskId === 'number'
          ? selectedLinks[0]
          : null

      if (taskLink && typeof taskLink.taskId === 'number') {
        if (taskLink.source === 'batch') {
          await updateBatchTextResponseMode(apiClient, taskLink.taskId, {
            response_mode: newMode,
          })
        } else {
          await updateDocumentFileResponseMode(apiClient, taskLink.taskId, {
            response_mode: newMode,
          })
        }
      } else {
        // 对所有选中的链接调用更新 API
        const updatePromises = ids.map((id) => {
          const linkToUpdate = links.find((link) => link.id === id)
          if (!linkToUpdate) return null

          return updateLinkResponseMode(apiClient, linkToUpdate.shortCode, {
            response_mode: newMode,
          })
        })

        // 等待所有更新完成
        await Promise.all(updatePromises.filter(Boolean))
      }

      // 更新本地列表
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
    } catch (err) {
      console.error('Failed to toggle proxy mode:', err)
      let errorMsg = '模式切换失败，请重试'
      if (err instanceof ApiError) {
        errorMsg = `${err.message} (${err.code})`
      }
      window.alert(errorMsg)
    }
  }

  const handleDownloadGroup = async (group: ConversionGroup) => {
    if (!apiClient || group.source !== 'file') {
      const text = group.links
        .map((link) => `${link.originalUrl} -> ${link.shortUrl}`)
        .join('\n')
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `cloak-${group.source}-${group.batchId.slice(0, 8)}.txt`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      return
    }

    const taskLink = group.links.find((link) => typeof link.taskId === 'number')
    if (!taskLink || typeof taskLink.taskId !== 'number') {
      window.alert('未找到可下载的文件任务')
      return
    }

    try {
      const response = await downloadDocumentFile(apiClient, taskLink.taskId)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = taskLink.fileName || `cloak-document-${taskLink.taskId}.txt`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download document file:', err)
      let errorMsg = '下载失败，请重试'
      if (err instanceof ApiError) {
        errorMsg = `${err.message} (${err.code})`
      }
      window.alert(errorMsg)
    }
  }

  const handleViewBatchDetail = async (taskId: number): Promise<BatchTextDetailResponse> => {
    if (!apiClient) {
      throw new Error('API client not initialized')
    }

    try {
      return await getBatchTextDetail(apiClient, taskId)
    } catch (err) {
      console.error('Failed to load batch detail:', err)
      if (err instanceof ApiError) {
        throw new Error(`${err.message} (${err.code})`)
      }
      throw new Error('加载批量任务详情失败')
    }
  }

  const handleOpenBatchDownload = (taskId: number) => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
    const downloadUrl = `${baseUrl}/api/batch-text/${taskId}/download`
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }

  const handleViewLogs = (link: ShortLink) => {
    setVisitLogLink(link)
  }

  const handleRefresh = async () => {
    // 从服务端重新加载历史记录
    if (!apiClient) return

    try {
      const response = await listConversions(apiClient, { page: 1, size: 100 })
      const mappedLinks = response.items.map(mapConversionRecordToShortLink)
      setLinks(mappedLinks)
    } catch (err) {
      console.error('Failed to refresh history from server:', err)
      window.alert('刷新失败，请稍后重试')
    }
  }

  // 搜索历史记录（调用服务端 API）
  const handleSearch = async (keyword: string) => {
    if (!apiClient) return

    try {
      if (!keyword || keyword.trim().length === 0) {
        // 关键词为空时，重新加载全部记录
        const response = await listConversions(apiClient, { page: 1, size: 100 })
        const mappedLinks = response.items.map(mapConversionRecordToShortLink)
        setLinks(mappedLinks)
      } else {
        // 调用搜索 API
        const response = await searchConversions(apiClient, {
          keyword: keyword.trim(),
          page: 1,
          size: 100,
        })
        const mappedLinks = response.items.map(mapConversionRecordToShortLink)
        setLinks(mappedLinks)
      }
    } catch (err) {
      console.error('Failed to search links:', err)
      window.alert('搜索失败，请重试')
    }
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      <Header
        username={user}
        profile={profile}
        expiryInfo={expiryInfo}
        isExpiryLoading={isExpiryLoading}
        isProfileLoading={isProfileLoading}
        onChangeUsername={handleChangeUsername}
        onChangePassword={handleChangePassword}
        usernameError={usernameError}
        passwordError={passwordError}
        isUpdatingUsername={isUpdatingUsername}
        isUpdatingPassword={isUpdatingPassword}
        onLogout={handleLogout}
      />

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {successMessage}
        </div>
      )}

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
              <BatchConvert key="batch" onConvert={(sourceText) => setPendingConvert(() => () => handleBatchConvert(sourceText))} />
            )}
            {activeTab === 'file' && (
              <FileConvert
                key="file"
                onConvert={(file, urls) =>
                  setPendingConvert(() => () => handleFileConvert(file, urls))
                }
              />
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
            onSearch={handleSearch}
            onDownloadGroup={handleDownloadGroup}
            onViewBatchDetail={handleViewBatchDetail}
            onOpenBatchDownload={handleOpenBatchDownload}
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
              href="https://t.me/nuoyea"
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
