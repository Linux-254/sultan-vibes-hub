export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NightClub",
    name: "Empire Kwa Sultan",
    description:
      "Afro-Kenyan shisha lounge, cocktail bar & events venue on USIU Road, Nairobi. Premium shisha, cocktails, liquor, beer, whisky, and the best nightlife in Kenya.",
    url: "https://empirekwasultan.co.ke",
    telephone: "+254-XXX-XXX-XXX",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Park Hotel, USIU Road",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -1.2864,
      longitude: 36.8547,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "17:00",
        closes: "04:00",
      },
    ],
    priceRange: "$$",
    servesCuisine: ["Shisha", "Cocktails", "Liquor", "Beer", "Whisky", "CGS"],
    sameAs: ["https://instagram.com/empirepuffandpark", "https://tiktok.com/@empirepuffandpark"],
  };
}

export function eventJsonLd(event: {
  name: string;
  description?: string | null;
  startDate: string;
  endDate?: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description ?? undefined,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Empire Kwa Sultan",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Park Hotel, USIU Road",
        addressLocality: "Nairobi",
        addressCountry: "KE",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Empire Kwa Sultan",
      url: "https://empirekwasultan.co.ke",
    },
    url: event.url,
  };
}

export function productJsonLd(product: {
  name: string;
  description?: string | null;
  price: number;
  brand?: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.image ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Empire Kwa Sultan",
      },
    },
  };
}
