"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MainNavbar from "@/components/MainNavbar";

export default function DashboardLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    // While loading, render nothing to avoid a flash of dashboard content
    if (loading) return null;

    // If there's no user, don't render dashboard pages (redirect is in progress)
    if (!user) return null;

    return <>
        <MainNavbar />
        <div className="mt-[80px]">{children}</div></>;
}
