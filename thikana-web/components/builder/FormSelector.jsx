/**
 * FORM SELECTOR COMPONENT
 * Dropdown to select a form for FormEmbed component
 */

'use client';

import { useState, useEffect } from 'react';

export default function FormSelector({ value, siteId, onChange }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (siteId) {
      fetchForms();
    }
  }, [siteId]);

  const fetchForms = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/forms`);
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const formId = e.target.value;
    const form = forms.find(f => f.id === formId);
    onChange(formId || null, form?.name || 'Select a form');
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading forms...</div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
        No forms found. Create a form first in the Forms section.
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Form
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Select a form --</option>
        {forms.map((form) => (
          <option key={form.id} value={form.id}>
            {form.name}
          </option>
        ))}
      </select>
    </div>
  );
}
