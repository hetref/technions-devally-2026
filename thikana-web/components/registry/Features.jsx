"use client";

import { clsx } from "clsx";

export default function Features({ props, styles, isSelected, onClick }) {
  const { title, items = [] } = props;

  const defaultItems = items.length
    ? items
    : [
        { title: "Feature 1", description: "Description of feature 1", icon: "⚡" },
        { title: "Feature 2", description: "Description of feature 2", icon: "🔒" },
        { title: "Feature 3", description: "Description of feature 3", icon: "💡" },
      ];

  return (
    <div
      onClick={onClick}
      className={clsx("py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative", isSelected && "ring-4 ring-purple-500 ring-inset")}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {title && (
          <div className="text-center mb-16 sm:mb-20">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ 
                color: styles?.textColor || "#111827",
                fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
              }}
            >
              {title}
            </h2>
            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
          {defaultItems.map((item, index) => (
            <div 
              key={index} 
              className="group relative flex flex-col p-8 rounded-2xl shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{
                backgroundColor: styles?.textColor ? `${styles.textColor}08` : '#ffffff',
                borderColor: styles?.textColor ? `${styles.textColor}15` : '#f3f4f6',
              }}
            >
              {/* Subtle background glow effect on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none" 
                style={{ backgroundColor: styles?.textColor || '#000000' }}
              />
              
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-100 text-purple-600 mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">{item.icon || "✨"}</span>
                </div>
                
                <h3
                  className="text-xl font-bold mb-3 tracking-tight"
                  style={{ 
                    color: styles?.textColor || "#111827",
                    fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
                  }}
                >
                  {item.title}
                </h3>
                
                <p
                  className="text-base leading-relaxed"
                  style={{
                    color: styles?.textColor ? `${styles.textColor}e6` : "#6b7280",
                    fontFamily: styles?.fontFamily || '"Inter", system-ui, sans-serif',
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
