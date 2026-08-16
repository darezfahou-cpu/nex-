import { STATUS_LABEL, statusTone, type ShipmentStatus } from "@/lib/nexora";

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${statusTone(status)}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
