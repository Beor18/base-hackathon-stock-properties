"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { isOptimizable } from "./api";

type ListingImageProps = Omit<ImageProps, "src" | "unoptimized"> & { src: string };

/**
 * Listing photo with a safe path: optimized when the host allows it; if that fails (listing
 * hosts can be slow), it retries straight from the source, and as a last resort draws a house.
 */
export function ListingImage({ src, alt, className, onLoad, ...props }: ListingImageProps) {
  const [attempt, setAttempt] = useState<{ src: string; level: 0 | 1 | 2 }>({ src, level: 0 });
  const level = attempt.src === src ? attempt.level : 0;

  if (level === 2) {
    return (
      <span role={alt ? "img" : undefined} aria-label={alt || undefined} className="absolute inset-0 flex items-center justify-center bg-surface-2 text-line-strong">
        <svg viewBox="0 0 64 64" className="size-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 30L32 14l20 16M18 26v24h28V26" />
          <path d="M27 50V39a5 5 0 0 1 10 0v11" />
        </svg>
      </span>
    );
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      unoptimized={level === 1 || !isOptimizable(src)}
      onLoad={onLoad}
      onError={() => setAttempt({ src, level: level === 0 && isOptimizable(src) ? 1 : 2 })}
    />
  );
}
