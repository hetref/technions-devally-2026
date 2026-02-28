"use client";

import React, { useState } from 'react';
import { LoginForm } from "@/components/auth/LoginForm";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

// --- MAIN COMPONENT ---

export default function LoginPage() {
    const { isDark } = useTheme();

    const title = <span className="font-light text-foreground tracking-tighter">Welcome back</span>;
    const description = "Log in to your account and continue your journey with us";
    const heroImageSrc = "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"; // Updated to Unsplash image

    return (
        <div className="h-[100svh] flex flex-col md:flex-row font-geist w-[100svw]">
            {/* Left column: sign-in form */}
            <section className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2 self-center font-medium">
                            <Image src="/logo/black-logo.png" alt="Thikana Logo" width={100} height={100} />
                        </div>

                        <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-gray-900">{title}</h1>
                        <p className="animate-element animate-delay-200 text-gray-600">{description}</p>

                        {/* LoginForm component wrapped in the new UI */}
                        <div className="animate-element animate-delay-300">
                            <LoginForm />
                        </div>
                    </div>
                </div>
            </section>

            {/* Right column: hero image */}
            {heroImageSrc && (
                <section className="hidden md:block flex-1 relative p-4 bg-whit">
                    <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
                </section>
            )}
        </div>
    );
}
