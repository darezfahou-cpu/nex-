import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowRight, MapPin, Clock3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, PortalHeading, StatCard, EmptyState, ProgressBar } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDateTime, statusProgress, STATUS_LABEL, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const query = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Not authenticated");
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return { shipments: data ?? [], email: userData.user.email };
    },
  });

  const shipments = query.data?.shipments ?? [];
  const active = shipments.filter((s) => !["delivered", "exception"].includes(s.status)).length;
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const exceptions = shipments.filter((s) => s.status === "exception").length;

  return (
    <PortalShell
      kind="Customer portal"
      email={query.data?.email}
      nav={[
        { to: "/dashboard", label: "Overview", icon: Package, exact: true },
        { to: "/dashboard/shipments", label: "My shipments", icon: Package },
        { to: "/admin", label: "Admin console", icon: Clock3 },
      ]}
    >
      <PortalHeading title="Shipment control" subtitle="Monitor your active freight and delivery milestones." />

      <div className="mt-6 grid gap-px bg-border sm:grid-cols-3">
        <StatCard label="Total shipments" value={shipments.length} />
        <StatCard label="Active" value={active} hint="Currently moving" />
        <StatCard label="Delivered" value={delivered} hint={exceptions ? `${exceptions} exception${exceptions > 1 ? "s" : ""}` : "No exceptions"} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <p className="eyebrow">Latest movement</p>
          <h2 className="mt-2 text-2xl uppercase">Your shipments</h2>
        </div>
        <Link to="/dashboard/shipments" className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">View all</Link>
      </div>

      {query.isLoading ? (
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading shipments…</p>
      ) : shipments.length === 0 ? (
        <div className="mt-6"><EmptyState title="No shipments yet" description="Your assigned shipments will appear here once they are created." /></div>
      ) : (
        <div className="mt-6 grid gap-3">
          {shipments.slice(0, 5).map((shipment) => (
            <Link key={shipment.id} to="/dashboard/shipments/$id" params={{ id: shipment.id }} className="panel block p-5 transition-colors hover:border-primary/50">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm tracking-widest text-primary">{shipment.tracking_number}</p>
                  <p className="mt-2 text-sm">{shipment.origin} <span className="text-muted-foreground">→</span> {shipment.destination}</p>
                </div>
                <StatusBadge status={shipment.status as ShipmentStatus} />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div><p className="eyebrow">Current location</p><p className="mt-1 flex items-center gap-1 text-sm"><MapPin className="h-3.5 w-3.5 text-primary" />{shipment.current_location ?? "Pending"}</p></div>
                <div><p className="eyebrow">ETA</p><p className="mt-1 text-sm">{formatDate(shipment.estimated_delivery)}</p></div>
                <div><p className="eyebrow">Updated</p><p className="mt-1 text-sm">{formatDateTime(shipment.updated_at)}</p></div>
              </div>
              <div className="mt-5"><ProgressBar value={statusProgress(shipment.status as ShipmentStatus)} /></div>
              <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Open tracking <ArrowRight className="h-3 w-3" /></div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
