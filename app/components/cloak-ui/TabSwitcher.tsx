import type { ReactNode } from "react";
import { FileText, Link2, List } from "lucide-react";
import { ConversionTab } from "./types";

interface TabSwitcherProps {
  activeTab: ConversionTab;
  onChange: (tab: ConversionTab) => void;
}

const TABS: Array<{ id: ConversionTab; label: string; icon: ReactNode }> = [
  { id: "single", label: "单链转换", icon: <Link2 size={16} /> },
  { id: "batch", label: "批量转换", icon: <List size={16} /> },
  { id: "file", label: "文件上传", icon: <FileText size={16} /> },
];

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps) {
  return (
    <div className="cloak-tab-shell">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`cloak-tab-button ${activeTab === tab.id ? "is-active" : ""}`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
