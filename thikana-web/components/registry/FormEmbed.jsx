/**
 * FORM EMBED COMPONENT
 * Embeds a form into a page by reference
 */

'use client';

export default function FormEmbed({ props, styles, isSelected, onClick }) {
  const { formId, formName, showTitle = true } = props;

  return (
    <div
      onClick={onClick}
      className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={styles}
    >
      {/* Builder Preview */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {formName || 'Form Embed'}
          </h3>
          <p className="text-sm text-gray-500">
            {formId ? (
              <>Form will be rendered here when published</>
            ) : (
              <>Select a form in the properties panel</>
            )}
          </p>
          {formId && (
            <p className="text-xs text-gray-400 mt-2 font-mono">
              Form ID: {formId.substring(0, 8)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
