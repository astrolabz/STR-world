"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, DollarSign, MapPin, Star, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

interface ListingsStats {
  totalCount: number;
  avgNightlyPrice: number;
  minNightlyPrice: number;
  maxNightlyPrice: number;
  avgRating: number;
  byPropertyType: { propertyType: string; count: number }[];
  byPlatform: { platform: string; count: number }[];
  topCities: { city: string; countryCode: string; count: number }[];
}

interface StatsOverlayProps {
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
}

export function StatsOverlay({ bbox }: StatsOverlayProps) {
  const [stats, setStats] = useState<ListingsStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!bbox) {
      return;
    }

    const searchParams = new URLSearchParams({
      minLat: String(bbox.minLat),
      maxLat: String(bbox.maxLat),
      minLng: String(bbox.minLng),
      maxLng: String(bbox.maxLng),
    });

    const response = await fetch(`/api/listings/stats?${searchParams.toString()}`);

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { data: ListingsStats };
    setStats(payload.data ?? null);
  }, [bbox]);

  useEffect(() => {
    if (isOpen) {
      void fetchStats();
    }
  }, [fetchStats, isOpen]);

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white/95 px-3 py-2 text-sm font-medium text-zinc-700 shadow hover:bg-white"
      >
        <BarChart3 className="h-4 w-4" />
        {isOpen ? "Nascondi statistiche" : "Mostra statistiche"}
      </button>

      {isOpen && stats && (
        <div className="mt-2 w-80 space-y-3 rounded-xl border border-zinc-200 bg-white/95 p-4 shadow">
          <div className="grid grid-cols-2 gap-2">
            <Card className="border-zinc-100">
              <CardHeader className="p-2 pb-0">
                <CardTitle className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="h-3 w-3" /> Annunci totali
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <p className="text-lg font-bold text-zinc-900">{stats.totalCount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-100">
              <CardHeader className="p-2 pb-0">
                <CardTitle className="flex items-center gap-1 text-xs text-zinc-500">
                  <DollarSign className="h-3 w-3" /> Prezzo medio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <p className="text-lg font-bold text-zinc-900">{stats.avgNightlyPrice.toFixed(0)}€</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-100">
              <CardHeader className="p-2 pb-0">
                <CardTitle className="flex items-center gap-1 text-xs text-zinc-500">
                  <TrendingUp className="h-3 w-3" /> Range prezzo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <p className="text-sm font-semibold text-zinc-900">
                  {stats.minNightlyPrice.toFixed(0)}€ - {stats.maxNightlyPrice.toFixed(0)}€
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-100">
              <CardHeader className="p-2 pb-0">
                <CardTitle className="flex items-center gap-1 text-xs text-zinc-500">
                  <Star className="h-3 w-3" /> Rating medio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                <p className="text-lg font-bold text-zinc-900">{stats.avgRating.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {stats.topCities.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-600">Top città</p>
              <div className="space-y-1">
                {stats.topCities.slice(0, 5).map((city) => (
                  <div key={`${city.city}-${city.countryCode}`} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700">
                      {city.city} ({city.countryCode})
                    </span>
                    <span className="font-medium text-zinc-900">{city.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.byPropertyType.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-600">Per tipo proprietà</p>
              <div className="space-y-1">
                {stats.byPropertyType.slice(0, 5).map((item) => (
                  <div key={item.propertyType} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700">{item.propertyType}</span>
                    <span className="font-medium text-zinc-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.byPlatform.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-600">Per piattaforma</p>
              <div className="space-y-1">
                {stats.byPlatform.map((item) => (
                  <div key={item.platform} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700">{item.platform}</span>
                    <span className="font-medium text-zinc-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
