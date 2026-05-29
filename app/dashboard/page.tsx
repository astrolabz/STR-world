import { DashboardContent } from "@/src/components/dashboard-content";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
        <h1 className="text-lg font-semibold text-white">STR World · Dashboard</h1>
        <a href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Torna alla mappa
        </a>
      </header>
      <DashboardContent />
    </main>
  );
}
