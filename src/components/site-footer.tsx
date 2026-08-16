import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 bg-primary" aria-hidden />
            <span className="font-display text-base font-extrabold uppercase">Nexora Logistics</span>
          </div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Freight forwarding, customs and last-mile delivery across 40 corridors.
          </p>
        </div>
        <div className="flex gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/services" className="hover:text-foreground">Services</Link>
          <Link to="/track" className="hover:text-foreground">Track</Link>
          <Link to="/quote" className="hover:text-foreground">Quote</Link>
        </div>
      </div>
      <div className="border-t border-border px-5 py-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        © {new Date().getFullYear()} Nexora Logistics
      </div>
    </footer>
  );
}
