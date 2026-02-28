"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile menu on route change
    useEffect(() => { setMenuOpen(false); }, [pathname]);

    // Scroll listener
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Lock body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    return (
        <>
            {/* ── Main navbar bar ───────────────────────────── */}
            <motion.nav
                initial={false}
                animate={{
                    width: scrolled ? "90%" : "100%",
                    maxWidth: scrolled ? "900px" : "1280px",
                    top: scrolled ? 12 : 0,
                    backgroundColor: scrolled ? "rgba(247,246,243,0.97)" : "transparent",
                    boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.07)" : "none",
                    borderRadius: scrolled ? 999 : 0,
                    paddingTop: scrolled ? 10 : 20,
                    paddingBottom: scrolled ? 10 : 20,
                    paddingLeft: scrolled ? 20 : 24,
                    paddingRight: scrolled ? 20 : 24,
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-between"
                style={{
                    border: scrolled ? "1px solid #E5E0D8" : "1px solid transparent",
                    fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    className="font-black text-xl tracking-tight text-[#1A1A1A] shrink-0"
                    style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}
                >
                    Thikana
                </Link>

                {/* Desktop center links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#555]">
                    {NAV_LINKS.map((l) => {
                        const active = pathname === l.href;
                        return (
                            <Link
                                key={l.label}
                                href={l.href}
                                className={`transition-colors ${active ? "text-[#1A1A1A] font-bold" : "hover:text-[#1A1A1A]"}`}
                            >
                                {l.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop CTA + Mobile hamburger */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Desktop-only CTA */}
                    <Link
                        href="/login"
                        className="hidden md:inline text-sm font-semibold text-[#1A1A1A] hover:text-[#555] transition"
                    >
                        Log In
                    </Link>
                    <Link
                        href="/signup"
                        className="hidden md:inline-flex bg-[#1A1A1A] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#333] transition items-center justify-center"
                    >
                        Get Started
                    </Link>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-[#1A1A1A] text-white transition hover:bg-[#333] shrink-0"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                    >
                        {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </motion.nav>

            {/* ── Mobile fullscreen menu overlay ─────────────── */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 z-40 bg-[#F7F6F3] flex flex-col px-6 pt-28 pb-10"
                        style={{ fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif" }}
                    >
                        {/* Nav links */}
                        <nav className="flex flex-col gap-1 flex-1">
                            {NAV_LINKS.map((l, i) => {
                                const active = pathname === l.href;
                                return (
                                    <motion.div
                                        key={l.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07, duration: 0.35 }}
                                    >
                                        <Link
                                            href={l.href}
                                            onClick={() => setMenuOpen(false)}
                                            className={`block text-[36px] font-black tracking-tight leading-tight py-2 transition-colors ${active ? "text-[#C8B99A]" : "text-[#1A1A1A] hover:text-[#C8B99A]"
                                                }`}
                                            style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}
                                        >
                                            {l.label}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </nav>

                        {/* Bottom CTA row */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="flex flex-col gap-3 border-t border-[#E8E4DC] pt-8"
                        >
                            <Link
                                href="/login"
                                onClick={() => setMenuOpen(false)}
                                className="w-full text-center border border-[#1A1A1A] text-[#1A1A1A] py-3.5 rounded-full text-sm font-bold hover:bg-[#1A1A1A] hover:text-white transition"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                onClick={() => setMenuOpen(false)}
                                className="w-full text-center bg-[#1A1A1A] text-white py-3.5 rounded-full text-sm font-bold hover:bg-[#333] transition"
                            >
                                Get Started
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
