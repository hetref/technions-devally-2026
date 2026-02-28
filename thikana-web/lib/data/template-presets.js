/**
 * Template Presets
 *
 * Full page-layout templates that users can import into the builder.
 * Each template is an array of containers (the `layout` portion of a page)
 * so it drops straight into `page.layout`.
 */

// ─── Template 1 — Landing Page ──────────────────────────────────────────────

const landingPageLayout = [
  // ── Navbar ─────────────────────────────────────────────────────────
  {
    id: "tpl-lp-nav",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 0,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-lp-nav-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-lp-navbar",
            type: "Navbar",
            props: {
              logo: "Thikana",
              links: [
                { label: "Home", href: "#" },
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Contact", href: "#contact" },
              ],
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── Hero ───────────────────────────────────────────────────────────
  {
    id: "tpl-lp-hero",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 24,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-lp-hero-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-lp-hero-comp",
            type: "Hero",
            props: {
              title: "Build Beautiful Websites in Minutes",
              subtitle:
                "The all-in-one website builder that makes creating professional sites simple. No coding required.",
              ctaText: "Start Free Trial",
              ctaLink: "#pricing",
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── Features ───────────────────────────────────────────────────────
  {
    id: "tpl-lp-features",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 24,
      verticalAlign: "stretch",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-lp-feat-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-lp-feat-comp",
            type: "Features",
            props: {
              title: "Everything You Need",
              items: [
                {
                  title: "Drag & Drop Builder",
                  description:
                    "Intuitively build pages by dragging elements into place. No technical skills needed.",
                },
                {
                  title: "Mobile Responsive",
                  description:
                    "Every template is fully responsive and looks great on any device out of the box.",
                },
                {
                  title: "SEO Optimized",
                  description:
                    "Built-in SEO tools help you rank higher in search results and drive more traffic.",
                },
              ],
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── CTA ────────────────────────────────────────────────────────────
  {
    id: "tpl-lp-cta",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 16,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-lp-cta-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-lp-cta-comp",
            type: "CTA",
            props: {
              title: "Ready to Launch Your Website?",
              description:
                "Join over 10,000 creators who trust Thikana to power their online presence.",
              buttonText: "Get Started for Free",
              buttonLink: "#pricing",
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── Footer ─────────────────────────────────────────────────────────
  {
    id: "tpl-lp-footer",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 0,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-lp-footer-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-lp-footer-comp",
            type: "Footer",
            props: {
              copyright: "© 2026 Thikana. All rights reserved.",
              links: [
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
                { label: "Contact Us", href: "#contact" },
              ],
            },
            styles: {},
          },
        ],
      },
    ],
  },
];

// ─── Template 2 — Portfolio ─────────────────────────────────────────────────

const portfolioLayout = [
  // ── Navbar ─────────────────────────────────────────────────────────
  {
    id: "tpl-pf-nav",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 0,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-pf-nav-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-pf-navbar",
            type: "Navbar",
            props: {
              logo: "Alex Morgan",
              links: [
                { label: "Home", href: "#" },
                { label: "Work", href: "#work" },
                { label: "About", href: "#about" },
                { label: "Contact", href: "#contact" },
              ],
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── Hero (intro) ──────────────────────────────────────────────────
  {
    id: "tpl-pf-hero",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 32,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 80,
      paddingBottom: 80,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-pf-hero-c1",
        width: 7,
        styles: {},
        components: [
          {
            id: "tpl-pf-hero-h1",
            type: "Heading",
            props: { text: "Hi, I'm Alex Morgan", level: "h1" },
            styles: { marginBottom: 12 },
          },
          {
            id: "tpl-pf-hero-txt",
            type: "Text",
            props: {
              content:
                "A creative designer & developer crafting unique digital experiences. I combine clean code with stunning visuals to bring ideas to life.",
              variant: "p",
            },
            styles: { marginBottom: 24 },
          },
          {
            id: "tpl-pf-hero-btn",
            type: "Button",
            props: {
              text: "View My Work",
              link: "#work",
              variant: "primary",
            },
            styles: {},
          },
        ],
      },
      {
        id: "tpl-pf-hero-c2",
        width: 5,
        styles: {},
        components: [
          {
            id: "tpl-pf-hero-img",
            type: "Image",
            props: {
              src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
              alt: "Profile photo",
              objectFit: "cover",
              borderRadius: 16,
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── Work / Gallery ─────────────────────────────────────────────────
  {
    id: "tpl-pf-work",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 24,
      verticalAlign: "stretch",
    },
    styles: {
      paddingTop: 60,
      paddingBottom: 60,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: "#f8fafc",
    },
    columns: [
      {
        id: "tpl-pf-work-c0",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-pf-work-heading",
            type: "Heading",
            props: { text: "Selected Work", level: "h2" },
            styles: { textAlign: "center", marginBottom: 32 },
          },
        ],
      },
    ],
  },
  {
    id: "tpl-pf-gallery",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 24,
      verticalAlign: "stretch",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 60,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: "#f8fafc",
    },
    columns: [
      {
        id: "tpl-pf-gal-c1",
        width: 4,
        styles: {},
        components: [
          {
            id: "tpl-pf-gal-img1",
            type: "Image",
            props: {
              src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
              alt: "Project 1 – Web Dashboard",
              objectFit: "cover",
              borderRadius: 12,
            },
            styles: {},
          },
          {
            id: "tpl-pf-gal-cap1",
            type: "Heading",
            props: { text: "Web Dashboard", level: "h4" },
            styles: { marginTop: 8 },
          },
        ],
      },
      {
        id: "tpl-pf-gal-c2",
        width: 4,
        styles: {},
        components: [
          {
            id: "tpl-pf-gal-img2",
            type: "Image",
            props: {
              src: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=600&h=400&fit=crop",
              alt: "Project 2 – Mobile App",
              objectFit: "cover",
              borderRadius: 12,
            },
            styles: {},
          },
          {
            id: "tpl-pf-gal-cap2",
            type: "Heading",
            props: { text: "Mobile App", level: "h4" },
            styles: { marginTop: 8 },
          },
        ],
      },
      {
        id: "tpl-pf-gal-c3",
        width: 4,
        styles: {},
        components: [
          {
            id: "tpl-pf-gal-img3",
            type: "Image",
            props: {
              src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop",
              alt: "Project 3 – Brand Identity",
              objectFit: "cover",
              borderRadius: 12,
            },
            styles: {},
          },
          {
            id: "tpl-pf-gal-cap3",
            type: "Heading",
            props: { text: "Brand Identity", level: "h4" },
            styles: { marginTop: 8 },
          },
        ],
      },
    ],
  },

  // ── About ──────────────────────────────────────────────────────────
  {
    id: "tpl-pf-about",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 32,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 60,
      paddingBottom: 60,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-pf-about-c1",
        width: 6,
        styles: {},
        components: [
          {
            id: "tpl-pf-about-h",
            type: "Heading",
            props: { text: "About Me", level: "h2" },
            styles: { marginBottom: 16 },
          },
          {
            id: "tpl-pf-about-p1",
            type: "Text",
            props: {
              content:
                "I'm a full-stack designer with 8+ years of experience working with startups and established brands. I specialize in creating intuitive user experiences backed by clean, maintainable code.",
              variant: "p",
            },
            styles: { marginBottom: 12 },
          },
          {
            id: "tpl-pf-about-p2",
            type: "Text",
            props: {
              content:
                "My toolkit includes Figma, React, Next.js, and a deep love for design systems. When I'm not designing, you'll find me hiking or experimenting with generative art.",
              variant: "p",
            },
            styles: {},
          },
        ],
      },
      {
        id: "tpl-pf-about-c2",
        width: 6,
        styles: {},
        components: [
          {
            id: "tpl-pf-about-img",
            type: "Image",
            props: {
              src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
              alt: "Workspace",
              objectFit: "cover",
              borderRadius: 12,
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── CTA ────────────────────────────────────────────────────────────
  {
    id: "tpl-pf-cta",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 16,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-pf-cta-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-pf-cta-comp",
            type: "CTA",
            props: {
              title: "Let's Work Together",
              description:
                "Have a project in mind? I'd love to hear about it. Let's create something amazing.",
              buttonText: "Get in Touch",
              buttonLink: "#contact",
            },
            styles: {},
          },
        ],
      },
    ],
  },

  // ── Footer ─────────────────────────────────────────────────────────
  {
    id: "tpl-pf-footer",
    type: "container",
    settings: {
      direction: "horizontal",
      contentWidth: "boxed",
      maxWidth: 1280,
      gap: 0,
      verticalAlign: "center",
    },
    styles: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    columns: [
      {
        id: "tpl-pf-footer-c1",
        width: 12,
        styles: {},
        components: [
          {
            id: "tpl-pf-footer-comp",
            type: "Footer",
            props: {
              copyright: "© 2026 Alex Morgan. All rights reserved.",
              links: [
                { label: "GitHub", href: "#" },
                { label: "Dribbble", href: "#" },
                { label: "LinkedIn", href: "#" },
              ],
            },
            styles: {},
          },
        ],
      },
    ],
  },
];

// ─── Exports ────────────────────────────────────────────────────────────────

export const templatePresets = [
  {
    id: "landing-page",
    name: "Landing Page",
    description:
      "A complete marketing landing page with hero, features, call-to-action and footer sections.",
    preview: {
      icon: "layout",
      sections: ["Navbar", "Hero", "Features", "CTA", "Footer"],
      color: "#3b82f6",
    },
    layout: landingPageLayout,
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description:
      "A creative portfolio page with intro, project gallery, about section and contact CTA.",
    preview: {
      icon: "user",
      sections: ["Navbar", "Intro", "Gallery", "About", "CTA", "Footer"],
      color: "#8b5cf6",
    },
    layout: portfolioLayout,
  },
];

/**
 * Get a template preset by its ID.
 */
export function getTemplatePreset(id) {
  return templatePresets.find((t) => t.id === id) ?? null;
}
