export type ShipmentStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "customs"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export const STATUS_ORDER: ShipmentStatus[] = [
  "pending",
  "picked_up",
  "in_transit",
  "customs",
  "out_for_delivery",
  "delivered",
];

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  pending: "Booked",
  picked_up: "Picked up",
  in_transit: "In transit",
  customs: "Customs clearance",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Exception",
};

export const SERVICE_LEVELS = [
  { value: "air_freight", label: "Air freight" },
  { value: "sea_freight", label: "Sea freight" },
  { value: "road_freight", label: "Road freight" },
  { value: "rail_freight", label: "Rail freight" },
  { value: "standard", label: "Standard parcel" },
] as const;

export function serviceLabel(value: string) {
  return SERVICE_LEVELS.find((s) => s.value === value)?.label ?? value;
}

export function statusTone(status: ShipmentStatus) {
  if (status === "delivered") return "text-success border-success/40 bg-success/10";
  if (status === "exception") return "text-destructive border-destructive/40 bg-destructive/10";
  return "text-primary border-primary/40 bg-primary/10";
}

export function newTrackingNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const s = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NX-${n}-${s}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusProgress(status: ShipmentStatus) {
  if (status === "exception") return 100;
  const idx = STATUS_ORDER.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STATUS_ORDER.length) * 100);
}
