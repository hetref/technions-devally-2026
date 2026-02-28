"use client";

import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Zap, Store } from "lucide-react";

const PERKS = [
  { icon: Store, text: "Business profile & geo-discovery" },
  { icon: Zap, text: "No-code website builder" },
  { icon: ShieldCheck, text: "Secure Razorpay payments" },
];

export default function LoginPage() {
  return (
    <div
      className="flex flex-col md:flex-row w-full min-h-[100svh]"
      style={{ fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif", backgroundColor: "#F7F6F3" }}
    >
      {/* ── LEFT: Form panel ──────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 bg-[#F7F6F3] relative">
        {/* Back to home */}
        <Link
          href="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-sm text-[#888] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
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

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mb-8"
          >
            <h1
              className="text-[40px] md:text-[48px] font-extrabold leading-[1.05] text-[#1A1A1A] mb-3 tracking-tight"
              style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}
            >
              Welcome back.
            </h1>
            <p className="text-[14px] text-[#888] leading-relaxed">
              Log in to your Thikana account and continue building your digital presence.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <LoginForm />
          </motion.div>

          {/* Sign up link */}
          <p className="mt-8 text-center text-[13px] text-[#888]">
            New to Thikana?{" "}
            <Link href="/register" className="font-bold text-[#1A1A1A] hover:text-[#C8B99A] transition-colors">
              Create an account
            </Link>
          </p>
        </motion.div>
      </section>

      {/* ── RIGHT: Branded panel ──────────────────────────────── */}
      <section className="hidden md:flex w-[45%] sticky top-0 h-[100svh] p-4 bg-[#F7F6F3]">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-full h-full rounded-[28px] overflow-hidden bg-[#2B2B2B] flex flex-col justify-between p-10"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#1A1A1A]/65 rounded-[28px]" />

          {/* Top badge */}
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[12px] font-semibold px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#C8B99A] inline-block" />
              Thikana Platform
            </span>
          </div>

          {/* Bottom content */}
          <div className="relative z-10 space-y-6">
            <h2
              className="text-white text-[36px] font-extrabold leading-[1.1] tracking-tight"
              style={{ fontFamily: "var(--font-heading), 'Bricolage Grotesque', system-ui, sans-serif" }}
            >
              Everything your local business needs — in one place.
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
}
