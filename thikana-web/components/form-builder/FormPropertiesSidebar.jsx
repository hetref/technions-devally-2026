/**
 * RIGHT SIDEBAR - Field Properties Editor
 */

'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import useFormBuilderStore from '@/lib/stores/formBuilderStore';
import { FIELD_WIDTHS } from '@/lib/form-schema';

export default function FormPropertiesSidebar() {
  // Use individual selectors to ensure re-render on changes
  const selectedFieldId = useFormBuilderStore((state) => state.selectedFieldId);
  const formDataFields = useFormBuilderStore((state) => state.formData.fields);
  const updateField = useFormBuilderStore((state) => state.updateField);
  const selectField = useFormBuilderStore((state) => state.selectField);
  
  // Find selected field from the fields array
  const selectedField = formDataFields.find(f => f.id === selectedFieldId);

  // Debug logging
  console.log('FormPropertiesSidebar render:', {
    selectedFieldId,
    selectedField,
    fieldsCount: formDataFields?.length,
    fieldIds: formDataFields?.map(f => f.id)
  });

  if (!selectedField) {
    return (
      <div className="w-80 bg-[#fcfdfc] border-l border-gray-100 flex items-center justify-center p-8 z-10 shrink-0">
        <div className="text-center text-gray-400">
          <svg
            className="mx-auto h-12 w-12 mb-3 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Select a field to edit</p>
          {selectedFieldId && (
            <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-widest">
              Field ID Error
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white/80 backdrop-blur-md border-l border-gray-100 flex flex-col h-full min-h-0 z-10 shadow-sm relative shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#8bc4b1] mb-1">Editing</h2>
          <p className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">Properties</p>
        </div>
        <button
          onClick={() => selectField(null)}
          className="p-2 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-xl transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Properties Form */}
      <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={selectedField.label}
            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Placeholder */}
        {!['checkbox', 'radio', 'file'].includes(selectedField.type) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={selectedField.placeholder || ''}
              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Required */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedField.required}
              onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field Width
          </label>
          <select
            value={selectedField.width}
            onChange={(e) => updateField(selectedField.id, { width: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={FIELD_WIDTHS.FULL}>Full Width</option>
            <option value={FIELD_WIDTHS.HALF}>Half Width</option>
            <option value={FIELD_WIDTHS.THIRD}>Third Width</option>
          </select>
        </div>

        {/* Options for Select/Checkbox/Radio */}
        {['select', 'checkbox', 'radio'].includes(selectedField.type) && (
          <OptionsEditor field={selectedField} updateField={updateField} />
        )}

        {/* Layout for Checkbox/Radio */}
        {['checkbox', 'radio'].includes(selectedField.type) && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Layout
            </label>
            <select
              value={selectedField.layout || 'vertical'}
              onChange={(e) => updateField(selectedField.id, { layout: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>
        )}

        {/* Rows for Textarea */}
        {selectedField.type === 'textarea' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rows
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={selectedField.rows || 4}
              onChange={(e) => updateField(selectedField.id, { rows: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Validation Rules */}
        <ValidationEditor field={selectedField} updateField={updateField} />
      </div>
    </div>
  );
}

// Options Editor Component
function OptionsEditor({ field, updateField }) {
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (!newOption.trim()) return;
    
    const options = [...(field.options || [])];
    options.push({
      label: newOption.trim(),
      value: newOption.toLowerCase().replace(/\s+/g, '-')
    });
    
    updateField(field.id, { options });
    setNewOption('');
  };

  const removeOption = (index) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    updateField(field.id, { options });
  };

  const updateOption = (index, updates) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], ...updates };
    updateField(field.id, { options });
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Options
      </label>
      
      {/* Existing Options */}
      <div className="space-y-2 mb-2">
        {field.options?.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(index, { label: e.target.value })}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Option label"
            />
            <button
              onClick={() => removeOption(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Option */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addOption()}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="Add option..."
        />
        <button
          onClick={addOption}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

// Validation Editor Component
function ValidationEditor({ field, updateField }) {
  const validation = field.validation || {};

  const updateValidation = (key, value) => {
    updateField(field.id, {
      validation: { ...validation, [key]: value }
    });
  };

  return (
    <div className="pt-4 border-t border-gray-200">
      <h3 className="text-xs font-medium text-gray-700 mb-3">Validation</h3>
      
      {/* Text/Textarea validation */}
      {['text', 'textarea'].includes(field.type) && (
        <>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Min Length</label>
            <input
              type="number"
              min="0"
              value={validation.minLength || ''}
              onChange={(e) => updateValidation('minLength', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="No minimum"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Max Length</label>
            <input
              type="number"
              min="0"
              value={validation.maxLength || ''}
              onChange={(e) => updateValidation('maxLength', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="No maximum"
            />
          </div>
        </>
      )}

      {/* Number validation */}
      {field.type === 'number' && (
        <>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Min Value</label>
            <input
              type="number"
              value={validation.min || ''}
              onChange={(e) => updateValidation('min', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">Max Value</label>
            <input
              type="number"
              value={validation.max || ''}
              onChange={(e) => updateValidation('max', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}
