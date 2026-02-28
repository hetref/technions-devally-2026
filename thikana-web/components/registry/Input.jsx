"use client";

import { clsx } from "clsx";

export default function Input({ props, styles, isSelected, onClick }) {
  const { type = "text", placeholder, name, label, required = false } = props;

  return (
    <div
      onClick={onClick}
      className={clsx("mb-4", isSelected && "ring-2 ring-blue-500 rounded p-2")}
    >
      {label && (
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: styles?.textColor || "#374151" }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder || `Enter ${label || "text"}`}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        style={{
          backgroundColor: styles?.backgroundColor || "#ffffff",
          borderColor: styles?.borderColor || "#d1d5db",
          color: styles?.textColor || "#1f2937",
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
