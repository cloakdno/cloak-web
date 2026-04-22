import { ArrowRight, FileText, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { FormatTip } from "./FormatTip";
import { isValidUrl, normalizeUrl } from "./mock";

interface FileConvertProps {
  onConvert: (urls: string[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function FileConvert({ onConvert }: FileConvertProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const pickFile = (selected: File) => {
    if (!selected.name.endsWith(".txt")) {
      setError("仅支持 .txt 文件");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("文件大小不能超过 10MB");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const convert = () => {
    if (!file) {
      return;
    }

    setProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const raw = String(event.target?.result ?? "");
      const urls = raw
        .split(/\r?\n/)
        .map((line) => normalizeUrl(line))
        .filter(Boolean);

      if (!urls.length) {
        setError("文件中未找到有效链接");
        setProcessing(false);
        return;
      }

      if (urls.some((line) => !isValidUrl(line))) {
        setError("文件中包含无效链接");
        setProcessing(false);
        return;
      }

      setError("");
      onConvert(urls);
      setProcessing(false);
      clearFile();
    };

    reader.onerror = () => {
      setError("文件读取失败");
      setProcessing(false);
    };

    reader.readAsText(file);
  };

  return (
    <section className="cloak-panel">
      <FormatTip />

      {!file ? (
        <button type="button" className="cloak-upload-zone" onClick={() => inputRef.current?.click()}>
          <UploadCloud size={30} />
          <p>点击上传 .txt 文件</p>
          <span>每行一个链接，最大 10MB</span>
        </button>
      ) : (
        <div className="cloak-file-card">
          <button type="button" onClick={clearFile} className="cloak-file-close">
            <X size={16} />
          </button>
          <FileText size={28} />
          <p>{file.name}</p>
          <span>{(file.size / 1024).toFixed(2)} KB</span>
          <button type="button" onClick={convert} className="cloak-primary-button" disabled={processing}>
            {processing ? "处理中" : "转换文件"} <ArrowRight size={16} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        className="cloak-hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) {
            pickFile(selected);
          }
        }}
      />

      {error ? <p className="cloak-error-text">{error}</p> : null}
    </section>
  );
}
