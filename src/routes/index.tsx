import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plane, Ship, Truck, Train, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-terminal.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXORA Logistics — Freight moved with industrial precision" },
      {
        name: "description",
        content:
          "NEXORA Logistics moves air, sea, road and rail freight across 40 corridors. Track shipments live and request a quote in minutes.",
      },
      { property: "og:title", content: "NEXORA Logistics — Freight moved with industrial precision" },
      {
        property: "og:description",
        content: "Air, sea, road and rail freight with live tracking and customs clearance.",
      },
    ],
  }),
  component: Home,
});

const MODES = [
  { icon: Plane, name: "Air freight", detail: "24–72h door to door on priority lanes." },
  { icon: Ship, name: "Sea freight", detail: "FCL and LCL consolidation from 40 ports." },
  { icon: Truck, name: "Road freight", detail: "Cross-border trucking with live telemetry." },
  { icon: Train, name: "Rail freight", detail: "Block trains on the Eurasia land bridge." },
];

const METRICS = [
  { value: "40", label: "Trade corridors" },
  { value: "18k", label: "Loads per year" },
  { value: "99.2%", label: "On-time arrival" },
  { value: "24/7", label: "Control tower" },
];

function Home() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt="Container terminal at dusk with a gantry crane under amber floodlights"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-floor)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-24 sm:pt-32">
          <p className="eyebrow">Freight forwarding · Est. 2019</p>
          <h1 className="mt-4 max-w-3xl text-4xl uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
            Heavy cargo,
            <br />
            moved with
            <span className="text-primary"> precision</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            NEXORA runs air, sea, road and rail freight through one control tower — customs
            clearance, warehousing and last-mile included.
          </p>

          <form
            className="mt-10 max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim())
                navigate({ to: "/track", search: { code: code.trim().toUpperCase() } });
            }}
          >
            <label
              htmlFor="hero-track"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              Track a shipment
            </label>
            <div className="mt-2 flex gap-0 border border-border bg-background/80">
              <Input
                id="hero-track"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="NX-4820-DEMO"
                className="h-12 border-0 bg-transparent font-mono uppercase tracking-widest focus-visible:ring-0"
              />
              <Button type="submit" className="h-12 rounded-none px-6">
                Track
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="border-b border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border px-0 sm:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-background px-5 py-8">
              <div className="font-display text-3xl font-extrabold text-primary sm:text-4xl">
                {m.value}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="h-1.5 w-24 hatch" aria-hidden />
        <h2 className="mt-6 text-3xl uppercase sm:text-4xl">Four modes, one operator</h2>
        <div className="mt-10 grid gap-px bg-border sm:grid-cols-2">
          {MODES.map((mode) => (
            <div key={mode.name} className="group bg-background p-8">
              <mode.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
              <h3 className="mt-5 text-xl uppercase">{mode.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{mode.detail}</p>
            </div>
          ))}
        </div>
        <Link
          to="/services"
          className="mt-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary"
        >
          All services <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl uppercase sm:text-3xl">Need a rate on a lane?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send the corridor and cargo details — our desk replies within one business day.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-none">
            <Link to="/quote">Request a quote</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
