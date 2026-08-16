import { createFileRoute, Link } from "@tanstack/react-router";
import { Plane, Ship, Truck, Train, Warehouse, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — NEXORA Logistics" },
      {
        name: "description",
        content:
          "Air, sea, road and rail freight, bonded warehousing and customs brokerage from NEXORA Logistics.",
      },
      { property: "og:title", content: "Services — NEXORA Logistics" },
      {
        property: "og:description",
        content: "Freight, warehousing and customs brokerage under one operator.",
      },
    ],
  }),
  component: Services,
});

const SERVICES = [
  {
    icon: Plane,
    name: "Air freight",
    body: "Priority and consolidated air uplift with charter access on constrained lanes. Temperature-controlled and DG-certified handling.",
  },
  {
    icon: Ship,
    name: "Sea freight",
    body: "FCL, LCL and breakbulk with weekly consolidations from 40 ports. Port-to-door with inland haulage included.",
  },
  {
    icon: Truck,
    name: "Road freight",
    body: "FTL and groupage across cross-border corridors, with telematics feeding the same tracking timeline as every other mode.",
  },
  {
    icon: Train,
    name: "Rail freight",
    body: "Block-train slots on the Eurasia land bridge — sea economics at close to air transit times.",
  },
  {
    icon: Warehouse,
    name: "Warehousing",
    body: "Bonded and general storage, pick-and-pack, cross-docking and returns processing at hub facilities.",
  },
  {
    icon: FileCheck,
    name: "Customs brokerage",
    body: "In-house clearance, tariff classification, duty deferment and compliance audits in every operating market.",
  },
];

function Services() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">Capabilities</p>
          <h1 className="mt-4 max-w-2xl text-4xl uppercase leading-[0.95] sm:text-5xl">
            Everything between the dock and the door
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-px bg-border md:grid-cols-3">
          {SERVICES.map((s) => (
            <article key={s.name} className="bg-background p-8">
              <s.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
              <h2 className="mt-5 text-lg uppercase">{s.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 border border-border p-8 sm:p-10">
          <div className="h-1.5 w-20 hatch" aria-hidden />
          <h2 className="mt-5 text-2xl uppercase">Build a lane with us</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Tell us the origin, destination and cargo profile. We map the mode mix, clearance path
            and cost before you commit.
          </p>
          <Button asChild className="mt-6 rounded-none">
            <Link to="/quote">Request a quote</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
