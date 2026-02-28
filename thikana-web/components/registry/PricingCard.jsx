"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";

export default function PricingCard({ props, styles, isSelected, onClick }) {
  const { 
    title, 
    price, 
    period = "month",
    description,
    features = [],
    buttonText,
    highlighted = false 
  } = props;

  const defaultFeatures = features.length ? features : [
    "Feature 1",
    "Feature 2",
    "Feature 3",
    "Feature 4"
  ];

  return (
    <div
      onClick={onClick}
      className={clsx(
        "p-6 sm:p-8 rounded-xl border-2 transition-all duration-300",
        highlighted ? "border-blue-500 shadow-xl scale-105" : "border-gray-200 shadow-lg hover:shadow-xl",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
        fontFamily: styles?.fontFamily || 'inherit',
      }}
    >
      {highlighted && (
        <div 
          className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 text-center py-1 px-3 rounded-full inline-block"
          style={{
            backgroundColor: styles?.textColor || "#3b82f6",
            color: "#ffffff",
          }}
        >
          Most Popular
        </div>
      )}

      {/* Title */}
      <h3
        className="text-xl sm:text-2xl font-bold mb-2"
        style={{
          color: styles?.textColor || "#1f2937",
          fontFamily: styles?.fontFamily || 'inherit',
        }}
      >
        {title || "Basic Plan"}
      </h3>

      {/* Description */}
      {description && (
        <p
          className="text-sm sm:text-base mb-4 opacity-75"
          style={{
            color: styles?.textColor || "#6b7280",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          {description}
        </p>
      )}

      {/* Price */}
      <div className="mb-6">
        <span
          className="text-4xl sm:text-5xl font-bold"
          style={{
            color: styles?.textColor || "#1f2937",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          ${price || "29"}
        </span>
        <span
          className="text-base sm:text-lg opacity-75 ml-2"
          style={{
            color: styles?.textColor || "#6b7280",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          /{period}
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {defaultFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 sm:gap-3">
            <Check 
              className="flex-shrink-0 mt-0.5" 
              size={18}
              style={{ color: styles?.textColor || "#10b981" }}
            />
            <span
              className="text-sm sm:text-base"
              style={{
                color: styles?.textColor || "#374151",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        className="w-full py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
        style={{
          backgroundColor: highlighted ? (styles?.textColor || "#3b82f6") : "transparent",
          color: highlighted ? "#ffffff" : (styles?.textColor || "#3b82f6"),
          border: `2px solid ${styles?.textColor || "#3b82f6"}`,
          fontFamily: styles?.fontFamily || 'inherit',
        }}
      >
        {buttonText || "Get Started"}
      </button>
    </div>
  );
}
