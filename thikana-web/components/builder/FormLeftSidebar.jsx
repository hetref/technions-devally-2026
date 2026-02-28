"use client";

/**
 * FORM LEFT SIDEBAR
 *
 * Elementor-style layout presets + draggable component elements for the form builder.
 * Includes form-specific elements AND standard content components.
 * Dark-themed sidebar with tabbed view: Elements / Layers.
 */

import { useState, useMemo } from "react";
import {
  Layout,
  Type,
  Image,
  MousePointer2,
  Grid3x3,
  FileText,
  Heading1,
  Link as LinkIcon,
  Box,
  Video as VideoIcon,
  Map as MapIcon,
  Star,
  Minus,
  FormInput,
  AlignLeft,
  Square,
  Circle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Search,
  LayoutGrid,
  GripVertical,
  Layers,
  Plus,
  WrapText,
  ToggleLeft,
  ListOrdered,
  Upload,
  Hash,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
} from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useUIStore from "@/lib/stores/uiStore";
import TreePanel from "@/components/builder/TreePanel";
import { clsx } from "clsx";

// ─── Layout presets ─────────────────────────────────────────────────────────

const layoutPresets = [
  { label: "1 Column", widths: [12] },
  { label: "2 Columns", widths: [6, 6] },
  { label: "3 Columns", widths: [4, 4, 4] },
  { label: "2/3 + 1/3", widths: [8, 4] },
  { label: "1/3 + 2/3", widths: [4, 8] },
  { label: "4 Columns", widths: [3, 3, 3, 3] },
];

// ─── Element library (Form builder — form-focused + content) ─────────────────

const elementLibrary = {
  "Form Fields": [
    { type: "Input", icon: FormInput, label: "Input" },
    { type: "Textarea", icon: AlignLeft, label: "Textarea" },
    { type: "Select", icon: Square, label: "Select" },
    { type: "Checkbox", icon: CheckSquare, label: "Checkbox" },
    { type: "Radio", icon: Circle, label: "Radio" },
    { type: "Label", icon: Type, label: "Label" },
    { type: "Button", icon: MousePointer2, label: "Button" },
  ],
  Content: [
    { type: "Heading", icon: Heading1, label: "Heading" },
    { type: "Text", icon: Type, label: "Text" },
    { type: "Divider", icon: Minus, label: "Divider" },
    { type: "Link", icon: LinkIcon, label: "Link" },
    { type: "LinkBox", icon: Box, label: "Link Box" },
  ],
  Media: [
    { type: "Image", icon: Image, label: "Image" },
    { type: "ImageBox", icon: Box, label: "Image Box" },
    { type: "Video", icon: VideoIcon, label: "Video" },
    { type: "Map", icon: MapIcon, label: "Map" },
    { type: "Icon", icon: Star, label: "Icon" },
    { type: "Gallery", icon: Grid3x3, label: "Gallery" },
  ],
  "Pre-built Sections": [
    { type: "Hero", icon: Layout, label: "Hero" },
    { type: "Features", icon: Grid3x3, label: "Features" },
    { type: "CTA", icon: FileText, label: "CTA" },
    { type: "Navbar", icon: ClipboardList, label: "Navbar" },
    { type: "Footer", icon: Layout, label: "Footer" },
  ],
};

// ─── Preset visual icon ──────────────────────────────────────────────────────

function PresetIcon({ widths }) {
  return (
    <div className="flex gap-0.5 w-full h-5">
      {widths.map((w, i) => (
        <div
          key={i}
          className="bg-emerald-400/80 rounded-sm"
          style={{ width: `${(w / 12) * 100}%`, height: "100%" }}
        />
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FormLeftSidebar() {
  const { addContainer, getLayoutJSON } = useBuilderStore();
  const { pushState } = useHistoryStore();
  const { activeLeftTab, setActiveLeftTab } = useUIStore();

  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(elementLibrary)
  );
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddContainer = (widths) => {
    pushState(getLayoutJSON());
    addContainer(widths);
  };

  const handleDragStart = (event, componentType) => {
    event.dataTransfer.setData("componentType", componentType);
    event.dataTransfer.effectAllowed = "copy";
    event.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (event) => {
    event.currentTarget.style.opacity = "1";
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Filter elements based on search
  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return elementLibrary;
    const q = searchQuery.toLowerCase();
    const result = {};
    for (const [cat, items] of Object.entries(elementLibrary)) {
      const filtered = items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [searchQuery]);

  return (
    <div className="w-72 bg-[#1E293B] border-r border-slate-700 overflow-hidden builder-sidebar flex flex-col">
      {/* ── Tab Switcher ──────────────────────────────────────── */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveLeftTab("elements")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeLeftTab === "elements"
              ? "text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/30"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
          )}
        >
          <Plus size={13} />
          Elements
        </button>
        <button
          onClick={() => setActiveLeftTab("layers")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeLeftTab === "layers"
              ? "text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/30"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
          )}
        >
          <Layers size={13} />
          Layers
        </button>
      </div>

      {/* ── Elements Tab Content ──────────────────────────────── */}
      {activeLeftTab === "elements" && (
        <>
          {/* Search */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elements..."
                className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* ── Layout Presets ──────────────────────────────────────── */}
            {!searchQuery && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <LayoutGrid size={12} className="text-slate-500" />
                  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Containers
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {layoutPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleAddContainer(preset.widths)}
                      className="p-2 bg-slate-800 border border-slate-600 rounded-lg hover:border-emerald-400 hover:bg-slate-700 transition-all duration-200 flex flex-col items-center gap-1.5 group"
                      title={preset.label}
                    >
                      <PresetIcon widths={preset.widths} />
                      <span className="text-[9px] text-slate-500 group-hover:text-slate-300 leading-none">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Draggable Elements ──────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <GripVertical size={12} className="text-slate-500" />
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Elements
                </h3>
              </div>

              <div className="space-y-2">
                {Object.entries(filteredLibrary).map(([category, elements]) => (
                  <div
                    key={category}
                    className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-300">
                        {category}
                      </span>
                      {expandedCategories.includes(category) ? (
                        <ChevronDown size={14} className="text-slate-500" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-500" />
                      )}
                    </button>

                    {expandedCategories.includes(category) && (
                      <div className="px-1.5 pb-1.5 grid grid-cols-3 gap-1">
                        {elements.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.type}
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, item.type)
                              }
                              onDragEnd={handleDragEnd}
                              className="flex flex-col items-center gap-1 p-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-emerald-600/20 hover:border-emerald-500/40 transition-all duration-150 border border-transparent text-center"
                            >
                              <Icon
                                size={18}
                                className="text-slate-400 group-hover:text-emerald-400 shrink-0"
                              />
                              <span className="text-[10px] text-slate-400 leading-tight">
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Layers Tab Content ────────────────────────────────── */}
      {activeLeftTab === "layers" && <TreePanel />}
    </div>
  );
}
