"use client";

import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ListingDetailsSheet } from "@/src/components/listing-details-sheet";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Slider } from "@/src/components/ui/slider";
import { ShortTermRentalListing } from "@/src/types/listings";

interface Bbox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface CesiumRectangle {
  west: number;
  east: number;
  south: number;
  north: number;
}

interface CesiumViewer {
  camera: {
    flyTo: (options: { destination: unknown }) => void;
    moveEnd: { addEventListener: (callback: () => void) => void };
    computeViewRectangle: () => CesiumRectangle | undefined;
  };
  scene: {
    canvas: HTMLCanvasElement;
    pick: (position: unknown) => { id?: { properties?: { listingId?: { getValue: () => string } } } } | undefined;
  };
  entities: {
    removeAll: () => void;
    add: (entity: unknown) => void;
  };
  destroy: () => void;
}

interface CesiumNamespace {
  Viewer: new (
    container: HTMLElement,
    options: {
      animation: boolean;
      timeline: boolean;
      geocoder: boolean;
      baseLayerPicker: boolean;
    },
  ) => CesiumViewer;
  Cartesian3: { fromDegrees: (longitude: number, latitude: number, height?: number) => unknown };
  Cartesian2: new (x: number, y: number) => unknown;
  Math: { toDegrees: (radians: number) => number };
  Color: Record<string, unknown>;
  LabelStyle: Record<string, unknown>;
  ScreenSpaceEventHandler: new (canvas: HTMLCanvasElement) => {
    setInputAction: (callback: (event: { position?: unknown }) => void, inputType: unknown) => void;
  };
  ScreenSpaceEventType: { LEFT_CLICK: unknown };
}

const PLATFORM_OPTIONS = ["all", "CityOpenData", "AnalyticsProvider", "Airbnb", "Booking", "VRBO"];
const CESIUM_VERSION = "1.120";
const UI_TEXT = {
  visibleListings: "annunci visibili",
};

function appendCesiumAssets() {
  if (document.getElementById("cesium-script")) {
    return;
  }

  window.CESIUM_BASE_URL = `https://unpkg.com/cesium@${CESIUM_VERSION}/Build/Cesium/`;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://unpkg.com/cesium@${CESIUM_VERSION}/Build/Cesium/Widgets/widgets.css`;
  document.head.appendChild(link);

  const script = document.createElement("script");
  script.id = "cesium-script";
  script.src = `https://unpkg.com/cesium@${CESIUM_VERSION}/Build/Cesium/Cesium.js`;
  script.async = true;
  document.body.appendChild(script);
}

export function ShortTermRentalMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const listingsRef = useRef<ShortTermRentalListing[]>([]);
  const [listings, setListings] = useState<ShortTermRentalListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<ShortTermRentalListing | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [searchText, setSearchText] = useState("");
  const [platform, setPlatform] = useState("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!bbox) {
      return;
    }

    const searchParams = new URLSearchParams({
      minLat: String(bbox.minLat),
      maxLat: String(bbox.maxLat),
      minLng: String(bbox.minLng),
      maxLng: String(bbox.maxLng),
      minNightlyPrice: String(priceRange[0]),
      maxNightlyPrice: String(priceRange[1]),
      minRating: String(minRating),
      limit: "500",
    });

    if (platform !== "all") {
      searchParams.append("platform", platform);
    }

    if (searchText.trim()) {
      searchParams.set("q", searchText.trim());
    }

    const response = await fetch(`api/listings?${searchParams.toString()}`);

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { data: ShortTermRentalListing[] };
    const query = searchText.trim().toLowerCase();
    const filtered = (payload.data ?? []).filter((listing) => {
      const inBbox =
        listing.latitude >= bbox.minLat &&
        listing.latitude <= bbox.maxLat &&
        listing.longitude >= bbox.minLng &&
        listing.longitude <= bbox.maxLng;
      const inPrice = listing.nightlyPrice >= priceRange[0] && listing.nightlyPrice <= priceRange[1];
      const inRating = (listing.rating ?? 0) >= minRating;
      const inPlatform = platform === "all" || listing.platform === platform;
      const inQuery =
        !query ||
        `${listing.title} ${listing.city} ${listing.countryCode}`.toLowerCase().includes(query);

      return inBbox && inPrice && inRating && inPlatform && inQuery;
    });

    setListings(filtered);
  }, [bbox, minRating, platform, priceRange, searchText]);

  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  useEffect(() => {
    appendCesiumAssets();

    const initialize = () => {
      if (!containerRef.current || !window.Cesium || viewerRef.current) {
        return;
      }

      const Cesium = window.Cesium as CesiumNamespace;
      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        baseLayerPicker: true,
      });

      viewerRef.current = viewer;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 20, 19000000),
      });

      viewer.camera.moveEnd.addEventListener(() => {
        const rectangle = viewer.camera.computeViewRectangle();

        if (!rectangle) {
          return;
        }

        setBbox({
          minLng: Cesium.Math.toDegrees(rectangle.west),
          maxLng: Cesium.Math.toDegrees(rectangle.east),
          minLat: Cesium.Math.toDegrees(rectangle.south),
          maxLat: Cesium.Math.toDegrees(rectangle.north),
        });
      });

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: { position?: unknown }) => {
        const picked = viewer.scene.pick(click.position);

        if (picked?.id?.properties?.listingId) {
          const listingId = picked.id.properties.listingId.getValue();
          const listing = listingsRef.current.find((item) => item.id === listingId);

          if (listing) {
            setSelectedListing(listing);
            setIsSheetOpen(true);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    };

    const interval = setInterval(() => {
      if (window.Cesium && containerRef.current && !viewerRef.current) {
        initialize();
      }
    }, 300);

    return () => {
      clearInterval(interval);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchListings();
    }, 0);

    return () => clearTimeout(timeout);
  }, [fetchListings]);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer || !window.Cesium) {
      return;
    }

    const Cesium = window.Cesium as CesiumNamespace;
    viewer.entities.removeAll();

    for (const listing of listings) {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(listing.longitude, listing.latitude),
        point: {
          pixelSize: 10,
          color: Cesium.Color.SKYBLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
        },
        label: {
          text: `${listing.nightlyPrice} ${listing.currency}`,
          font: "12px sans-serif",
          pixelOffset: new Cesium.Cartesian2(0, -20),
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
        },
        properties: {
          listingId: listing.id,
        },
      });
    }
  }, [listings]);

  const listingCountText = useMemo(() => `${listings.length} ${UI_TEXT.visibleListings}`, [listings.length]);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full bg-zinc-950">
      <div className="absolute left-4 top-4 z-20 w-72 rounded-xl border border-zinc-200 bg-white/95 shadow">
        <button
          onClick={() => setIsFiltersOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filtri · {listingCountText}
          </span>
          {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {isFiltersOpen && (
          <div className="border-t border-zinc-100 p-3 space-y-3">
            <Input
              placeholder="Cerca città o paese"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-600">Range prezzo per notte</p>
              <Slider
                value={priceRange}
                min={0}
                max={2000}
                step={10}
                onValueChange={(value) => setPriceRange([value[0] ?? 0, value[1] ?? 2000])}
              />
              <p className="text-xs text-zinc-500">
                {priceRange[0]} – {priceRange[1]} EUR
              </p>
            </div>
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={minRating}
              onChange={(event) => setMinRating(Number(event.target.value || 0))}
              placeholder="Rating minimo"
            />
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Piattaforma" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div ref={containerRef} className="h-full w-full" />

      <ListingDetailsSheet listing={selectedListing} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </div>
  );
}
