import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ComicPage } from '../../types/comic';
import { resolvePageImageUrl, resolvePagePreviewUrl } from '../../services/page-source-utils';

type RenderedPageImageProps = {
  page: ComicPage;
  alt: string;
  className?: string;
  style?: CSSProperties;
  preferThumbnail?: boolean;
};

export const RenderedPageImage: React.FC<RenderedPageImageProps> = ({
  page,
  alt,
  className,
  style,
  preferThumbnail = false,
}) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const nextSrc = preferThumbnail
        ? await resolvePagePreviewUrl(page)
        : await resolvePageImageUrl(page, false);
      if (active) {
        setSrc(nextSrc);
      }
    };
    load().catch((error) => {
      console.error('Failed to resolve page image', error);
      if (active) {
        setSrc('');
      }
    });

    return () => {
      active = false;
    };
  }, [page, preferThumbnail]);

  if (!src) {
    return <div className={className} style={style} />;
  }

  return <img src={src} alt={alt} className={className} style={style} />;
};
