"use client";

/**
 * LEFT SIDEBAR
 *
 * Elementor-style layout presets + draggable component elements.
 * Dark-themed sidebar with tabbed view: Elements (drag widgets) / Layers (tree panel).
 */

import { useState, useMemo } from "react";
import {
  Layout,
  Type,
  Image,
  MousePointer2,
  Grid3x3,
  Menu,
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
  Palette,
} from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useUIStore from "@/lib/stores/uiStore";
import TreePanel from "@/components/builder/TreePanel";
import TemplateSection from "@/components/builder/TemplateSection";
import { clsx } from "clsx";

// ─── Layout presets ──────────────────────────────────────────────────────────

const layoutPresets = [
  { label: "1 Column", widths: [12] },
  { label: "2 Columns", widths: [6, 6] },
  { label: "3 Columns", widths: [4, 4, 4] },
  { label: "2/3 + 1/3", widths: [8, 4] },
  { label: "1/3 + 2/3", widths: [4, 8] },
  { label: "4 Columns", widths: [3, 3, 3, 3] },
];

// ─── Element library ─────────────────────────────────────────────────────────

const elementLibrary = {
  Content: [
    { type: "Heading", icon: Heading1, label: "Heading" },
    { type: "Text", icon: Type, label: "Text" },
    { type: "Link", icon: LinkIcon, label: "Link" },
    { type: "LinkBox", icon: Box, label: "Link Box" },
    { type: "Divider", icon: Minus, label: "Divider" },
  ],
  Media: [
    { type: "Image", icon: Image, label: "Image" },
    { type: "ImageBox", icon: Box, label: "Image Box" },
    { type: "Video", icon: VideoIcon, label: "Video" },
    { type: "Map", icon: MapIcon, label: "Map" },
    { type: "Icon", icon: Star, label: "Icon" },
    { type: "Gallery", icon: Grid3x3, label: "Gallery" },
  ],
  "Form Elements": [
    { type: "FormEmbed", icon: FileText, label: "Form" },
    { type: "Form", icon: Square, label: "Form Container" },
    { type: "Input", icon: FormInput, label: "Input" },
    { type: "Textarea", icon: AlignLeft, label: "Textarea" },
    { type: "Select", icon: Square, label: "Select" },
    { type: "Button", icon: MousePointer2, label: "Button" },
    { type: "Label", icon: Type, label: "Label" },
    { type: "Checkbox", icon: CheckSquare, label: "Checkbox" },
    { type: "Radio", icon: Circle, label: "Radio" },
  ],
  "Pre-built Sections": [
    { type: "Hero", icon: Layout, label: "Hero" },
    { type: "Features", icon: Grid3x3, label: "Features" },
    { type: "CTA", icon: FileText, label: "CTA" },
    { type: "Navbar", icon: Menu, label: "Navbar" },
    { type: "Footer", icon: Layout, label: "Footer" },
  ],
};

// ─── Preset visual icon ─────────────────────────────────────────────────────

function PresetIcon({ widths }) {
  return (
    <div className="flex gap-0.5 w-full h-5">
      {widths.map((w, i) => (
        <div
          key={i}
          className="bg-[#0b1411]/80 rounded-sm"
          style={{ width: `${(w / 12) * 100}%`, height: "100%" }}
        />
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeftSidebar() {
  const { addContainer, getLayoutJSON } = useBuilderStore();
  const { pushState } = useHistoryStore();
  const { activeLeftTab, setActiveLeftTab } = useUIStore();

  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(elementLibrary),
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
        : [...prev, category],
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
          item.type.toLowerCase().includes(q),
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [searchQuery]);

  return (
    <div className="w-72 bg-white/80 backdrop-blur-md border-r border-gray-100 overflow-hidden builder-sidebar flex flex-col z-10 shadow-sm shrink-0">
      {/* ── Tab Switcher ──────────────────────────────────────── */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveLeftTab("elements")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-colors",
            activeLeftTab === "elements"
              ? "text-[#1d2321] border-b-2 border-[#1d2321] bg-[#fcfdfc]"
              : "text-gray-400 hover:text-[#1d2321] hover:bg-gray-50",
          )}
        >
          <Plus size={14} />
          Elements
        </button>
        <button
          onClick={() => setActiveLeftTab("layers")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-colors",
            activeLeftTab === "layers"
              ? "text-[#1d2321] border-b-2 border-[#1d2321] bg-[#fcfdfc]"
              : "text-gray-400 hover:text-[#1d2321] hover:bg-gray-50",
          )}
        >
          <Layers size={14} />
          Layers
        </button>
        <button
          onClick={() => setActiveLeftTab("templates")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeLeftTab === "templates"
              ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/30"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/20",
          )}
        >
          <Palette size={13} />
          Templates
        </button>
      </div>

      {/* ── Elements Tab Content ──────────────────────────────── */}
      {activeLeftTab === "elements" && (
        <>
          {/* Search */}
          <div className="p-4 border-b border-gray-100 bg-[#fcfdfc]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elements..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#0b1411] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8bc4b1] focus:border-transparent shadow-sm transition-all"
              />
            </div>
          </div>

          <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
            {/* ── Layout Presets ──────────────────────────────────────── */}
            {!searchQuery && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid size={14} className="text-[#8bc4b1]" />
                  <h3 className="text-[10px] font-black text-[#8bc4b1] uppercase tracking-[0.2em]">
                    Containers
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {layoutPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleAddContainer(preset.widths)}
                      className="p-3 bg-white border border-gray-100 rounded-xl hover:border-[#8bc4b1] hover:shadow-md transition-all duration-300 flex flex-col items-center gap-2 group hover:-translate-y-0.5"
                      title={preset.label}
                    >
                      <PresetIcon widths={preset.widths} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-[#1d2321] leading-none transition-colors">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Draggable Elements ──────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GripVertical size={14} className="text-[#8bc4b1]" />
                <h3 className="text-[10px] font-black text-[#8bc4b1] uppercase tracking-[0.2em]">
                  Elements
                </h3>
              </div>

              <div className="space-y-3">
                {Object.entries(filteredLibrary).map(([category, elements]) => (
                  <div
                    key={category}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fcfdfc] transition-colors"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#1d2321]">
                        {category}
                      </span>
                      {expandedCategories.includes(category) ? (
                        <ChevronDown size={14} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}
                    </button>

                    {expandedCategories.includes(category) && (
                      <div className="px-2 pb-2 grid grid-cols-3 gap-1.5 bg-[#fcfdfc] pt-2 border-t border-gray-50">
                        {elements.map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.type}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item.type)}
                              onDragEnd={handleDragEnd}
                              className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl cursor-grab active:cursor-grabbing hover:bg-[#f2f4f2] hover:shadow-sm border border-gray-100 hover:border-[#8bc4b1] transition-all duration-300 text-center hover:-translate-y-0.5"
                            >
                              <Icon
                                size={18}
                                className="text-gray-400 group-hover:text-[#1d2321] shrink-0 transition-colors"
                              />
                              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-[#8bc4b1] leading-tight transition-colors">
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

      {/* ── Templates Tab Content ────────────────────────────── */}
      {activeLeftTab === "templates" && <TemplateSection />}
    </div>
  );
}
