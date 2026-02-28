"use client";

import { clsx } from "clsx";

export default function Checkbox({ props, styles, isSelected, onClick }) {
  const { label, name, checked = false, required = false } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center mb-3",
        isSelected && "ring-2 ring-blue-500 rounded p-2",
      )}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        required={required}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        style={{
          accentColor: styles?.accentColor || "#3b82f6",
        }}
        onClick={(e) => e.stopPropagation()}
      />
      {label && (
        <label
          className="ml-2 text-sm cursor-pointer"
          style={{ color: styles?.textColor || "#374151" }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
    </div>
  );
}
