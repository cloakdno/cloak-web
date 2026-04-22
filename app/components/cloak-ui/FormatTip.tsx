import { CircleAlert } from "lucide-react";

export function FormatTip() {
  return (
    <div className="cloak-tip">
      <CircleAlert size={16} />
      <p>
        链接建议使用 http:// 或 https:// 开头。批量/文件模式默认一行一个链接，便于后续 API
        直接处理。
      </p>
    </div>
  );
}
