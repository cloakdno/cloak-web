import { ConversionGroup, ConversionTab, ProxyMode, ShortLink, VisitLog } from "./types";

const DOMAIN = "clk.sh";

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let output = "";
  for (let i = 0; i < 6; i += 1) {
    output += chars.charAt(randomInt(chars.length));
  }
  return output;
}

function generateVisits(count: number): VisitLog[] {
  return Array.from({ length: count }, () => ({
    id: crypto.randomUUID(),
    timestamp: Date.now() - randomInt(1000 * 60 * 60 * 24 * 7),
  }));
}

export function createMockLink(
  originalUrl: string,
  source: ConversionTab,
  batchId?: string,
  proxyMode: ProxyMode = "redirect",
  status: ShortLink["status"] = "done",
): ShortLink {
  const shortCode = generateShortCode();
  return {
    id: crypto.randomUUID(),
    originalUrl,
    shortCode,
    shortUrl: `https://${DOMAIN}/${shortCode}`,
    createdAt: Date.now() - randomInt(1000 * 60 * 60 * 24 * 5),
    source,
    batchId: batchId ?? crypto.randomUUID(),
    status,
    proxyMode,
    visits: generateVisits(randomInt(24)),
  };
}

export function seedMockLinks(): ShortLink[] {
  const singleUrls = [
    "https://github.com/vercel/next.js",
    "https://react.dev/learn",
    "https://tailwindcss.com/docs/installation",
  ];
  const batchUrls = [
    "https://www.cloudflare.com/learning/security/what-is-https/",
    "https://developer.mozilla.org/en-US/docs/Web/HTTP",
    "https://vercel.com/docs/deployments/overview",
  ];
  const fileUrls = [
    "https://example.com/marketing/campaign-a",
    "https://example.com/marketing/campaign-b",
    "https://example.com/marketing/campaign-c",
  ];

  const batchId = crypto.randomUUID();
  const fileBatchId = crypto.randomUUID();

  return [
    ...singleUrls.map((url) => createMockLink(url, "single")),
    ...batchUrls.map((url) => createMockLink(url, "batch", batchId)),
    ...fileUrls.map((url) => createMockLink(url, "file", fileBatchId)),
  ].sort((a, b) => b.createdAt - a.createdAt);
}

export function groupByBatch(links: ShortLink[]): ConversionGroup[] {
  const map = new Map<string, ShortLink[]>();
  links.forEach((link) => {
    const prev = map.get(link.batchId) ?? [];
    prev.push(link);
    map.set(link.batchId, prev);
  });

  return Array.from(map.entries())
    .map(([batchId, groupLinks]) => ({
      batchId,
      source: groupLinks[0].source,
      links: groupLinks,
      createdAt: Math.max(...groupLinks.map((item) => item.createdAt)),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeUrl(input: string): string {
  const raw = input.trim();
  if (!raw) {
    return "";
  }
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function isValidUrl(value: string): boolean {
  try {
    // URL 构造失败时即视为无效链接。
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
