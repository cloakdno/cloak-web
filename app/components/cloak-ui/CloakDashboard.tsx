"use client";

import { useEffect, useMemo, useState } from "react";
import { BatchConvert } from "./BatchConvert";
import { FileConvert } from "./FileConvert";
import { Header } from "./Header";
import { HistoryTable } from "./HistoryTable";
import { createMockLink, seedMockLinks } from "./mock";
import { SingleConvert } from "./SingleConvert";
import { TabSwitcher } from "./TabSwitcher";
import { ConversionTab, ProxyMode, ShortLink } from "./types";

export function CloakDashboard() {
  const [activeTab, setActiveTab] = useState<ConversionTab>("single");
  const [proxyMode, setProxyMode] = useState<ProxyMode>("redirect");
  const [links, setLinks] = useState<ShortLink[]>([]);

  useEffect(() => {
    // 仅在客户端挂载后生成演示数据，避免 SSR 与客户端随机值不一致导致 hydration 报错。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 这里需要在挂载后注入随机 mock 数据，属于有意为之。
    setLinks(seedMockLinks());
  }, []);

  const modeDescription = useMemo(() => {
    if (proxyMode === "redirect") {
      return "短链命中后直接跳转到目标页面，适合快速分发。";
    }
    return "短链命中后由服务端代理返回内容，适合隐藏目标地址。";
  }, [proxyMode]);

  const pushLinks = (newLinks: ShortLink[]) => {
    setLinks((prev) => [...newLinks, ...prev]);
  };

  const handleSingleConvert = (url: string) => {
    pushLinks([createMockLink(url, "single", undefined, proxyMode)]);
  };

  const handleBatchConvert = (urls: string[]) => {
    const batchId = crypto.randomUUID();
    pushLinks(urls.map((url) => createMockLink(url, "batch", batchId, proxyMode)));
  };

  const handleFileConvert = (urls: string[]) => {
    const batchId = crypto.randomUUID();
    pushLinks(urls.map((url) => createMockLink(url, "file", batchId, proxyMode)));
  };

  return (
    <div className="cloak-page-bg">
      <div className="cloak-orb cloak-orb-a" />
      <div className="cloak-orb cloak-orb-b" />

      <div className="cloak-page-container">
        <Header
          proxyMode={proxyMode}
          onToggleProxyMode={() => setProxyMode((prev) => (prev === "redirect" ? "proxy" : "redirect"))}
        />

        <main className="cloak-main-grid">
          <section className="cloak-convert-shell">
            <div className="cloak-section-title">
              <h2>{proxyMode === "redirect" ? "短链生成" : "反向代理短链"}</h2>
              <p>{modeDescription}</p>
            </div>

            <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "single" ? <SingleConvert onConvert={handleSingleConvert} /> : null}
            {activeTab === "batch" ? <BatchConvert onConvert={handleBatchConvert} /> : null}
            {activeTab === "file" ? <FileConvert onConvert={handleFileConvert} /> : null}
          </section>

          <HistoryTable links={links} />
        </main>
      </div>
    </div>
  );
}
