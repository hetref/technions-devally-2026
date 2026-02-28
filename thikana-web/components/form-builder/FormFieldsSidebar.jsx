/**
 * LEFT SIDEBAR - Field Types Palette
 */

'use client';

import { FIELD_TYPES, FIELD_TYPE_METADATA } from '@/lib/form-schema';
import useFormBuilderStore from '@/lib/stores/formBuilderStore';

export default function FormFieldsSidebar() {
  const { addField } = useFormBuilderStore();

  const handleAddField = (fieldType) => {
    addField(fieldType);
  };

  return (
    <div className="w-72 bg-white/80 backdrop-blur-md border-r border-gray-100 flex flex-col h-full min-h-0 z-10 shadow-sm relative shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#8bc4b1] mb-1">Components</h2>
        <p className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">Form Fields</p>
      </div>

      {/* Field Types List */}
      <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        {Object.values(FIELD_TYPES).map((fieldType) => {
          const metadata = FIELD_TYPE_METADATA[fieldType];
          
          return (
            <button
              key={fieldType}
              onClick={() => handleAddField(fieldType)}
              className="w-full flex items-start gap-4 p-4 bg-white hover:bg-[#fcfdfc] border border-gray-100 hover:border-[#8bc4b1] rounded-2xl transition-all shadow-sm hover:shadow-md text-left group hover:-translate-y-1"
            >
              <div className="h-10 w-10 flex-shrink-0 bg-[#f2f4f2] text-[#0b1411] rounded-xl flex items-center justify-center group-hover:bg-[#d3ff4a] transition-colors shadow-inner text-lg">
                {metadata.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-sm font-black text-[#1d2321] tracking-tight group-hover:text-[#8bc4b1] transition-colors">
                  {metadata.label}
                </div>
                <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">
                  {metadata.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="p-6 border-t border-gray-100 bg-[#fcfdfc]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <p className="text-[#8bc4b1] mb-3 flex items-center gap-2">
             <span className="text-sm">💡</span> TIPS & TRICKS
          </p>
          <ul className="space-y-2 text-gray-500 pl-6 list-disc list-outside">
            <li>Click a field to add it</li>
            <li>Drag to reorder fields</li>
            <li>Click field to edit properties</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
