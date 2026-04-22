import { ArrowRight, Link2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { isValidUrl, normalizeUrl } from "./mock";

interface SingleConvertProps {
  onConvert: (url: string) => void;
}

export function SingleConvert({ onConvert }: SingleConvertProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeUrl(url);

    if (!normalized) {
      setError("请输入链接");
      return;
    }

    if (!isValidUrl(normalized)) {
      setError("请输入有效链接");
      return;
    }

    setError("");
    onConvert(normalized);
    setUrl("");
  };

  return (
    <form className="cloak-panel" onSubmit={submit}>
      <div className="cloak-input-row">
        <div className="cloak-input-icon">
          <Link2 size={18} />
        </div>
        <input
          type="text"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) {
              setError("");
            }
          }}
          placeholder="在此粘贴长链接（如：https://example.com/campaign/abc）"
          className={`cloak-input ${error ? "has-error" : ""}`}
        />
        <button type="submit" className="cloak-primary-button" disabled={!url.trim()}>
          转换 <ArrowRight size={16} />
        </button>
      </div>
      {error ? <p className="cloak-error-text">{error}</p> : null}
    </form>
  );
}
