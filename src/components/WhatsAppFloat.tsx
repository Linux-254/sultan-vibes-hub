import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/254700000000?text=Hi%20Empire%2C%20I%27d%20like%20to%20book%20a%20table"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-20 lg:bottom-6 left-4 z-40 h-11 w-11 rounded-full bg-[oklch(0.74_0.18_150)] text-night-deep flex items-center justify-center shadow-lg hover:scale-110 transition-transform opacity-80 hover:opacity-100"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={20} fill="currentColor" />
    </a>
  );
}
