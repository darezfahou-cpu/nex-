import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import {
  STATUS_LABEL,
  formatDate,
  formatDateTime,
  serviceLabel,
  type ShipmentStatus,
} from "@/lib/nexora";

const searchSchema = z.object({ code: z.string().optional() });

type TrackEvent = {
  id: string;
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  occurred_at: string;
};

type TrackResult = {
  shipment: {
    id: string;
    tracking_number: string;
    origin: string;
    destination: string;
    service_level: string;
    cargo_type: string | null;
    weight_kg: number | null;
    pieces: number;
    recipient_name: string | null;
    status: ShipmentStatus;
    estimated_delivery: string | null;
  };
  events: TrackEvent[];
};

export const Route = createFileRoute("/track")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Track a shipment — NEXORA Logistics" },
      {
        name: "description",
        content: "Enter your NEXORA tracking number to see live status, location and delivery ETA.",
      },
      { property: "og:title", content: "Track a shipment — NEXORA Logistics" },
      { property: "og:description", content: "Live shipment status and delivery timeline." },
    ],
  }),
  component: Track,
});

function Track() {
  const { code } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? "");

  const query = useQuery({
    queryKey: ["track", code],
    enabled: Boolean(code),
    queryFn: async (): Promise<TrackResult | null> => {
      const { data, error } = await supabase.rpc("track_shipment", {
        _tracking_number: code!,
      });
      if (error) throw error;
      return (data as TrackResult | null) ?? null;
    },
  });

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <p className="eyebrow">Control tower</p>
      <h1 className="mt-4 text-4xl uppercase sm:text-5xl">Track shipment</h1>

      <form
        className="mt-8 flex border border-border"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/track", search: { code: input.trim().toUpperCase() } });
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="NX-4820-DEMO"
          aria-label="Tracking number"
          className="h-12 border-0 bg-transparent font-mono uppercase tracking-widest focus-visible:ring-0"
        />
        <Button type="submit" className="h-12 rounded-none px-6">
          Track
        </Button>
      </form>

      {query.isLoading && (
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Querying network…
        </p>
      )}

      {code && !query.isLoading && !query.data && (
        <div className="mt-10 border border-destructive/40 bg-destructive/10 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-destructive">
            No shipment found for {code}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check the reference, or try the demo number NX-4820-DEMO.
          </p>
        </div>
      )}

      {query.data && (
        <div className="mt-10 space-y-8">
          <div className="panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-sm tracking-widest text-primary">
                {query.data.shipment.tracking_number}
              </span>
              <StatusBadge status={query.data.shipment.status as ShipmentStatus} />
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Field label="Origin" value={query.data.shipment.origin} />
              <Field label="Destination" value={query.data.shipment.destination} />
              <Field label="Service" value={serviceLabel(query.data.shipment.service_level)} />
              <Field label="Pieces / weight" value={`${query.data.shipment.pieces} pcs · ${query.data.shipment.weight_kg ?? "—"} kg`} />
              <Field label="Estimated delivery" value={formatDate(query.data.shipment.estimated_delivery)} />
              <Field label="Recipient" value={query.data.shipment.recipient_name ?? "—"} />
            </div>
          </div>

          <div>
            <h2 className="text-xl uppercase">Timeline</h2>
            <ol className="mt-5 border-l border-border pl-6">
              {query.data.events.map((event, i) => (
                <li key={event.id} className="relative pb-7 last:pb-0">
                  <span
                    className={`absolute -left-[31px] top-1 h-2.5 w-2.5 ${i === 0 ? "bg-primary" : "bg-steel"}`}
                    aria-hidden
                  />
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {formatDateTime(event.occurred_at)}
                  </p>
                  <p className="mt-1 font-display font-bold uppercase">
                    {STATUS_LABEL[event.status as ShipmentStatus]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[event.location, event.note].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
              {query.data.events.length === 0 && (
                <li className="text-sm text-muted-foreground">No scans recorded yet.</li>
              )}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
