export type ConversionSource = 'single' | 'batch' | 'file'

// 用于 TabSwitcher 组件的标签页类型别名
export type ConversionTab = ConversionSource

export interface VisitLog {
  id: string
  timestamp: number
  ip: string
  country: string
  device: string
  browser: string
  referrer: string
}

export type LinkStatus = 'converting' | 'done'

export type ProxyMode = 'redirect' | 'proxy'

export interface ShortLink {
  id: string
  originalUrl: string
  shortCode: string
  shortUrl: string
  createdAt: number
  source: ConversionSource
  visits: VisitLog[]
  batchId: string
  recognizedLinkCount?: number
  status: LinkStatus
  proxyMode: ProxyMode
}

export interface ConversionGroup {
  batchId: string
  source: ConversionSource
  links: ShortLink[]
  createdAt: number
}

export interface ConversionResult {
  source: ConversionSource
  links: ShortLink[]
}
