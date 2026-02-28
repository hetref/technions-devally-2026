"use client";

import { clsx } from "clsx";

export default function Divider({ props, styles, isSelected, onClick }) {
  const { thickness = 1, style: dividerStyle = "solid" } = props;

  return (
    <hr
      onClick={onClick}
      className={clsx("my-8", isSelected && "ring-2 ring-blue-500")}
      style={{
        borderWidth: `${thickness}px 0 0 0`,
        borderStyle: dividerStyle,
        borderColor: styles?.textColor || "#e5e7eb",
        marginTop: styles?.marginTop ? `${styles.marginTop}px` : undefined,
        marginBottom: styles?.marginBottom
          ? `${styles.marginBottom}px`
          : undefined,
        backgroundColor: "transparent",
      }}
    />
  );
}
