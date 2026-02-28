"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Phone, Clock, Mail, ArrowUpRight, Send } from "lucide-react";
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

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
    const [sent, setSent] = useState(false);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A]" style={{ fontFamily: "var(--font-body), 'Plus Jakarta Sans', system-ui, sans-serif" }}>

            {/* Navbar */}
            <Navbar />

            <main className="max-w-[1100px] mx-auto px-6 pt-36 pb-24">

                {/* ── TOP LABEL ─── */}
                <FadeSection>
                    <p className="text-[#C8B99A] text-xs font-bold tracking-widest uppercase mb-6">Get In Touch</p>
                </FadeSection>

                {/* ── MAIN CONTACT BLOCK ─── */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

                    {/* Left: form */}
                    <FadeSection className="flex-[1.3]" delay={0.05}>
                        <h1
                            className="text-[64px] md:text-[80px] leading-[0.95] tracking-tight mb-4 font-normal"
                            style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}
                        >
                            Contact<br />Us
                        </h1>
                        <p className="text-[14px] text-[#888] mb-10 max-w-xs leading-relaxed">
                            Tell us how we can help your business grow and we'll get back to you within 24 hours.
                        </p>

                        {sent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#4A7C6F]/10 border border-[#4A7C6F]/30 rounded-[20px] p-10 text-center"
                            >
                                <div className="w-14 h-14 rounded-full bg-[#4A7C6F]/15 flex items-center justify-center mx-auto mb-4">
                                    <Send className="w-6 h-6 text-[#4A7C6F]" />
                                </div>
                                <h3 className="font-black text-xl mb-2">Message received!</h3>
                                <p className="text-[13px] text-[#888]">We'll confirm availability and respond within 24 hours.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Row 1 */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2">Name</label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Your full name"
                                            required
                                            className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] placeholder-[#BDBDBD] focus:outline-none focus:border-[#C8B99A] transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] placeholder-[#BDBDBD] focus:outline-none focus:border-[#C8B99A] transition"
                                        />
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2">Phone Number</label>
                                        <input
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="+91 98765 43210"
                                            className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] placeholder-[#BDBDBD] focus:outline-none focus:border-[#C8B99A] transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2">Select Service</label>
                                        <select
                                            name="service"
                                            value={form.service}
                                            onChange={handleChange}
                                            className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] focus:outline-none focus:border-[#C8B99A] transition appearance-none"
                                        >
                                            <option value="" disabled>Choose your plan...</option>
                                            <option>Starter — Free</option>
                                            <option>Pro — $29/month</option>
                                            <option>Franchise — $99/month</option>
                                            <option>Custom Enterprise</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-wider mb-2">Message / Notes</label>
                                    <textarea
                                        name="message"
                                        value={form.message}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Tell us about your business, your goals, or anything else we should know..."
                                        className="w-full bg-white border border-[#E8E4DC] rounded-[12px] px-4 py-3.5 text-[14px] text-[#1A1A1A] placeholder-[#BDBDBD] focus:outline-none focus:border-[#C8B99A] transition resize-none"
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="flex items-center gap-3 bg-[#1A1A1A] text-white px-8 py-4 rounded-full text-sm font-bold hover:bg-[#333] transition group"
                                >
                                    Send Message
                                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </span>
                                </button>
                            </form>
                        )}
                    </FadeSection>

                    {/* Right: image + info */}
                    <FadeSection delay={0.18} className="flex-1 flex flex-col gap-6 sticky top-32 self-start">
                        <div className="relative rounded-[28px] overflow-hidden aspect-[3/4] shadow-sm">
                            <img
                                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=700"
                                alt="Thikana office"
                                className="w-full h-full object-cover"
                            />
                            {/* "Your Journey" pill */}
                            <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-[12px] font-bold text-[#1A1A1A] shadow-sm">
                                Your Business Starts Here
                            </div>
                        </div>

                        {/* Info card below image */}
                        <div className="bg-white border border-[#E8E4DC] rounded-[20px] p-6 text-center">
                            <p className="text-[11px] font-bold text-[#C8B99A] uppercase tracking-widest mb-2">Response time</p>
                            <p className="text-[28px] font-black" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>Within 24 hrs</p>
                            <p className="text-[12px] text-[#888] mt-1">Mon–Fri, 9am–6pm IST</p>
                        </div>
                    </FadeSection>

                </div>

                {/* ── CONTACT INFO STRIP ─── */}
                <FadeSection delay={0.2} className="mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Phone, title: "Call & WhatsApp", lines: ["+91 98765 43210", "+91 87654 32109"], color: "#4A7C6F" },
                            { icon: Clock, title: "Working Hours", lines: ["Mon–Fri: 9am–6pm IST", "Saturday: Closed"], color: "#C8B99A" },
                            { icon: Mail, title: "Write to Us", lines: ["hello@thikana.in", "support@thikana.in"], color: "#5B5EA6" },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -4 }}
                                className="bg-white border border-[#E8E4DC] rounded-[20px] p-8 text-center flex flex-col items-center gap-4 shadow-sm"
                            >
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: `${item.color}12`, border: `1.5px solid ${item.color}25` }}
                                >
                                    <item.icon className="w-5 h-5" style={{ color: item.color }} strokeWidth={1.8} />
                                </div>
                                <h3 className="font-black text-[15px]">{item.title}</h3>
                                {item.lines.map((l) => (
                                    <p key={l} className="text-[13px] text-[#888]">{l}</p>
                                ))}
                            </motion.div>
                        ))}
                    </div>
                </FadeSection>

            </main>

            {/* Footer */}
            <footer className="bg-[#1E1E1E] text-white rounded-t-[40px] overflow-hidden">
                <div className="bg-[#C8B99A] px-8 md:px-20 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-[#1A1A1A] text-[22px] font-black leading-tight mb-1">Ready to grow your local business?</h3>
                        <p className="text-[#1A1A1A]/60 text-sm">Join hundreds of businesses already building on Thikana.</p>
                    </div>
                    <Link href="/signup" className="bg-[#1A1A1A] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#333] transition flex items-center gap-2 shrink-0">
                        Get Started Free <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="px-8 md:px-20 py-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="font-black text-xl" style={{ fontFamily: "var(--font-heading), 'DM Serif Display', serif" }}>Thikana</div>
                        <p className="text-xs text-white/30">© {new Date().getFullYear()} Thikana Technologies Pvt. Ltd. All rights reserved.</p>
                        <div className="flex gap-6 text-sm text-white/40">
                            <Link href="/" className="hover:text-white transition">Home</Link>
                            <Link href="/about" className="hover:text-white transition">About</Link>
                            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
