"use client";

import { clsx } from "clsx";

export default function Features({ props, styles, isSelected, onClick }) {
  const { title, items = [] } = props;

  const defaultItems = items.length
    ? items
    : [
        { title: "Feature 1", description: "Description of feature 1" },
        { title: "Feature 2", description: "Description of feature 2" },
        { title: "Feature 3", description: "Description of feature 3" },
      ];

  return (
    <div
      onClick={onClick}
      className={clsx("py-8 sm:py-12 px-4 sm:px-6 lg:px-8", isSelected && "ring-2 ring-blue-500")}
      style={{
        backgroundColor: styles?.backgroundColor,
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
      }}
    >
      {title && (
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12"
          style={{ 
            color: styles?.textColor || "#1f2937",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
        {defaultItems.map((item, index) => (
          <div key={index} className="text-center px-2">
            <h3
              className="text-lg sm:text-xl font-semibold mb-2"
              style={{ 
                color: styles?.textColor || "#1f2937",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {item.title}
            </h3>
            <p
              className="text-sm sm:text-base"
              style={{
                color: styles?.textColor ? `${styles.textColor}cc` : "#4b5563",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
