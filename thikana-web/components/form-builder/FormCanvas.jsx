/**
 * CENTER CANVAS - Form Preview & Field Management
 */

'use client';

import { useState, useRef } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import useFormBuilderStore from '@/lib/stores/formBuilderStore';
import { FIELD_WIDTHS } from '@/lib/form-schema';

export default function FormCanvas() {
  const { formData, selectedFieldId, selectField, removeField, reorderFields } = useFormBuilderStore();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragCounter = useRef(0);

  const getFieldWidthClass = (width) => {
    switch (width) {
      case FIELD_WIDTHS.HALF:
        return 'w-1/2';
      case FIELD_WIDTHS.THIRD:
        return 'w-1/3';
      default:
        return 'w-full';
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a transparent drag image to hide the default preview
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderFields(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderFieldPreview = (field, index) => {
    const isSelected = selectedFieldId === field.id;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;
    
    return (
      <div
        key={field.id}
        className={`${getFieldWidthClass(field.width)} p-2`}
      >
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Field clicked:', field.id, field.label);
            selectField(field.id);
          }}
          className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
            isSelected
              ? 'border-[#8bc4b1] bg-[#f2f4f2] shadow-md'
              : isDragOver
              ? 'border-[#d3ff4a] bg-[#fcfdfc]'
              : 'border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-gray-200'
          } ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
        >
          {/* Drag Handle */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 cursor-move hover:text-[#8bc4b1] transition-colors p-2">
            <GripVertical size={20} />
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeField(field.id);
            }}
            className={`absolute right-4 top-4 p-2 rounded-xl transition-all ${isSelected ? 'bg-white text-red-500 shadow-sm hover:bg-red-50 hover:text-red-700' : 'text-gray-300 hover:text-red-500'}`}
          >
            <Trash2 size={16} />
          </button>

          {/* Field Label */}
          <div className="mb-3 pl-8">
            <label className="block text-sm font-black text-[#1d2321] tracking-tight uppercase">
              {field.label}
              {field.required && <span className="text-[#8bc4b1] ml-1">*</span>}
            </label>
          </div>

          {/* Field Input Preview */}
          <div className="pl-8 pointer-events-none opacity-80">
            {renderInputPreview(field)}
          </div>

          {/* Field Type Badge */}
          <div className="absolute bottom-4 right-4">
            <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 bg-[#0b1411] text-[#d3ff4a] rounded-lg shadow-sm">
              {field.type}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderInputPreview = (field) => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={field.rows || 4}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          />
        );

      case 'select':
        return (
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          >
            <option>{field.placeholder || 'Select an option'}</option>
            {field.options?.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className={`space-${field.layout === 'horizontal' ? 'x' : 'y'}-2 ${field.layout === 'horizontal' ? 'flex' : ''}`}>
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" disabled className="rounded" />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className={`space-${field.layout === 'horizontal' ? 'x' : 'y'}-2 ${field.layout === 'horizontal' ? 'flex' : ''}`}>
            {field.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="radio" name={field.id} disabled />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center bg-gray-50">
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
          />
        );
    }
  };

  return (
    <div data-lenis-prevent className="flex-1 h-full min-h-0 min-w-0 bg-[#fcfdfc] overflow-y-auto relative flex flex-col">
      <div className="absolute inset-0 min-h-full bg-[#fefefe] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60 -z-10" />
      <div className="w-full max-w-4xl mx-auto p-6 sm:p-10 relative z-10 my-4 sm:my-8 flex-1">
        {/* Form Container */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-14">
          {/* Form Title */}
          <div className="mb-10 pb-8 border-b border-gray-100">
            <h1 className="text-4xl font-black text-[#1d2321] tracking-tighter uppercase">{formData.name}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8bc4b1] mt-2">
              {formData.fields.length} component{formData.fields.length !== 1 ? 's' : ''} mapped
            </p>
          </div>

          {/* Fields */}
          {formData.fields.length === 0 ? (
            <div className="text-center py-20 bg-[#fcfdfc] border-2 border-dashed border-gray-200 rounded-[2rem] shadow-inner">
              <div className="text-gray-300 mb-6 flex justify-center opacity-50">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-black text-[#1d2321] tracking-tight mb-2 uppercase">
                No fields mapped
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Click a field type from the left sidebar to add it to your form
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap -mx-2">
              {formData.fields
                .sort((a, b) => a.order - b.order)
                .map((field, index) => renderFieldPreview(field, index))}
            </div>
          )}

          {/* Submit Button Preview */}
          {formData.fields.length > 0 && (
            <div className={`mt-8 pt-6 border-t border-gray-200 flex ${
              formData.settings.submitButtonPosition === 'center' ? 'justify-center' :
              formData.settings.submitButtonPosition === 'right' ? 'justify-end' :
              'justify-start'
            }`}>
              <button
                disabled
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium"
                style={{
                  backgroundColor: formData.styling.buttonColor,
                  color: formData.styling.buttonTextColor
                }}
              >
                {formData.settings.submitButtonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
