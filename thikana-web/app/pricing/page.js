"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function FadeSection({ children, className = "", delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.1 });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay, duration: 0.7, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A]" style={{ fontFamily: "var(--font-body), 'Plus Jakarta Sans', system-ui, sans-serif" }}>

            {/* Navbar */}
            <Navbar />

            <main className="max-w-[1100px] mx-auto px-6 pt-40 pb-24">

                {/* Header */}
                <FadeSection className="text-center max-w-2xl mx-auto mb-20">
                    <p className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase mb-6">Pricing</p>
                    <h1 className="text-[56px] md:text-[72px] leading-[0.95] font-normal mb-6" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>
                        Simple,<br />scalable pricing.
                    </h1>
                    <p className="text-[15px] text-[#888] leading-relaxed">
                        No hidden fees. No setup costs. Start free and upgrade as your business grows.
                    </p>
                </FadeSection>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {[
                        {
                            name: "Starter",
                            sub: "For shops & solo businesses getting started online.",
                            price: "Free",
                            period: "forever",
                            cta: "Start for free",
                            ctaHref: "/signup",
                            dark: false,
                            popular: false,
                            features: [
                                "Geo-Discovery business profile",
                                "No-code website builder",
                                "Accept online payments (Razorpay)",
                                "Up to 50 products & services",
                                "Basic order management",
                                "Business notifications",
                            ],
                        },
                        {
                            name: "Pro",
                            sub: "For growing businesses expanding their operations.",
                            price: "$29",
                            period: "per month",
                            cta: "Start Pro Trial",
                            ctaHref: "/signup",
                            dark: true,
                            popular: true,
                            features: [
                                "Everything in Starter",
                                "Custom domain + SSL integration",
                                "Unlimited products & services",
                                "Recurring subscriptions",
                                "Invoice & billing management",
                                "Advanced analytics dashboard",
                                "Algolia-powered priority search",
                            ],
                        },
                        {
                            name: "Franchise",
                            sub: "For multi-location networks scaling operations.",
                            price: "$99",
                            period: "per month",
                            cta: "Contact Sales",
                            ctaHref: "/contact",
                            dark: false,
                            popular: false,
                            features: [
                                "Everything in Pro",
                                "Unlimited franchise outlets",
                                "Delegated franchise owner logins",
                                "Centralized franchise dashboard",
                                "Cross-outlet analytics",
                                "Webhook + API access",
                                "Dedicated onboarding support",
                            ],
                        },
                    ].map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1, duration: 0.65 }}
                            viewport={{ once: true }}
                            whileHover={{ y: plan.popular ? -2 : -5 }}
                            className={`rounded-[28px] p-8 flex flex-col border transition-all ${plan.dark
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xl md:-translate-y-5"
                                : "bg-white border-[#E8E4DC] hover:border-[#C8B99A] shadow-sm"
                                }`}
                        >
                            {plan.popular && (
                                <div className="bg-[#C8B99A] text-[#1A1A1A] text-[11px] font-bold w-fit px-3 py-1 rounded-full mb-5">
                                    Most Popular
                                </div>
                            )}
                            <h2 className="text-[20px] font-black mb-1" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>{plan.name}</h2>
                            <p className={`text-xs mb-8 leading-relaxed ${plan.dark ? "text-white/45" : "text-[#999]"}`}>{plan.sub}</p>

                            <div className="mb-8">
                                <span className="text-[48px] font-black leading-none">{plan.price}</span>
                                <span className={`text-sm ml-2 ${plan.dark ? "text-white/35" : "text-[#999]"}`}>/ {plan.period}</span>
                            </div>

                            <Link
                                href={plan.ctaHref}
                                className={`w-full py-3.5 rounded-full text-sm font-bold text-center mb-8 block transition ${plan.dark
                                    ? "bg-[#C8B99A] text-[#1A1A1A] hover:bg-[#b8a88a]"
                                    : idx === 2
                                        ? "bg-[#1A1A1A] text-white hover:bg-[#333]"
                                        : "border border-[#DDD8CF] hover:bg-[#F0ECE6] text-[#1A1A1A]"
                                    }`}
                            >
                                {plan.cta}
                            </Link>

                            <div className="space-y-4 mt-auto">
                                {plan.features.map((f) => (
                                    <div key={f} className="flex items-start gap-3">
                                        <Check
                                            className={`w-4 h-4 shrink-0 mt-0.5 ${plan.dark ? "text-[#C8B99A]" : "text-[#4A7C6F]"}`}
                                            strokeWidth={2.5}
                                        />
                                        <span className={`text-[13px] ${plan.dark ? "text-white/65" : "text-[#555]"}`}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ strip */}
                <FadeSection className="bg-white border border-[#E8E4DC] rounded-[28px] p-10 mb-12">
                    <h2 className="text-[26px] font-black mb-8" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>Common questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { q: "Can I upgrade or downgrade anytime?", a: "Yes — you can switch plans at any time from your dashboard. Changes take effect immediately with prorated billing." },
                            { q: "Is there a setup fee?", a: "None. There are zero setup fees. You pay only the monthly plan price, and the Starter plan is completely free forever." },
                            { q: "How does Razorpay work?", a: "We integrate Razorpay directly into your Thikana store. You connect your Razorpay account and start accepting payments within minutes." },
                            { q: "What counts as a franchise outlet?", a: "Each physical or operational branch of your business with its own team counts as a franchise outlet under the Franchise plan." },
                        ].map((item) => (
                            <div key={item.q} className="border-t border-[#F0ECE6] pt-6">
                                <h3 className="font-black text-[15px] mb-2">{item.q}</h3>
                                <p className="text-[13px] text-[#888] leading-relaxed">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </FadeSection>

                {/* Enterprise CTA */}
                <FadeSection className="bg-[#2B2B2B] rounded-[32px] px-10 md:px-16 py-14 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                    <div>
                        <p className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase mb-3">Enterprise</p>
                        <h2 className="text-[28px] font-black mb-2" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>Need a custom plan?</h2>
                        <p className="text-white/50 text-[14px] max-w-sm leading-relaxed">Large franchise networks, custom API needs, white-labelling, or B2B supplier integrations? Let's talk.</p>
                    </div>
                    <Link href="/contact" className="bg-[#C8B99A] text-[#1A1A1A] px-8 py-4 rounded-full text-sm font-bold hover:bg-[#b8a88a] transition shrink-0 flex items-center gap-2">
                        Talk to Sales <ArrowRight className="w-4 h-4" />
                    </Link>
                </FadeSection>

            </main>

            {/* Footer */}
            <footer className="bg-[#1E1E1E] text-white rounded-t-[40px] overflow-hidden mt-8">
                <div className="bg-[#C8B99A] px-8 md:px-20 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-[#1A1A1A] text-[22px] font-black leading-tight mb-1">Start free today. Scale when ready.</h3>
                        <p className="text-[#1A1A1A]/60 text-sm">No credit card required. Set up in minutes.</p>
                    </div>
                    <Link href="/signup" className="bg-[#1A1A1A] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#333] transition flex items-center gap-2 shrink-0">
                        Get Started Free <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="px-8 md:px-20 py-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="font-black text-xl" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>Thikana</div>
                        <p className="text-xs text-white/30">© {new Date().getFullYear()} Thikana Technologies Pvt. Ltd. All rights reserved.</p>
                        <div className="flex gap-6 text-sm text-white/40">
                            <Link href="/" className="hover:text-white transition">Home</Link>
                            <Link href="/about" className="hover:text-white transition">About</Link>
                            <Link href="/contact" className="hover:text-white transition">Contact</Link>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
