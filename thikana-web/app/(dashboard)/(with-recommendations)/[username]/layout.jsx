"use client";
import Sidebar from "@/components/Sidebar";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

const UsernameLayout = ({ children }) => {
    const params = useParams();
    const usernameParam = params.username; // Use username param
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchUserByUsername = async () => {
            try {
                setLoading(true);

                // Query the users collection by username field
                const q = query(collection(db, "users"), where("username", "==", usernameParam));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setNotFound(true);
                    setLoading(false);
                    return;
                }

                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();

                console.log("USERDOC", userData);

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
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">Loading profile...</span>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col lg:flex-row gap-6 px-2 md:px-4">
                        {/* <aside className="hidden lg:block lg:w-80">
                            <div className="sticky top-20">
                                <Sidebar />
                            </div>
                        </aside> */}

                        <main className="flex-1 py-10 px-4">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
                                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                    User Not Found
                                </h1>
                                <p className="text-gray-600">
                                    The user you're looking for doesn't exist or is not a business
                                    profile.
                                </p>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-[1400px] mx-auto">
                <div>
                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
};

export default UsernameLayout; 