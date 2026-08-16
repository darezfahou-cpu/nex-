import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Boxes, ClipboardList, Package, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, PortalHeading, StatCard } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminDashboard });

const nav = [{ to: "/admin", label: "Overview", icon: Activity, exact: true }, { to: "/admin/shipments", label: "Shipments", icon: Package }, { to: "/admin/customers", label: "Customers", icon: Users }, { to: "/admin/tracking", label: "Tracking", icon: ClipboardList }, { to: "/dashboard", label: "Customer portal", icon: Boxes }];

function AdminDashboard() {
  const query = useQuery({ queryKey: ["admin-overview"], queryFn: async () => { const [{ data: shipments, error: se }, { data: profiles, error: pe }, { data: events, error: ee }, { data: userData }] = await Promise.all([supabase.from("shipments").select("*").order("updated_at", { ascending: false }), supabase.from("profiles").select("id,full_name,email: id"), supabase.from("shipment_events").select("*").order("occurred_at", { ascending: false }).limit(8), supabase.auth.getUser()]); if (se) throw se; if (pe) throw pe; if (ee) throw ee; return { shipments: shipments ?? [], profiles: profiles ?? [], events: events ?? [], email: userData.user?.email }; } });
  const shipments = query.data?.shipments ?? [];
  return <PortalShell kind="Admin console" email={query.data?.email} nav={nav}>
    <PortalHeading title="Control tower" subtitle="Manage every shipment, customer and tracking event from one console." />
    <div className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Total shipments" value={shipments.length} /><StatCard label="In transit" value={shipments.filter(s => s.status === "in_transit").length} /><StatCard label="Delivered" value={shipments.filter(s => s.status === "delivered").length} /><StatCard label="Exceptions" value={shipments.filter(s => s.status === "exception").length} /></div>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_.6fr]"><div><div className="flex items-end justify-between"><div><p className="eyebrow">Operations</p><h2 className="mt-2 text-2xl uppercase">Latest shipments</h2></div><Link to="/admin/shipments" className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Manage all</Link></div><div className="mt-5 space-y-2">{shipments.slice(0, 8).map(s => <Link key={s.id} to="/admin/shipments/$id" params={{ id: s.id }} className="panel flex flex-wrap items-center justify-between gap-4 p-4 hover:border-primary/50"><div><p className="font-mono text-sm tracking-widest text-primary">{s.tracking_number}</p><p className="mt-1 text-sm">{s.origin} → {s.destination}</p></div><div className="flex items-center gap-4"><p className="hidden text-xs text-muted-foreground sm:block">{formatDateTime(s.updated_at)}</p><StatusBadge status={s.status as ShipmentStatus} /></div></Link>)}</div></div><div className="panel p-6"><p className="eyebrow">Quick actions</p><div className="mt-5 grid gap-2"><Link to="/admin/shipments" className="border border-border p-4 text-sm uppercase hover:border-primary">Create / manage shipment</Link><Link to="/admin/tracking" className="border border-border p-4 text-sm uppercase hover:border-primary">Post tracking update</Link><Link to="/admin/customers" className="border border-border p-4 text-sm uppercase hover:border-primary">View customers</Link></div></div></div>
  </PortalShell>;
}
