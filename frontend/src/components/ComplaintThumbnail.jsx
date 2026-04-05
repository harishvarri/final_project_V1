import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

export default function ComplaintThumbnail({
  src,
  alt,
  className = '',
  emptyLabel = 'No image',
  openInNewTab = false,
}) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveMediaUrl(src);

  if (!resolvedSrc || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-400`}>
        <ImageOff size={18} aria-hidden="true" />
        <span className="sr-only">{emptyLabel}</span>
      </div>
    );
  }

  const image = (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );

  if (!openInNewTab) return image;

  return (
    <a href={resolvedSrc} target="_blank" rel="noreferrer" className="inline-block">
      {image}
    </a>
  );
}
