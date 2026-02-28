"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ({ props, styles, isSelected, onClick }) {
  const { title, items = [] } = props;
  const [openIndex, setOpenIndex] = useState(null);

  const defaultItems = items.length ? items : [
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day money-back guarantee on all purchases. If you're not satisfied, contact our support team for a full refund."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days. Express shipping is available for 2-3 day delivery."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes! Our support team is available 24/7 via email, chat, and phone to assist you with any questions."
    },
    {
      question: "Can I upgrade my plan later?",
      answer: "Absolutely! You can upgrade or downgrade your plan at any time from your account settings."
    },
  ];

  return (
    <div
      onClick={onClick}
      className={clsx(
        "py-8 sm:py-12 px-4 sm:px-6 lg:px-8",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
        fontFamily: styles?.fontFamily || 'inherit',
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        {title && (
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12"
            style={{
              color: styles?.textColor || "#1f2937",
              fontFamily: styles?.fontFamily || 'inherit',
            }}
          >
            {title}
          </h2>
        )}

        {/* FAQ Items */}
        <div className="space-y-3 sm:space-y-4">
          {defaultItems.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
              style={{
                borderColor: styles?.textColor ? `${styles.textColor}20` : "#e5e7eb",
              }}
            >
              {/* Question */}
              <button
                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex(openIndex === index ? null : index);
                }}
                style={{
                  backgroundColor: openIndex === index ? (styles?.textColor ? `${styles.textColor}10` : "#f9fafb") : "transparent",
                }}
              >
                <span
                  className="font-semibold text-sm sm:text-base md:text-lg pr-4"
                  style={{
                    color: styles?.textColor || "#1f2937",
                    fontFamily: styles?.fontFamily || 'inherit',
                  }}
                >
                  {item.question}
                </span>
                <ChevronDown
                  className={clsx(
                    "flex-shrink-0 transition-transform duration-200",
                    openIndex === index && "rotate-180"
                  )}
                  size={20}
                  style={{ color: styles?.textColor || "#6b7280" }}
                />
              </button>

              {/* Answer */}
              {openIndex === index && (
                <div
                  className="px-4 sm:px-6 py-3 sm:py-4 border-t"
                  style={{
                    borderColor: styles?.textColor ? `${styles.textColor}20` : "#e5e7eb",
                    backgroundColor: styles?.textColor ? `${styles.textColor}05` : "#f9fafb",
                  }}
                >
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{
                      color: styles?.textColor || "#6b7280",
                      fontFamily: styles?.fontFamily || 'inherit',
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
