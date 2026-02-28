import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";
import ThemeSwitcher from "@/components/ThemeSwitcher";

// Bricolage Grotesque — wide, expressive display. Very distinctive 2025 startup font.
const bricolage = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Manrope — smooth geometric humanist body. Clean, contemporary, pairs perfectly.
const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Thikana — Empower Your Local Business",
  description: "Thikana is an all-in-one SaaS platform combining business discovery, no-code websites, commerce, and payments for local businesses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.variable} ${manrope.variable} min-h-screen bg-background antialiased`}
        style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
      >
        <ThemeProvider>
          <AuthProvider>
            <div className="relative flex min-h-screen h-full flex-col">
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
            <ThemeSwitcher />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
