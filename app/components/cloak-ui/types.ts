export type ConversionTab = "single" | "batch" | "file";

export type ProxyMode = "redirect" | "proxy";

export type LinkStatus = "converting" | "done";

export interface VisitLog {
  id: string;
  timestamp: number;
}

export interface ShortLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: number;
  source: ConversionTab;
  batchId: string;
  status: LinkStatus;
  proxyMode: ProxyMode;
  visits: VisitLog[];
}

export interface ConversionGroup {
  batchId: string;
  source: ConversionTab;
  links: ShortLink[];
  createdAt: number;
}
