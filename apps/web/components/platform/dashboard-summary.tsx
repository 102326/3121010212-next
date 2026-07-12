import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardMetric } from "@/components/platform/types";

type DashboardSummaryProps = {
  loading: boolean;
  message: string;
  stats: DashboardMetric[];
  onRefresh: () => void;
};

export function DashboardSummary({ loading, message, stats, onRefresh }: DashboardSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Go API + PostgreSQL</p>
          <h2 className="mt-1 text-2xl font-semibold">运营概览</h2>
        </div>
        <Button className="gap-2" variant="outline" disabled={loading} onClick={onRefresh}>
          <RefreshCw className="size-4" />
          刷新
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((item) => (
          <div key={item.name} className="rounded-md border border-border p-4">
            <item.icon className="mb-4 size-5 text-primary" />
            <p className="text-2xl font-semibold">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.name}</p>
          </div>
        ))}
      </div>
      {message ? <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
