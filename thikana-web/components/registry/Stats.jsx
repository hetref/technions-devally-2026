"use client";

import { clsx } from "clsx";

export default function Stats({ props, styles, isSelected, onClick }) {
  const { stats = [] } = props;

  const defaultStats = stats.length ? stats : [
    { number: "10K+", label: "Active Users" },
    { number: "50+", label: "Countries" },
    { number: "99%", label: "Satisfaction" },
    { number: "24/7", label: "Support" },
  ];

  return (
    <div
      onClick={onClick}
      className={clsx(
        "py-8 sm:py-12 px-4 sm:px-6",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#f9fafb",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
        fontFamily: styles?.fontFamily || 'inherit',
      }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
        {defaultStats.map((stat, index) => (
          <div key={index} className="text-center">
            <div
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
              style={{
                color: styles?.textColor || "#3b82f6",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {stat.number}
            </div>
            <div
              className="text-sm sm:text-base md:text-lg opacity-75"
              style={{
                color: styles?.textColor || "#6b7280",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
