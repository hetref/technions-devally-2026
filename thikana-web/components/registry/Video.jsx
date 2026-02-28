"use client";

import { clsx } from "clsx";
import { Play } from "lucide-react";
import { useMemo } from "react";

export default function Video({ props, styles, isSelected, onClick }) {
  const { url, type = "youtube", autoplay = false, controls = true } = props;

  const embedUrl = useMemo(() => {
    if (!url || !url.trim()) return null;

    if (type === "youtube") {
      // Extract YouTube video ID from various URL formats
      const regExp =
        /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=${controls ? 1 : 0}`;
      }
      return null;
    } else if (type === "vimeo") {
      const regExp = /vimeo\.com\/(\d+)/;
      const match = url.match(regExp);
      const videoId = match ? match[1] : null;
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}`;
      }
      return null;
    }
    return url;
  }, [url, type, autoplay, controls]);

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden rounded-lg",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        aspectRatio: "16/9",
        backgroundColor: styles?.backgroundColor || "#000000",
      }}
    >
      {embedUrl ? (
        <>
          <iframe
            src={embedUrl}
            className="w-full h-full absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video player"
            style={{ pointerEvents: isSelected ? "auto" : "none" }}
          />
          {!isSelected && <div className="absolute inset-0 cursor-pointer" />}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
          <Play size={48} className="mb-2 opacity-50" />
          <p className="text-sm opacity-75">
            {url ? "Invalid video URL" : "Enter a video URL in properties"}
          </p>
        </div>
      )}
    </div>
  );
}
