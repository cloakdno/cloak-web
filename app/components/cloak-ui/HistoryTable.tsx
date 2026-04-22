import { Copy, ExternalLink, FileText, Layers, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDate, groupByBatch } from "./mock";
import { ShortLink } from "./types";

interface HistoryTableProps {
  links: ShortLink[];
}

export function HistoryTable({ links }: HistoryTableProps) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const filtered = lowered
      ? links.filter(
          (item) =>
            item.shortCode.toLowerCase().includes(lowered) ||
            item.originalUrl.toLowerCase().includes(lowered),
        )
      : links;

    return groupByBatch(filtered);
  }, [links, query]);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <section className="cloak-history-shell">
      <div className="cloak-history-header">
        <h3>转换记录</h3>
        <p>仅展示 UI 交互，后续可直接替换为 API 返回数据。</p>
      </div>

      <div className="cloak-search-row">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索原始链接或短链码" />
      </div>

      <div className="cloak-table-wrap">
        <table className="cloak-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>链接信息</th>
              <th>创建时间</th>
              <th>访问量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const first = group.links[0];
              const visits = group.links.reduce((sum, item) => sum + item.visits.length, 0);
              const isSingle = group.source === "single";

              return (
                <tr key={group.batchId}>
                  <td>
                    <span className={`cloak-badge ${isSingle ? "is-single" : group.source === "batch" ? "is-batch" : "is-file"}`}>
                      {isSingle ? (
                        "单链"
                      ) : group.source === "batch" ? (
                        <>
                          <Layers size={12} /> 批量
                        </>
                      ) : (
                        <>
                          <FileText size={12} /> 文件
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="cloak-link-meta">
                      <a href={first.shortUrl} target="_blank" rel="noreferrer">
                        {first.shortUrl} <ExternalLink size={12} />
                      </a>
                      <p>{isSingle ? first.originalUrl : `${group.links.length} 条链接`}</p>
                    </div>
                  </td>
                  <td>{formatDate(group.createdAt)}</td>
                  <td>{visits}</td>
                  <td>
                    <button type="button" className="cloak-icon-btn" onClick={() => copy(first.shortUrl, first.id)}>
                      <Copy size={14} /> {copiedId === first.id ? "已复制" : "复制"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
