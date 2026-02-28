'use client';

import AIGenerateButton from './AIGenerateButton';

export default function InputFieldWithAI({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  componentType,
  fieldName,
  businessType,
  showAI = true,
  multiline = false,
  rows = 3
}) {
  const InputComponent = multiline ? 'textarea' : 'input';
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <InputComponent
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={multiline ? rows : undefined}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {showAI && componentType && fieldName && (
          <AIGenerateButton
            componentType={componentType}
            fieldName={fieldName}
            businessType={businessType}
            onGenerate={onChange}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
