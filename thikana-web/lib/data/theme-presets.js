/**
 * Theme Presets
 *
 * Pre-built theme JSON files that users can import from the builder.
 * Each theme defines colors, fonts, border radii, and spacing that the
 * HTML generator (jsonToHtml.js) reads when publishing the site.
 */

export const themePresets = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean lines, generous whitespace, and a cool blue accent.',
    preview: {
      primaryColor: '#3b82f6',
      secondaryColor: '#6366f1',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
    },
    theme: {
      // Colors
      primaryColor: '#3b82f6',
      secondaryColor: '#6366f1',
      accentColor: '#06b6d4',
      backgroundColor: '#ffffff',
      surfaceColor: '#f8fafc',
      textColor: '#1f2937',
      textSecondaryColor: '#6b7280',
      borderColor: '#e5e7eb',

      // Typography
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      headingFont: 'Inter, system-ui, -apple-system, sans-serif',
      baseFontSize: 16,
      headingWeight: '700',
      bodyWeight: '400',

      // Shape
      borderRadius: 8,
      buttonRadius: 8,
      cardRadius: 12,

      // Spacing
      sectionPadding: 64,
      containerMaxWidth: 1280,

      // Buttons
      buttonStyle: 'filled',
      buttonPaddingX: 24,
      buttonPaddingY: 12,
    },
  },
  {
    id: 'bold-dark',
    name: 'Bold & Dark',
    description: 'High contrast dark theme with vibrant orange accents and sharp edges.',
    preview: {
      primaryColor: '#f97316',
      secondaryColor: '#ef4444',
      backgroundColor: '#0f172a',
      textColor: '#f1f5f9',
    },
    theme: {
      // Colors
      primaryColor: '#f97316',
      secondaryColor: '#ef4444',
      accentColor: '#eab308',
      backgroundColor: '#0f172a',
      surfaceColor: '#1e293b',
      textColor: '#f1f5f9',
      textSecondaryColor: '#94a3b8',
      borderColor: '#334155',

      // Typography
      fontFamily: 'DM Sans, system-ui, sans-serif',
      headingFont: 'Space Grotesk, system-ui, sans-serif',
      baseFontSize: 16,
      headingWeight: '800',
      bodyWeight: '400',

      // Shape
      borderRadius: 4,
      buttonRadius: 4,
      cardRadius: 8,

      // Spacing
      sectionPadding: 80,
      containerMaxWidth: 1200,

      // Buttons
      buttonStyle: 'filled',
      buttonPaddingX: 28,
      buttonPaddingY: 14,
    },
  },
]

/**
 * Get a theme preset by its ID.
 */
export function getThemePreset(id) {
  return themePresets.find((t) => t.id === id) ?? null
}
