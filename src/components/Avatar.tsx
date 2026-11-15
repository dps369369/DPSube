import React, { useState } from 'react';
import defaultAvatarImg from '../assets/images/default_cuber_avatar_1794733637193.jpg';

interface AvatarProps {
  src?: string | null;
  alt: string;
  sizeClass?: string;
}

export function Avatar({ src, alt, sizeClass = 'w-9 h-9' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = !src || failed ? defaultAvatarImg : src;

  return (
    <div
      className={`${sizeClass} rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center`}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
