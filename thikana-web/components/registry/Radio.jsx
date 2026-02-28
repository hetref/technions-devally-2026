"use client";

import { clsx } from "clsx";

export default function Radio({ props, styles, isSelected, onClick }) {
  const { options = [], name, label, required = false } = props;

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
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center">
            <input
              type="radio"
              id={`${name}-${index}`}
              name={name}
              value={option.value || option}
              required={required && index === 0}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              style={{
                accentColor: styles?.accentColor || "#3b82f6",
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <label
              htmlFor={`${name}-${index}`}
              className="ml-2 text-sm cursor-pointer"
              style={{ color: styles?.textColor || "#374151" }}
            >
              {option.label || option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
