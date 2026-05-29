"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { IngestionJob } from "@/src/types/listings";

export function DashboardContent() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/ingestion-jobs?limit=50");

      if (response.ok) {
        const payload = (await response.json()) as { data: IngestionJob[] };
        setJobs(payload.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-zinc-100 text-zinc-800";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 bg-zinc-950 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Ingestion Jobs</h2>
            <p className="text-sm text-zinc-400">Cronologia delle esecuzioni del processo di raccolta dati</p>
          </div>
          <Button onClick={() => void fetchJobs()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : jobs.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="py-12 text-center">
              <p className="text-zinc-400">Nessun job di ingestion trovato.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className="border-zinc-800 bg-zinc-900">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <CardTitle className="text-sm font-medium text-white">{job.source}</CardTitle>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <CardDescription className="text-xs text-zinc-500">ID: {job.id}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="flex gap-4 text-xs text-zinc-400">
                    <span>Inizio: {formatDate(job.startedAt)}</span>
                    {job.finishedAt && <span>Fine: {formatDate(job.finishedAt)}</span>}
                  </div>
                  {job.errorMessage && (
                    <p className="mt-2 rounded bg-red-950/50 p-2 text-xs text-red-300">{job.errorMessage}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
