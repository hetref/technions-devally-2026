"use client";

import React from "react";
import BusinessRegistration from "@/components/auth/BusinessRegistration";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, BarChart3, Layers } from "lucide-react";

const PERKS = [
  { icon: MapPin, text: "Appear in local Algolia-powered search" },
  { icon: Layers, text: "No-code website live in minutes" },
  { icon: BarChart3, text: "Track orders, revenue & franchise outlets" },
];

const BusinessRegistrationPage = () => {
  return (
    <div
      className="flex flex-col md:flex-row w-full min-h-[100svh]"
      style={{ fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif", backgroundColor: "#F7F6F3" }}
    >
      {/* ── LEFT: Form panel ──────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 bg-[#F7F6F3] relative">
        {/* Back link */}
        <Link
          href="/register"
          className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[#888] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to account setup
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-10">
            <Image src="/logo/black-logo.png" alt="Thikana" width={90} height={90} />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#C8B99A] flex items-center justify-center text-[10px] font-black text-[#1A1A1A]">1</div>
              <div className="h-px w-8 bg-[#C8B99A]" />
              <div className="w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-black text-white">2</div>
            </div>
            <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider ml-2">Business Setup</span>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mb-8"
          >
            <h1
              className="text-[38px] md:text-[46px] font-extrabold leading-[1.05] text-[#1A1A1A] mb-3 tracking-tight"
              style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}
            >
              Register your business.
            </h1>
            <p className="text-[14px] text-[#888] leading-relaxed">
              Add your business details to start getting discovered by local customers on Thikana.
            </p>
          </motion.div>

          {/* Registration form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <BusinessRegistration />
          </motion.div>
        </motion.div>
      </section>

      {/* ── RIGHT: Branded panel ──────────────────────────────── */}
      <section className="hidden md:flex w-[45%] sticky top-0 h-[100svh] p-4 bg-[#F7F6F3]">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full h-full rounded-[28px] overflow-hidden flex flex-col justify-between p-10"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=1200)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#1A1A1A]/70 rounded-[28px]" />

          {/* Top badge */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[12px] font-semibold px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#C8B99A] inline-block" />
              Step 2 of 2 — Business Profile
            </span>
          </div>

          {/* Bottom content */}
          <div className="relative z-10 space-y-6">
            {/* Testimonial quote */}
            <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-[20px] p-6 mb-2">
              <p className="text-white/80 text-[13px] italic leading-relaxed mb-4">
                "Setting up our salon on Thikana took less than 20 minutes. We got 3 new bookings within the first week just from the discovery feature."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C8B99A]/30 flex items-center justify-center text-[#C8B99A] text-xs font-bold">AS</div>
                <div>
                  <p className="text-white text-[12px] font-bold">Aisha Sharma</p>
                  <p className="text-white/40 text-[11px]">Owner, Glow Salon, Pune</p>
                </div>
              </div>
            </div>

            <h2
              className="text-white text-[30px] font-extrabold leading-[1.15] tracking-tight"
              style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}
            >
              Almost there. Let's get your business online.
            </h2>
            <div className="space-y-3">
              {PERKS.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#C8B99A]/20 border border-[#C8B99A]/30 flex items-center justify-center shrink-0">
                    <p.icon className="w-4 h-4 text-[#C8B99A]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[13px] text-white/70">{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default BusinessRegistrationPage;
