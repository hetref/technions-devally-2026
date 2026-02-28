"use client";

import { clsx } from "clsx";
import * as Icons from "lucide-react";

export default function Icon({ props, styles, isSelected, onClick }) {
  const { name = "Star", size = 24 } = props;

  // Get the icon component from lucide-react
  const IconComponent = Icons[name] || Icons.HelpCircle;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center",
        isSelected && "ring-2 ring-blue-500 rounded",
      )}
      style={{
        padding: styles?.padding ? `${styles.padding}px` : "8px",
        backgroundColor: styles?.backgroundColor,
        borderRadius: styles?.borderRadius
          ? `${styles.borderRadius}px`
          : undefined,
      }}
    >
      <IconComponent
        size={size}
        style={{
          color: styles?.textColor || "#1f2937",
        }}
      />
    </div>
  );
}
