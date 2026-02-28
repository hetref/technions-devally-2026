"use client";

import { clsx } from "clsx";

export default function Select({ props, styles, isSelected, onClick }) {
  const {
    options = [],
    name,
    label,
    required = false,
    placeholder = "Select an option",
  } = props;

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
      <select
        name={name}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer"
        style={{
          backgroundColor: styles?.backgroundColor || "#ffffff",
          borderColor: styles?.borderColor || "#d1d5db",
          color: styles?.textColor || "#1f2937",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );
}
