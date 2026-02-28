"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ props, styles, isSelected, onClick }) {
  const { logo, links = [] } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const defaultLinks = links.length
    ? links
    : [
        { label: "Home", href: "#" },
        { label: "About", href: "#" },
        { label: "Services", href: "#" },
        { label: "Contact", href: "#" },
      ];

  return (
    <nav
      onClick={onClick}
      className={clsx(
        "relative px-4 sm:px-6 py-3 sm:py-4",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div
          className="text-lg sm:text-xl font-bold"
          style={{ 
            color: styles?.textColor || "#1f2937",
            fontFamily: styles?.fontFamily || 'inherit',
          }}
        >
          {logo || "Logo"}
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex gap-6 text-sm sm:text-base">
          {defaultLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="hover:text-blue-600 transition-colors"
              style={{ 
                color: styles?.textColor || "#374151",
                fontFamily: styles?.fontFamily || 'inherit',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          style={{ 
            color: styles?.textColor || "#374151",
          }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div 
          className="sm:hidden absolute left-0 right-0 top-full shadow-lg border-t border-gray-100 z-50"
          style={{
            backgroundColor: styles?.backgroundColor || "#ffffff",
          }}
        >
          <div className="flex flex-col py-2">
            {defaultLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                style={{ 
                  color: styles?.textColor || "#374151",
                  fontFamily: styles?.fontFamily || 'inherit',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
