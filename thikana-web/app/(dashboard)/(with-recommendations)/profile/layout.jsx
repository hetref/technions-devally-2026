import React from "react";

const Layout = ({ children }) => {
    return (
        <div className="flex items-center justify-center w-full">
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="w-full">{children}</div>
            </div>
        </div>
    );
};

export default Layout;
