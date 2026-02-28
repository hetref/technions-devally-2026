/**
 * FORM BUILDER STORE
 * Manages form builder state (separate from site builder)
 */

import { create } from 'zustand';
import { createDefaultForm, createField } from '@/lib/form-schema';

const useFormBuilderStore = create((set, get) => ({
  // Form data
  formData: createDefaultForm(),
  
  // Selected field for editing
  selectedFieldId: null,
  
  // UI state
  isDirty: false,
  
  // Initialize form
  initializeForm: (formData) => {
    set({
      formData: formData || createDefaultForm(),
      selectedFieldId: null,
      isDirty: false
    });
  },
  
  // Update form name
  updateFormName: (name) => {
    set((state) => ({
      formData: { ...state.formData, name },
      isDirty: true
    }));
  },
  
  // Add field to form
  addField: (fieldType) => {
    const newField = createField(fieldType);
    set((state) => {
      const fields = [...state.formData.fields];
      newField.order = fields.length;
      fields.push(newField);
      
      return {
        formData: { ...state.formData, fields },
        selectedFieldId: newField.id,
        isDirty: true
      };
    });
  },
  
  // Remove field
  removeField: (fieldId) => {
    set((state) => {
      const fields = state.formData.fields
        .filter(f => f.id !== fieldId)
        .map((f, index) => ({ ...f, order: index }));
      
      return {
        formData: { ...state.formData, fields },
        selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
        isDirty: true
      };
    });
  },
  
  // Update field
  updateField: (fieldId, updates) => {
    set((state) => {
      const fields = state.formData.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      );
      
      return {
        formData: { ...state.formData, fields },
        isDirty: true
      };
    });
  },
  
  // Reorder fields
  reorderFields: (startIndex, endIndex) => {
    set((state) => {
      const fields = [...state.formData.fields];
      const [removed] = fields.splice(startIndex, 1);
      fields.splice(endIndex, 0, removed);
      
      // Update order property
      const reorderedFields = fields.map((f, index) => ({ ...f, order: index }));
      
      return {
        formData: { ...state.formData, fields: reorderedFields },
        isDirty: true
      };
    });
  },
  
  // Select field for editing
  selectField: (fieldId) => {
    set({ selectedFieldId: fieldId });
  },
  
  // Update form settings
  updateSettings: (settings) => {
    set((state) => ({
      formData: {
        ...state.formData,
        settings: { ...state.formData.settings, ...settings }
      },
      isDirty: true
    }));
  },
  
  // Update form styling
  updateStyling: (styling) => {
    set((state) => ({
      formData: {
        ...state.formData,
        styling: { ...state.formData.styling, ...styling }
      },
      isDirty: true
    }));
  },
  
  // Get selected field
  getSelectedField: () => {
    const state = get();
    return state.formData.fields.find(f => f.id === state.selectedFieldId);
  },
  
  // Mark as saved
  markAsSaved: () => {
    set({ isDirty: false });
  },
  
  // Reset store
  reset: () => {
    set({
      formData: createDefaultForm(),
      selectedFieldId: null,
      isDirty: false
    });
  }
}));

export default useFormBuilderStore;
