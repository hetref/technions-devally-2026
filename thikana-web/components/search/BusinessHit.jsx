"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Navigation } from "lucide-react";

const BusinessHit = ({ hit, userLocation, googleMapsService }) => {
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const businessLocation = hit.location || null;

    useEffect(() => {
        const calculateGoogleDistance = async () => {
            if (!userLocation || !businessLocation || !googleMapsService) return;

            setLoading(true);
            try {
                const distanceService = new googleMapsService.DistanceMatrixService();
                const response = await distanceService.getDistanceMatrix({
                    origins: [
                        { lat: userLocation.latitude, lng: userLocation.longitude },
                    ],
                    destinations: [
                        { lat: businessLocation.latitude, lng: businessLocation.longitude },
                    ],
                    travelMode: googleMapsService.TravelMode.DRIVING,
                    unitSystem: googleMapsService.UnitSystem.METRIC,
                });

                if (response.rows[0].elements[0].status === "OK") {
                    setDistance({
                        text: response.rows[0].elements[0].distance.text,
                        value: response.rows[0].elements[0].distance.value,
                    });
                }
            } catch (error) {
                console.error("Error calculating Google Maps distance:", error);
            } finally {
                setLoading(false);
            }
        };

        calculateGoogleDistance();
    }, [userLocation, businessLocation, googleMapsService]);

    return (
        <Link
            href={`/${hit.username || "business"}?user=${hit.objectID || hit.id}`}
            className="block group"
        >
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200 group-hover:scale-[1.01]">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {hit.businessName}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                            @{hit.username || "business"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {hit.isFranchise && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200">
                                Franchise
                            </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200 capitalize">
                            {hit.plan || "basic"} plan
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-25 text-blue-700 rounded-lg border border-blue-100">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">
                            {hit.business_type || hit.businessType || "Business"}
                        </span>
                    </div>

                    {loading && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">
                            <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>
                            <span className="text-sm">Calculating distance...</span>
                        </div>
                    )}

                    {distance && !loading && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-25 text-green-700 rounded-lg border border-green-100">
                            <Navigation className="w-3.5 h-3.5" />
                            <span className="text-sm font-medium">{distance.text}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default BusinessHit;
