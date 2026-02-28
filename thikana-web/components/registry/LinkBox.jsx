"use client";

import { clsx } from "clsx";
import { ExternalLink } from "lucide-react";

export default function LinkBox({ props, styles, isSelected, onClick }) {
  const { title, description, href, openInNewTab = false } = props;

  return (
    <a
      href={href || "#"}
      target={openInNewTab ? "_blank" : "_self"}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
      className={clsx(
        "block p-6 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-400 transition-all duration-200",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        borderColor: styles?.borderColor,
        padding: styles?.padding ? `${styles.padding}px` : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: styles?.textColor || "#1f2937" }}
          >
            {title || "Link Title"}
          </h3>
          <p
            className="text-sm"
            style={{
              color: styles?.textColor ? `${styles.textColor}cc` : "#6b7280",
            }}
          >
            {description || "Click to navigate"}
          </p>
        </div>
        {openInNewTab && <ExternalLink size={18} className="text-gray-400" />}
      </div>
    </a>
  );
}
