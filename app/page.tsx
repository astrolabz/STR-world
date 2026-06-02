import { AnimatedHeader } from "@/src/components/animated-header";
import { ShortTermRentalMap } from "@/src/components/short-term-rental-map";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center border-b border-zinc-800 bg-zinc-900 px-6">
        <AnimatedHeader>STR World · Global Short-Term Rental 3D Map</AnimatedHeader>
      </header>
      <ShortTermRentalMap />
    </main>
  );
}
