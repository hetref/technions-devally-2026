"use client";

import { clsx } from "clsx";

export default function Image({ props, styles, isSelected, onClick }) {
  const {
    src,
    alt,
    width,
    height,
    objectFit = "cover",
    borderRadius = 0,
    linkUrl,
  } = props;

  const imgElement = (
    <img
      src={src || "https://via.placeholder.com/800x400"}
      alt={alt || "Image"}
      className="block"
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        maxWidth: "100%",
        objectFit: objectFit,
        borderRadius: borderRadius ? `${borderRadius}px` : undefined,
      }}
    />
  );

  return (
    <div
      onClick={onClick}
      className={clsx("relative", isSelected && "ring-2 ring-blue-500")}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
        backgroundColor: styles?.backgroundColor,
        textAlign: styles?.textAlign || "left",
      }}
    >
      {linkUrl ? <a href={linkUrl}>{imgElement}</a> : imgElement}
    </div>
  );
}
