"use client";

import { clsx } from "clsx";

export default function Footer({ props, styles, isSelected, onClick }) {
  const { copyright, links = [] } = props;

  return (
    <footer
      onClick={onClick}
      className={clsx(
        "px-4 sm:px-6 py-6 sm:py-8 text-center",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#1f2937",
        color: styles?.textColor || "#ffffff",
        fontFamily: styles?.fontFamily || 'inherit',
      }}
    >
      {links.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-4">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="hover:text-blue-400 transition-colors text-sm sm:text-base"
              style={{
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
      <p 
        className="text-xs sm:text-sm"
        style={{
          fontFamily: styles?.fontFamily || 'inherit',
        }}
      >
        {copyright || "© 2026 Your Company. All rights reserved."}
      </p>
    </footer>
  );
}
