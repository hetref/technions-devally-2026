"use client";

import { clsx } from "clsx";

export default function Label({ props, styles, isSelected, onClick }) {
  const { text, htmlFor } = props;

  return (
    <label
      htmlFor={htmlFor}
      onClick={onClick}
      className={clsx(
        "block text-sm font-medium mb-2",
        isSelected && "ring-2 ring-blue-500 rounded px-2 py-1",
      )}
      style={{
        color: styles?.textColor || "#374151",
        fontSize: styles?.fontSize ? `${styles.fontSize}px` : undefined,
      }}
    >
      {text || "Label Text"}
    </label>
  );
}
