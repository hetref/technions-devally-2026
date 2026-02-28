"use client";

import { clsx } from "clsx";

export default function Hero({ props, styles, isSelected, onClick }) {
  const { title, subtitle, ctaText, ctaLink, backgroundImage, titleFontSize, titleColor, subtitleFontSize, subtitleColor } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative min-h-[500px] sm:min-h-[600px] flex items-center justify-center overflow-hidden",
        isSelected && "ring-4 ring-purple-500 ring-inset",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#fafafa",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "120px",
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : "120px",
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Decorative blurred background blobs if no background image */}
      {!backgroundImage && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl opacity-50 mix-blend-multiply" />
          <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-blue-400/20 to-teal-400/20 blur-3xl opacity-50 mix-blend-multiply" />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Subtle dynamic pill tag */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm mb-8 animate-fade-in-up"
          style={{ 
            borderColor: styles?.textColor ? `${styles.textColor}30` : 'rgba(0,0,0,0.1)',
            backgroundColor: styles?.textColor ? `${styles.textColor}05` : 'rgba(255,255,255,0.5)',
            color: styles?.textColor || '#374151'
          }}
        >
           <span className="flex w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
           <span className="text-xs font-semibold tracking-wide uppercase">Presenting your new website</span>
        </div>

        <h1
          className={clsx(
            "font-extrabold tracking-tight mb-6 leading-[1.1]",
            !titleFontSize && "text-5xl sm:text-6xl md:text-7xl"
          )}
          style={{
            fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
            color: titleColor || (backgroundImage ? "#ffffff" : (styles?.textColor || "#111827")),
            fontSize: titleFontSize ? `${titleFontSize}px` : undefined,
          }}
        >
          {title || "Build Beautiful Websites in Minutes"}
        </h1>
        
        <p
          className={clsx(
            "mb-10 max-w-2xl leading-relaxed",
            !subtitleFontSize && "text-lg sm:text-xl md:text-2xl"
          )}
          style={{
            color: subtitleColor || (backgroundImage ? "rgba(255,255,255,0.9)" : (styles?.textColor ? `${styles.textColor}e6` : "#4b5563")),
            fontSize: subtitleFontSize ? `${subtitleFontSize}px` : undefined,
            fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
          }}
        >
          {subtitle || "The all-in-one website builder that makes creating professional sites simple. No coding required."}
        </p>

        {ctaText && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <a
              href={ctaLink || "#"}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold transition-all duration-200 border border-transparent rounded-full hover:shadow-lg hover:-translate-y-0.5"
              style={{ 
                fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
                backgroundColor: styles?.textColor || '#111827',
                color: styles?.backgroundColor || '#ffffff'
              }}
            >
              <span className="relative z-10">{ctaText}</span>
              <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ ringColor: styles?.textColor || '#111827', ringOffsetColor: styles?.backgroundColor || '#ffffff' }} />
            </a>
            
             <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 font-bold transition-all duration-200 border rounded-full hover:shadow-md"
              style={{ 
                fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
                color: styles?.textColor || '#111827',
                borderColor: styles?.textColor ? `${styles.textColor}30` : '#e5e7eb',
                backgroundColor: 'transparent'
              }}
            >
              Learn more
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
