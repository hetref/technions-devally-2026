/**
 * JSON → HTML/CSS/JS CONVERTER
 *
 * Converts the builder's layout JSON into standalone HTML, CSS, and JS files.
 * Mirrors the rendering logic of each registry component into plain HTML+inline styles.
 */

// Prisma removed for Thikana-integration

/**
 * Returns a <script> tag that loads tracker.js from the SitePilot app server.
 *
 * The tracker.js file lives in public/tracker.js of this Next.js app, so it is
 * served at {APP_URL}/tracker.js. By loading it via src we get:
 *  - Single source of truth: update tracker.js once → every site picks it up
 *  - No code stored on user's side
 *  - Browser caching for repeat visits
 *
 * The tracker script itself derives the API base URL from its own src attribute,
 * so no separate data-api attribute is needed.
 */
function buildTrackerTag(siteId, pageSlug, appBaseUrl) {
  const base = appBaseUrl.replace(/\/+$/, '');
  return `<script src="${base}/tracker.js" data-site="${escapeHtml(siteId)}" data-page="${escapeHtml(pageSlug)}" defer><\/script>`;
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function styleObj(obj) {
  if (!obj || Object.keys(obj).length === 0) return "";
  const css = Object.entries(obj)
    .filter(([, v]) => v != null && v !== "" && v !== undefined)
    .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
    .join("; ");
  return css ? ` style="${css}"` : "";
}

function camelToKebab(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function px(v) {
  if (v == null || v === "") return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

// ============================================================================
// COMPONENT RENDERERS  (type → HTML string)
// ============================================================================

const componentRenderers = {
  // ── Hero ──────────────────────────────────────────────────────
  Hero: (props, styles) => {
    const bg = styles?.backgroundColor || "#f3f4f6";
    const color = styles?.textColor || "#1f2937";
    const pt = px(styles?.paddingTop) || "clamp(3rem, 8vw, 5rem)";
    const pb = px(styles?.paddingBottom) || "clamp(3rem, 8vw, 5rem)";
    const bgImg = props.backgroundImage
      ? `background-image: url(${props.backgroundImage}); background-size: cover; background-position: center;`
      : "";

    let cta = "";
    if (props.ctaText) {
      cta = `<a href="${escapeHtml(props.ctaLink || "#")}" class="sp-btn-primary">${escapeHtml(props.ctaText)}</a>`;
    }

    return `<section class="sp-hero" style="min-height: clamp(300px, 50vw, 600px); display: flex; align-items: center; justify-content: center; background-color: ${bg}; padding-top: ${pt}; padding-bottom: ${pb}; ${bgImg}">
  <div style="width: 100%; max-width: 900px; margin: 0 auto; text-align: center; padding: 0 1.5rem;">
    <h1 style="font-size: clamp(1.75rem, 5vw, 3.5rem); font-weight: 700; margin-bottom: 1rem; line-height: 1.15; color: ${color};">${escapeHtml(props.title || "Your Hero Title")}</h1>
    <p style="font-size: clamp(1rem, 2.5vw, 1.25rem); margin-bottom: 2rem; line-height: 1.6; color: ${color};">${escapeHtml(props.subtitle || "Your hero subtitle goes here")}</p>
    ${cta}
  </div>
</section>`;
  },

  // ── Text ──────────────────────────────────────────────────────
  Text: (props, styles) => {
    const tag = props.variant || "p";
    const sizeMap = {
      h1: "2.5rem",
      h2: "1.875rem",
      h3: "1.5rem",
      h4: "1.25rem",
      h5: "1.125rem",
      h6: "1rem",
      p: "1rem",
    };
    const weightMap = {
      h1: "700",
      h2: "700",
      h3: "600",
      h4: "600",
      h5: "500",
      h6: "500",
      p: "400",
    };
    const s = {
      "font-size": sizeMap[tag] || "1rem",
      "font-weight": weightMap[tag] || "400",
      color: styles?.textColor || "#1f2937",
      "text-align": styles?.textAlign || "left",
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "background-color": styles?.backgroundColor,
    };
    return `<${tag}${styleObj(s)}>${escapeHtml(props.content || "Enter your text here")}</${tag}>`;
  },

  // ── Heading ───────────────────────────────────────────────────
  Heading: (props, styles) => {
    const tag = props.level || "h2";
    const sizeMap = {
      h1: "3rem",
      h2: "2.25rem",
      h3: "1.875rem",
      h4: "1.5rem",
      h5: "1.25rem",
      h6: "1.125rem",
    };
    const weightMap = {
      h1: "700",
      h2: "700",
      h3: "600",
      h4: "600",
      h5: "500",
      h6: "500",
    };
    const s = {
      "font-size": sizeMap[tag] || "2.25rem",
      "font-weight": weightMap[tag] || "700",
      "margin-bottom": "1rem",
      color: styles?.textColor || "#1f2937",
      "text-align": styles?.textAlign || "left",
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "padding-left": px(styles?.paddingLeft),
      "padding-right": px(styles?.paddingRight),
      "margin-top": px(styles?.marginTop),
      "background-color": styles?.backgroundColor,
    };
    return `<${tag}${styleObj(s)}>${escapeHtml(props.text || "Heading Text")}</${tag}>`;
  },

  // ── Image ─────────────────────────────────────────────────────
  Image: (props, styles) => {
    const src = props.src || "https://via.placeholder.com/800x400";
    const alt = escapeHtml(props.alt || "Image");
    const w = props.width ? `${props.width}px` : "100%";
    const h = props.height ? `${props.height}px` : "auto";
    const fit = props.objectFit || "cover";
    const br = props.borderRadius ? `${props.borderRadius}px` : undefined;

    const imgStyle = {
      width: w,
      height: h,
      "max-width": "100%",
      "object-fit": fit,
      "border-radius": br,
      display: "block",
    };
    const img = `<img src="${escapeHtml(src)}" alt="${alt}"${styleObj(imgStyle)} />`;

    const wrapStyle = {
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "background-color": styles?.backgroundColor,
      "text-align": styles?.textAlign || "left",
    };

    if (props.linkUrl) {
      return `<div${styleObj(wrapStyle)}><a href="${escapeHtml(props.linkUrl)}">${img}</a></div>`;
    }
    return `<div${styleObj(wrapStyle)}>${img}</div>`;
  },

  // ── Button ────────────────────────────────────────────────────
  Button: (props, styles) => {
    const text = escapeHtml(props.text || "Button Text");
    const variant = props.variant || "primary";
    const variantClass = {
      primary: "sp-btn-primary",
      secondary: "sp-btn-secondary",
      outline: "sp-btn-outline",
    };
    const wrapStyle = {
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
    };
    const href = props.link || "#";
    return `<div style="display: inline-block;${Object.entries(wrapStyle)
      .filter(([, v]) => v)
      .map(([k, v]) => ` ${k}: ${v};`)
      .join("")}">
  <a href="${escapeHtml(href)}" class="${variantClass[variant] || "sp-btn-primary"}">${text}</a>
</div>`;
  },

  // ── Link ──────────────────────────────────────────────────────
  Link: (props, styles) => {
    const s = {
      color: styles?.textColor || "#2563eb",
      "text-decoration": "underline",
      "padding-top": px(styles?.paddingTop),
      "padding-bottom": px(styles?.paddingBottom),
      "text-align": styles?.textAlign,
      "background-color": styles?.backgroundColor,
      "font-size": px(styles?.fontSize),
    };
    const target = props.openInNewTab
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    return `<a href="${escapeHtml(props.href || "#")}"${target}${styleObj(s)}>${escapeHtml(props.text || "Link Text")}</a>`;
  },

  // ── LinkBox ───────────────────────────────────────────────────
  LinkBox: (props, styles) => {
    const target = props.openInNewTab
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    const s = {
      display: "block",
      padding: px(styles?.padding) || "1.5rem",
      border: `1px solid ${styles?.borderColor || "#e5e7eb"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      "text-decoration": "none",
      transition: "box-shadow 0.2s",
    };
    const titleColor = styles?.textColor || "#1f2937";
    const descColor = styles?.textColor ? `${styles.textColor}cc` : "#6b7280";
    return `<a href="${escapeHtml(props.href || "#")}"${target}${styleObj(s)} class="sp-link-box">
  <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: ${titleColor};">${escapeHtml(props.title || "Link Title")}</h3>
  <p style="font-size: 0.875rem; color: ${descColor};">${escapeHtml(props.description || "Click to navigate")}</p>
</a>`;
  },

  // ── Divider ───────────────────────────────────────────────────
  Divider: (props, styles) => {
    const thickness = props.thickness || 1;
    const divStyle = props.style || "solid";
    const s = {
      "border-width": `${thickness}px 0 0 0`,
      "border-style": divStyle,
      "border-color": styles?.textColor || "#e5e7eb",
      "margin-top": px(styles?.marginTop) || "2rem",
      "margin-bottom": px(styles?.marginBottom) || "2rem",
      "background-color": "transparent",
    };
    return `<hr${styleObj(s)} />`;
  },

  // ── ImageBox ──────────────────────────────────────────────────
  ImageBox: (props, styles) => {
    const ar = props.aspectRatio || "16/9";
    const wrapStyle = {
      position: "relative",
      overflow: "hidden",
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#f3f4f6",
    };
    let imgHtml = "";
    if (props.src) {
      imgHtml = `<img src="${escapeHtml(props.src)}" alt="${escapeHtml(props.alt || "Image")}" style="width: 100%; height: 100%; object-fit: ${styles?.objectFit || "cover"};" />`;
    } else {
      imgHtml = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #e5e7eb;"><p style="color: #9ca3af;">No image selected</p></div>`;
    }
    let captionHtml = "";
    if (props.caption) {
      captionHtml = `<div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem; background-color: ${styles?.overlayColor || "rgba(0,0,0,0.7)"};">
  <p style="font-size: 0.875rem; color: ${styles?.textColor || "#ffffff"};">${escapeHtml(props.caption)}</p>
</div>`;
    }
    return `<div${styleObj(wrapStyle)}><div style="aspect-ratio: ${ar};">${imgHtml}</div>${captionHtml}</div>`;
  },

  // ── Video ─────────────────────────────────────────────────────
  Video: (props, styles) => {
    let embedUrl = null;
    const url = props.url || "";
    const autoplay = props.autoplay ? 1 : 0;
    const controls = props.controls !== false ? 1 : 0;

    if (url && props.type === "youtube") {
      const match = url.match(
        /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
      );
      const videoId = match && match[2].length === 11 ? match[2] : null;
      if (videoId)
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&controls=${controls}`;
    } else if (url && props.type === "vimeo") {
      const match = url.match(/vimeo\.com\/(\d+)/);
      const videoId = match ? match[1] : null;
      if (videoId)
        embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay}`;
    } else if (url) {
      embedUrl = url;
    }

    const bg = styles?.backgroundColor || "#000000";
    if (embedUrl) {
      return `<div style="position: relative; overflow: hidden; border-radius: 0.5rem; aspect-ratio: 16/9; background-color: ${bg};">
  <iframe src="${escapeHtml(embedUrl)}" style="width: 100%; height: 100%; position: absolute; inset: 0; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Video"></iframe>
</div>`;
    }
    return `<div style="aspect-ratio: 16/9; background-color: ${bg}; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #fff;"><p>No video</p></div>`;
  },

  // ── Map ───────────────────────────────────────────────────────
  Map: (props, styles) => {
    const height = props.height || 400;
    const zoom = props.zoom || 15;
    const bg = styles?.backgroundColor || "#e5e7eb";
    let src = "";
    if (props.latitude && props.longitude) {
      src = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${props.longitude}!3d${props.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1234567890!5m2!1sen!2s&z=${zoom}`;
    } else if (props.address) {
      src = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(props.address)}&zoom=${zoom}`;
    }
    if (src) {
      return `<div style="overflow: hidden; border-radius: 0.5rem; height: ${height}px; background-color: ${bg};"><iframe src="${escapeHtml(src)}" style="width: 100%; height: 100%; border: 0;" allowfullscreen loading="lazy" title="Google Maps"></iframe></div>`;
    }
    return `<div style="height: ${height}px; background-color: ${bg}; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #6b7280;"><p>Enter address or coordinates</p></div>`;
  },

  // ── Icon ──────────────────────────────────────────────────────
  Icon: (props, styles) => {
    // We use a simple SVG placeholder since lucide-react isn't available in static HTML
    const size = props.size || 24;
    const color = styles?.textColor || "#1f2937";
    const padding = px(styles?.padding) || "8px";
    const bg = styles?.backgroundColor || "transparent";
    const br = px(styles?.borderRadius);
    // For the published HTML we use the icon name as text in a styled span
    return `<span style="display: inline-flex; align-items: center; justify-content: center; width: ${size + 16}px; height: ${size + 16}px; padding: ${padding}; background-color: ${bg};${br ? ` border-radius: ${br};` : ""} font-size: ${size}px; color: ${color};" title="${escapeHtml(props.name || "Icon")}">★</span>`;
  },

  // ── Gallery ───────────────────────────────────────────────────
  Gallery: (props, styles) => {
    const columns = props.columns || 3;
    const images = props.images?.length
      ? props.images
      : [
        { src: "https://via.placeholder.com/400", alt: "Gallery 1" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 2" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 3" },
      ];
    const wrapStyle = {
      "padding-top": px(styles?.paddingTop) || "20px",
      "padding-bottom": px(styles?.paddingBottom) || "20px",
      "background-color": styles?.backgroundColor,
      padding: "1rem",
    };
    // Use auto-fit with minmax for responsive gallery without media queries
    const minColWidth = columns === 1 ? "100%" : columns === 2 ? "min(280px, 100%)" : columns >= 4 ? "min(220px, 100%)" : "min(250px, 100%)";
    const gridStyle = {
      display: "grid",
      "grid-template-columns": `repeat(auto-fit, minmax(${minColWidth}, 1fr))`,
      gap: "1rem",
    };
    const imgs = images
      .map(
        (img) =>
          `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || "")}" style="width: 100%; height: auto; border-radius: 0.5rem; aspect-ratio: 4/3; object-fit: cover;" loading="lazy" />`,
      )
      .join("\n      ");
    return `<div${styleObj(wrapStyle)}>
  <div${styleObj(gridStyle)}>
      ${imgs}
  </div>
</div>`;
  },

  // ── Navbar ────────────────────────────────────────────────────
  Navbar: (props, styles) => {
    const bg = styles?.backgroundColor || "#ffffff";
    const color = styles?.textColor || "#374151";
    const links = props.links?.length
      ? props.links
      : [
        { label: "Home", href: "#" },
        { label: "About", href: "#" },
        { label: "Services", href: "#" },
        { label: "Contact", href: "#" },
      ];
    const navId = `sp-nav-${Math.random().toString(36).slice(2, 7)}`;
    const linkHtml = links
      .map(
        (l) =>
          `<a href="${escapeHtml(l.href)}" style="color: ${color}; text-decoration: none;" class="sp-nav-link">${escapeHtml(l.label)}</a>`,
      )
      .join("\n      ");
    const mobileLinksHtml = links
      .map(
        (l) =>
          `<a href="${escapeHtml(l.href)}" style="color: ${color}; text-decoration: none; padding: 0.75rem 1.5rem; border-bottom: 1px solid #f3f4f6; display: block;" class="sp-nav-link">${escapeHtml(l.label)}</a>`,
      )
      .join("\n      ");
    return `<nav class="sp-navbar" style="background-color: ${bg}; border-bottom: 1px solid #e5e7eb;" id="${navId}">
  <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; max-width: 1280px; margin: 0 auto;">
    <div style="font-size: 1.25rem; font-weight: 700; color: ${styles?.textColor || "#1f2937"}; z-index: 1;">${escapeHtml(props.logo || "Logo")}</div>
    <div class="sp-nav-links" style="display: flex; gap: 1.5rem; align-items: center;">
      ${linkHtml}
    </div>
    <button class="sp-hamburger" aria-label="Toggle menu" aria-expanded="false" aria-controls="${navId}-menu" style="display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px;">
      <span style="display: block; width: 24px; height: 2px; background-color: ${color}; border-radius: 2px; transition: transform 0.3s;"></span>
      <span style="display: block; width: 24px; height: 2px; background-color: ${color}; border-radius: 2px; transition: opacity 0.3s;"></span>
      <span style="display: block; width: 24px; height: 2px; background-color: ${color}; border-radius: 2px; transition: transform 0.3s;"></span>
    </button>
  </div>
  <div id="${navId}-menu" class="sp-mobile-menu" style="display: none; flex-direction: column; background-color: ${bg}; border-top: 1px solid #e5e7eb;">
    ${mobileLinksHtml}
  </div>
</nav>`;
  },

  // ── Footer ────────────────────────────────────────────────────
  Footer: (props, styles) => {
    const bg = styles?.backgroundColor || "#1f2937";
    const color = styles?.textColor || "#ffffff";
    const copyright =
      props.copyright ||
      props.text ||
      "© 2026 Your Company. All rights reserved.";
    let linksHtml = "";
    if (props.links?.length) {
      const ll = props.links
        .map(
          (l) =>
            `<a href="${escapeHtml(l.href)}" style="color: ${color}; text-decoration: none; transition: color 0.2s;" class="sp-nav-link">${escapeHtml(l.label)}</a>`,
        )
        .join("\n        ");
      linksHtml = `<div style="display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1rem;">\n        ${ll}\n      </div>`;
    }
    return `<footer style="padding: 2rem 1.5rem; text-align: center; background-color: ${bg}; color: ${color};">
  ${linksHtml}
  <p style="font-size: 0.875rem;">${escapeHtml(copyright)}</p>
</footer>`;
  },

  // ── Features ──────────────────────────────────────────────────
  Features: (props, styles) => {
    const items = props.items?.length
      ? props.items
      : props.features?.length
        ? props.features
        : [
          { title: "Feature 1", description: "Description of feature 1" },
          { title: "Feature 2", description: "Description of feature 2" },
          { title: "Feature 3", description: "Description of feature 3" },
        ];
    const color = styles?.textColor || "#1f2937";
    const descColor = styles?.textColor ? `${styles.textColor}cc` : "#4b5563";
    const wrapStyle = {
      "padding-top": px(styles?.paddingTop) || "clamp(2rem, 6vw, 4rem)",
      "padding-bottom": px(styles?.paddingBottom) || "clamp(2rem, 6vw, 4rem)",
      "background-color": styles?.backgroundColor,
      "padding-left": "1.5rem",
      "padding-right": "1.5rem",
    };
    const heading = props.title || props.heading;
    let headingHtml = "";
    if (heading) {
      headingHtml = `<h2 style="font-size: clamp(1.5rem, 4vw, 2.25rem); font-weight: 700; text-align: center; margin-bottom: clamp(1.5rem, 4vw, 3rem); color: ${color};">${escapeHtml(heading)}</h2>`;
    }
    const cards = items
      .map((item) => {
        const icon = item.icon
          ? `<div style="font-size: 2rem; margin-bottom: 0.75rem;">${escapeHtml(item.icon)}</div>`
          : "";
        return `<div style="text-align: center; padding: 1rem;">
        ${icon}
        <h3 style="font-size: clamp(1rem, 2.5vw, 1.25rem); font-weight: 600; margin-bottom: 0.5rem; color: ${color};">${escapeHtml(item.title)}</h3>
        <p style="color: ${descColor}; font-size: clamp(0.875rem, 2vw, 1rem); line-height: 1.6;">${escapeHtml(item.description)}</p>
      </div>`;
      })
      .join("\n      ");
    return `<div${styleObj(wrapStyle)}>
  <div style="max-width: 1200px; margin: 0 auto;">
  ${headingHtml}
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: clamp(1rem, 3vw, 2rem);">
      ${cards}
  </div>
  </div>
</div>`;
  },

  // ── CTA ───────────────────────────────────────────────────────
  CTA: (props, styles) => {
    const bg = styles?.backgroundColor || "#3b82f6";
    const color = styles?.textColor || "#ffffff";
    const wrapStyle = {
      "padding-top": px(styles?.paddingTop) || "clamp(2.5rem, 6vw, 4rem)",
      "padding-bottom": px(styles?.paddingBottom) || "clamp(2.5rem, 6vw, 4rem)",
      "text-align": "center",
      "background-color": bg,
    };
    return `<div${styleObj(wrapStyle)}>
  <div style="max-width: 700px; margin: 0 auto; padding: 0 1.5rem;">
    <h2 style="font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 700; margin-bottom: 1rem; color: ${color};">${escapeHtml(props.title || "Ready to Get Started?")}</h2>
    <p style="font-size: clamp(1rem, 2.5vw, 1.25rem); margin-bottom: 2rem; opacity: 0.9; color: ${color}; line-height: 1.6;">${escapeHtml(props.description || "Join us today")}</p>
    <a href="${escapeHtml(props.buttonLink || "#")}" class="sp-btn-white">${escapeHtml(props.buttonText || "Get Started")}</a>
  </div>
</div>`;
  },

  // ── Form ──────────────────────────────────────────────────────
  Form: (props, styles) => {
    const s = {
      padding: px(styles?.padding) || "24px",
      "background-color": styles?.backgroundColor,
      "border-radius": px(styles?.borderRadius) || "8px",
    };
    return `<form action="${escapeHtml(props.action || "#")}" method="${props.method || "POST"}"${props.name ? ` name="${escapeHtml(props.name)}"` : ""}${styleObj(s)}>
  <p style="color: #6b7280; font-size: 0.875rem;">Form Container</p>
</form>`;
  },

  // ── Input ─────────────────────────────────────────────────────
  Input: (props, styles) => {
    const labelColor = styles?.textColor || "#374151";
    const req = props.required ? " *" : "";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${labelColor};">${escapeHtml(props.label)}${req ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const inputStyle = {
      width: "100%",
      padding: "0.5rem 1rem",
      border: `1px solid ${styles?.borderColor || "#d1d5db"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      color: styles?.textColor || "#1f2937",
      "font-size": "1rem",
      "box-sizing": "border-box",
    };
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  <input type="${props.type || "text"}"${props.name ? ` name="${escapeHtml(props.name)}"` : ""} placeholder="${escapeHtml(props.placeholder || `Enter ${props.label || "text"}`)}${required !== "" ? `"${required}` : '"'}${styleObj(inputStyle)} />
</div>`;
  },

  // ── Textarea ──────────────────────────────────────────────────
  Textarea: (props, styles) => {
    const labelColor = styles?.textColor || "#374151";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${labelColor};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const taStyle = {
      width: "100%",
      padding: "0.5rem 1rem",
      border: `1px solid ${styles?.borderColor || "#d1d5db"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      color: styles?.textColor || "#1f2937",
      "font-size": "1rem",
      resize: "vertical",
      "box-sizing": "border-box",
    };
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  <textarea${props.name ? ` name="${escapeHtml(props.name)}"` : ""} rows="${props.rows || 4}" placeholder="${escapeHtml(props.placeholder || "Enter your message")}"${required}${styleObj(taStyle)}></textarea>
</div>`;
  },

  // ── Select ────────────────────────────────────────────────────
  Select: (props, styles) => {
    const labelColor = styles?.textColor || "#374151";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${labelColor};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const selStyle = {
      width: "100%",
      padding: "0.5rem 1rem",
      border: `1px solid ${styles?.borderColor || "#d1d5db"}`,
      "border-radius": "0.5rem",
      "background-color": styles?.backgroundColor || "#ffffff",
      color: styles?.textColor || "#1f2937",
      "font-size": "1rem",
      cursor: "pointer",
      "box-sizing": "border-box",
    };
    const options = (props.options || [])
      .map((o) => {
        const val = o.value || o;
        const label = o.label || o;
        return `<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`;
      })
      .join("\n    ");
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  <select${props.name ? ` name="${escapeHtml(props.name)}"` : ""}${required}${styleObj(selStyle)}>
    <option value="">${escapeHtml(props.placeholder || "Select an option")}</option>
    ${options}
  </select>
</div>`;
  },

  // ── Label ─────────────────────────────────────────────────────
  Label: (props, styles) => {
    const s = {
      display: "block",
      "font-size": px(styles?.fontSize) || "0.875rem",
      "font-weight": "500",
      "margin-bottom": "0.5rem",
      color: styles?.textColor || "#374151",
    };
    return `<label${props.htmlFor ? ` for="${escapeHtml(props.htmlFor)}"` : ""}${styleObj(s)}>${escapeHtml(props.text || "Label Text")}</label>`;
  },

  // ── Checkbox ──────────────────────────────────────────────────
  Checkbox: (props, styles) => {
    const checked = props.checked ? " checked" : "";
    const required = props.required ? " required" : "";
    const color = styles?.textColor || "#374151";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="margin-left: 0.5rem; font-size: 0.875rem; cursor: pointer; color: ${color};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    return `<div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
  <input type="checkbox"${props.name ? ` name="${escapeHtml(props.name)}"` : ""}${checked}${required} style="width: 1rem; height: 1rem; accent-color: ${styles?.accentColor || "#3b82f6"}; cursor: pointer;" />
  ${labelHtml}
</div>`;
  },

  // ── Radio ─────────────────────────────────────────────────────
  Radio: (props, styles) => {
    const color = styles?.textColor || "#374151";
    const required = props.required ? " required" : "";
    let labelHtml = "";
    if (props.label) {
      labelHtml = `<label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: ${color};">${escapeHtml(props.label)}${props.required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ""}</label>`;
    }
    const radios = (props.options || [])
      .map((o, i) => {
        const val = o.value || o;
        const label = o.label || o;
        return `<div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
    <input type="radio" name="${escapeHtml(props.name || "radio")}" value="${escapeHtml(val)}"${i === 0 ? required : ""} style="width: 1rem; height: 1rem; accent-color: ${styles?.accentColor || "#3b82f6"}; cursor: pointer;" />
    <label style="margin-left: 0.5rem; font-size: 0.875rem; cursor: pointer; color: ${color};">${escapeHtml(label)}</label>
  </div>`;
      })
      .join("\n  ");
    return `<div style="margin-bottom: 1rem;">
  ${labelHtml}
  ${radios}
</div>`;
  },

  // ── FormEmbed ─────────────────────────────────────────────────
  FormEmbed: (props, styles) => {
    // This is a placeholder that will be replaced during async rendering
    // The actual form HTML will be injected by the convertPageToHtml function
    return `<!-- FORM_EMBED:${props.formId || 'NO_FORM_ID'} -->`;
  },
};

// ============================================================================
// CONTAINER / COLUMN RENDERER
// ============================================================================

function renderComponent(component) {
  if (component.hidden) return "";
  const renderer = componentRenderers[component.type];
  if (!renderer)
    return `<!-- Unknown component: ${escapeHtml(component.type)} -->`;
  return renderer(component.props || {}, component.styles || {});
}

function renderColumn(column, isHorizontal) {
  const flexBasis = isHorizontal && column.width ? `${(column.width / 12) * 100}%` : "100%";
  const s = {
    // Use flex-basis for desktop; CSS will override to 100% on mobile via .sp-col class
    "flex-basis": isHorizontal ? flexBasis : "100%",
    "flex-shrink": "0",
    "flex-grow": isHorizontal ? "0" : "1",
    "min-height": "50px",
    "background-color": column.styles?.backgroundColor,
    "padding-top": px(column.styles?.paddingTop),
    "padding-bottom": px(column.styles?.paddingBottom),
    "padding-left": px(column.styles?.paddingLeft),
    "padding-right": px(column.styles?.paddingRight),
    "box-sizing": "border-box",
  };
  const children = (column.components || [])
    .map(renderComponent)
    .filter(Boolean)
    .join("\n    ");
  // data-flex-basis used by CSS to restore flex-basis on desktop
  return `<div class="sp-col" data-flex-basis="${flexBasis}"${styleObj(s)}>
    ${children || ""}
  </div>`;
}

function renderContainer(container) {
  if (container.hidden) return "";
  const settings = container.settings || {};
  const styles = container.styles || {};
  const isHorizontal = settings.direction !== "vertical";
  const contentWidth = settings.contentWidth || "boxed";
  const maxWidth = settings.maxWidth || 1280;
  const gap = settings.gap ?? 16;

  const outerStyle = {
    "background-color": styles.backgroundColor,
    color: styles.textColor || "#1f2937",
    "padding-top": px(styles.paddingTop ?? 40),
    "padding-bottom": px(styles.paddingBottom ?? 40),
    "padding-left": px(styles.paddingLeft ?? 0),
    "padding-right": px(styles.paddingRight ?? 0),
    "margin-top": px(styles.marginTop ?? 0),
    "margin-bottom": px(styles.marginBottom ?? 0),
  };

  const innerStyle = {
    "max-width": contentWidth === "boxed" ? `${maxWidth}px` : "none",
    margin: contentWidth === "boxed" ? "0 auto" : undefined,
    "padding-left": contentWidth === "boxed" ? "16px" : undefined,
    "padding-right": contentWidth === "boxed" ? "16px" : undefined,
    display: "flex",
    // On mobile (handled by CSS), horizontal becomes column; vertical stays column
    "flex-direction": isHorizontal ? "row" : "column",
    "flex-wrap": isHorizontal ? "wrap" : undefined,
    gap: `${gap}px`,
    "align-items": isHorizontal
      ? settings.verticalAlign || "stretch"
      : undefined,
    "box-sizing": "border-box",
  };

  const columns = (container.columns || [])
    .map((col) => renderColumn(col, isHorizontal))
    .join("\n  ");

  // Use data-layout to allow CSS to target horizontal containers for responsive stacking
  return `<section${styleObj(outerStyle)}>
  <div class="sp-row" data-layout="${isHorizontal ? 'horizontal' : 'vertical'}"${styleObj(innerStyle)}>
  ${columns}
  </div>
</section>`;
}

// ============================================================================
// CSS
// ============================================================================

function generateCSS(theme) {
  const primary = theme?.primaryColor || "#3b82f6";
  const fontFamily =
    theme?.fontFamily || "Inter, system-ui, -apple-system, sans-serif";
  const headingFont = theme?.headingFont || fontFamily;

  return `/* SitePilot — Generated Styles */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

body {
  font-family: ${fontFamily};
  line-height: 1.6;
  color: #1f2937;
  background-color: #ffffff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 { font-family: ${headingFont}; line-height: 1.2; }

img { max-width: 100%; height: auto; display: block; }

a { transition: color 0.2s, opacity 0.2s; }

/* ── Buttons ──────────────────────────────────────────────────── */

.sp-btn-primary {
  display: inline-block;
  padding: clamp(0.6rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 2rem);
  background-color: ${primary};
  color: #ffffff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.875rem, 2vw, 1rem);
  transition: background-color 0.2s, transform 0.1s;
}
.sp-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }

.sp-btn-secondary {
  display: inline-block;
  padding: clamp(0.6rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 2rem);
  background-color: #4b5563;
  color: #ffffff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.875rem, 2vw, 1rem);
  transition: background-color 0.2s;
}
.sp-btn-secondary:hover { background-color: #374151; }

.sp-btn-outline {
  display: inline-block;
  padding: calc(clamp(0.6rem, 2vw, 0.75rem) - 2px) clamp(1.5rem, 4vw, 2rem);
  background-color: transparent;
  color: ${primary};
  border: 2px solid ${primary};
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.875rem, 2vw, 1rem);
  transition: background-color 0.2s, color 0.2s;
}
.sp-btn-outline:hover { background-color: ${primary}; color: #ffffff; }

.sp-btn-white {
  display: inline-block;
  padding: clamp(0.6rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 2rem);
  background-color: #ffffff;
  color: ${primary};
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(0.875rem, 2vw, 1rem);
  transition: background-color 0.2s;
}
.sp-btn-white:hover { background-color: #f3f4f6; }

/* ── Link box hover ──────────────────────────────────────────── */
.sp-link-box:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,.1); border-color: ${primary}; }

/* ── Nav ─────────────────────────────────────────────────────── */
.sp-nav-link:hover { color: ${primary} !important; }

/* ── Hamburger ───────────────────────────────────────────────── */
.sp-hamburger.is-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.sp-hamburger.is-open span:nth-child(2) { opacity: 0; }
.sp-hamburger.is-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Layout — Row / Column responsive ───────────────────────── */
/* Columns: use flex-basis from data attribute on desktop, 100% on mobile */
.sp-col { box-sizing: border-box; }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  /* Stack all horizontal rows vertically on mobile */
  .sp-row[data-layout="horizontal"] {
    flex-direction: column !important;
  }
  /* All columns go full width on mobile */
  .sp-col {
    flex-basis: 100% !important;
    width: 100% !important;
  }

  /* Navbar: show hamburger, hide desktop links */
  .sp-navbar .sp-nav-links { display: none !important; }
  .sp-navbar .sp-hamburger { display: flex !important; }
  .sp-navbar .sp-mobile-menu.is-open { display: flex !important; }

  /* Typography scaling for smaller screens */
  body { font-size: 0.9375rem; }

  /* Reduce section padding on mobile */
  section {
    padding-left: max(1rem, env(safe-area-inset-left)) !important;
    padding-right: max(1rem, env(safe-area-inset-right)) !important;
  }
}

@media (max-width: 480px) {
  body { font-size: 0.9rem; }

  section {
    padding-left: max(0.75rem, env(safe-area-inset-left)) !important;
    padding-right: max(0.75rem, env(safe-area-inset-right)) !important;
  }

  /* Ensure buttons are always tap-friendly */
  .sp-btn-primary, .sp-btn-secondary, .sp-btn-outline, .sp-btn-white {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
`;
}

// ============================================================================
// JS  (minimal interactivity)
// ============================================================================

function generateJS() {
  return `/* SitePilot — Generated JS */
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Hamburger menu toggle for all navbars
  document.querySelectorAll('.sp-hamburger').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var menuId = btn.getAttribute('aria-controls');
      var menu = menuId ? document.getElementById(menuId) : null;
      var isOpen = btn.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (menu) {
        menu.classList.toggle('is-open', isOpen);
      }
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(e) {
    document.querySelectorAll('.sp-hamburger.is-open').forEach(function(btn) {
      if (!btn.closest('.sp-navbar').contains(e.target)) {
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        var menuId = btn.getAttribute('aria-controls');
        var menu = menuId ? document.getElementById(menuId) : null;
        if (menu) menu.classList.remove('is-open');
      }
    });
  });

  // Close mobile menu on window resize back to desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      document.querySelectorAll('.sp-hamburger.is-open').forEach(function(btn) {
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        var menuId = btn.getAttribute('aria-controls');
        var menu = menuId ? document.getElementById(menuId) : null;
        if (menu) menu.classList.remove('is-open');
      });
    }
  });
});
`;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Convert a layout JSON object into { html, css, js } strings.
 *
 * @param {object} layoutJSON – The full layout JSON from the builder store
 * @param {string} [pageId]   – Optional page ID (defaults to first page)
 * @returns {{ html: string, css: string, js: string }}
 */
/**
 * Convert a single Page record (from the DB) into { html, css, js } strings.
 * Use this for the per-page storage architecture.
 *
 * @param {object} theme    – Site.theme from the DB (primaryColor, fontFamily, …)
 * @param {object} page     – Page record from the DB (name, slug, seo, layout)
 * @param {string} siteName – Human-readable site name used as fallback <title>
 * @param {object} [opts]   – { stylesHref, scriptSrc } for asset path control
 * @returns {Promise<{ html: string, css: string, js: string }>}
 */
export async function convertPageToHtml(
  theme,
  page,
  siteName = "SitePilot Site",
  opts = {},
) {
  if (!page) throw new Error("Page is required");

  const { stylesHref = "styles.css", scriptSrc = "script.js" } = opts;
  const seo = page.seo || {};

  // `layout` is stored as the raw containers array in the DB
  let bodyContent = (page.layout || [])
    .map(renderContainer)
    .filter(Boolean)
    .join("\n\n");

  // Collect all form IDs from FormEmbed components
  const formIds = [];
  const formPlaceholderRegex = /<!-- FORM_EMBED:([a-zA-Z0-9-]+) -->/g;
  let match;
  while ((match = formPlaceholderRegex.exec(bodyContent)) !== null) {
    const formId = match[1];
    if (formId !== 'NO_FORM_ID') {
      formIds.push(formId);
    }
  }

  // Fetch all forms and generate their HTML/CSS/JS
  const formData = {};
  let additionalCSS = '';
  let additionalJS = '';

  // Form rendering removed (Prisma dependency)
  if (formIds.length > 0) {
    // skipped
  }

  // Remove any remaining placeholders (forms not found)
  bodyContent = bodyContent.replace(
    /<!-- FORM_EMBED:[a-zA-Z0-9-]+ -->/g,
    '<div style="padding: 2rem; text-align: center; background-color: #fee; border: 2px dashed #f00; border-radius: 0.5rem;"><p style="color: #c00;">Form not found or not published</p></div>'
  );

  const css = generateCSS(theme || {}) + additionalCSS;
  const js = generateJS() + additionalJS;

  // Resolve the app base URL — this is where tracker.js is served from
  const appBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.sitepilot.devally.in';
  const trackerTag = buildTrackerTag(page.siteId, page.slug, appBaseUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seo.title || page.name || siteName)}</title>
  <meta name="description" content="${escapeHtml(seo.description || "")}" />
  ${seo.ogImage ? `<meta property="og:image" content="${escapeHtml(seo.ogImage)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${stylesHref}" />
  ${trackerTag}
</head>
<body>
${bodyContent}
  <script src="${scriptSrc}"><\/script>
</body>
</html>`;

  return { html, css, js };
}

/**
 * Convert a layout JSON object into { html, css, js } strings.
 *
 * @param {object} layoutJSON – The full layout JSON from the builder store
 * @param {string} [pageId]   – Optional page ID (defaults to first page)
 * @returns {{ html: string, css: string, js: string }}
 */
export function convertJsonToHtml(layoutJSON, pageId) {
  const page = pageId
    ? layoutJSON.pages.find((p) => p.id === pageId)
    : layoutJSON.pages?.[0];

  if (!page) throw new Error("Page not found");

  const theme = layoutJSON.theme || {};
  const seo = page.seo || {};
  const siteName = layoutJSON.site?.name || "SitePilot Site";

  // Render all containers
  const bodyContent = (page.layout || [])
    .map(renderContainer)
    .filter(Boolean)
    .join("\n\n");

  const css = generateCSS(theme);
  const js = generateJS();

  const appBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.sitepilot.devally.in';
  const pageSiteId = page.siteId || layoutJSON.site?.id || '';
  const trackerTag = buildTrackerTag(pageSiteId, page.slug || '/', appBaseUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seo.title || siteName)}</title>
  <meta name="description" content="${escapeHtml(seo.description || "")}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
  ${trackerTag}
</head>
<body>
${bodyContent}
  <script src="script.js"><\/script>
</body>
</html>`;

  return { html, css, js };
}
