import { STATUS_LABEL, formatDateTime, type ShipmentStatus } from "@/lib/nexora";

export type TimelineEvent = {
  id: string;
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  occurred_at: string;
};

export function TrackingTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        No tracking updates yet
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border pl-6">
      {events.map((event, index) => (
        <li key={event.id} className="relative pb-8 last:pb-0">
          <span
            className={`absolute -left-[31px] mt-1 h-2.5 w-2.5 ${
              index === 0 ? "bg-primary" : "bg-muted-foreground/50"
            }`}
            aria-hidden
          />
          <p
            className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
              index === 0 ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {STATUS_LABEL[event.status]}
          </p>
          <p className="mt-1 text-sm">{event.location ?? "Location pending"}</p>
          {event.note && <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {formatDateTime(event.occurred_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
