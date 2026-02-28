"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ArrowRight,
  Quote,
  CheckCircle2,
  Check,
  Store,
  Globe,
  CreditCard,
  BarChart3,
  Layers,
  GitBranch,
  Zap,
  Cloud,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import Link from "next/link";
import Navbar from "@/components/Navbar";

/* ── Reusable animated word-by-word headline ─────────────────── */
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
          initial={{ opacity: 0, y: 24, rotateX: -30 }}
          animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ delay: delay + i * 0.07, duration: 0.55, ease: "easeOut" }}
        >
          {w}
        </motion.span>
      ))}
    </h2>
  );
}

/* ── Reusable fade-up section wrapper ────────────────────────── */
function FadeSection({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
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

/* ── Rotating word ticker in hero ────────────────────────────── */
const WORDS = ["Digitally.", "Effortlessly.", "Locally.", "Powerfully."];
function RotatingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((p) => (p + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="inline-block overflow-hidden leading-none h-[1.1em] align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          className="block text-[#E8D5B7]"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── Counter animation ───────────────────────────────────────── */
function Counter({ to, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(id); }
      else setCount(start);
    }, 30);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────── */

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8 pt-32">

        {/* ── HERO ───────────────────────────────────────────────── */}
        <section className="flex flex-col md:flex-row h-auto md:h-[520px] rounded-[32px] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex-[1.2] bg-[#2B2B2B] text-white p-12 md:p-16 flex flex-col justify-center relative overflow-hidden"
          >
            {/* subtle texture ring */}
            <div className="absolute -right-24 -bottom-24 w-72 h-72 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-white/5 pointer-events-none" />

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-[#C8B99A] text-sm font-semibold tracking-widest uppercase mb-6"
            >
              Welcome To Thikana
            </motion.p>

            <h1 className="text-5xl md:text-[60px] font-black leading-[1.08] tracking-tight mb-6">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.65 }}
              >
                Empower Your Local
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58, duration: 0.65 }}
              >
                Business <RotatingWord />
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.7 }}
              className="text-white/60 text-[15px] max-w-sm mb-12 leading-relaxed"
            >
              Thikana is a SaaS platform combining business discovery, website building, commerce, and payments into a single ecosystem.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.55 }}
              className="flex items-center gap-4 mt-auto"
            >
              <button className="bg-[#C8B99A] text-[#1A1A1A] px-8 py-3.5 rounded-full text-sm font-bold hover:bg-[#b8a88a] transition flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button className="border border-white/20 text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-white/8 transition">
                Learn More
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            className="flex-1 bg-[#E8DDD0] flex items-center justify-center p-0 relative rounded-bl-[48px] md:rounded-bl-[64px] border-l-[16px] md:border-l-[24px] border-[#F7F6F3] -ml-4 md:-ml-6 z-10 overflow-hidden group"
          >
            {/* Dashboard screenshot — no blend mode so colours are vivid */}
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=85&w=1200"
              alt="Thikana SaaS analytics dashboard"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            {/* Subtle warm tint overlay */}
            <div className="absolute inset-0 bg-[#2B2B2B]/10 pointer-events-none" />
          </motion.div>
        </section>

        {/* ── FEATURES ROW ───────────────────────────────────────── */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 px-6 py-4">
          {[
            { t: "No-Code Websites", d: "Build professional pages with drag-and-drop, no IT needed.", icon: Globe, color: "#4A7C6F" },
            { t: "Unified Commerce", d: "Products, subscriptions and payments under one platform.", icon: Store, color: "#8B6F4E" },
            { t: "Geo-Discovery", d: "Get found by local customers via our Algolia-powered search.", icon: Zap, color: "#5B5EA6" },
          ].map((item, idx) => (
            <FadeSection key={idx} delay={idx * 0.12} className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${item.color}18`, border: `1.5px solid ${item.color}30` }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] mb-1 text-[#1A1A1A]">{item.t}</h3>
                <p className="text-xs text-[#888] max-w-[180px] leading-relaxed">{item.d}</p>
              </div>
            </FadeSection>
          ))}
        </section>

        {/* ── KEY MODULES ────────────────────────────────────────── */}
        <FadeSection className="bg-[#EEEAE4] rounded-[32px] p-8 md:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div className="flex items-center bg-white rounded-full p-1 border border-[#DDD8CF]">
              {["Platform", "Users", "Businesses"].map((t, i) => (
                <button key={t} className={`px-6 py-2 rounded-full text-[14px] font-${i === 0 ? "bold" : "medium"} transition ${i === 0 ? "bg-white shadow-sm text-[#1A1A1A]" : "text-[#888] hover:text-[#1A1A1A]"}`}>{t}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full border border-[#DDD8CF] bg-white flex items-center justify-center text-[#999] hover:bg-[#F0ECE6] transition shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
              <button className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:bg-[#333] transition shadow-sm"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Franchise Management\n& Centralized Control", tag: "Scale", img: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=600", desc: "Create multiple franchise outlets, delegate access, and monitor centrally from one dashboard.", accent: "#4A7C6F" },
              { title: "Service Marketplace\n& Subscriptions", tag: "Services", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600", desc: "Sell services with one-time or recurring subscriptions. Ideal for gyms, salons, clinics & repairs.", accent: "#8B6F4E" },
              { title: "No-Code Website\nBuilder Platform", tag: "Web", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600", desc: "GrapesJS-powered template builder hosted on AWS S3 + CloudFront with custom domain support.", accent: "#5B5EA6" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-[24px] p-4 flex flex-col shadow-sm cursor-default"
              >
                <div className="rounded-[16px] h-48 flex items-center justify-center mb-5 overflow-hidden" style={{ backgroundColor: `${item.accent}12` }}>
                  <img src={item.img} className="w-full h-full object-cover opacity-80 mix-blend-multiply hover:opacity-100 transition duration-500" alt={item.title} />
                </div>
                <h4 className="font-bold text-[15px] mb-2 whitespace-pre-line leading-tight">{item.title}</h4>
                <p className="text-xs text-[#888] mb-6 leading-relaxed">{item.desc}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-[13px] px-3 py-1 rounded-full" style={{ backgroundColor: `${item.accent}15`, color: item.accent }}>{item.tag}</span>
                  <button className="bg-[#1A1A1A] text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-[#333] transition">Explore</button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center items-center gap-2 mt-10">
            <div className="w-8 h-2 rounded-full bg-[#1A1A1A]"></div>
            <div className="w-2 h-2 rounded-full bg-[#C8B99A]"></div>
            <div className="w-2 h-2 rounded-full bg-[#D8D2C9]"></div>
          </div>
        </FadeSection>

        {/* ── PROBLEMS SOLVED ────────────────────────────────────── */}
        <FadeSection className="bg-white rounded-[32px] p-8 md:p-16 flex flex-col md:flex-row gap-12 md:gap-24 relative overflow-hidden">
          <div className="flex-1 relative">
            <Quote className="absolute -top-10 -left-6 w-32 h-32 text-[#F0ECE6] rotate-180" strokeWidth={1.5} />
            <AnimatedHeadline className="text-4xl md:text-[52px] font-black leading-[1.08] relative z-10 pt-4 tracking-tight">
              Solving problems for local SMEs
            </AnimatedHeadline>
          </div>
          <div className="flex-[1.2] border-l-2 border-[#EEE9E2] pl-10 space-y-8 py-2">
            {[
              { title: "Fragmented digital tools", desc: "Thikana provides an all-in-one unified SaaS solution bridging the gap between disjointed tools.", color: "#4A7C6F" },
              { title: "Lack of local visibility", desc: "Hyperlocal consumers use our geo-based discovery to find nearby businesses effortlessly.", color: "#8B6F4E" },
              { title: "No technical expertise", desc: "Easily set up beautiful pages with our no-code drag-and-drop website builder — no IT support.", color: "#5B5EA6" },
              { title: "Limited scalability", desc: "Manage growing payments, subscriptions, and franchises efficiently under one roof.", color: "#B85C57" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -left-[46px] top-2 w-3 h-3 rounded-full ring-4 ring-white" style={{ backgroundColor: item.color }} />
                <h4 className="font-bold text-[16px] mb-1.5" style={{ color: item.color }}>{item.title}</h4>
                <p className="text-[14px] text-[#777] max-w-[300px] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </FadeSection>

        {/* ── TESTIMONIAL ────────────────────────────────────────── */}
        <FadeSection className="bg-[#EEEAE4] rounded-[32px] p-8 md:p-16">
          <AnimatedHeadline className="text-center text-[30px] font-black mb-14 tracking-tight">
            Real Businesses Speak
          </AnimatedHeadline>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="relative h-[320px] md:h-[380px]">
              <motion.img
                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=600"
                className="absolute top-0 left-0 w-[65%] h-[65%] object-cover rounded-[24px] z-10 shadow-md border-[4px] border-[#EEEAE4]"
                alt="Business"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.35 }}
              />
              <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600" className="absolute bottom-4 right-4 w-[65%] h-[65%] object-cover rounded-[24px] z-0 shadow grayscale opacity-70" alt="Storefront" />
            </div>
            <div className="bg-white rounded-[32px] p-10 flex flex-col justify-center shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#C8B99A]">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Avatar" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] mb-1">Aisha Sharma</h4>
                  <div className="flex gap-[2px] mt-1 text-[#C8B99A]">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                </div>
              </div>
              <p className="text-[14px] text-[#777] leading-relaxed mb-8 italic">
                "We were struggling with local discovery and maintaining three different apps. Thikana unified our storefront, payments, and website completely. Expanding our franchise has never been easier."
              </p>
              <button className="w-full bg-[#1A1A1A] text-white py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition">
                Read Case Study <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </FadeSection>

        {/* ── STATS & VISION ─────────────────────────────────────── */}
        <FadeSection className="bg-[#2B2B2B] text-white rounded-[32px] p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/3 space-y-6">
            {[
              { label: "Discovery", val: null, desc: "Search and explore local businesses based on relevance and location via verified profiles." },
              { label: "Commerce", val: null, desc: "Purchase products, book services, manage recurring subscriptions and track orders seamlessly." },
              { label: "Ecosystem", val: null, desc: "Save favourites and interact with business websites built directly on Thikana's infrastructure." },
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="text-[24px] font-black mb-1.5 text-[#E8D5B7]">{item.label}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                {idx < 2 && <div className="h-px bg-white/10 w-full mt-6" />}
              </div>
            ))}
          </div>
          <motion.div whileHover={{ scale: 1.02 }} className="w-full md:w-1/3 px-4">
            <div className="aspect-[4/5] rounded-[32px] overflow-hidden">
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover mix-blend-luminosity opacity-70" alt="Vision" />
            </div>
          </motion.div>
          <div className="w-full md:w-1/3 space-y-6">
            <AnimatedHeadline className="text-[26px] font-black leading-[1.2] text-white">
              The Digital Backbone For Local Businesses
            </AnimatedHeadline>
            <p className="text-[13px] text-white/50 leading-relaxed">
              We seamlessly blend no-code builders with Algolia Search, Firebase, and Razorpay-integrated transactions. Businesses operate, sell, scale, and grow online while remaining locally connected.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { n: 500, s: "+", label: "Businesses" },
                { n: 10, s: "k+", label: "Transactions" },
                { n: 99, s: "%", label: "Uptime" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-[28px] font-black text-[#C8B99A]"><Counter to={stat.n} suffix={stat.s} /></div>
                  <div className="text-[10px] text-white/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ── PRICING ────────────────────────────────────────────── */}
        <FadeSection className="bg-white rounded-[32px] py-16 px-4 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <AnimatedHeadline className="text-[36px] md:text-[44px] font-black mb-4 tracking-tight">
              Simple scalable pricing
            </AnimatedHeadline>
            <p className="text-[15px] text-[#888] leading-relaxed">No hidden fees. Start building your local empire on Thikana with clear, transparent pricing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Starter", sub: "For single stores getting started online.", price: "Free", period: "/ forever", cta: "Start for free", dark: false, popular: false, features: ["Geo-Discovery Profile", "No-Code Website Builder", "Accept Online Payments", "Max 50 Products/Services"] },
              { name: "Pro", sub: "For growing businesses expanding operations.", price: "$29", period: "/ month", cta: "Upgrade to Pro", dark: true, popular: true, features: ["Custom Domain Integration", "Unlimited Products & Services", "Recurring Subscriptions", "Advanced Analytics"] },
              { name: "Franchise", sub: "Multi-location networks at scale.", price: "$99", period: "/ month", cta: "Contact Sales", dark: false, popular: false, features: ["Centralized Franchise Control", "Delegated Login Dashboards", "Algolia Priority Boosts", "Dedicated Support"] },
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: plan.popular ? -2 : -4 }}
                className={`rounded-[24px] p-8 flex flex-col border ${plan.dark ? "bg-[#1A1A1A] text-white border-[#1A1A1A] md:-translate-y-4 shadow-2xl" : "bg-white border-[#E5E0D8] hover:border-[#C8B99A]"} transition-all`}
              >
                {plan.popular && <div className="bg-[#C8B99A] text-[#1A1A1A] text-[11px] font-bold w-fit px-3 py-1 rounded-full mb-4">Most Popular</div>}
                <h3 className="text-lg font-black mb-1">{plan.name}</h3>
                <p className={`text-xs mb-6 ${plan.dark ? "text-white/50" : "text-[#999]"}`}>{plan.sub}</p>
                <div className="mb-8">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.dark ? "text-white/40" : "text-[#999]"}`}>{plan.period}</span>
                </div>
                <button className={`w-full py-3 rounded-full text-sm font-bold mb-8 transition ${plan.dark ? "bg-[#C8B99A] text-[#1A1A1A] hover:bg-[#b8a88a]" : idx === 2 ? "bg-[#1A1A1A] text-white hover:bg-[#333]" : "border border-[#DDD] hover:bg-[#F7F6F3] text-[#1A1A1A]"}`}>
                  {plan.cta}
                </button>
                <div className="space-y-3.5 mt-auto">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <Check className={`w-4 h-4 shrink-0 ${plan.dark ? "text-[#C8B99A]" : "text-[#4A7C6F]"}`} strokeWidth={2.5} />
                      <span className={`text-xs ${plan.dark ? "text-white/70" : "text-[#666]"}`}>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </FadeSection>

        {/* ── TECH BACKBONE ──────────────────────────────────────── */}
        <FadeSection className="bg-[#EEEAE4] rounded-[32px] p-8 md:p-12">
          <div className="flex justify-between items-center mb-10">
            <div className="w-10" />
            <AnimatedHeadline className="text-[28px] font-black text-center w-full">Technology Backbone</AnimatedHeadline>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full border border-[#DDD8CF] bg-white flex items-center justify-center text-[#999] hover:bg-[#F0ECE6] shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
              <button className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:bg-[#333] shadow-sm"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { t: "Frontend & Web", desc: "Next.js + GrapesJS for fast drag-and-drop website building.", icon: Layers, color: "#4A7C6F" },
              { t: "Backend Cloud", desc: "Firebase Auth, Firestore, and Realtime DB for instant scalable data.", icon: Cloud, color: "#8B6F4E" },
              { t: "Payments Gateway", desc: "Razorpay for invoices, subscriptions, and secure transactions.", icon: CreditCard, color: "#5B5EA6" },
              { t: "AWS Architecture", desc: "S3 + CloudFront for blazing-fast static hosting and custom domains.", icon: BarChart3, color: "#B85C57" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white rounded-[20px] p-5 flex flex-col shadow-sm"
              >
                <div className="rounded-[14px] h-28 flex flex-col items-center justify-center mb-4" style={{ backgroundColor: `${item.color}12` }}>
                  <item.icon className="w-10 h-10" style={{ color: item.color }} strokeWidth={1.5} />
                </div>
                <h4 className="font-bold text-[13px] mb-1.5">{item.t}</h4>
                <p className="text-[11px] text-[#999] mb-4 leading-relaxed">{item.desc}</p>
                <div className="mt-auto pt-3 border-t border-[#F0ECE6] flex justify-end">
                  <button className="bg-[#1A1A1A] text-white px-4 py-1.5 rounded-full text-[11px] font-bold hover:bg-[#333] transition">Details</button>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeSection>

        {/* ── VALUE PROPOSITION ──────────────────────────────────── */}
        <FadeSection className="bg-[#EEEAE4] rounded-[32px] p-8 md:p-12 mb-12">
          <AnimatedHeadline className="text-center text-[28px] font-black mb-12 tracking-tight">Value Proposition</AnimatedHeadline>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", title: "All-In-One\nPlatform", desc: "Discovery, websites, e-commerce, and payments in a single cohesive ecosystem designed for SMEs.", dark: true, accent: "#C8B99A" },
              { n: "02", title: "Minimal Tech\nBarriers", desc: "Any business owner can adopt digital-first operations without requiring any external IT support.", dark: false, accent: "#4A7C6F" },
              { n: "03", title: "Scales With\nFranchises", desc: "Grows from individual stores to multi-location franchise networks with delegated access and full control.", dark: false, accent: "#5B5EA6" },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.65 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className={`rounded-[32px] p-10 flex flex-col min-h-[380px] shadow-sm relative overflow-hidden ${card.dark ? "bg-[#1A1A1A] text-white" : "bg-white border border-[#DDD8CF] text-[#1A1A1A]"}`}
              >
                <span className={`text-[36px] font-light absolute top-10 right-10 leading-none ${card.dark ? "text-white/20" : "text-[#E0D8CE]"}`}>{card.n}</span>
                <div
                  className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
                  style={{ backgroundColor: card.accent, transform: "translate(30%, 30%)" }}
                />
                <div className="mt-auto">
                  <h3 className="text-[26px] font-black mb-4 leading-tight whitespace-pre-line" style={card.dark ? { color: card.accent } : { color: "#1A1A1A" }}>{card.title}</h3>
                  <p className={`text-[13px] leading-relaxed pr-4 ${card.dark ? "text-white/50" : "text-[#888]"}`}>{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeSection>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-[#1E1E1E] text-white mt-8 rounded-t-[40px] overflow-hidden">
        {/* Top CTA strip */}
        <div className="bg-[#C8B99A] px-8 md:px-20 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-[#1A1A1A] text-[26px] font-black leading-tight mb-1">
              Ready to grow your local business?
            </h3>
            <p className="text-[#1A1A1A]/60 text-sm">Join hundreds of businesses already building on Thikana.</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button className="bg-[#1A1A1A] text-white px-7 py-3.5 rounded-full text-sm font-bold hover:bg-[#333] transition flex items-center gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <button className="border border-[#1A1A1A]/30 text-[#1A1A1A] px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-[#1A1A1A]/10 transition">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Main footer body */}
        <div className="px-8 md:px-20 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">

            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="font-black text-2xl tracking-tight mb-4 text-white">Thikana</div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
                The all-in-one SaaS platform empowering local businesses to discover, sell, and scale — without the complexity.
              </p>
              {/* Tech tags */}
              <div className="flex flex-wrap gap-2">
                {["Next.js", "Firebase", "Razorpay", "AWS S3", "Algolia"].map((t) => (
                  <span key={t} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/8 text-white/50 border border-white/10">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            {[
              {
                heading: "Platform",
                links: ["Business Discovery", "Website Builder", "Product Listing", "Service Marketplace", "Franchise Control"],
              },
              {
                heading: "Company",
                links: ["About Thikana", "Careers", "Blog", "Press Kit", "Contact Us"],
              },
              {
                heading: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Refund Policy"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-[13px] font-black tracking-widest uppercase text-white/30 mb-5">
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-white/55 hover:text-white transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-8" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/30">
              © {new Date().getFullYear()} Thikana Technologies Pvt. Ltd. All rights reserved.
            </p>
            {/* Social icons using lucide equivalents */}
            <div className="flex items-center gap-4">
              {[
                { label: "Twitter / X", path: "M 4 4 L 20 20 M 20 4 L 4 20" },
                { label: "LinkedIn", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
                { label: "GitHub", path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
                { label: "Instagram", path: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.71 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
