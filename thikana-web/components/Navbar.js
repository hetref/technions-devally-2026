"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <motion.nav
            initial={false}
            animate={{
                width: scrolled ? "85%" : "100%",
                maxWidth: scrolled ? "900px" : "1280px",
                top: scrolled ? 16 : 0,
                backgroundColor: scrolled ? "rgba(247,246,243,0.96)" : "transparent",
                boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.07)" : "none",
                borderRadius: scrolled ? 999 : 0,
                paddingTop: scrolled ? 10 : 20,
                paddingBottom: scrolled ? 10 : 20,
                paddingLeft: scrolled ? 24 : 32,
                paddingRight: scrolled ? 24 : 32,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-between"
            style={{
                border: scrolled ? "1px solid #E5E0D8" : "1px solid transparent",
                fontFamily: "var(--font-body), 'Plus Jakarta Sans', system-ui, sans-serif",
            }}
        >
            {/* Logo */}
            <Link
                href="/"
                className="font-black text-xl tracking-tight text-[#1A1A1A] shrink-0"
                style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}
            >
                Thikana
            </Link>

            {/* Center links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#555]">
                {NAV_LINKS.map((l) => {
                    const active = pathname === l.href;
                    return (
                        <Link
                            key={l.label}
                            href={l.href}
                            className={`transition-colors ${active ? "text-[#1A1A1A] font-bold" : "hover:text-[#1A1A1A]"
                                }`}
                        >
                            {l.label}
                        </Link>
                    );
                })}
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-4 shrink-0">
                <Link
                    href="/login"
                    className="text-sm font-semibold text-[#1A1A1A] hover:text-[#555] transition"
                >
                    Log In
                </Link>
                <Link
                    href="/signup"
                    className="bg-[#1A1A1A] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#333] transition inline-flex items-center justify-center"
                >
                    Get Started
                </Link>
            </div>
        </motion.nav>
    );
}
