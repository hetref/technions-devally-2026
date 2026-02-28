"use client";

import React from "react";
import { RefinementList } from "react-instantsearch";
import { Filter } from "lucide-react";

export const CustomRefinementList = ({ ...props }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 rounded-lg">
                <Filter className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Business Type</h3>
        </div>
        <RefinementList
            {...props}
            classNames={{
                root: "",
                list: "space-y-3",
                item: "flex items-center",
                label: "flex items-center cursor-pointer group w-full",
                checkbox:
                    "w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 bg-white transition-colors",
                labelText: "ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors flex-1",
                count:
                    "ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium",
            }}
            operator="or"
            showMore
        />
    </div>
);
