"use client";

import { clsx } from "clsx";

export default function Link({ props, styles, isSelected, onClick }) {
  const { text, href, openInNewTab = false } = props;

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
        "text-blue-600 hover:text-blue-800 underline transition-colors",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
        color: styles?.textColor,
        textAlign: styles?.textAlign,
        backgroundColor: styles?.backgroundColor,
        fontSize: styles?.fontSize ? `${styles.fontSize}px` : undefined,
      }}
    >
      {text || "Link Text"}
    </a>
  );
}
