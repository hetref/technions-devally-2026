'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

export default function AIPageGenerator({ isOpen, onClose, onGenerate, tenantId }) {
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [pageType, setPageType] = useState('home');
  const [loading, setLoading] = useState(false);
  const [brandKit, setBrandKit] = useState(null);

  // Fetch brand kit when modal opens
  useState(() => {
    if (isOpen && tenantId) {
      fetchBrandKit();
    }
  }, [isOpen, tenantId]);

  const fetchBrandKit = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/brand-kit`);
      if (response.ok) {
        const data = await response.json();
        setBrandKit(data.brandKit);
      }
    } catch (error) {
      console.error('Failed to fetch brand kit:', error);
    }
  };

  const businessTypes = [
    'Restaurant',
    'Gym / Fitness',
    'Salon / Spa',
    'E-commerce Store',
    'Portfolio',
    'Agency',
    'School / Education',
    'Healthcare',
    'Real Estate',
    'Other'
  ];

  const pageTypes = [
    { value: 'home', label: 'Home Page' },
    { value: 'about', label: 'About Us' },
    { value: 'services', label: 'Services' },
    { value: 'contact', label: 'Contact' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'blog', label: 'Blog' }
  ];

  const handleGenerate = async () => {
    if (!description.trim() || !businessType) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          businessType,
          pageType,
          brandKit  // Pass brand kit to API
        })
      });

      const data = await response.json();

      if (data.success) {
        onGenerate(data.layout);
        onClose();
        setDescription('');
        setBusinessType('');
      } else {
        if (data.fallback) {
          const useFallback = confirm(
            'AI generation failed. Would you like to use a template instead?'
          );
          if (useFallback) {
            onGenerate(data.fallback);
            onClose();
          }
        } else {
          alert('Failed to generate page: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate page');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Generate Page with AI</h2>
              <p className="text-sm text-gray-500">Describe your page and let AI build it</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type *
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select business type...</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Page Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {pageTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPageType(type.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    pageType === type.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Create a modern gym homepage with a hero section showcasing our facilities, a features section highlighting our services, pricing plans, and a contact form..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific about sections, content, and style you want
            </p>
          </div>

          {/* Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">💡 Example Prompts:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• "Modern restaurant homepage with hero, menu preview, chef's special, and reservation form"</li>
              <li>• "Fitness gym page with motivational hero, class schedule, trainer profiles, and membership pricing"</li>
              <li>• "Professional portfolio with project showcase, skills section, and contact information"</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !description.trim() || !businessType}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Page</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
