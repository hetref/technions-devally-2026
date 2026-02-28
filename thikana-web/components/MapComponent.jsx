"use client";
import { useEffect, useState, useRef } from "react";
import { Navigation, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MapComponent({ location, name, address, isCurrentUser }) {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let scriptTag = null;

    const initMap = (apiKey) => {
      // Setup global callback 
      window.initGoogleMap = () => {
        if (!mapContainerRef.current) return;

        try {
          const mapOptions = {
            center: { lat: location.lat, lng: location.lng },
            zoom: 16,
            disableDefaultUI: false,
          };

          mapRef.current = new window.google.maps.Map(mapContainerRef.current, mapOptions);

          // Custom marker
          markerRef.current = new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapRef.current,
            title: name || "Location"
          });

          // Info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="color: black; padding: 5px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">${name || "Location"}</h3>
                ${address ? `<p style="margin: 0; font-size: 14px;">${address}</p>` : ""}
              </div>
            `
          });

          markerRef.current.addListener("click", () => {
            infoWindow.open(mapRef.current, markerRef.current);
          });

          setIsMapLoaded(true);
        } catch (err) {
          console.error("Error setting up map:", err);
          setError("Failed to render map");
        }
      };

      // Check if google maps is already loaded
      if (window.google && window.google.maps) {
        window.initGoogleMap();
        return;
      }

      // Check if script is already injecting
      let existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        // Map is currently loading from another component instance
        return;
      }

      // Inject script
      scriptTag = document.createElement("script");
      scriptTag.id = "google-maps-script";
      scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
      scriptTag.async = true;
      scriptTag.defer = true;
      scriptTag.onerror = () => setError("Failed to load Google Maps script");
      document.body.appendChild(scriptTag);
    };

    // Only load if we have valid coordinates
    if (location && location.lat && location.lng) {
      fetch("/api/maps-key")
        .then((res) => res.json())
        .then((data) => {
          if (data.key) {
            initMap(data.key);
          } else {
            setError("Map API key not found");
          }
        })
        .catch((err) => {
          console.error("Error fetching Maps API key:", err);
          setError("Failed to fetch map configuration");
        });
    }

    return () => {
      // Complete cleanup for React Strict Mode and unmounts
      if (window.initGoogleMap) {
        delete window.initGoogleMap;
      }

      // We do not remove the scriptTag directly due to React hydration mismatch
      // But we can clear out the map instances to allow garbage collection
      if (mapRef.current) {
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [location, name, address]);

  // Center map if location changes after initialization
  useEffect(() => {
    if (isMapLoaded && mapRef.current && window.google && location?.lat && location?.lng) {
      const newPos = { lat: location.lat, lng: location.lng };
      mapRef.current.panTo(newPos);
      if (markerRef.current) {
        markerRef.current.setPosition(newPos);
      }
    }
  }, [location, isMapLoaded]);

  const handleGetDirections = () => {
    if (location && location.lat && location.lng) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
      window.open(googleMapsUrl, "_blank");
    }
  };

  if (!location || !location.lat || !location.lng) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-100 rounded-xl border border-gray-200">
        <div className="text-center p-6 text-gray-500">
          <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Location not pinned on map</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full bg-red-50 text-red-500 rounded-xl border border-red-200">
        <p className="font-medium text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden relative border border-gray-200 shadow-inner bg-gray-100">
      {/* 
        This div is strictly for Google Maps to mutate.
        We do not conditionally render anything else as a sibling inside it
        to prevent React hydration / removeChild node mismatch errors.
      */}
      <div className="w-full h-full absolute inset-0 z-0" ref={mapContainerRef} />

      {/* Floating UI overlay that sits securely above the map layer without touching its DOM structure */}
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full px-4 flex justify-between items-end pointer-events-none transition-opacity duration-300 ${isMapLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent -z-10 h-[100px] bottom-0" />

        <div className="bg-white/95 backdrop-blur shadow-lg rounded-2xl p-4 border border-gray-100 flex-grow mr-4 pointer-events-auto max-w-[70%] transition-transform hover:-translate-y-1">
          <h4 className="font-bold text-gray-900 truncate flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            {name || "Location"}
          </h4>
          {address && <p className="text-xs text-gray-600 truncate mt-1 pl-6">{address}</p>}
        </div>

        <div className="flex gap-2 shrink-0 pointer-events-auto items-center">
          {isCurrentUser && (
            <Button
              asChild
              size="default"
              variant="outline"
              className="rounded-full shadow-lg gap-2 font-semibold hover:scale-105 transition-transform bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hidden sm:flex"
            >
              <Link href="/my-location">
                <Pencil size={18} />
                <span>Edit</span>
              </Link>
            </Button>
          )}

          <Button
            onClick={handleGetDirections}
            size="default"
            className="rounded-full shadow-lg gap-2 font-semibold hover:scale-105 transition-transform bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Navigation size={18} className="fill-current" />
            <span className="hidden sm:inline">Directions</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
