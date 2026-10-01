import { useState, useRef } from 'react';
import { UploadCloud, Download, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';

export function ImageConverterTool() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<number>(85);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setOriginalSize(selected.size);
    const objUrl = URL.createObjectURL(selected);
    setOriginalUrl(objUrl);

    await processConversion(selected, quality);
  };

  const processConversion = async (imageFile: File, q: number) => {
    setConverting(true);
    try {
      const img = new Image();
      const tempUrl = URL.createObjectURL(imageFile);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = tempUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context error');
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', q / 100);
      });

      URL.revokeObjectURL(tempUrl);

      if (blob) {
        setConvertedSize(blob.size);
        if (convertedUrl) URL.revokeObjectURL(convertedUrl);
        setConvertedUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConverting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
  };

  const savings = originalSize > 0 && convertedSize > 0
    ? Math.round(((originalSize - convertedSize) / originalSize) * 100)
    : 0;

  return (
    <div className="border border-[#34343c] bg-[#0b0b10] p-6 font-mono text-xs text-[#d0d0d6]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#26262e]">
        <div>
          <h2 className="text-lg font-bold text-white mb-1 font-sans">
            WebP & Image Optimizer
          </h2>
          <p className="text-[11px] text-[#73737d] m-0">
            Локальное сжатие изображений в формат WebP нового поколения. Работает на 100% в браузере.
          </p>
        </div>
        <span className="px-2.5 py-1 border border-[#3b3b45] text-[#bd5aff] text-[9px] uppercase tracking-wider">
          Offline Tool
        </span>
      </div>

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#3a3a46] hover:border-[#8a00ff] bg-[#08080c] p-10 text-center cursor-pointer transition-colors"
        >
          <UploadCloud size={36} className="mx-auto mb-3 text-[#8a00ff]" />
          <strong className="text-white text-sm block mb-1">Выберите или перетащите изображение</strong>
          <span className="text-[#686872] text-[10px]">PNG, JPG, SVG, WebP до 50 МБ</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelectFile}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Image Preview */}
            <div className="border border-[#282830] bg-[#08080c] p-3 text-center">
              <div className="text-[10px] text-[#777] mb-2">ПРЕДПРОСМОТР РЕЗУЛЬТАТА</div>
              <div className="h-52 flex items-center justify-center bg-black/40 overflow-hidden">
                {convertedUrl ? (
                  <img src={convertedUrl} alt="Optimized" className="max-h-full object-contain" />
                ) : (
                  <ImageIcon size={32} className="text-[#444]" />
                )}
              </div>
            </div>

            {/* Controls & Metrics */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white">Качество WebP:</span>
                  <span className="text-[#bd5aff] font-bold">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setQuality(q);
                    if (file) void processConversion(file, q);
                  }}
                  className="w-full accent-[#8a00ff]"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 border border-[#2a2a34] bg-[#07070b] p-3 text-center">
                <div>
                  <div className="text-[9px] text-[#666]">ИСХОДНЫЙ</div>
                  <div className="text-white font-bold">{formatSize(originalSize)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#666]">WEBP</div>
                  <div className="text-white font-bold">{formatSize(convertedSize)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#666]">ЭКОНОМИЯ</div>
                  <div className={`font-bold ${savings > 0 ? 'text-[#48ff89]' : 'text-white'}`}>
                    {savings > 0 ? `-${savings}%` : '0%'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={convertedUrl || '#'}
                  download={`${file.name.replace(/\.[^.]+$/, '')}-optimized.webp`}
                  className={`ui-button primary flex-1 ${!convertedUrl ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Download size={14} />
                  СКАЧАТЬ WEBP
                </a>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ui-button ghost"
                  title="Загрузить другой файл"
                >
                  <RefreshCw size={14} />
                  ДРУГОЙ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
