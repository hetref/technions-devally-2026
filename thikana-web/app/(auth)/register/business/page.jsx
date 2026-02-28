"use client";

import React from "react";
import Image from "next/image";
import BusinessRegistration from "@/components/auth/BusinessRegistration";

const BusinessRegistrationPage = () => {

    const title = <span className="font-light text-foreground tracking-tighter">Business Registration</span>;
    const description = "Register your business and start growing with Thikana";
    const heroImageSrc = "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80";

    return (
        <div className="flex flex-col md:flex-row font-geist w-full min-h-[100svh] bg-white">
            {/* Left column: business registration form */}
            <section className="flex-1 flex flex-col items-center justify-start p-8 bg-white">
                <div className="w-full max-w-md py-8">
                    <div className="flex flex-col gap-6">
                        {/* Logo */}
                        <div className="flex items-center gap-2 font-medium mb-2">
                            <Image src="/logo/black-logo.png" alt="Thikana Logo" width={100} height={100} />
                        </div>

                        <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-gray-900">{title}</h1>
                        <p className="animate-element animate-delay-200 text-gray-600">{description}</p>

                        {/* BusinessRegistration component wrapped in the new UI */}
                        <div className="animate-element animate-delay-300">
                            <BusinessRegistration />
                        </div>
                    </div>
                </div>
            </section>

            {/* Right column: hero image — sticky */}
            {heroImageSrc && (
                <section className="hidden md:block w-[45%] sticky top-0 h-[100svh] p-4 bg-white">
                    <div className="animate-slide-right animate-delay-300 h-full w-full rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
                </section>
            )}
        </div>
    );
};

export default BusinessRegistrationPage;
