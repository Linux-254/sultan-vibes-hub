import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { EventNotificationBar } from "@/components/EventNotificationBar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in the smoke</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page slipped out the back door. Let's get you home.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-night-deep"
        >
          Back to Empire
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Something stalled the vibe</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-night-deep"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0D0D0D" },
      { title: "Empire Kwa Sultan — Shisha & Chill Spots in Nairobi | Best Campus Hangout" },
      {
        name: "description",
        content:
          "Empire Kwa Sultan is Nairobi's premier shisha lounge, cocktail bar & events venue on USIU Road. Kenya's best shisha, chill spot for students, nightlife, VIP tables & live DJs. Reserve your table today.",
      },
      {
        name: "keywords",
        content:
          "shisha kenya, shisha lounge Nairobi, chill spots in Nairobi, campus hangouts, hookah lounge Nairobi, cocktail bar Kenya, nightlife USIU Road, Empire Kwa Sultan, shisha Nairobi, events venue Nairobi, VIP lounge Nairobi, bar Nairobi Kenya, student hangout Nairobi, rooftop lounge, Afro house music, DJ Nairobi, best shisha in Nairobi, where to chill in Nairobi",
      },
      { rel: "canonical", href: "https://empirekwasultan.co.ke/" },
      {
        property: "og:title",
        content: "Empire Kwa Sultan — Nairobi's Best Shisha Lounge & Chill Spot",
      },
      {
        property: "og:description",
        content:
          "Best shisha in Kenya, cocktails, chill spots & campus hangouts on USIU Road, Nairobi. Live DJs, VIP tables & unforgettable nights.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Empire Kwa Sultan" },
      { property: "og:url", content: "https://empirekwasultan.co.ke/" },
      { property: "og:image", content: "https://empirekwasultan.co.ke/favicon.png" },
      { property: "og:locale", content: "en_KE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Empire Kwa Sultan — Shisha & Chill Spots in Nairobi" },
      {
        name: "twitter:description",
        content: "Best shisha in Kenya, cocktails & campus hangouts on USIU Road, Nairobi.",
      },
      { name: "twitter:image", content: "https://empirekwasultan.co.ke/favicon.png" },
      { name: "geo.region", content: "KE" },
      { name: "geo.placename", content: "Nairobi" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "canonical", href: "https://empirekwasultan.co.ke/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://rhdhaptcdjgnsbamgxyv.supabase.co" },
      { rel: "preconnect", href: "https://rhdhaptcdjgnsbamgxyv.supabase.co" },
      {
        rel: "stylesheet",
        href: "https://api.fontshare.com/v2/css?f[]=clash-display@600,500,700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@1,500&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("empire_age_confirmed") === "true") {
      setAgeConfirmed(true);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark">
        <AuthProvider>
          <div
            style={{ display: ageConfirmed ? "none" : "flex" }}
            className="fixed inset-0 z-[999] items-center justify-center bg-night-deep/95 backdrop-blur-md"
          >
            <div className="glass rounded-3xl p-8 sm:p-10 kente-border max-w-sm mx-4 text-center shadow-[var(--shadow-elevated)]">
              <div className="text-5xl mb-4">🔞</div>
              <h2 className="font-display text-2xl sm:text-3xl">
                Are you <span className="text-gold-gradient">18+</span>?
              </h2>
              <p className="text-foreground/60 text-sm mt-2">
                Empire Kwa Sultan is an 18+ venue. You must be of legal age to enter.
              </p>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => {
                    setAgeConfirmed(true);
                    try {
                      sessionStorage.setItem("empire_age_confirmed", "true");
                    } catch {}
                  }}
                  className="w-full rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-night-deep hover:shadow-[var(--shadow-glow)] transition"
                >
                  Yes, I'm 18+
                </button>
                <p className="text-xs text-foreground/50">You must be 18+ to access this site.</p>
              </div>
            </div>
          </div>
          <SiteHeader />
          <main className="pt-16 pb-28 lg:pb-0">
            <Outlet />
          </main>
          <MobileBottomNav />
          <SiteFooter />
          <EventNotificationBar />
          <Toaster />
        </AuthProvider>
      </div>
    </QueryClientProvider>
  );
}
