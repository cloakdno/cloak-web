import { ArrowRightLeft, Clock3, Globe, VenetianMask } from "lucide-react";
import { ProxyMode } from "./types";

interface HeaderProps {
  proxyMode: ProxyMode;
  onToggleProxyMode: () => void;
}

export function Header({ proxyMode, onToggleProxyMode }: HeaderProps) {
  return (
    <header className="cloak-header">
      <div className="cloak-brand">
        <div className="cloak-brand-icon">
          <VenetianMask size={22} />
        </div>
        <div>
          <p className="cloak-brand-title">Cloak</p>
          <p className="cloak-brand-subtitle">Short Link Studio</p>
        </div>
      </div>

      <div className="cloak-header-tools">
        <div className="cloak-expire-pill">
          <Clock3 size={14} />
          <span>试用到期：2026-05-22</span>
        </div>

        <button type="button" className="cloak-mode-pill" onClick={onToggleProxyMode}>
          {proxyMode === "redirect" ? <ArrowRightLeft size={14} /> : <Globe size={14} />}
          <span>{proxyMode === "redirect" ? "跳转模式" : "代理模式"}</span>
        </button>
      </div>
    </header>
  );
}
