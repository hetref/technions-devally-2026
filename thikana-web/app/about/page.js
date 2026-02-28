"use client";

import React, { useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Zap, Globe, Store, GitBranch, BarChart3, CreditCard, Layers, Cloud, Users, Building2, Star } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function FadeSection({ children, className = "", delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.1 });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay, duration: 0.75, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

function AnimatedHeadline({ children, className = "", delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.4 });
    const words = children.split(" ");
    return (
        <h2 ref={ref} className={className} aria-label={children}>
            {words.map((w, i) => (
                <motion.span
                    key={i}
                    className="inline-block mr-[0.25em]"
                    initial={{ opacity: 0, y: 24 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: delay + i * 0.07, duration: 0.55, ease: "easeOut" }}
                >
                    {w}
                </motion.span>
            ))}
        </h2>
    );
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A]" style={{ fontFamily: "var(--font-body), 'Plus Jakarta Sans', system-ui, sans-serif" }}>

            {/* Navbar */}
            <Navbar />

            <main className="pt-20">

                {/* ── HERO ─── */}
                <section className="max-w-[1280px] mx-auto px-6 pt-12 pb-6">
                    <div className="flex flex-col md:flex-row h-auto md:h-[560px] rounded-[32px] overflow-hidden">
                        {/* Left text */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.85 }}
                            className="flex-[1.1] bg-[#2B2B2B] text-white p-12 md:p-16 flex flex-col justify-between relative overflow-hidden"
                        >
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full border border-white/5 pointer-events-none" />
                            <div>
                                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase mb-8">Our Story</motion.p>
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45, duration: 0.7 }}
                                    className="text-5xl md:text-[58px] leading-[1.08] tracking-tight mb-6"
                                    style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}
                                >
                                    One platform.<br />Every local business.
                                </motion.h1>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="text-white/60 text-[15px] max-w-sm leading-relaxed">
                                    Thikana was built to solve a real problem — local businesses have no single home on the internet.
                                </motion.p>
                            </div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="flex items-center gap-4">
                                <Link href="/signup" className="bg-[#C8B99A] text-[#1A1A1A] px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#b8a88a] transition flex items-center gap-2">
                                    Join Thikana <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Right image grid */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.85, delay: 0.2 }}
                            className="flex-1 grid grid-cols-2 gap-2 p-2 bg-[#E8DDD0] rounded-bl-[48px] md:rounded-bl-[64px] border-l-[16px] md:border-l-[24px] border-[#F7F6F3] -ml-4 md:-ml-6 overflow-hidden"
                        >
                            <div className="rounded-[16px] overflow-hidden row-span-2">
                                <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Local store" />
                            </div>
                            <div className="rounded-[16px] overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Business" />
                            </div>
                            <div className="rounded-[16px] overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Dashboard" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── INTRO BLOCK ─── */}
                <section className="max-w-[860px] mx-auto px-6 py-20 text-center">
                    <FadeSection>
                        <p className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase mb-6">What we believe</p>
                        <p className="text-[28px] md:text-[36px] leading-[1.25] text-[#1A1A1A]" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>
                            Hi! We're the <span className="text-[#C8B99A]">Thikana</span> team, and we build infrastructure for local businesses. With us, any shop owner gets a{" "}
                            <span className="relative inline-block">
                                <span className="relative z-10">complete digital presence</span>
                                <span className="absolute bottom-1 left-0 w-full h-2 bg-[#C8B99A]/25 rounded" />
                            </span>{" "}
                            — website, payments, discovery — without needing a tech team.
                        </p>
                        <Link href="/signup" className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 rounded-full text-sm font-bold mt-10 hover:bg-[#333] transition">
                            Start building <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </FadeSection>
                </section>

                {/* ── VALUES / FEATURES GRID ─── */}
                <section className="max-w-[1280px] mx-auto px-6 pb-12">
                    <FadeSection className="mb-10 flex items-center justify-between">
                        <p className="text-[22px] font-black" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>Why Thikana exists</p>
                        <Link href="/signup" className="flex items-center gap-2 text-sm font-bold hover:text-[#C8B99A] transition">
                            Get started <ArrowRight className="w-4 h-4" />
                        </Link>
                    </FadeSection>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: Globe, color: "#4A7C6F", title: "Local First", desc: "Discovery built for hyperlocal search, not generic SEO tricks. We rank businesses where it matters — nearby." },
                            { icon: Zap, color: "#C8B99A", title: "No Tech Team Needed", desc: "Any shop owner can build a page, add products, and accept payments within hours — with zero IT knowledge." },
                            { icon: GitBranch, color: "#5B5EA6", title: "Franchise Ready", desc: "From one outlet to fifty, Thikana scales with you. Delegate access, monitor centrally, grow freely." },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.12, duration: 0.6 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-[24px] p-8 flex flex-col gap-5 border border-[#E8E4DC] shadow-sm cursor-default"
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, border: `1.5px solid ${item.color}30` }}>
                                    <item.icon className="w-5 h-5" style={{ color: item.color }} strokeWidth={1.8} />
                                </div>
                                <div>
                                    <h3 className="font-black text-[17px] mb-2">{item.title}</h3>
                                    <p className="text-[13px] text-[#888] leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── PHOTO COLLAGE + MISSION ─── */}
                <section className="max-w-[1280px] mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: photo collage */}
                        <FadeSection className="grid grid-cols-2 gap-3 h-[480px]">
                            <div className="rounded-[20px] overflow-hidden row-span-2">
                                <img src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="team" />
                            </div>
                            <div className="rounded-[20px] overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="founder" />
                            </div>
                            <div className="rounded-[20px] overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="office" />
                            </div>
                        </FadeSection>

                        {/* Right: mission text */}
                        <FadeSection delay={0.15} className="flex flex-col justify-center gap-8 pl-0 md:pl-8">
                            <p className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase">Our Mission</p>
                            <h2 className="text-[36px] md:text-[44px] leading-[1.1] font-normal" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>
                                Becoming the digital backbone for every local business.
                            </h2>
                            <p className="text-[14px] text-[#888] leading-relaxed max-w-md">
                                We believe that every local business — the neighbourhood gym, the family restaurant, the corner pharmacy — deserves the same digital infrastructure as a Fortune 500 company. Thikana makes that possible.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Business registration with legal identifiers (MSME/GST/PAN)",
                                    "Algolia-powered geo-based discovery engine",
                                    "Razorpay for payments, invoices & subscriptions",
                                    "AWS S3 + CloudFront for scalable hosting",
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-[#4A7C6F] mt-0.5 shrink-0" strokeWidth={2.5} />
                                        <span className="text-[13px] text-[#555]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </FadeSection>
                    </div>
                </section>

                {/* ── HOW IT WORKS ─── */}
                <section className="max-w-[1280px] mx-auto px-6 py-16">
                    <FadeSection className="mb-12">
                        <p className="text-[22px] font-black mb-2" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>How Thikana works</p>
                        <p className="text-[#888] text-sm max-w-md">Simple steps. Zero confusion. Your business goes digital in hours, not months.</p>
                    </FadeSection>
                    <div className="space-y-0 border-l-2 border-[#E8E4DC] ml-4">
                        {[
                            { n: "01", title: "Register your business", desc: "Add legal identifiers, business details, products and services. Verification is streamlined for MSMEs." },
                            { n: "02", title: "Build your web presence", desc: "Use the no-code GrapesJS drag-and-drop builder. Pick a template, customise, publish. Done in minutes." },
                            { n: "03", title: "Accept payments", desc: "Add Razorpay in one click. Sell products, accept one-time bookings or set up recurring subscriptions." },
                            { n: "04", title: "Grow and scale", desc: "Add franchise outlets, delegate access to managers, and track everything from your central dashboard." },
                        ].map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.55 }}
                                viewport={{ once: true }}
                                className="relative pl-10 pb-12"
                            >
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#C8B99A] ring-4 ring-[#F7F6F3]" />
                                <span className="text-[11px] font-bold text-[#C8B99A] tracking-widest uppercase mb-2 block">{step.n}</span>
                                <h3 className="font-black text-[18px] mb-2">{step.title}</h3>
                                <p className="text-[13px] text-[#888] leading-relaxed max-w-md">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── STATS BAR ─── */}
                <FadeSection className="bg-[#2B2B2B] mx-6 md:mx-auto max-w-[1280px] rounded-[32px] px-8 md:px-16 py-12 mb-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { val: "500+", label: "Businesses onboarded" },
                            { val: "10k+", label: "Transactions processed" },
                            { val: "9", label: "Core platform modules" },
                            { val: "99%", label: "Platform uptime SLA" },
                        ].map((s, i) => (
                            <div key={i}>
                                <div className="text-[36px] font-black text-[#C8B99A] mb-1">{s.val}</div>
                                <div className="text-[12px] text-white/40">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </FadeSection>

            </main>

            {/* ── FOOTER ─── */}
            <footer className="bg-[#1E1E1E] text-white rounded-t-[40px] overflow-hidden mx-0">
                <div className="bg-[#C8B99A] px-8 md:px-20 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-[#1A1A1A] text-[24px] font-black leading-tight mb-1">Ready to grow your local business?</h3>
                        <p className="text-[#1A1A1A]/60 text-sm">Join hundreds of businesses already building on Thikana.</p>
                    </div>
                    <Link href="/signup" className="bg-[#1A1A1A] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#333] transition flex items-center gap-2 shrink-0">
                        Get Started Free <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="px-8 md:px-20 py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="font-black text-xl" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>Thikana</div>
                        <p className="text-xs text-white/30">© {new Date().getFullYear()} Thikana Technologies Pvt. Ltd. All rights reserved.</p>
                        <div className="flex gap-6 text-sm text-white/40">
                            <Link href="/" className="hover:text-white transition">Home</Link>
                            <Link href="/contact" className="hover:text-white transition">Contact</Link>
                            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
