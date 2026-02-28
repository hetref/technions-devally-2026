"use client";

import { clsx } from "clsx";

export default function Hero({ props, styles, isSelected, onClick }) {
  const { title, subtitle, ctaText, ctaLink, backgroundImage } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative min-h-[300px] sm:min-h-[400px] flex items-center justify-center",
        isSelected && "ring-4 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#f3f4f6",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "60px",
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : "60px",
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4"
          style={{
            color: styles?.textColor || "#1f2937",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          {title || "Your Hero Title"}
        </h1>
        <p
          className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8"
          style={{
            color: styles?.textColor || "#4b5563",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          {subtitle || "Your hero subtitle goes here"}
        </p>
        {ctaText && (
          <button 
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            style={{
              fontFamily: styles?.fontFamily || 'inherit',
            }}
          >
            {ctaText}
          </button>
        )}
      </div>
    </div>
  );
}
