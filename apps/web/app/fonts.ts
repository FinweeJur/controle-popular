import localFont from "next/font/local";

// Self-hosted (not loaded from Fontshare's CDN at runtime): api.fontshare.com
// started refusing requests from this environment ("Access to the Fontshare
// API has been temporarily restricted"), so the site silently fell back to
// system-ui. next/font/local bundles these at build time -- no third-party
// dependency, and it handles basePath/hashing/preload automatically (unlike
// serving them from public/, which would need manual basePath prefixing,
// same class of bug already hit twice this session).
export const clashDisplay = localFont({
  src: [
    { path: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ClashDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

export const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

export const tabular = localFont({
  src: [
    { path: "./fonts/Tabular-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Tabular-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-tabular-raw",
  display: "swap",
});
