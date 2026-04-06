import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImageOff, X } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

export default function ComplaintThumbnail({
  src,
  alt,
  className = '',
  emptyLabel = 'No image',
  openInNewTab = false,
}) {
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const resolvedSrc = resolveMediaUrl(src);

  useEffect(() => {
    if (!previewOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreviewOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewOpen]);

  if (!resolvedSrc || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-400`}>
        <ImageOff size={18} aria-hidden="true" />
        <span className="sr-only">{emptyLabel}</span>
      </div>
    );
  }

  const handlePreviewOpen = (event) => {
    if (!openInNewTab) return;
    event.preventDefault();
    event.stopPropagation();
    setPreviewOpen(true);
  };

  const image = (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`${className}${openInNewTab ? ' cursor-zoom-in transition hover:opacity-95' : ''}`}
      onError={() => setFailed(true)}
      onClick={handlePreviewOpen}
    />
  );

  if (!openInNewTab) return image;

  return (
    <>
      {image}
      {previewOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            aria-label="Close image preview"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewOpen(false);
            }}
          >
            <X size={22} />
          </button>
          <div className="max-h-full max-w-full" onClick={(event) => event.stopPropagation()}>
            <img
              src={resolvedSrc}
              alt={alt}
              className="max-h-[90vh] max-w-[92vw] rounded-2xl bg-white object-contain shadow-2xl"
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
