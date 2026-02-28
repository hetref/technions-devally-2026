"use client";

/**
 * THEME SECTION
 *
 * Shows importable theme presets and an inline theme editor.
 * Lives inside the LeftSidebar "Themes" tab.
 */

import { useState, useCallback } from "react";
import {
  Palette,
  Check,
  Download,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { themePresets } from "@/lib/data/theme-presets";
import useBuilderStore from "@/lib/stores/builderStore";
import { clsx } from "clsx";

// ─── Color swatch row (for preset card preview) ────────────────────────────

function PresetSwatches({ preview }) {
  const colors = [
    preview.primaryColor,
    preview.secondaryColor,
    preview.backgroundColor,
    preview.textColor,
  ];
  return (
    <div className="flex gap-1">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-full border border-slate-600"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

// ─── Preset Card ────────────────────────────────────────────────────────────

function PresetCard({ preset, isActive, onImport }) {
  return (
    <button
      onClick={() => onImport(preset)}
      className={clsx(
        "w-full text-left p-3 rounded-lg border transition-all duration-200",
        isActive
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-600 bg-slate-800 hover:border-blue-400 hover:bg-slate-700/60",
      )}
    >
      {/* Preview bar */}
      <div
        className="h-16 rounded-md mb-2.5 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${preset.preview.backgroundColor} 0%, ${preset.preview.primaryColor}22 100%)`,
          border: `1px solid ${preset.preview.primaryColor}44`,
        }}
      >
        <span
          className="text-sm font-bold"
          style={{ color: preset.preview.primaryColor }}
        >
          Aa
        </span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-200">
          {preset.name}
        </span>
        {isActive && <Check size={14} className="text-blue-400" />}
      </div>

      <p className="text-[10px] text-slate-500 leading-snug mb-2">
        {preset.description}
      </p>

      <PresetSwatches preview={preset.preview} />
    </button>
  );
}

// ─── Color Field ────────────────────────────────────────────────────────────

function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-400 truncate">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border border-slate-600 bg-transparent p-0"
        />
        <span className="text-[10px] text-slate-500 font-mono w-16 text-right">
          {value || "—"}
        </span>
      </div>
    </label>
  );
}

// ─── Number Field ───────────────────────────────────────────────────────────

function NumberField({ label, value, onChange, unit = "px", min = 0, max = 200 }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-400 truncate">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] text-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-[10px] text-slate-500 w-5">{unit}</span>
      </div>
    </label>
  );
}

// ─── Select Field ───────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-400 truncate">{label}</span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-36 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ─── Editor Section (collapsible) ───────────────────────────────────────────

function EditorSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-xs font-medium text-slate-300">{title}</span>
        {open ? (
          <ChevronDown size={14} className="text-slate-500" />
        ) : (
          <ChevronRight size={14} className="text-slate-500" />
        )}
      </button>
      {open && <div className="px-3 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

// ─── Font options ───────────────────────────────────────────────────────────

const fontOptions = [
  { value: "Inter, system-ui, -apple-system, sans-serif", label: "Inter" },
  { value: "DM Sans, system-ui, sans-serif", label: "DM Sans" },
  { value: "Space Grotesk, system-ui, sans-serif", label: "Space Grotesk" },
  { value: "Poppins, system-ui, sans-serif", label: "Poppins" },
  { value: "Roboto, system-ui, sans-serif", label: "Roboto" },
  { value: "Playfair Display, serif", label: "Playfair Display" },
  { value: "Merriweather, serif", label: "Merriweather" },
  { value: "Lato, system-ui, sans-serif", label: "Lato" },
  { value: "Montserrat, system-ui, sans-serif", label: "Montserrat" },
  { value: "system-ui, -apple-system, sans-serif", label: "System Default" },
];

const weightOptions = [
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra Bold (800)" },
];

const buttonStyleOptions = [
  { value: "filled", label: "Filled" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ThemeSection() {
  const theme = useBuilderStore((s) => s.theme);
  const siteId = useBuilderStore((s) => s.siteId);
  const importTheme = useBuilderStore((s) => s.importTheme);
  const updateTheme = useBuilderStore((s) => s.updateTheme);

  const [saving, setSaving] = useState(false);
  const [confirmPreset, setConfirmPreset] = useState(null);

  // Check which preset matches current theme (if any)
  const activePresetId = themePresets.find(
    (p) => p.theme.primaryColor === theme?.primaryColor && p.theme.backgroundColor === theme?.backgroundColor,
  )?.id;

  // Persist theme to DB
  const saveThemeToDB = useCallback(
    async (newTheme) => {
      if (!siteId) return;
      setSaving(true);
      try {
        await fetch(`/api/sites/${siteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (err) {
        console.error("Failed to save theme:", err);
      } finally {
        setSaving(false);
      }
    },
    [siteId],
  );

  // Import a preset
  const handleImport = useCallback(
    (preset) => {
      if (theme && theme.primaryColor) {
        // Already have a theme — confirm before overwriting
        setConfirmPreset(preset);
        return;
      }
      importTheme(preset.theme);
      saveThemeToDB(preset.theme);
    },
    [theme, importTheme, saveThemeToDB],
  );

  const confirmImport = useCallback(() => {
    if (!confirmPreset) return;
    importTheme(confirmPreset.theme);
    saveThemeToDB(confirmPreset.theme);
    setConfirmPreset(null);
  }, [confirmPreset, importTheme, saveThemeToDB]);

  // Update individual field
  const handleFieldChange = useCallback(
    (field, value) => {
      updateTheme({ [field]: value });
      // Debounced save: we save on every change but the backend is fast enough
      if (siteId) {
        const newTheme = { ...(theme || {}), [field]: value };
        saveThemeToDB(newTheme);
      }
    },
    [updateTheme, theme, siteId, saveThemeToDB],
  );

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Palette size={12} className="text-slate-500" />
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Theme Presets
          </h3>
        </div>
        {saving && (
          <span className="text-[10px] text-blue-400 animate-pulse">
            Saving…
          </span>
        )}
      </div>

      {/* ── Confirmation Dialog ────────────────────────────── */}
      {confirmPreset && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-[11px] text-amber-200 mb-2">
            Replace current theme with <strong>{confirmPreset.name}</strong>?
            This will overwrite all existing theme settings.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmImport}
              className="flex-1 px-3 py-1.5 bg-amber-500 text-slate-900 text-[11px] font-medium rounded hover:bg-amber-400 transition-colors"
            >
              <Download size={11} className="inline mr-1" />
              Import
            </button>
            <button
              onClick={() => setConfirmPreset(null)}
              className="flex-1 px-3 py-1.5 bg-slate-700 text-slate-300 text-[11px] rounded hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Preset Cards ──────────────────────────────────── */}
      <div className="space-y-2">
        {themePresets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onImport={handleImport}
          />
        ))}
      </div>

      {/* ── Theme Editor ──────────────────────────────────── */}
      {theme && (
        <>
          <div className="flex items-center gap-1.5 pt-2">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Edit Theme
            </h3>
          </div>

          <div className="space-y-2">
            {/* Colors */}
            <EditorSection title="Colors" defaultOpen>
              <ColorField
                label="Primary"
                value={theme.primaryColor}
                onChange={(v) => handleFieldChange("primaryColor", v)}
              />
              <ColorField
                label="Secondary"
                value={theme.secondaryColor}
                onChange={(v) => handleFieldChange("secondaryColor", v)}
              />
              <ColorField
                label="Accent"
                value={theme.accentColor}
                onChange={(v) => handleFieldChange("accentColor", v)}
              />
              <ColorField
                label="Background"
                value={theme.backgroundColor}
                onChange={(v) => handleFieldChange("backgroundColor", v)}
              />
              <ColorField
                label="Surface"
                value={theme.surfaceColor}
                onChange={(v) => handleFieldChange("surfaceColor", v)}
              />
              <ColorField
                label="Text"
                value={theme.textColor}
                onChange={(v) => handleFieldChange("textColor", v)}
              />
              <ColorField
                label="Text Secondary"
                value={theme.textSecondaryColor}
                onChange={(v) => handleFieldChange("textSecondaryColor", v)}
              />
              <ColorField
                label="Border"
                value={theme.borderColor}
                onChange={(v) => handleFieldChange("borderColor", v)}
              />
            </EditorSection>

            {/* Typography */}
            <EditorSection title="Typography">
              <SelectField
                label="Body Font"
                value={theme.fontFamily}
                onChange={(v) => handleFieldChange("fontFamily", v)}
                options={fontOptions}
              />
              <SelectField
                label="Heading Font"
                value={theme.headingFont}
                onChange={(v) => handleFieldChange("headingFont", v)}
                options={fontOptions}
              />
              <NumberField
                label="Base Size"
                value={theme.baseFontSize}
                onChange={(v) => handleFieldChange("baseFontSize", v)}
                min={10}
                max={24}
              />
              <SelectField
                label="Heading Weight"
                value={theme.headingWeight}
                onChange={(v) => handleFieldChange("headingWeight", v)}
                options={weightOptions}
              />
              <SelectField
                label="Body Weight"
                value={theme.bodyWeight}
                onChange={(v) => handleFieldChange("bodyWeight", v)}
                options={weightOptions}
              />
            </EditorSection>

            {/* Shape & Spacing */}
            <EditorSection title="Shape & Spacing">
              <NumberField
                label="Border Radius"
                value={theme.borderRadius}
                onChange={(v) => handleFieldChange("borderRadius", v)}
              />
              <NumberField
                label="Button Radius"
                value={theme.buttonRadius}
                onChange={(v) => handleFieldChange("buttonRadius", v)}
              />
              <NumberField
                label="Card Radius"
                value={theme.cardRadius}
                onChange={(v) => handleFieldChange("cardRadius", v)}
              />
              <NumberField
                label="Section Padding"
                value={theme.sectionPadding}
                onChange={(v) => handleFieldChange("sectionPadding", v)}
                max={200}
              />
              <NumberField
                label="Max Width"
                value={theme.containerMaxWidth}
                onChange={(v) => handleFieldChange("containerMaxWidth", v)}
                max={2000}
              />
            </EditorSection>

            {/* Buttons */}
            <EditorSection title="Buttons">
              <SelectField
                label="Style"
                value={theme.buttonStyle}
                onChange={(v) => handleFieldChange("buttonStyle", v)}
                options={buttonStyleOptions}
              />
              <NumberField
                label="Padding X"
                value={theme.buttonPaddingX}
                onChange={(v) => handleFieldChange("buttonPaddingX", v)}
                max={60}
              />
              <NumberField
                label="Padding Y"
                value={theme.buttonPaddingY}
                onChange={(v) => handleFieldChange("buttonPaddingY", v)}
                max={30}
              />
            </EditorSection>
          </div>

          {/* Reset to default */}
          <button
            onClick={() => {
              const defaultTheme = themePresets[0].theme;
              importTheme(defaultTheme);
              saveThemeToDB(defaultTheme);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700/50 hover:text-slate-300 transition-colors"
          >
            <RotateCcw size={11} />
            Reset to Default
          </button>
        </>
      )}
    </div>
  );
}
