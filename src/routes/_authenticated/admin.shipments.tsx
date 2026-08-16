import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, PortalHeading, EmptyState } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, type ShipmentStatus } from "@/lib/nexora";

export const Route = createFileRoute("/_authenticated/admin/shipments")({ component: AdminShipments });
const nav = [{ to: "/admin", label: "Overview", icon: Package, exact: true }, { to: "/admin/shipments", label: "Shipments", icon: Package }, { to: "/admin/customers", label: "Customers", icon: Package }, { to: "/admin/tracking", label: "Tracking", icon: Package }, { to: "/dashboard", label: "Customer portal", icon: Package }];

function AdminShipments() {
  const qc = useQueryClient(); const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin-shipments"], queryFn: async () => { const { data, error } = await supabase.from("shipments").select("*").order("updated_at", { ascending: false }); if (error) throw error; const { data: userData } = await supabase.auth.getUser(); return { shipments: data ?? [], email: userData.user?.email }; } });
  const rows = useMemo(() => (query.data?.shipments ?? []).filter(s => [s.tracking_number, s.origin, s.destination, s.recipient_name ?? ""].join(" ").toLowerCase().includes(search.toLowerCase())), [query.data?.shipments, search]);
  async function remove(id: string) { if (!confirm("Delete this shipment and its tracking history?")) return; const { error } = await supabase.from("shipments").delete().eq("id", id); if (error) toast.error(error.message); else { toast.success("Shipment deleted"); qc.invalidateQueries({ queryKey: ["admin-shipments"] }); } }
  return <PortalShell kind="Admin console" email={query.data?.email} nav={nav}><PortalHeading title="Shipments" subtitle="Create, inspect, edit and remove shipments." action={<Button asChild className="rounded-none"><Link to="/admin/shipments/new"><Plus className="h-4 w-4" /> New shipment</Link></Button>} />
    <div className="mt-6 flex items-center gap-2 border border-border px-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking, route or recipient" className="border-0 bg-transparent focus-visible:ring-0" /></div>
    <div className="mt-5 overflow-x-auto border border-border"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-border bg-card"><tr>{["Tracking","Route","Customer","Status","ETA","Actions"].map(h => <th key={h} className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map(s => <tr key={s.id} className="border-b border-border last:border-0"><td className="px-4 py-4"><Link to="/admin/shipments/$id" params={{ id: s.id }} className="font-mono text-sm text-primary">{s.tracking_number}</Link></td><td className="px-4 py-4 text-sm">{s.origin} → {s.destination}</td><td className="px-4 py-4 text-sm">{s.recipient_name ?? "—"}</td><td className="px-4 py-4"><StatusBadge status={s.status as ShipmentStatus} /></td><td className="px-4 py-4 text-sm">{formatDate(s.estimated_delivery)}</td><td className="px-4 py-4"><Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>)}</tbody></table>{!query.isLoading && rows.length === 0 && <EmptyState title="No matches" description="Try a different search term." />}</div>
  </PortalShell>;
}
