"use client";

import { animate, utils } from "animejs";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { ShortTermRentalListing } from "@/src/types/listings";

interface ListingDetailsSheetProps {
  listing: ShortTermRentalListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListingDetailsSheet({ listing, open, onOpenChange }: ListingDetailsSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listing && open && contentRef.current) {
      const children = Array.from(contentRef.current.children);
      animate(children, {
        opacity: [0, 1],
        translateX: [24, 0],
        duration: 350,
        delay: utils.stagger(80),
        easing: "easeOutQuart",
      });
    }
  }, [listing, open]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {listing ? (
          <div ref={contentRef} className="space-y-4">
            <SheetHeader>
              <SheetTitle>{listing.title}</SheetTitle>
              <SheetDescription>
                {listing.city}, {listing.countryCode}
              </SheetDescription>
            </SheetHeader>

            <Card>
              <CardHeader>
                <CardTitle>
                  {listing.nightlyPrice.toFixed(2)} {listing.currency} / notte
                </CardTitle>
                <CardDescription>{listing.platform}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-700">
                <p>{listing.description}</p>
                <p>
                  Rating: {listing.rating ?? "N/D"} · Recensioni: {listing.reviewCount ?? "N/D"}
                </p>
                <p>
                  Ospiti: {listing.maxGuests} · Camere: {listing.bedrooms} · Bagni: {listing.bathrooms}
                </p>
                <Button asChild className="w-full">
                  <a href={listing.originalUrl} target="_blank" rel="noopener noreferrer">
                    Vedi annuncio originale
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="pt-10 text-sm text-zinc-500">Seleziona un annuncio dalla mappa per vedere i dettagli.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
