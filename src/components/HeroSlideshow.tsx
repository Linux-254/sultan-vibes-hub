import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero.webp";
import event1Img from "@/assets/event-1.webp";
import event2Img from "@/assets/event-2.webp";
import event3Img from "@/assets/event-3.webp";

interface SlideImage {
  url: string;
  alt: string | null;
}

const FALLBACK: SlideImage[] = [
  { url: heroImg, alt: "Empire Kwa Sultan lounge at night" },
  { url: event1Img, alt: "DJ booth at Empire Kwa Sultan" },
  { url: event2Img, alt: "Cocktails and shisha at Empire" },
  { url: event3Img, alt: "Empire Kwa Sultan nightlife" },
];

interface HeroSlideshowProps {
  slot: "hero" | "auth";
}

export function HeroSlideshow({ slot = "hero" }: HeroSlideshowProps) {
  const [slides, setSlides] = useState<SlideImage[]>(FALLBACK);
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_images")
        .select("url, alt")
        .eq("slot", slot)
        .eq("active", true)
        .order("sort_order");
      if (data && data.length > 0) setSlides(data);
    };
    load();
  }, [slot]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setCurrent((c) => (c + (diff > 0 ? 1 : slides.length - 1)) % slides.length);
    }
    setTouchStart(null);
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, i) => (
        <div
          key={`${slot}-${i}`}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : 0,
            willChange: "opacity",
            transition: "opacity 1s ease-in-out",
          }}
        >
          {(i === current || i === (current + 1) % slides.length) && (
            <img
              src={slide.url}
              alt={slide.alt}
              className="h-full w-full object-cover kenburns"
              style={{
                transform: i === current ? "scale(1.08)" : "scale(1)",
                willChange: "transform",
                transition: "transform 6s ease-in-out",
              }}
              loading={i === 0 ? "eager" : "lazy"}
            />
          )}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-night-deep/70 via-night-deep/40 to-night-deep" />

      {/* Dot indicators */}
      <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-gold" : "w-2 bg-foreground/30 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
