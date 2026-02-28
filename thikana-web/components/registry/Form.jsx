"use client";

import { clsx } from "clsx";

export default function Form({ props, styles, isSelected, onClick }) {
  const { action, method = "POST", name } = props;

  return (
    <form
      action={action || "#"}
      method={method}
      name={name}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
      className={clsx(
        "space-y-4",
        isSelected && "ring-2 ring-blue-500 rounded p-4",
      )}
      style={{
        padding: styles?.padding ? `${styles.padding}px` : "24px",
        backgroundColor: styles?.backgroundColor,
        borderRadius: styles?.borderRadius ? `${styles.borderRadius}px` : "8px",
      }}
    >
      <div className="text-gray-500 text-sm">
        Form Container - Add form inputs here
      </div>
    </form>
  );
}
