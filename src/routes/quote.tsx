import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Request a freight quote — NEXORA Logistics" },
      {
        name: "description",
        content:
          "Send your origin, destination and cargo details to the NEXORA pricing desk and get a rate within one business day.",
      },
      { property: "og:title", content: "Request a freight quote — NEXORA Logistics" },
      { property: "og:description", content: "Get a lane rate from the NEXORA pricing desk." },
    ],
  }),
  component: Quote,
});

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  company: "",
  origin: "",
  destination: "",
  cargo_type: "",
  weight_kg: "",
  notes: "",
};

function Quote() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quote_requests").insert({
        ...form,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSent(true);
      setForm(EMPTY);
      toast.success("Quote request received — our desk will reply shortly.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <p className="eyebrow">Pricing desk</p>
      <h1 className="mt-4 text-4xl uppercase sm:text-5xl">Request a quote</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">
        Give us the corridor and cargo profile. We reply with mode options, transit time and an
        all-in rate.
      </p>

      {sent && (
        <div className="mt-8 border border-success/40 bg-success/10 p-5 font-mono text-xs uppercase tracking-[0.16em] text-success">
          Request logged — expect a reply within one business day.
        </div>
      )}

      <form
        className="mt-10 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="name" label="Full name" required value={form.name} onChange={set("name")} />
          <FormField id="email" label="Email" type="email" required value={form.email} onChange={set("email")} />
          <FormField id="phone" label="Phone" value={form.phone} onChange={set("phone")} />
          <FormField id="company" label="Company" value={form.company} onChange={set("company")} />
          <FormField id="origin" label="Origin" required value={form.origin} onChange={set("origin")} />
          <FormField id="destination" label="Destination" required value={form.destination} onChange={set("destination")} />
          <FormField id="cargo_type" label="Cargo type" value={form.cargo_type} onChange={set("cargo_type")} />
          <FormField id="weight_kg" label="Weight (kg)" type="number" value={form.weight_kg} onChange={set("weight_kg")} />
        </div>

        <div>
          <Label htmlFor="notes" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Notes
          </Label>
          <Textarea
            id="notes"
            rows={4}
            value={form.notes}
            onChange={set("notes")}
            className="mt-2 rounded-none"
            placeholder="Dimensions, incoterms, deadlines, special handling…"
          />
        </div>

        <Button type="submit" size="lg" className="rounded-none" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending…" : "Send request"}
        </Button>
      </form>
    </section>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="mt-2 rounded-none"
      />
    </div>
  );
}
