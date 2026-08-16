import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, PortalHeading, EmptyState, ProgressBar } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, statusProgress, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/dashboard/shipments")({ component: Shipments });

function Shipments() {
  const query = useQuery({
    queryKey: ["customer-shipments"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not authenticated");
      const { data, error } = await supabase.from("shipments").select("*").eq("user_id", userData.user.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return { data: data ?? [], email: userData.user.email };
    },
  });
  return (
    <PortalShell kind="Customer portal" email={query.data?.email} nav={[{ to: "/dashboard", label: "Overview", icon: Package, exact: true }, { to: "/dashboard/shipments", label: "My shipments", icon: Package }, { to: "/admin", label: "Admin console", icon: Package }]}>
      <PortalHeading title="My shipments" subtitle="Only shipments assigned to your account are shown here." />
      <div className="mt-6 space-y-3">
        {query.isLoading && <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading…</p>}
        {!query.isLoading && (query.data?.data.length ?? 0) === 0 && <EmptyState title="No shipments" description="There are no shipments assigned to your account yet." />}
        {query.data?.data.map((s) => (
          <Link key={s.id} to="/dashboard/shipments/$id" params={{ id: s.id }} className="panel block p-5 hover:border-primary/50">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-sm tracking-widest text-primary">{s.tracking_number}</p><p className="mt-2 text-sm">{s.origin} → {s.destination}</p></div><StatusBadge status={s.status as ShipmentStatus} /></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3"><div><p className="eyebrow">Service</p><p className="mt-1 text-sm">{s.service_level.replaceAll("_", " ")}</p></div><div><p className="eyebrow">ETA</p><p className="mt-1 text-sm">{formatDate(s.estimated_delivery)}</p></div><div><p className="eyebrow">Current</p><p className="mt-1 text-sm">{s.current_location ?? "Pending"}</p></div></div>
            <div className="mt-5"><ProgressBar value={statusProgress(s.status as ShipmentStatus)} /></div>
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">View shipment <ArrowRight className="h-3 w-3" /></div>
          </Link>
        ))}
      </div>
    </PortalShell>
  );
}
