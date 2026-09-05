import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: {
    default: "ACM CMS",
    template: "%s · ACM CMS",
  },
  description: "ACM club learning and management platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Applies the stored theme before first paint to avoid a light/dark flash.
const themeScript = `try{var t=localStorage.getItem("cms-theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
