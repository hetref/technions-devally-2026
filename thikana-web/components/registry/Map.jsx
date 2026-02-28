"use client";

import { clsx } from "clsx";
import { MapPin } from "lucide-react";

export default function Map({ props, styles, isSelected, onClick }) {
  const { address, latitude, longitude, zoom = 15, height = 400 } = props;

  const getMapEmbedUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1234567890!5m2!1sen!2s&z=${zoom}`;
    } else if (address) {
      return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(address)}&zoom=${zoom}`;
    }
    return null;
  };

  const embedUrl = getMapEmbedUrl();

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden rounded-lg",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        height: `${height}px`,
        backgroundColor: styles?.backgroundColor || "#e5e7eb",
      }}
    >
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-500">
          <MapPin size={48} className="mb-2" />
          <p className="text-sm">Enter address or coordinates</p>
        </div>
      )}
    </div>
  );
}
