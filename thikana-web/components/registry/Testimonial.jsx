"use client";

import { clsx } from "clsx";
import { Quote } from "lucide-react";

export default function Testimonial({ props, styles, isSelected, onClick }) {
  const { quote, author, role, company, avatar } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "p-6 sm:p-8 rounded-xl shadow-lg",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
        fontFamily: styles?.fontFamily || 'inherit',
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Quote Icon */}
        <Quote 
          className="text-blue-500 opacity-50" 
          size={32}
          style={{ color: styles?.textColor || "#3b82f6" }}
        />
        
        {/* Quote Text */}
        <p
          className="text-base sm:text-lg leading-relaxed"
          style={{
            color: styles?.textColor || "#374151",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          "{quote || "This product has completely transformed how we work. Highly recommended!"}"
        </p>

        {/* Author Info */}
        <div className="flex items-center gap-3 sm:gap-4 mt-2">
          {avatar && (
            <img
              src={avatar}
              alt={author || "Author"}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
            />
          )}
          <div>
            <p
              className="font-semibold text-sm sm:text-base"
              style={{
                color: styles?.textColor || "#1f2937",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {author || "John Doe"}
            </p>
            <p
              className="text-xs sm:text-sm opacity-75"
              style={{
                color: styles?.textColor || "#6b7280",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {role || "CEO"}{company ? ` at ${company}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
