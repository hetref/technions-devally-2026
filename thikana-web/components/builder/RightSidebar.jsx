"use client";

/**
 * RIGHT SIDEBAR
 *
 * Properties and styles editor for selected component.
 * Shows a "locked" message when the selected node is being edited by another user.
 */

import React, { useState, useMemo, useEffect } from "react";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { Trash2, Copy, Plus, Minus, Settings2, Paintbrush, Lock, Wand2, Loader2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import FormSelector from "./FormSelector";


const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
  'Raleway', 'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Poppins',
  'Ubuntu', 'Mukta', 'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Quicksand',
  'Karla', 'Cabin', 'Barlow', 'Crimson Text', 'Bitter', 'Arimo', 'Titillium Web',
  'DM Sans', 'Manrope', 'Space Grotesk', 'Plus Jakarta Sans', 'Outfit', 'Lexend'
].sort();

export default function RightSidebar() {
  const store = useBuilderStore();
  const {
    layoutJSON,
    selectedNodeId,
    currentPageId,
    updateComponentProps,
    updateComponentStyles,
    deleteComponent,
    duplicateComponent,
    deleteContainer,
    duplicateContainer,
    updateContainerStyles,
    updateContainerSettings,
    addColumnToContainer,
    removeColumnFromContainer,
    updateColumnWidth,
    getLayoutJSON,
  } = store;
  
  const siteId = store.siteId;

  // Global settings (colors/fonts)
  const [globalSettings, setGlobalSettings] = useState(null);
  const [brandKit, setBrandKit] = useState(null);

  useEffect(() => {
    if (!siteId) return;
    // Fetch site global settings
    fetch(`/api/sites/${siteId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.site?.globalSettings) {
          setGlobalSettings(data.site.globalSettings);
        }
        // Also fetch brand kit from tenant
        if (data?.site?.tenantId) {
          fetch(`/api/tenants/${data.site.tenantId}/brand-kit`)
            .then(res => res.ok ? res.json() : null)
            .then(bk => { if (bk?.brandKit) setBrandKit(bk.brandKit); })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [siteId]);

  // Resolve effective global colors/fonts
  const effectiveGlobalColors = useMemo(() => {
    if (globalSettings?.colorMode === 'custom' && globalSettings?.globalColors) {
      return globalSettings.globalColors;
    }
    if (brandKit?.colors) return brandKit.colors;
    return { primary: '#3B82F6', secondary: '#8B5CF6', tertiary: '#EC4899' };
  }, [globalSettings, brandKit]);

  const effectiveGlobalFonts = useMemo(() => {
    if (globalSettings?.fontMode === 'custom' && globalSettings?.globalFonts) {
      return globalSettings.globalFonts;
    }
    if (brandKit?.fonts) return brandKit.fonts;
    return { heading: 'Poppins', body: 'Inter' };
  }, [globalSettings, brandKit]);
  
  const { pushState } = useHistoryStore();
  const [activeTab, setActiveTab] = useState("properties");

  // Multiplayer removed for single-tenant builder
  const others = [];
  const selectedNodeLock = null;

  // ✅ Find selected node from current layout state
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !layoutJSON) return null;

    const page = layoutJSON.pages.find((p) => p.id === currentPageId);
    if (!page) return null;

    // Search for the node
    for (const container of page.layout) {
      if (container.id === selectedNodeId) return container;

      for (const column of container.columns) {
        for (const component of column.components) {
          if (component.id === selectedNodeId) return component;
        }
      }
    }

    return null;
  }, [layoutJSON, selectedNodeId, currentPageId]);

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className="w-80 bg-[#fcfdfc] border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-10 shrink-0">
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
            <Settings2 size={20} className="text-[#8bc4b1] opacity-50" />
          </div>
          <p className="text-[10px] font-black tracking-widest uppercase text-[#1d2321]">Select an element</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">
            Click on any component or container on the canvas to view properties
          </p>
        </div>
      </div>
    );
  }

  // ── If the selected node is locked by another user ─────────────────────
  if (selectedNodeLock) {
    return (
      <div className="w-80 bg-[#fcfdfc] border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-10 shrink-0">
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border"
            style={{ backgroundColor: `${selectedNodeLock.color}10`, borderColor: `${selectedNodeLock.color}30` }}
          >
            <Lock size={20} style={{ color: selectedNodeLock.color }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1d2321]">Element Locked</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">
            <span
              className="mr-1"
              style={{ color: selectedNodeLock.color }}
            >
              {selectedNodeLock.username}
            </span>
            is currently editing
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mt-4 leading-relaxed">
            You can view real-time changes but cannot edit until they finish.
          </p>
        </div>
      </div>
    );
  }

  const isContainer = selectedNode.type === "container";
  const isComponent = selectedNode.type !== "container";

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this element?")) {
      pushState(getLayoutJSON());

      if (isContainer) {
        deleteContainer(selectedNodeId);
      } else {
        deleteComponent(selectedNodeId);
      }
    }
  };

  const handleDuplicate = () => {
    pushState(getLayoutJSON());
    if (isContainer) {
      duplicateContainer(selectedNodeId);
    } else {
      duplicateComponent(selectedNodeId);
    }
  };

  // ✅ Property update handler with history tracking
  const handleUpdateProps = (props) => {
    pushState(getLayoutJSON());
    updateComponentProps(selectedNodeId, props);
  };

  const handleUpdateStyles = (styles) => {
    pushState(getLayoutJSON());
    if (isContainer) {
      updateContainerStyles(selectedNodeId, styles);
    } else {
      updateComponentStyles(selectedNodeId, styles);
    }
  };

  return (
    <div className="w-80 bg-white/80 backdrop-blur-md border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-10 shadow-sm shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Editing</p>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  "w-2 h-2 rounded-full",
                  isContainer ? "bg-[#d3ff4a]" : "bg-[#0b1411]",
                )}
              />
              <h3 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">
                {isContainer ? "Container" : selectedNode.type}
              </h3>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-[#f2f4f2] hover:text-[#0b1411] rounded-xl text-gray-400 transition-colors"
              title="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f2f4f2] rounded-full p-1 border border-gray-100 shadow-inner">
          <button
            onClick={() => setActiveTab("properties")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300",
              activeTab === "properties"
                ? "bg-white text-[#0b1411] shadow-sm transform scale-105"
                : "text-gray-400 hover:text-gray-900",
            )}
          >
            <Settings2 size={12} />
            Properties
          </button>
          <button
            onClick={() => setActiveTab("styles")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300",
              activeTab === "styles"
                ? "bg-white text-[#0b1411] shadow-sm transform scale-105"
                : "text-gray-400 hover:text-gray-900",
            )}
          >
            <Paintbrush size={12} />
            Styles
          </button>
        </div>
      </div>

      {/* Content */}
      <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === "properties" && isComponent && (
          <PropertiesEditor
            component={selectedNode}
            onUpdate={handleUpdateProps}
            siteId={siteId}
          />
        )}

        {activeTab === "styles" && isComponent && (
          <StylesEditor
            styles={selectedNode.styles || {}}
            onUpdate={handleUpdateStyles}
            globalColors={effectiveGlobalColors}
            globalFonts={effectiveGlobalFonts}
          />
        )}

        {activeTab === "styles" && isContainer && (
          <StylesEditor
            styles={selectedNode.styles || {}}
            onUpdate={handleUpdateStyles}
            globalColors={effectiveGlobalColors}
            globalFonts={effectiveGlobalFonts}
          />
        )}

        {activeTab === "properties" && isContainer && (
          <ContainerPropertiesEditor
            container={selectedNode}
            onUpdateSettings={(settings) => {
              pushState(getLayoutJSON());
              updateContainerSettings(selectedNodeId, settings);
            }}
            onAddColumn={() => {
              pushState(getLayoutJSON());
              addColumnToContainer(selectedNodeId);
            }}
            onRemoveColumn={(colIndex) => {
              pushState(getLayoutJSON());
              removeColumnFromContainer(selectedNodeId, colIndex);
            }}
            onUpdateColumnWidth={(colIndex, width) => {
              pushState(getLayoutJSON());
              updateColumnWidth(selectedNodeId, colIndex, width);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONTAINER PROPERTIES EDITOR
// ============================================================================

function ContainerPropertiesEditor({
  container,
  onUpdateSettings,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumnWidth,
}) {
  const settings = container.settings || {};

  return (
    <div className="space-y-4">
      {/* Direction */}
      <SelectField
        label="Direction"
        value={settings.direction || "horizontal"}
        options={[
          { value: "horizontal", label: "Horizontal (Row)" },
          { value: "vertical", label: "Vertical (Column)" },
        ]}
        onChange={(v) => onUpdateSettings({ direction: v })}
      />

      {/* Content Width */}
      <SelectField
        label="Content Width"
        value={settings.contentWidth || "boxed"}
        options={[
          { value: "boxed", label: "Boxed" },
          { value: "full", label: "Full Width" },
        ]}
        onChange={(v) => onUpdateSettings({ contentWidth: v })}
      />

      {/* Max Width (only when boxed) */}
      {(settings.contentWidth || "boxed") === "boxed" && (
        <InputField
          label="Max Width (px)"
          type="number"
          value={settings.maxWidth || 1280}
          onChange={(v) => onUpdateSettings({ maxWidth: parseInt(v) || 1280 })}
        />
      )}

      {/* Gap */}
      <InputField
        label="Gap (px)"
        type="number"
        value={settings.gap ?? 16}
        onChange={(v) => onUpdateSettings({ gap: parseInt(v) || 0 })}
      />

      {/* Vertical Align */}
      <SelectField
        label="Vertical Align"
        value={settings.verticalAlign || "stretch"}
        options={[
          { value: "stretch", label: "Stretch" },
          { value: "flex-start", label: "Top" },
          { value: "center", label: "Center" },
          { value: "flex-end", label: "Bottom" },
        ]}
        onChange={(v) => onUpdateSettings({ verticalAlign: v })}
      />

      {/* Column Widths */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Columns (width out of 12)
        </label>
        <div className="space-y-2">
          {(container.columns || []).map((col, i) => (
            <div key={col.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
              {/* Visual bar */}
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-200 rounded transition-all"
                  style={{ width: `${(col.width / 12) * 100}%` }}
                />
              </div>
              <input
                type="number"
                min={1}
                max={12}
                value={col.width}
                onChange={(e) =>
                  onUpdateColumnWidth(i, parseInt(e.target.value) || 1)
                }
                className="w-14 px-2 py-1 border border-gray-200 rounded text-sm text-center"
              />
              {container.columns.length > 1 && (
                <button
                  onClick={() => onRemoveColumn(i)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Remove column"
                >
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onAddColumn}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Plus size={14} /> Add Column
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PROPERTIES EDITOR
// ============================================================================

function PropertiesEditor({ component, onUpdate, siteId }) {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const props = component.props || {};
  const componentType = component.type;

  // Dynamic property fields based on component type
  return (
    <div className="space-y-4">
      {/* Hero Component */}
      {component.type === "Hero" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Subtitle"
            value={props.subtitle || ""}
            onChange={(value) => handleChange("subtitle", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="CTA Text"
            value={props.ctaText || ""}
            onChange={(value) => handleChange("ctaText", value)}
          />
          <InputField
            label="CTA Link"
            value={props.ctaLink || ""}
            onChange={(value) => handleChange("ctaLink", value)}
          />
          <InputField
            label="Background Image URL"
            value={props.backgroundImage || ""}
            onChange={(value) => handleChange("backgroundImage", value)}
          />
        </>
      )}

      {/* Text Component */}
      {component.type === "Text" && (
        <>
          <InputField
            label="Content"
            value={props.content || ""}
            onChange={(value) => handleChange("content", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <SelectField
            label="Variant"
            value={props.variant || "p"}
            options={[
              { value: "h1", label: "Heading 1" },
              { value: "h2", label: "Heading 2" },
              { value: "h3", label: "Heading 3" },
              { value: "h4", label: "Heading 4" },
              { value: "p", label: "Paragraph" },
            ]}
            onChange={(value) => handleChange("variant", value)}
          />
        </>
      )}

      {/* Image Component */}
      {component.type === "Image" && (
        <>
          <InputField
            label="Image URL"
            value={props.src || ""}
            onChange={(value) => handleChange("src", value)}
          />
          <InputField
            label="Alt Text"
            value={props.alt || ""}
            onChange={(value) => handleChange("alt", value)}
          />
          <InputField
            label="Width (px)"
            type="number"
            value={props.width || ""}
            onChange={(value) =>
              handleChange("width", value ? parseInt(value) : null)
            }
          />
          <InputField
            label="Height (px)"
            type="number"
            value={props.height || ""}
            onChange={(value) =>
              handleChange("height", value ? parseInt(value) : null)
            }
          />
          <SelectField
            label="Object Fit"
            value={props.objectFit || "cover"}
            options={[
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
              { value: "fill", label: "Fill" },
              { value: "none", label: "None" },
              { value: "scale-down", label: "Scale Down" },
            ]}
            onChange={(value) => handleChange("objectFit", value)}
          />
          <InputField
            label="Border Radius (px)"
            type="number"
            value={props.borderRadius || 0}
            onChange={(value) =>
              handleChange("borderRadius", parseInt(value) || 0)
            }
          />
          <InputField
            label="Link URL (optional)"
            value={props.linkUrl || ""}
            onChange={(value) => handleChange("linkUrl", value)}
          />
        </>
      )}

      {/* Button Component */}
      {component.type === "Button" && (
        <>
          <InputField
            label="Button Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Link"
            value={props.link || ""}
            onChange={(value) => handleChange("link", value)}
          />
          <SelectField
            label="Variant"
            value={props.variant || "primary"}
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
            ]}
            onChange={(value) => handleChange("variant", value)}
          />
        </>
      )}

      {/* CTA Component */}
      {component.type === "CTA" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Description"
            value={props.description || ""}
            onChange={(value) => handleChange("description", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Button Text"
            value={props.buttonText || ""}
            onChange={(value) => handleChange("buttonText", value)}
          />
        </>
      )}

      {/* Heading Component */}
      {component.type === "Heading" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <SelectField
            label="Level"
            value={props.level || "h2"}
            options={[
              { value: "h1", label: "H1" },
              { value: "h2", label: "H2" },
              { value: "h3", label: "H3" },
              { value: "h4", label: "H4" },
              { value: "h5", label: "H5" },
              { value: "h6", label: "H6" },
            ]}
            onChange={(value) => handleChange("level", value)}
          />
        </>
      )}

      {/* Link Component */}
      {component.type === "Link" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
          />
          <InputField
            label="URL"
            value={props.href || ""}
            onChange={(value) => handleChange("href", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.openInNewTab || false}
              onChange={(e) => handleChange("openInNewTab", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Open in new tab</label>
          </div>
        </>
      )}

      {/* LinkBox Component */}
      {component.type === "LinkBox" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
          />
          <InputField
            label="Description"
            value={props.description || ""}
            onChange={(value) => handleChange("description", value)}
          />
          <InputField
            label="URL"
            value={props.href || ""}
            onChange={(value) => handleChange("href", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.openInNewTab || false}
              onChange={(e) => handleChange("openInNewTab", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Open in new tab</label>
          </div>
        </>
      )}

      {/* ImageBox Component */}
      {component.type === "ImageBox" && (
        <>
          <InputField
            label="Image URL"
            value={props.src || ""}
            onChange={(value) => handleChange("src", value)}
          />
          <InputField
            label="Alt Text"
            value={props.alt || ""}
            onChange={(value) => handleChange("alt", value)}
          />
          <InputField
            label="Caption"
            value={props.caption || ""}
            onChange={(value) => handleChange("caption", value)}
          />
          <InputField
            label="Aspect Ratio"
            value={props.aspectRatio || "16/9"}
            onChange={(value) => handleChange("aspectRatio", value)}
          />
        </>
      )}

      {/* Video Component */}
      {component.type === "Video" && (
        <>
          <InputField
            label="Video URL"
            value={props.url || ""}
            onChange={(value) => handleChange("url", value)}
          />
          <SelectField
            label="Type"
            value={props.type || "youtube"}
            options={[
              { value: "youtube", label: "YouTube" },
              { value: "vimeo", label: "Vimeo" },
              { value: "direct", label: "Direct URL" },
            ]}
            onChange={(value) => handleChange("type", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.autoplay || false}
              onChange={(e) => handleChange("autoplay", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Autoplay</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.controls !== false}
              onChange={(e) => handleChange("controls", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Show controls</label>
          </div>
        </>
      )}

      {/* Map Component */}
      {component.type === "Map" && (
        <>
          <InputField
            label="Address"
            value={props.address || ""}
            onChange={(value) => handleChange("address", value)}
          />
          <InputField
            label="Height (px)"
            type="number"
            value={props.height || 400}
            onChange={(value) => handleChange("height", parseInt(value))}
          />
          <InputField
            label="Zoom Level"
            type="number"
            value={props.zoom || 15}
            onChange={(value) => handleChange("zoom", parseInt(value))}
          />
        </>
      )}

      {/* Icon Component */}
      {component.type === "Icon" && (
        <>
          <InputField
            label="Icon Name"
            value={props.name || "Star"}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Size (px)"
            type="number"
            value={props.size || 24}
            onChange={(value) => handleChange("size", parseInt(value))}
          />
        </>
      )}

      {/* Input Component */}
      {component.type === "Input" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <SelectField
            label="Type"
            value={props.type || "text"}
            options={[
              { value: "text", label: "Text" },
              { value: "email", label: "Email" },
              { value: "password", label: "Password" },
              { value: "number", label: "Number" },
              { value: "tel", label: "Phone" },
              { value: "url", label: "URL" },
            ]}
            onChange={(value) => handleChange("type", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Textarea Component */}
      {component.type === "Textarea" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Rows"
            type="number"
            value={props.rows || 4}
            onChange={(value) => handleChange("rows", parseInt(value))}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Checkbox Component */}
      {component.type === "Checkbox" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.checked || false}
              onChange={(e) => handleChange("checked", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Default checked</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Select Component */}
      {component.type === "Select" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          <OptionsEditor
            label="Options"
            options={props.options || []}
            onChange={(options) => handleChange("options", options)}
          />
        </>
      )}

      {/* Radio Component */}
      {component.type === "Radio" && (
        <>
          <InputField
            label="Group Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          <OptionsEditor
            label="Options"
            options={props.options || []}
            onChange={(options) => handleChange("options", options)}
          />
        </>
      )}

      {/* Label Component */}
      {component.type === "Label" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
          />
          <InputField
            label="For (input name)"
            value={props.htmlFor || ""}
            onChange={(value) => handleChange("htmlFor", value)}
          />
        </>
      )}

      {/* FormEmbed Component */}
      {component.type === "FormEmbed" && (
        <>
          {siteId ? (
            <FormSelector
              value={props.formId}
              siteId={siteId}
              onChange={(formId, formName) => {
                handleChange("formId", formId);
                handleChange("formName", formName);
              }}
            />
          ) : (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
              Loading site information...
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={props.showTitle !== false}
              onChange={(e) => handleChange("showTitle", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Show form title</label>
          </div>
          {props.formId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              Form will be rendered when the page is published.
            </div>
          )}
        </>
      )}

      {/* Form Component */}
      {component.type === "Form" && (
        <>
          <InputField
            label="Action URL"
            value={props.action || ""}
            onChange={(value) => handleChange("action", value)}
          />
          <SelectField
            label="Method"
            value={props.method || "POST"}
            options={[
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
            ]}
            onChange={(value) => handleChange("method", value)}
          />
          <InputField
            label="Form Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
        </>
      )}

      {/* Divider Component */}
      {component.type === "Divider" && (
        <>
          <InputField
            label="Thickness (px)"
            type="number"
            value={props.thickness || 1}
            onChange={(value) => handleChange("thickness", parseInt(value))}
          />
          <SelectField
            label="Style"
            value={props.style || "solid"}
            options={[
              { value: "solid", label: "Solid" },
              { value: "dashed", label: "Dashed" },
              { value: "dotted", label: "Dotted" },
            ]}
            onChange={(value) => handleChange("style", value)}
          />
        </>
      )}

      {/* Gallery Component */}
      {component.type === "Gallery" && (
        <>
          <InputField
            label="Columns"
            type="number"
            value={props.columns || 3}
            onChange={(value) => handleChange("columns", parseInt(value))}
          />
          <GalleryEditor
            images={props.images || []}
            onChange={(images) => handleChange("images", images)}
          />
        </>
      )}

      {/* Features Component */}
      {component.type === "Features" && (
        <>
          <InputField
            label="Section Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
          />
          <FeaturesEditor
            items={props.items || []}
            onChange={(items) => handleChange("items", items)}
          />
        </>
      )}

      {/* Navbar Component */}
      {component.type === "Navbar" && (
        <>
          <InputField
            label="Logo Text"
            value={props.logo || ""}
            onChange={(value) => handleChange("logo", value)}
          />
          <NavLinksEditor
            links={props.links || []}
            onChange={(links) => handleChange("links", links)}
          />
        </>
      )}

      {/* Footer Component */}
      {component.type === "Footer" && (
        <>
          <InputField
            label="Copyright"
            value={props.copyright || ""}
            onChange={(value) => handleChange("copyright", value)}
          />
          <NavLinksEditor
            links={props.links || []}
            onChange={(links) => handleChange("links", links)}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// STYLES EDITOR
// ============================================================================

function StylesEditor({ styles, onUpdate, globalColors, globalFonts }) {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="space-y-5">
      {/* Spacing Section */}
      <div>
        <SectionLabel>Spacing</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Pad Top"
            type="number"
            value={styles.paddingTop || ""}
            onChange={(value) =>
              handleChange("paddingTop", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Pad Bottom"
            type="number"
            value={styles.paddingBottom || ""}
            onChange={(value) =>
              handleChange("paddingBottom", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Pad Left"
            type="number"
            value={styles.paddingLeft || ""}
            onChange={(value) =>
              handleChange("paddingLeft", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Pad Right"
            type="number"
            value={styles.paddingRight || ""}
            onChange={(value) =>
              handleChange("paddingRight", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Margin Top"
            type="number"
            value={styles.marginTop || ""}
            onChange={(value) =>
              handleChange("marginTop", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Margin Bottom"
            type="number"
            value={styles.marginBottom || ""}
            onChange={(value) =>
              handleChange("marginBottom", parseInt(value) || 0)
            }
            compact
          />
        </div>
      </div>

      {/* Colors Section */}
      <div>
        <SectionLabel>Colors</SectionLabel>
        <div className="space-y-3">
          <GlobalColorField
            label="Background"
            value={styles.backgroundColor || "#ffffff"}
            onChange={(v) => handleChange("backgroundColor", v)}
            globalColors={globalColors}
          />
          <GlobalColorField
            label="Text Color"
            value={styles.textColor || "#1f2937"}
            onChange={(v) => handleChange("textColor", v)}
            globalColors={globalColors}
          />
        </div>
      </div>

      {/* Typography Section */}
      <div>
        <SectionLabel>Typography</SectionLabel>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
            <select
              value={styles.fontFamily || ''}
              onChange={(e) => handleChange("fontFamily", e.target.value || undefined)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              style={{ fontFamily: styles.fontFamily || globalFonts?.body || 'inherit' }}
            >
              <option value="">Global Default ({globalFonts?.body || 'Inter'})</option>
              <optgroup label="Google Fonts">
                {GOOGLE_FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <SelectField
            label="Text Align"
            value={styles.textAlign || "left"}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(value) => handleChange("textAlign", value)}
          />
          <InputField
            label="Font Size (px)"
            type="number"
            value={styles.fontSize || ""}
            onChange={(value) => handleChange("fontSize", parseInt(value) || 0)}
          />
          <SelectField
            label="Font Weight"
            value={styles.fontWeight || ""}
            options={[
              { value: "", label: "Default" },
              { value: "300", label: "Light" },
              { value: "400", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "600", label: "Semibold" },
              { value: "700", label: "Bold" },
              { value: "800", label: "Extrabold" },
              { value: "900", label: "Black" },
            ]}
            onChange={(value) => handleChange("fontWeight", value || undefined)}
          />
        </div>
      </div>

      {/* Border Section */}
      <div>
        <SectionLabel>Border</SectionLabel>
        <InputField
          label="Border Radius (px)"
          type="number"
          value={styles.borderRadius || ""}
          onChange={(value) =>
            handleChange("borderRadius", parseInt(value) || 0)
          }
        />
      </div>
    </div>
  );
}

// ============================================================================
// SECTION LABEL
// ============================================================================

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

// ============================================================================
// COLOR FIELD
// ============================================================================

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-mono text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="#ffffff"
        />
      </div>
    </div>
  );
}

// ============================================================================
// OPTIONS EDITOR (for Radio, Select)
// ============================================================================

function OptionsEditor({ label, options, onChange }) {
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  const handleAddOption = () => {
    const newOptions = [
      ...options,
      { label: `Option ${options.length + 1}`, value: `${options.length + 1}` },
    ];
    onChange(newOptions);
  };

  const handleRemoveOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={option.label || ""}
              onChange={(e) =>
                handleOptionChange(index, "label", e.target.value)
              }
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Label"
            />
            <input
              type="text"
              value={option.value || ""}
              onChange={(e) =>
                handleOptionChange(index, "value", e.target.value)
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Value"
            />
            <button
              onClick={() => handleRemoveOption(index)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remove option"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddOption}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add option
      </button>
    </div>
  );
}

// ============================================================================
// GALLERY EDITOR (for Gallery images)
// ============================================================================

function GalleryEditor({ images, onChange }) {
  const handleImageChange = (index, field, value) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange(newImages);
  };

  const handleAddImage = () => {
    onChange([
      ...images,
      {
        src: "https://via.placeholder.com/400",
        alt: `Image ${images.length + 1}`,
      },
    ]);
  };

  const handleRemoveImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Images
      </label>
      <div className="space-y-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 border border-gray-200 rounded space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Image {index + 1}
              </span>
              <button
                onClick={() => handleRemoveImage(index)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={image.src || ""}
              onChange={(e) => handleImageChange(index, "src", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Image URL"
            />
            <input
              type="text"
              value={image.alt || ""}
              onChange={(e) => handleImageChange(index, "alt", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Alt text"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleAddImage}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add image
      </button>
    </div>
  );
}

// ============================================================================
// FEATURES EDITOR (for Features items)
// ============================================================================

function FeaturesEditor({ items, onChange }) {
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleAddItem = () => {
    onChange([
      ...items,
      { title: `Feature ${items.length + 1}`, description: "Description" },
    ]);
  };

  const handleRemoveItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Feature Items
      </label>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 border border-gray-200 rounded space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Feature {index + 1}
              </span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={item.title || ""}
              onChange={(e) => handleItemChange(index, "title", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Title"
            />
            <input
              type="text"
              value={item.description || ""}
              onChange={(e) =>
                handleItemChange(index, "description", e.target.value)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Description"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleAddItem}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add feature
      </button>
    </div>
  );
}

// ============================================================================
// NAV LINKS EDITOR (for Navbar, Footer)
// ============================================================================

function NavLinksEditor({ links, onChange }) {
  const handleLinkChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange(newLinks);
  };

  const handleAddLink = () => {
    onChange([...links, { label: "New Link", href: "#" }]);
  };

  const handleRemoveLink = (index) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Links
      </label>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={link.label || ""}
              onChange={(e) => handleLinkChange(index, "label", e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Label"
            />
            <input
              type="text"
              value={link.href || ""}
              onChange={(e) => handleLinkChange(index, "href", e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="URL"
            />
            <button
              onClick={() => handleRemoveLink(index)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remove link"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddLink}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add link
      </button>
    </div>
  );
}

// ============================================================================
// FORM FIELDS
// ============================================================================

function InputField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  compact = false,
  aiRewrite = false,
  componentType = "",
}) {
  const [isRewriting, setIsRewriting] = useState(false);

  const handleRewrite = async () => {
    if (!value || isRewriting) return;
    setIsRewriting(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          fieldType: label,
          context: { componentType },
        }),
      });
      if (!res.ok) throw new Error("Failed to rewrite");
      const data = await res.json();
      if (data.text) {
        onChange(data.text);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rewrite text. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-600">
          {label}
        </label>
        {aiRewrite && type === "text" && (
          <button
            onClick={handleRewrite}
            disabled={isRewriting || !value}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors disabled:opacity-50"
            title="Rewrite with AI Magic"
          >
            {isRewriting ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Wand2 size={10} />
            )}
            {isRewriting ? "Rewriting..." : "AI ✨"}
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            "w-full border border-gray-200 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none",
            compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm",
          )}
        />
      )}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function GlobalColorField({ label, value, onChange, globalColors }) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Determine if the current value matches a global color
  const matchedGlobal = useMemo(() => {
    if (!globalColors) return null;
    for (const [key, color] of Object.entries(globalColors)) {
      if (color?.toLowerCase() === value?.toLowerCase()) return key;
    }
    return null;
  }, [value, globalColors]);

  const colorOptions = useMemo(() => {
    if (!globalColors) return [];
    return Object.entries(globalColors).map(([key, color]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color,
    }));
  }, [globalColors]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        {/* Global color swatches */}
        {colorOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { onChange(opt.color); setShowCustomPicker(false); }}
            className={clsx(
              "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
              matchedGlobal === opt.key
                ? "border-[#0b1411] ring-2 ring-[#0b1411]/20 scale-110"
                : "border-gray-200 hover:border-gray-400"
            )}
            style={{ backgroundColor: opt.color }}
            title={`${opt.label} (${opt.color})`}
          />
        ))}

        {/* Custom button */}
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={clsx(
            "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center text-[10px] font-bold",
            !matchedGlobal && !showCustomPicker
              ? "border-gray-300"
              : showCustomPicker
              ? "border-[#0b1411] ring-2 ring-[#0b1411]/20"
              : "border-gray-200 hover:border-gray-400"
          )}
          style={!matchedGlobal ? { backgroundColor: value } : { backgroundColor: '#f5f5f5' }}
          title="Custom color"
        >
          {matchedGlobal ? '⋯' : ''}
        </button>

        {/* Current value label */}
        <span className="text-[10px] font-mono font-bold text-gray-400 ml-1">
          {matchedGlobal ? matchedGlobal.toUpperCase() : value}
        </span>
      </div>

      {/* Custom color picker dropdown */}
      {showCustomPicker && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex gap-3 items-center">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-8 rounded border border-gray-200 cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      )}
    </div>
  );
}
