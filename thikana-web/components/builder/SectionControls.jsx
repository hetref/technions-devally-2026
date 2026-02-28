"use client";

/**
 * SECTION CONTROLS
 *
 * Add section button and section management
 */

import { Plus } from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";

export default function SectionControls() {
  const { addSection, getLayoutJSON } = useBuilderStore();
  const { pushState } = useHistoryStore();

  const handleAddSection = (variant) => {
    pushState(getLayoutJSON());
    addSection(variant);
  };

  return (
    <div className="flex items-center justify-center py-4 border-t border-b border-gray-200 bg-gray-50">
      <button
        onClick={() => handleAddSection("container")}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} />
        Add Section
      </button>
    </div>
  );
}
