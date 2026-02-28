"use client";

import React from "react";
import { SortBy } from "react-instantsearch";
import { Clock } from "lucide-react";

export const CustomSortBy = ({ ...props }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-green-100 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Sort By</h3>
        </div>
        <SortBy
            {...props}
            classNames={{
                root: "w-full",
                select:
                    "w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all duration-200 hover:border-gray-300",
            }}
            items={[
                { label: "Featured", value: "business" },
                {
                    label: "Business Name (A-Z)",
                    value: "business_businessName_asc",
                },
                {
                    label: "Business Name (Z-A)",
                    value: "business_businessName_desc",
                },
            ]}
        />
    </div>
);
