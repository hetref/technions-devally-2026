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