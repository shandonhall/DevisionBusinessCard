import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getServerEnv } from "@/lib/validation/env";
import { THEME_STORAGE_KEY } from "@/lib/theme/theme";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#050607" },
  ],
};

export function generateMetadata(): Metadata {
  const env = getServerEnv();
  return {
    title: {
      default: env.NEXT_PUBLIC_PLATFORM_NAME,
      template: `%s · ${env.NEXT_PUBLIC_PLATFORM_NAME}`,
    },
    description:
      "White-label digital business cards for organisations, teams and staff.",
  };
}

const themeInitScript = `
(function(){
  try {
    var key=${JSON.stringify(THEME_STORAGE_KEY)};
    var stored=localStorage.getItem(key);
    var dark=stored==="dark"||(stored!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
    if(dark){
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme="dark";
    }else{
      document.documentElement.style.colorScheme="light";
    }
  }catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${sourceSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
