"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace("/feed");
        }
    }, [user, loading, router]);

    // While loading, render nothing to avoid a flash of auth content
    if (loading) return null;

    // If there's already a user, don't render auth pages (redirect is in progress)
    if (user) return null;

    return <>{children}</>;
}
