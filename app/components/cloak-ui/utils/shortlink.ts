import { ShortLink, ConversionSource, VisitLog, ProxyMode } from '../types/index'

const DOMAIN = 'clk.sh'

export const generateShortCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const createShortLink = (
  originalUrl: string,
  source: ConversionSource,
  batchId?: string,
  proxyMode: ProxyMode = 'redirect',
): ShortLink => {
  const shortCode = generateShortCode()
  return {
    id: crypto.randomUUID(),
    originalUrl,
    shortCode,
    shortUrl: `https://${DOMAIN}/${shortCode}`,
    createdAt: Date.now(),
    source,
    visits: [],
    batchId: batchId || crypto.randomUUID(),
    status: 'done',
    proxyMode,
  }
}

export const groupLinksByBatch = (links: ShortLink[]): import('../types/index').ConversionGroup[] => {
  const groupMap = new Map<string, ShortLink[]>()
  links.forEach((link) => {
    const existing = groupMap.get(link.batchId) || []
    existing.push(link)
    groupMap.set(link.batchId, existing)
  })
  return Array.from(groupMap.entries())
    .map(([batchId, groupLinks]) => ({
      batchId,
      source: groupLinks[0].source,
      links: groupLinks,
      createdAt: Math.max(...groupLinks.map((l) => l.createdAt)),
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

const mockIPs = [
  '103.24.68.12',
  '45.76.123.89',
  '192.168.1.105',
  '78.46.91.34',
  '185.220.101.5',
  '13.225.67.44',
  '104.16.89.20',
  '172.67.182.31',
  '8.8.8.8',
  '1.1.1.1',
  '223.5.5.5',
  '119.29.29.29',
]

const mockCountries = [
  '🇨🇳 中国',
  '🇺🇸 美国',
  '🇯🇵 日本',
  '🇰🇷 韩国',
  '🇬🇧 英国',
  '🇩🇪 德国',
  '🇫🇷 法国',
  '🇸🇬 新加坡',
  '🇭🇰 香港',
  '🇹🇼 台湾',
]

const mockDevices = ['iPhone 15', 'Android', 'Windows PC', 'MacBook', 'iPad', 'Linux']

const mockBrowsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'WeChat', 'Telegram']

const mockReferrers = [
  'https://t.me/',
  'https://google.com',
  'https://twitter.com',
  'https://facebook.com',
  '直接访问',
  'https://weibo.com',
  'https://zhihu.com',
  'https://baidu.com',
]

const randomFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export const generateMockVisit = (): VisitLog => {
  const timestamp = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
  return {
    id: crypto.randomUUID(),
    timestamp,
    ip: randomFrom(mockIPs),
    country: randomFrom(mockCountries),
    device: randomFrom(mockDevices),
    browser: randomFrom(mockBrowsers),
    referrer: randomFrom(mockReferrers),
  }
}

export const generateMockVisits = (count: number): VisitLog[] => {
  return Array.from({ length: count }, () => generateMockVisit()).sort((a, b) => b.timestamp - a.timestamp)
}

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const isValidUrl = (string: string) => {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

const isIpv4Host = (hostname: string) => {
  return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(
    hostname,
  )
}

/**
 * 更严格的单链接校验：
 * - 必须能被 URL 正常解析
 * - 仅允许 http/https
 * - 主机名需为常规域名、localhost 或 IP，避免把任意字符串补成 https://abc 后误判为合法
 */
export const isCompliantHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }

    const hostname = parsed.hostname.trim().toLowerCase()
    if (!hostname) {
      return false
    }

    if (hostname === 'localhost' || hostname.includes('.') || isIpv4Host(hostname)) {
      return true
    }

    return hostname.includes(':')
  } catch {
    return false
  }
}

const trimTrailingPunctuation = (url: string) => {
  return url.replace(/[\),.;!?\]\}，。；！？）】》]+$/g, '')
}

export const extractHttpUrls = (text: string): string[] => {
  const matches = text.match(/https?:\/\/[^\s<>"']+/gi)
  if (!matches) {
    return []
  }

  return matches.map((m) => trimTrailingPunctuation(m.trim())).filter(Boolean)
}
