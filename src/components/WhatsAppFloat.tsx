import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/254700000000?text=Hi%20Sultan%2C%20I%27d%20like%20to%20book%20a%20table"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[oklch(0.74_0.18_150)] text-night-deep flex items-center justify-center shadow-[var(--shadow-glow)] hover:scale-110 transition-transform"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={24} fill="currentColor" />
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-lava animate-ping" />
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-lava" />
    </a>
  );
}
