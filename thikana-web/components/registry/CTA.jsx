"use client";

import { clsx } from "clsx";

export default function CTA({ props, styles, isSelected, onClick }) {
  const { title, description, buttonText, buttonLink } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "py-16 sm:py-24 px-4 sm:px-6 lg:px-8",
        isSelected && "ring-4 ring-purple-500 ring-inset",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div 
          className="relative overflow-hidden rounded-3xl shadow-2xl"
          style={{
             backgroundColor: styles?.textColor ? `${styles.textColor}08` : '#111827',
             border: `1px solid ${styles?.textColor ? `${styles.textColor}15` : 'transparent'}`
          }}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />
             <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-l from-pink-500/10 to-orange-400/10 blur-3xl rounded-full" />
             <div 
                className="absolute inset-0" 
                style={{ backgroundColor: styles?.textColor ? `${styles.textColor}05` : 'transparent' }} 
             />
          </div>

          <div className="relative px-6 py-16 sm:px-16 sm:py-20 flex flex-col items-center text-center">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6"
              style={{ 
                color: styles?.textColor || "#ffffff",
                fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
              }}
            >
              {title || "Ready to Get Started?"}
            </h2>
            
            <p
              className="text-lg sm:text-xl mb-10 max-w-2xl leading-relaxed"
              style={{ 
                color: styles?.textColor ? `${styles.textColor}e6` : "#d1d5db",
                fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
              }}
            >
              {description || "Join us today and experience the difference"}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href={buttonLink || "#"}
                className="group relative inline-flex items-center justify-center px-10 py-4 font-bold rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
                  backgroundColor: styles?.textColor || '#ffffff',
                  color: styles?.backgroundColor || '#111827',
                  boxShadow: styles?.textColor ? `0 10px 15px -3px ${styles.textColor}30` : undefined
                }}
              >
                <span>{buttonText || "Get Started"}</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
