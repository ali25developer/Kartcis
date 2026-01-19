import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SponsorBannerProps {
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
  variant?: "horizontal" | "square" | "wide";
}

export function SponsorBanner({
  image,
  title,
  subtitle,
  link,
  variant = "horizontal",
}: SponsorBannerProps) {
  const variantClasses = {
    horizontal: "aspect-[4/1]",
    square: "aspect-square",
    wide: "aspect-[16/5]",
  };

  const content = (
    <div className="relative group overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md transition-all">
      <div className={`relative w-full ${variantClasses[variant]}`}>
        <ImageWithFallback
          src={image}
          alt={title || "Sponsor"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {(title || subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
          {title && <p className="font-semibold mb-1">{title}</p>}
          {subtitle && <p className="text-sm text-gray-200">{subtitle}</p>}
        </div>
      )}
    </div>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}