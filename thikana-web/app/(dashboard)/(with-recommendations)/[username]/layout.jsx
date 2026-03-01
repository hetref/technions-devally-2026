"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loader from "@/components/Loader";

const UsernameLayout = ({ children }) => {
    const params = useParams();
    const usernameParam = params.username;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        // Prevent system routes from displaying "Profile Not Found"
        const SYSTEM_ROUTES = ["map", "settings", "explore", "messages", "notifications", "search", "login", "register", "dashboard", "feed", "profile", "post"];
        if (SYSTEM_ROUTES.includes(usernameParam?.toLowerCase())) {
            setLoading(false);
            return;
        }

        const fetchUserByUsername = async () => {
            try {
                setLoading(true);

                const q = query(collection(db, "users"), where("username", "==", usernameParam));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();

                // Check if the user role is "user" - in which case we don't show the profile
                if (userData.role === "user") {
                    setNotFound(true);
                } else {
                    setUser({ ...userData, uid: userDoc.id });
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        if (usernameParam) {
            fetchUserByUsername();
        }
    }, [usernameParam]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader />
                <span className="ml-3 text-gray-600">Loading profile...</span>
            </div>
        );
    }

    const SYSTEM_ROUTES = ["map", "settings", "explore", "messages", "notifications", "search", "login", "register", "dashboard", "feed", "profile", "post"];
    if (SYSTEM_ROUTES.includes(usernameParam?.toLowerCase())) {
        return (
            <div className="flex items-center justify-center w-full min-h-[50vh]">
                <div className="p-8 text-center max-w-md mx-auto">
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                       </svg>
                   </div>
                   <h2 className="text-xl font-bold text-gray-900 mb-2">Page Coming Soon</h2>
                   <p className="text-gray-500 text-sm">The /{usernameParam} page is currently under development. Check back later!</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex items-center justify-center w-full">
                <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-20">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center max-w-lg mx-auto">
                            <div className="p-4 rounded-full bg-gray-100 w-fit mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                Profile Not Found
                            </h1>
                            <p className="text-gray-600 leading-relaxed">
                                The user you&apos;re looking for doesn&apos;t exist or is not a business profile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full">
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="w-full">{children}</div>
            </div>
        </div>
    );
};

export default UsernameLayout;