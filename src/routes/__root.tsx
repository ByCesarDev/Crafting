import type { ReactNode } from "react";

import { createRootRoute, HeadContent, Navigate, Outlet, Scripts } from "@tanstack/react-router";

import { Analytics } from "@/components/analytics";
import { ThemeProvider } from "@/context/theme-context";

import "@/assets/css/index.css";

const siteUrl = (import.meta.env.VITE_SITE_URL ?? "https://crafting.thedestruc7i0n.ca").replace(
  /\/$/,
  "",
);
const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const themeScript = `
(() => {
  try {
    const theme = localStorage.getItem("ui-theme") || "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolvedTheme);
  } catch {
    document.documentElement.classList.add("light");
  }
})();
`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "theme-color", content: "#262626" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { property: "og:image", content: `${siteUrl}/icons/icon-512.png` },
      { property: "og:locale", content: "en_us" },
      { name: "twitter:site", content: "@thedestruc7i0n" },
      { property: "twitter:image", content: `${siteUrl}/icons/icon-512.png` },
    ],
    links: [
      { rel: "icon", type: "image/x-icon", href: `${base}/favicon.ico` },
      { rel: "icon", type: "image/png", href: `${base}/icons/icon-192.png` },
      { rel: "apple-touch-icon", href: `${base}/icons/icon-192.png` },
      { rel: "manifest", href: `${base}/manifest.json` },
      {
        rel: "preload",
        href: `${base}/fonts/Minecraft.woff`,
        as: "font",
        type: "font/woff",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: `${base}/fonts/minecraft-font.css` },
    ],
  }),
  component: RootRoute,
  notFoundComponent: NotFoundPage,
});

function RootRoute() {
  return (
    <RootDocument>
      <ThemeProvider defaultTheme="system">
        <Analytics />
        <Outlet />
      </ThemeProvider>
    </RootDocument>
  );
}

function NotFoundPage() {
  return <Navigate to="/" replace />;
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BZ61P6Z37L" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "G-BZ61P6Z37L", { send_page_view: false });
`,
          }}
        />
      </head>
      <body className="bg-background font-sans" suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
