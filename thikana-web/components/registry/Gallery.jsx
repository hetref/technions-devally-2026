"use client";

import { clsx } from "clsx";

export default function Gallery({ props, styles, isSelected, onClick }) {
  const { images = [], columns = 3 } = props;

  const defaultImages = images.length
    ? images
    : [
        { src: "https://via.placeholder.com/400", alt: "Gallery 1" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 2" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 3" },
      ];

  return (
    <div
      onClick={onClick}
      className={clsx(isSelected && "ring-2 ring-blue-500", "px-2 sm:px-4")}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "20px",
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : "20px",
        backgroundColor: styles?.backgroundColor,
      }}
    >
      <div
        className={clsx(
          "grid gap-2 sm:gap-4",
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          columns >= 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        )}
      >
        {defaultImages.map((image, index) => (
          <img
            key={index}
            src={image.src}
            alt={image.alt}
            className="w-full h-auto rounded-lg object-cover"
          />
        ))}
      </div>
    </div>
  );
}
