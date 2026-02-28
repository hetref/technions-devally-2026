'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIGenerateButton({ 
  componentType, 
  fieldName, 
  onGenerate,
  context,
  businessType,
  size = 'sm'
}) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentType,
          fieldName,
          context,
          businessType
        })
      });

      const data = await response.json();

      if (data.success) {
        onGenerate(data.content);
      } else {
        alert('Failed to generate content: ' + data.error);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'px-3 py-2'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className={`${sizeClasses[size]} bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md`}
      title="Generate with AI"
    >
      {loading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : (
        <Sparkles size={iconSizes[size]} />
      )}
      {size === 'lg' && <span className="text-sm font-medium">Generate with AI</span>}
    </button>
  );
}
