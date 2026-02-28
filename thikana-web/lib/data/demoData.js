import { nanoid } from "nanoid";

/**
 * DEMO DATA
 *
 * Elementor-style layout: Container → Columns → Components
 * Each layout item is a container with settings and a columns array.
 */

export const demoWebsiteJSON = {
  site: {
    id: nanoid(),
    name: "Demo Website",
    createdAt: new Date().toISOString(),
  },
  theme: {
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    fontFamily: "Inter, system-ui, sans-serif",
    headingFont: "Inter, system-ui, sans-serif",
    borderRadius: "8px",
  },
  pages: [
    {
      id: nanoid(),
      name: "Home",
      slug: "/",
      seo: {
        title: "Demo Website — Home",
        description: "Welcome to the demo website built with SitePilot.",
      },
      layout: [
        // ── Navbar ──────────────────────────────────────────────
        {
          id: nanoid(),
          type: "container",
          settings: {
            direction: "horizontal",
            contentWidth: "full",
            maxWidth: 1280,
            gap: 0,
            verticalAlign: "stretch",
          },
          styles: {
            backgroundColor: "#ffffff",
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 0,
            marginBottom: 0,
          },
          columns: [
            {
              id: nanoid(),
              width: 12,
              styles: {},
              components: [
                {
                  id: nanoid(),
                  type: "Navbar",
                  props: {
                    logo: "SitePilot",
                    links: [
                      { label: "Home", href: "#" },
                      { label: "Features", href: "#features" },
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

        // ── Hero ────────────────────────────────────────────────
        {
          id: nanoid(),
          type: "container",
          settings: {
            direction: "horizontal",
            contentWidth: "full",
            maxWidth: 1280,
            gap: 16,
            verticalAlign: "center",
          },
          styles: {
            backgroundColor: "#f0f9ff",
            paddingTop: 80,
            paddingBottom: 80,
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 0,
            marginBottom: 0,
          },
          columns: [
            {
              id: nanoid(),
              width: 12,
              styles: {},
              components: [
                {
                  id: nanoid(),
                  type: "Hero",
                  props: {
                    title: "Build Websites with AI",
                    subtitle:
                      "Create stunning, professional websites in minutes with our AI‑powered platform.",
                    ctaText: "Get Started Free",
                    ctaLink: "#signup",
                  },
                  styles: { textColor: "#1f2937" },
                },
              ],
            },
          ],
        },

        // ── Features ────────────────────────────────────────────
        {
          id: nanoid(),
          type: "container",
          settings: {
            direction: "horizontal",
            contentWidth: "boxed",
            maxWidth: 1280,
            gap: 16,
            verticalAlign: "stretch",
          },
          styles: {
            backgroundColor: "#ffffff",
            paddingTop: 80,
            paddingBottom: 80,
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 0,
            marginBottom: 0,
          },
          columns: [
            {
              id: nanoid(),
              width: 12,
              styles: {},
              components: [
                {
                  id: nanoid(),
                  type: "Features",
                  props: {
                    heading: "Why Choose SitePilot?",
                    features: [
                      {
                        icon: "⚡",
                        title: "Lightning Fast",
                        description:
                          "Build websites 10× faster with AI‑powered tools.",
                      },
                      {
                        icon: "🎨",
                        title: "Beautiful Design",
                        description:
                          "Professional templates that look great on every device.",
                      },
                      {
                        icon: "🔧",
                        title: "Easy to Customize",
                        description:
                          "Drag‑and‑drop editor — no coding required.",
                      },
                    ],
                  },
                  styles: {},
                },
              ],
            },
          ],
        },

        // ── CTA ─────────────────────────────────────────────────
        {
          id: nanoid(),
          type: "container",
          settings: {
            direction: "horizontal",
            contentWidth: "full",
            maxWidth: 1280,
            gap: 16,
            verticalAlign: "center",
          },
          styles: {
            backgroundColor: "#3b82f6",
            textColor: "#ffffff",
            paddingTop: 60,
            paddingBottom: 60,
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 0,
            marginBottom: 0,
          },
          columns: [
            {
              id: nanoid(),
              width: 12,
              styles: {},
              components: [
                {
                  id: nanoid(),
                  type: "CTA",
                  props: {
                    title: "Ready to get started?",
                    description:
                      "Join thousands of creators already using SitePilot.",
                    buttonText: "Start Building",
                    buttonLink: "#signup",
                  },
                  styles: {},
                },
              ],
            },
          ],
        },

        // ── Footer ──────────────────────────────────────────────
        {
          id: nanoid(),
          type: "container",
          settings: {
            direction: "horizontal",
            contentWidth: "full",
            maxWidth: 1280,
            gap: 0,
            verticalAlign: "stretch",
          },
          styles: {
            backgroundColor: "#1f2937",
            textColor: "#ffffff",
            paddingTop: 40,
            paddingBottom: 40,
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 0,
            marginBottom: 0,
          },
          columns: [
            {
              id: nanoid(),
              width: 12,
              styles: {},
              components: [
                {
                  id: nanoid(),
                  type: "Footer",
                  props: {
                    text: "© 2025 SitePilot. All rights reserved.",
                    links: [
                      { label: "Privacy Policy", href: "#" },
                      { label: "Terms of Service", href: "#" },
                      { label: "Contact", href: "#" },
                    ],
                  },
                  styles: {},
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Simulated API helper — returns demo JSON as if from a server.
 */
export const siteAPI = {
  getSiteData: async () => {
    return new Promise((resolve) =>
      setTimeout(() => resolve(demoWebsiteJSON), 300),
    );
  },
};
