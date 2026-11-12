import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS Nova — Official CDI Mock Suite",
  description:
    "Professional Computer-Delivered IELTS Listening & Reading Mock Examination Platform.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo-mark.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/logo-mark.png",
  },
};

const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem("ielts-nova:theme");
    if (!t) {
      var raw = localStorage.getItem("ielts-nova:v2");
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.theme) t = parsed.theme;
      }
    }
    var isDark = t === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased selection:bg-emerald-500/20">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
