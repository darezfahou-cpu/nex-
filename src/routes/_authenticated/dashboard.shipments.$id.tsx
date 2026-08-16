import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, PortalHeading, ProgressBar } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { formatDate, serviceLabel, statusProgress, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/dashboard/shipments/$id")({ component: ShipmentDetail });

function ShipmentDetail() {
  const { id } = Route.useParams();
  const query = useQuery({
    queryKey: ["customer-shipment", id],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { data: shipment, error } = await supabase.from("shipments").select("*").eq("id", id).eq("user_id", userData.user.id).maybeSingle();
      if (error) throw error;
      if (!shipment) return null;
      const { data: events, error: eventError } = await supabase.from("shipment_events").select("*").eq("shipment_id", id).order("occurred_at", { ascending: false });
      if (eventError) throw eventError;
      return { shipment, events: events ?? [], email: userData.user.email };
    },
  });
  const shipment = query.data?.shipment;
  return <PortalShell kind="Customer portal" email={query.data?.email} nav={[{ to: "/dashboard", label: "Overview", icon: Package, exact: true }, { to: "/dashboard/shipments", label: "My shipments", icon: Package }, { to: "/admin", label: "Admin console", icon: Package }]}>
    <Link to="/dashboard/shipments" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"><ArrowLeft className="h-3 w-3" /> Back to shipments</Link>
    {query.isLoading && <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Loading shipment…</p>}
    {!query.isLoading && !shipment && <div className="mt-8 border border-destructive/40 bg-destructive/10 p-6 text-sm">Shipment not found in your account.</div>}
    {shipment && <>
      <div className="mt-5"><PortalHeading title={shipment.tracking_number} subtitle={`${shipment.origin} → ${shipment.destination}`} action={<StatusBadge status={shipment.status as ShipmentStatus} />} /></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Origin" value={shipment.origin} /><Info label="Destination" value={shipment.destination} /><Info label="Current location" value={shipment.current_location ?? "Pending"} icon /><Info label="Estimated delivery" value={formatDate(shipment.estimated_delivery)} /></div>
      <div className="panel mt-6 p-6"><div className="flex justify-between gap-4"><div><p className="eyebrow">Progress</p><p className="mt-2 text-lg uppercase">{shipment.status.replaceAll("_", " ")}</p></div><p className="font-mono text-sm text-primary">{statusProgress(shipment.status as ShipmentStatus)}%</p></div><div className="mt-4"><ProgressBar value={statusProgress(shipment.status as ShipmentStatus)} /></div></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_.7fr]"><div><p className="eyebrow">Tracking history</p><h2 className="mt-2 text-2xl uppercase">Movement timeline</h2><div className="mt-6"><TrackingTimeline events={(query.data?.events ?? []).map((e) => ({ id: e.id, status: e.status as ShipmentStatus, location: e.location, note: e.note, occurred_at: e.occurred_at }))} /></div></div><div className="panel p-6"><p className="eyebrow">Cargo</p><div className="mt-5 space-y-4"><Info label="Service" value={serviceLabel(shipment.service_level)} /><Info label="Cargo" value={shipment.cargo_type ?? "—"} /><Info label="Pieces" value={String(shipment.pieces)} /><Info label="Weight" value={`${shipment.weight_kg ?? "—"} kg`} /><Info label="Recipient" value={shipment.recipient_name ?? "—"} /></div></div></div>
    </>}
  </PortalShell>;
}
function Info({ label, value, icon }: { label: string; value: string; icon?: boolean }) { return <div className="panel p-5"><p className="eyebrow">{label}</p><p className="mt-2 flex items-center gap-1 text-sm">{icon && <MapPin className="h-3.5 w-3.5 text-primary" />}{value}</p></div>; }
