import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { FormatTip } from "./FormatTip";
import { isValidUrl, normalizeUrl } from "./mock";

interface BatchConvertProps {
  onConvert: (urls: string[]) => void;
}

export function BatchConvert({ onConvert }: BatchConvertProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const lines = useMemo(
    () => content.split("\n").map((line) => line.trim()).filter(Boolean),
    [content],
  );

  const submit = () => {
    if (!lines.length) {
      setError("请至少输入一条链接");
      return;
    }

    const normalized = lines.map(normalizeUrl);
    const invalidIndex = normalized.findIndex((line) => !isValidUrl(line));

    if (invalidIndex >= 0) {
      setError(`第 ${invalidIndex + 1} 行格式有误`);
      return;
    }

    setError("");
    onConvert(normalized);
    setContent("");
  };

  return (
    <section className="cloak-panel">
      <FormatTip />

      <textarea
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          if (error) {
            setError("");
          }
        }}
        placeholder="每行输入一个链接，支持粘贴大批量 URL"
        className="cloak-textarea"
      />

      <div className="cloak-panel-footer">
        <span className="cloak-counter">{lines.length} 条</span>
        <button type="button" onClick={submit} className="cloak-primary-button" disabled={!lines.length}>
          批量转换 <ArrowRight size={16} />
        </button>
      </div>

      {error ? <p className="cloak-error-text">{error}</p> : null}
    </section>
  );
}
