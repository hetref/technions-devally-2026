"use client";

import React from "react";
import { SearchBox } from "react-instantsearch";
import { Search as SearchIcon } from "lucide-react";

export const CustomSearchBox = ({ ...props }) => (
    <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
            <SearchIcon className="w-5 h-5 text-gray-400" />
        </div>
        <SearchBox
            {...props}
            classNames={{
                root: "w-full",
                form: "w-full",
                input:
                    "w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-base shadow-sm transition-all duration-200 hover:shadow-md",
                submit: "hidden",
                reset:
                    "absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors",
                loadingIndicator: "absolute right-14 top-1/2 -translate-y-1/2",
            }}
            placeholder="Search for businesses near you..."
            submitIconComponent={() => null}
        />
    </div>
);
