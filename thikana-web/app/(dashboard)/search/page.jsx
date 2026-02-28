"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Loader } from "@googlemaps/js-api-loader";

import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
    InstantSearch,
    Hits,
    Stats,
    Pagination,
    Configure,
} from "react-instantsearch";

import BusinessHit from "@/components/search/BusinessHit";
import { CustomSearchBox } from "@/components/search/CustomSearchBox";
import { CustomRefinementList } from "@/components/search/CustomRefinementList";
import { CustomSortBy } from "@/components/search/CustomSortBy";

// Initialized Algolia Config
const searchClient = algoliasearch(
    "06ON25GG08",
    "7430ada66e673b9d14fb5690faebc334"
);

// Fallback to empty string to prevent crashes if not set
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const SearchPage = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState("pending");
    const [googleMapsService, setGoogleMapsService] = useState(null);
    const [googleLoading, setGoogleLoading] = useState(true);

    // Load Google Maps API
    useEffect(() => {
        const loadGoogleMapsAPI = async () => {
            if (!GOOGLE_MAPS_API_KEY) {
                console.warn("Google Maps API Key missing in .env list");
                setGoogleLoading(false);
                return;
            }
            try {
                setGoogleLoading(true);
                const loader = new Loader({
                    apiKey: GOOGLE_MAPS_API_KEY,
                    version: "weekly",
                    libraries: ["places", "geometry"],
                });

                const google = await loader.load();
                setGoogleMapsService(google.maps);
                setGoogleLoading(false);
            } catch (error) {
                console.error("Error loading Google Maps API:", error);
                toast.error("Could not load Google Maps. Distances may be inaccurate.");
                setGoogleLoading(false);
            }
        };

        loadGoogleMapsAPI();
    }, []);

    const getLocation = () => {
        setLocationStatus("loading");

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setLocationStatus("granted");
                    toast.success("Location access granted!");
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setLocationStatus("denied");
                    toast.error("Unable to access your location");
                },
                { enableHighAccuracy: true }
            );
        } else {
            setLocationStatus("unsupported");
            toast.error("Geolocation is not supported by your browser");
        }
    };

    // Try to get location automatically on page load
    useEffect(() => {
        getLocation();

        // Setup a watchPosition to update location in real-time if user is moving
        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error watching location:", error);
                },
                { enableHighAccuracy: true }
            );
        }

        // Cleanup watch on component unmount
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const customHitComponent = (props) => (
        <BusinessHit
            {...props}
            userLocation={userLocation}
            googleMapsService={googleMapsService}
        />
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="mx-auto flex gap-8 px-4 md:px-6 lg:gap-12 max-w-7xl pt-8 pb-12">
                <div className="flex-1">
                    <InstantSearch
                        searchClient={searchClient}
                        indexName="business"
                        insights
                    >
                        <Configure hitsPerPage={10} />

                        {/* Header Section */}
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                        Discover Businesses
                                    </h1>
                                    <p className="text-gray-600">
                                        Find and connect with local businesses in your area
                                    </p>
                                </div>

                                {locationStatus !== "granted" && (
                                    <Button
                                        variant="outline"
                                        className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                                        onClick={getLocation}
                                        disabled={locationStatus === "loading"}
                                    >
                                        <MapPin className="w-5 h-5" />
                                        <span className="font-medium">
                                            {locationStatus === "loading"
                                                ? "Getting location..."
                                                : "Enable location"}
                                        </span>
                                    </Button>
                                )}

                                {userLocation && (
                                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <Navigation className="w-4 h-4" />
                                        <span className="font-medium">Location active</span>
                                        {googleLoading && (
                                            <span className="text-xs text-green-600 opacity-75">
                                                (Loading maps...)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <CustomSearchBox />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Sidebar Filters */}
                            <div className="w-full lg:w-80 flex-shrink-0">
                                <div className="sticky top-6 space-y-6">
                                    <CustomRefinementList attribute="business_type" />
                                    <CustomSortBy />
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                                {/* Stats */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                                    <Stats
                                        classNames={{
                                            root: "text-sm font-medium text-gray-600",
                                        }}
                                        translations={{
                                            stats: (nbHits) =>
                                                `${nbHits.toLocaleString()} ${nbHits === 1 ? "business" : "businesses"
                                                } found`,
                                        }}
                                    />
                                </div>

                                {/* Results */}
                                <div className="space-y-4 mb-8">
                                    <Hits
                                        hitComponent={customHitComponent}
                                        classNames={{
                                            root: "",
                                            list: "space-y-4",
                                        }}
                                    />
                                </div>

                                {/* Pagination */}
                                <div className="flex justify-center">
                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                        <Pagination
                                            classNames={{
                                                root: "",
                                                list: "flex items-center gap-2",
                                                item: "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                                selectedItem: "bg-blue-600 text-white shadow-md",
                                                disabledItem: "opacity-40 cursor-not-allowed",
                                                link: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstantSearch>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;