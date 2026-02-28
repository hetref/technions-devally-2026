"use client";

import { clsx } from "clsx";

export default function ImageBox({ props, styles, isSelected, onClick }) {
  const { src, alt, caption, aspectRatio = "16/9" } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden rounded-lg",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#f3f4f6",
      }}
    >
      <div style={{ aspectRatio }}>
        {src ? (
          <img
            src={src}
            alt={alt || "Image"}
            className="w-full h-full object-cover"
            style={{
              objectFit: styles?.objectFit || "cover",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-400">No image selected</p>
          </div>
        )}
      </div>
      {caption && (
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{
            backgroundColor: styles?.overlayColor || "rgba(0, 0, 0, 0.7)",
          }}
        >
          <p
            className="text-sm"
            style={{ color: styles?.textColor || "#ffffff" }}
          >
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}
