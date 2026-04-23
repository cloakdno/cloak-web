import React, { useEffect, useState, useRef } from 'react'
import {
  Search,
  Trash2,
  Edit2,
  Copy,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Download,
  Layers,
  FileText,
  Eye,
  RefreshCw,
  Loader2,
  ArrowRight,
  ArrowRightLeft,
  Globe,
  MoreVertical,
  Info,
  X,
} from 'lucide-react'
import { ShortLink, ConversionGroup, ProxyMode } from '../types'
import { groupLinksByBatch } from '../utils/shortlink'
import { BatchViewModal } from './BatchViewModal'
import { BatchTextDetailResponse } from '@/app/lib/api'
import toast from 'react-hot-toast'

interface HistoryTableProps {
  links: ShortLink[]
  onDelete: (id: string) => void
  onDeleteGroup: (batchId: string) => void
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBulkDelete: (ids: string[]) => void
  onEdit: (link: ShortLink) => void
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onViewLogs: (link: ShortLink) => void
  onRefresh?: () => void
  onToggleProxyMode?: (ids: string[], newMode: ProxyMode) => void
  onSearch?: (keyword: string) => void
  onDownloadGroup?: (group: ConversionGroup) => void
  onViewBatchDetail?: (taskId: number) => Promise<BatchTextDetailResponse>
  onOpenBatchDownload?: (taskId: number) => void
}

export function HistoryTable({
  links,
  onDelete,
  onDeleteGroup,
  onBulkDelete,
  onEdit,
  onViewLogs,
  onRefresh,
  onToggleProxyMode,
  onSearch,
  onDownloadGroup,
  onViewBatchDetail,
  onOpenBatchDownload,
}: HistoryTableProps) {
  const formatCreatedTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}/${month}/${day} ${hour}:${minute}`
  }

  const [searchInput, setSearchInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingBatchGroup, setViewingBatchGroup] =
    useState<ConversionGroup | null>(null)
  const [viewingBatchDetail, setViewingBatchDetail] =
    useState<BatchTextDetailResponse | null>(null)
  const [isBatchDetailLoading, setIsBatchDetailLoading] = useState(false)
  const [batchDetailError, setBatchDetailError] = useState<string | null>(null)
  const [proxyConfirm, setProxyConfirm] = useState<{
    ids: string[]
    currentMode: ProxyMode
    newMode: ProxyMode
    count: number
  } | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewingDetails, setViewingDetails] = useState<
    ShortLink | ConversionGroup | null
  >(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const itemsPerPage = 10
  // 搜索已在服务端处理，links 本身就是搜索结果或全部列表，无需本地过滤
  const filteredLinks = links
  const groups = groupLinksByBatch(filteredLinks)
  const totalPages = Math.ceil(groups.length / itemsPerPage)
  const paginatedGroups = groups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDownloadGroup = (group: ConversionGroup) => {
    const text = group.links
      .map((l) => `${l.originalUrl} -> ${l.shortUrl}`)
      .join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cloak-${group.source}-${group.batchId.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getGroupTaskId = (group: ConversionGroup) => {
    return group.links.find((link) => typeof link.taskId === 'number')?.taskId
  }

  const openBatchGroup = async (group: ConversionGroup) => {
    setViewingBatchGroup(group)
    setViewingBatchDetail(null)
    setBatchDetailError(null)

    const taskId = getGroupTaskId(group)
    if (typeof taskId !== 'number' || !onViewBatchDetail) {
      setBatchDetailError('未找到批量任务详情')
      return
    }

    setIsBatchDetailLoading(true)
    try {
      const detail = await onViewBatchDetail(taskId)
      setViewingBatchDetail(detail)
    } catch (error) {
      setBatchDetailError(
        error instanceof Error ? error.message : '加载批量任务详情失败',
      )
    } finally {
      setIsBatchDetailLoading(false)
    }
  }

  const closeBatchGroup = () => {
    setViewingBatchGroup(null)
    setViewingBatchDetail(null)
    setBatchDetailError(null)
    setIsBatchDetailLoading(false)
  }

  const getTotalVisits = (group: ConversionGroup) => {
    const taskTotal = group.links.find(
      (link) => typeof link.totalVisitCount === 'number',
    )?.totalVisitCount
    if (typeof taskTotal === 'number') return taskTotal

    if (group.source === 'batch' || group.source === 'file') return 0

    const total = group.links.reduce((sum, l) => sum + (l.visits || []).length, 0)
    if (total >= 10000) return `${(total / 10000).toFixed(1).replace(/\.0$/, '')}w`
    if (total >= 1000) return `${(total / 1000).toFixed(1).replace(/\.0$/, '')}k`
    return total
  }

  const getSingleVisitCount = (link: ShortLink) => {
    if (typeof link.totalVisitCount === 'number') return link.totalVisitCount
    return (link.visits || []).length
  }

  const getGroupRecognizedCount = (group: ConversionGroup) => {
    const recognizedLinkCount = group.links.find(
      (link) => typeof link.recognizedLinkCount === 'number',
    )?.recognizedLinkCount

    return recognizedLinkCount ?? group.links.length
  }

  const getSourceMeta = (source: ShortLink['source']) => {
    if (source === 'file') {
      return {
        label: '文件任务',
        icon: <FileText size={12} className="text-blue-500" />,
        className: 'bg-blue-50 text-blue-600',
      }
    }
    if (source === 'batch') {
      return {
        label: '批量任务',
        icon: <Layers size={12} className="text-orange-500" />,
        className: 'bg-orange-50 text-orange-600',
      }
    }
    return {
      label: '单链',
      icon: null,
      className: 'bg-purple-50 text-purple-600',
    }
  }

  const renderSourceBadge = (source: ShortLink['source']) => {
    const meta = getSourceMeta(source)
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.className}`}
      >
        {meta.icon}
        {meta.label}
      </span>
    )
  }

  const renderTaskStatusBadge = (converting: boolean) => {
    if (converting) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-500">
          <Loader2 size={10} className="animate-spin" />
          处理中
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={10} />
        已完成
      </span>
    )
  }

  const renderProxyBadge = (mode: ProxyMode | undefined, ids: string[]) => {
    const currentMode = mode || 'redirect'
    const isRedirect = currentMode === 'redirect'
    const newMode: ProxyMode = isRedirect ? 'proxy' : 'redirect'

    return (
      <button
        onClick={() => {
          setProxyConfirm({
            ids,
            currentMode,
            newMode,
            count: ids.length,
          })
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${isRedirect ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
        title={`点击切换为${isRedirect ? '反向代理' : '302 跳转'}模式`}
      >
        {isRedirect ? <ArrowRightLeft size={10} /> : <Globe size={10} />}
        {isRedirect ? '跳转' : '代理'}
      </button>
    )
  }

  if (links.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-1">暂无链接</h3>
        <p className="text-gray-500">转换你的第一个链接，即可在此查看。</p>
      </div>
    )
  }

  const isLinkConverting = (link: ShortLink) => link.status === 'converting'
  const isGroupConverting = (group: ConversionGroup) =>
    group.links.some((l) => l.status === 'converting')

  const renderSingleRow = (link: ShortLink, idx: number) => {
    const converting = isLinkConverting(link)
    const actionDisabled = converting
    const isMenuOpen = openMenuId === link.id

    return (
      <tr
        key={link.id}
        className={`group border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${converting ? 'bg-purple-50/30' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}
      >
        <td className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {converting ? (
              <>
                <Loader2 size={14} className="animate-spin text-purple-500" />
                <span className="text-sm text-purple-500 font-medium">转换中...</span>
                {renderSourceBadge(link.source)}
                {renderTaskStatusBadge(true)}
              </>
            ) : (
              <>
                <a
                  href={link.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  {link.shortCode}
                  <ExternalLink size={12} className="transition-opacity" />
                </a>
                {renderSourceBadge(link.source)}
              </>
            )}
          </div>
        </td>
        <td className="p-4 hidden md:table-cell max-w-[200px] lg:max-w-[300px]">
          <div className="text-sm text-gray-600 truncate" title={link.originalUrl}>
            {link.originalUrl}
          </div>
        </td>
        <td className="p-4 hidden lg:table-cell text-sm text-gray-500">
          {formatCreatedTime(link.createdAt)}
        </td>
        <td className="p-4 hidden sm:table-cell">
          {converting ? (
            <span className="text-xs text-purple-400">--</span>
          ) : (
            renderProxyBadge(link.proxyMode, [link.id])
          )}
        </td>
        <td className="p-4 hidden sm:table-cell">
          {converting ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-400 rounded-lg text-sm font-medium">
              <Loader2 size={14} className="animate-spin" />
              --
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium">
              <BarChart3 size={14} />
              {getSingleVisitCount(link)}
            </span>
          )}
        </td>
        <td className="p-4 text-right relative">
          <>
            <div className="hidden sm:flex items-center justify-end gap-1">
              <button
                onClick={() => handleCopy(link.shortUrl, link.id)}
                disabled={actionDisabled}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                title="复制"
              >
                {copiedId === link.id ? (
                  <CheckCircle2 size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
              <button
                onClick={() => onEdit(link)}
                disabled={actionDisabled}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                title="编辑"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('确定删除此链接？')) onDelete(link.id)
                }}
                disabled={actionDisabled}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="sm:hidden flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (actionDisabled) return
                  setOpenMenuId(isMenuOpen ? null : link.id)
                }}
                disabled={actionDisabled}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                <MoreVertical size={18} />
              </button>
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-4 top-12 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
                >
                  <button
                    onClick={() => {
                      handleCopy(link.shortUrl, link.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {copiedId === link.id ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-gray-400" />
                    )}
                    复制短链
                  </button>
                  <button
                    onClick={() => {
                      onEdit(link)
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 size={14} className="text-gray-400" />
                    编辑
                  </button>
                  <button
                    onClick={() => {
                      setViewingDetails(link)
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Info size={14} className="text-gray-400" />
                    查看详情
                  </button>
                  <button
                    onClick={() => {
                      setProxyConfirm({
                        ids: [link.id],
                        currentMode: link.proxyMode || 'redirect',
                        newMode: link.proxyMode === 'redirect' ? 'proxy' : 'redirect',
                        count: 1,
                      })
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {link.proxyMode === 'redirect' ? (
                      <Globe size={14} className="text-gray-400" />
                    ) : (
                      <ArrowRightLeft size={14} className="text-gray-400" />
                    )}
                    切换模式
                  </button>
                  <div className="h-px bg-gray-100 my-1 mx-2" />
                  <button
                    onClick={() => {
                      if (window.confirm('确定删除此链接？')) onDelete(link.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              )}
            </div>
          </>
        </td>
      </tr>
    )
  }

  const renderGroupRow = (group: ConversionGroup, idx: number) => {
    const isFile = group.source === 'file'
    const converting = isGroupConverting(group)
    const actionDisabled = converting
    const groupIds = group.links.map((l) => l.id)
    const groupMode = group.links[0]?.proxyMode
    const groupRecognizedCount = getGroupRecognizedCount(group)
    const isMenuOpen = openMenuId === group.batchId

    return (
      <tr
        key={group.batchId}
        className={`group border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${converting ? 'bg-purple-50/30' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}
      >
        <td className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {converting ? (
              <>
                <Loader2 size={16} className="animate-spin text-purple-500" />
                <span className="text-sm text-purple-500 font-medium">
                  {isFile ? '文件转换中...' : '批量转换中...'}
                </span>
                {renderTaskStatusBadge(true)}
                <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-400 rounded-full font-medium">
                  {groupRecognizedCount} 条
                </span>
              </>
            ) : (
              <>
                {isFile ? (
                  <FileText size={16} className="text-blue-500" />
                ) : (
                  <Layers size={16} className="text-orange-500" />
                )}
                <span className="font-medium text-gray-800">
                  {isFile ? '文件上传' : '批量转换'}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isFile ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}
                >
                  {groupRecognizedCount} 条
                </span>
              </>
            )}
          </div>
        </td>
        <td className="p-4 hidden md:table-cell">
          <span className="text-sm text-gray-500">
            {converting ? '正在转换...' : `${groupRecognizedCount} 条链接已转换`}
          </span>
        </td>
        <td className="p-4 hidden lg:table-cell text-sm text-gray-500">
          {formatCreatedTime(group.createdAt)}
        </td>
        <td className="p-4 hidden sm:table-cell">
          {converting ? (
            <span className="text-xs text-purple-400">--</span>
          ) : (
            renderProxyBadge(groupMode, groupIds)
          )}
        </td>
        <td className="p-4 hidden sm:table-cell">
          {converting ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-400 rounded-lg text-sm font-medium">
              <Loader2 size={14} className="animate-spin" />
              --
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
              <BarChart3 size={14} />
              {getTotalVisits(group)}
            </span>
          )}
        </td>
        <td className="p-4 text-right relative">
          <>
            <div className="hidden sm:flex items-center justify-end gap-1">
              {isFile ? (
                <button
                  onClick={() => {
                    if (window.confirm('确定要下载转换结果文件吗？')) {
                      if (onDownloadGroup) {
                        onDownloadGroup(group)
                      } else {
                        handleDownloadGroup(group)
                      }
                    }
                  }}
                  disabled={actionDisabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                  title="下载转换结果"
                >
                  <Download size={14} />
                  下载
                </button>
              ) : (
                <button
                  onClick={() => void openBatchGroup(group)}
                  disabled={actionDisabled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-50"
                  title="查看转换结果"
                >
                  <Eye size={14} />
                  查看
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm(`确定删除这 ${groupRecognizedCount} 条链接？`)) onDeleteGroup(group.batchId)
                }}
                disabled={actionDisabled}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                title="删除全部"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="sm:hidden flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (actionDisabled) return
                  setOpenMenuId(isMenuOpen ? null : group.batchId)
                }}
                disabled={actionDisabled}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                <MoreVertical size={18} />
              </button>
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-4 top-12 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
                >
                  {isFile ? (
                    <button
                      onClick={() => {
                        if (window.confirm('确定要下载转换结果文件吗？')) {
                          if (onDownloadGroup) {
                            onDownloadGroup(group)
                          } else {
                            handleDownloadGroup(group)
                          }
                        }
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download size={14} className="text-gray-400" />
                      下载结果
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        void openBatchGroup(group)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye size={14} className="text-gray-400" />
                      查看结果
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setViewingDetails(group)
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Info size={14} className="text-gray-400" />
                    查看详情
                  </button>
                  <button
                    onClick={() => {
                      setProxyConfirm({
                        ids: groupIds,
                        currentMode: groupMode || 'redirect',
                        newMode: groupMode === 'redirect' ? 'proxy' : 'redirect',
                        count: groupRecognizedCount,
                      })
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {groupMode === 'redirect' ? (
                      <Globe size={14} className="text-gray-400" />
                    ) : (
                      <ArrowRightLeft size={14} className="text-gray-400" />
                    )}
                    切换模式
                  </button>
                  <div className="h-px bg-gray-100 my-1 mx-2" />
                  <button
                    onClick={() => {
                      if (window.confirm(`确定删除这 ${groupRecognizedCount} 条链接？`)) onDeleteGroup(group.batchId)
                      setOpenMenuId(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    删除全部
                  </button>
                </div>
              )}
            </div>
          </>
        </td>
      </tr>
    )
  }

  return (
    <>
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-row justify-between items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="搜索链接..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch?.(searchInput)
                  setCurrentPage(1)
                }
              }}
              className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => {
                  onSearch?.(searchInput)
                  setCurrentPage(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors"
                title="搜索"
              >
                <ArrowRight size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                title="刷新"
              >
                <RefreshCw size={14} />
                刷新
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <th className="p-4 font-medium">短链接</th>
                <th className="p-4 font-medium hidden md:table-cell">原始链接</th>
                <th className="p-4 font-medium hidden lg:table-cell">创建时间</th>
                <th className="p-4 font-medium hidden sm:table-cell">模式</th>
                <th className="p-4 font-medium hidden sm:table-cell">访问量</th>
                <th className="p-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGroups.map((group, idx) =>
                group.source === 'single'
                  ? renderSingleRow(group.links[0], idx)
                  : renderGroupRow(group, idx),
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">
              显示第 {(currentPage - 1) * itemsPerPage + 1} 至{' '}
              {Math.min(currentPage * itemsPerPage, groups.length)} 条，共 {groups.length} 条
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-gray-200 bg-white text-gray-500 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-gray-200 bg-white text-gray-500 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <BatchViewModal
        group={viewingBatchGroup}
        detail={viewingBatchDetail}
        isLoading={isBatchDetailLoading}
        errorMessage={batchDetailError}
        isOpen={!!viewingBatchGroup}
        onClose={closeBatchGroup}
        onDownload={() => {
          const taskId = viewingBatchGroup ? getGroupTaskId(viewingBatchGroup) : undefined
          if (typeof taskId !== 'number') {
            toast.error('未找到批量任务下载地址')
            return
          }
          if (onOpenBatchDownload) {
            onOpenBatchDownload(taskId)
            return
          }
          window.open(`/api/batch-text/${taskId}/download`, '_blank', 'noopener,noreferrer')
        }}
      />

      {proxyConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProxyConfirm(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div
                  className={`p-3 rounded-full ${proxyConfirm.newMode === 'proxy' ? 'bg-indigo-50' : 'bg-emerald-50'}`}
                >
                  {proxyConfirm.newMode === 'proxy' ? (
                    <Globe size={24} className="text-indigo-600" />
                  ) : (
                    <ArrowRightLeft size={24} className="text-emerald-600" />
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">切换响应模式</h3>
              <p className="text-sm text-gray-600 text-center mb-1">
                确定要将
                {proxyConfirm.count > 1 ? ` ${proxyConfirm.count} 条链接` : '该链接'}
                的响应模式从
              </p>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${proxyConfirm.currentMode === 'redirect' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}
                >
                  {proxyConfirm.currentMode === 'redirect' ? (
                    <ArrowRightLeft size={12} />
                  ) : (
                    <Globe size={12} />
                  )}
                  {proxyConfirm.currentMode === 'redirect' ? '302 跳转' : '反向代理'}
                </span>
                <ArrowRight size={14} className="text-gray-400" />
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${proxyConfirm.newMode === 'redirect' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}
                >
                  {proxyConfirm.newMode === 'redirect' ? (
                    <ArrowRightLeft size={12} />
                  ) : (
                    <Globe size={12} />
                  )}
                  {proxyConfirm.newMode === 'redirect' ? '302 跳转' : '反向代理'}
                </span>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5 text-center">
                ⚠️ 此操作需要重新配置服务端路由，可能需要几分钟生效。
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setProxyConfirm(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onToggleProxyMode?.(proxyConfirm.ids, proxyConfirm.newMode)
                  setProxyConfirm(null)
                }}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingDetails && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingDetails(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Info size={20} className="text-purple-600" />
                详情信息
              </h3>
              <button
                onClick={() => setViewingDetails(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {'originalUrl' in viewingDetails ? (
                <>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      原始链接
                    </span>
                    <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 break-all flex items-start justify-between gap-3">
                      <span>{viewingDetails.originalUrl}</span>
                      <button
                        onClick={() => handleCopy(viewingDetails.originalUrl, 'detail-copy')}
                        className="p-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                        title="复制原始链接"
                      >
                        {copiedId === 'detail-copy' ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        转换来源
                      </span>
                      <div className="mt-1">{renderSourceBadge(viewingDetails.source)}</div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        任务状态
                      </span>
                      <div className="mt-1">{renderTaskStatusBadge(viewingDetails.status === 'converting')}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </span>
                      <p className="mt-1 text-sm text-gray-800">
                        {formatCreatedTime(viewingDetails.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        访问量
                      </span>
                      <p className="mt-1 text-sm text-gray-800">
                        {(viewingDetails.visits || []).length} 次
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                      响应模式
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${viewingDetails.proxyMode === 'redirect' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}
                    >
                      {viewingDetails.proxyMode === 'redirect' ? (
                        <ArrowRightLeft size={14} />
                      ) : (
                        <Globe size={14} />
                      )}
                      {viewingDetails.proxyMode === 'redirect' ? '302 跳转' : '反向代理'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      转换来源
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-800">
                      {viewingDetails.source === 'file' ? (
                        <FileText size={16} className="text-blue-500" />
                      ) : (
                        <Layers size={16} className="text-orange-500" />
                      )}
                      {viewingDetails.source === 'file' ? '文件上传' : '批量转换'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        包含链接
                      </span>
                      <p className="mt-1 text-sm text-gray-800">{getGroupRecognizedCount(viewingDetails)} 条</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        任务状态
                      </span>
                      <div className="mt-1">
                        {renderTaskStatusBadge(
                          viewingDetails.links.some((link) => link.status === 'converting'),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        总访问量
                      </span>
                      <p className="mt-1 text-sm text-gray-800">
                        {getTotalVisits(viewingDetails)} 次
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </span>
                      <p className="mt-1 text-sm text-gray-800">
                        {formatCreatedTime(viewingDetails.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">
                        响应模式
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${viewingDetails.links[0]?.proxyMode === 'redirect' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}
                      >
                        {viewingDetails.links[0]?.proxyMode === 'redirect' ? (
                          <ArrowRightLeft size={14} />
                        ) : (
                          <Globe size={14} />
                        )}
                        {viewingDetails.links[0]?.proxyMode === 'redirect'
                          ? '302 跳转'
                          : '反向代理'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
