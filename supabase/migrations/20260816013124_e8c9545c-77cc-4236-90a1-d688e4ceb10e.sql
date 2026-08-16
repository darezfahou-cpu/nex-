ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS current_location text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS description text;

-- Any authenticated account acts as admin in this project
DROP POLICY IF EXISTS "own or staff shipments read" ON public.shipments;
DROP POLICY IF EXISTS "own shipments insert" ON public.shipments;
DROP POLICY IF EXISTS "staff manage shipments update" ON public.shipments;
DROP POLICY IF EXISTS "staff manage shipments delete" ON public.shipments;
CREATE POLICY "authenticated read shipments" ON public.shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert shipments" ON public.shipments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update shipments" ON public.shipments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated delete shipments" ON public.shipments FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "own or staff events read" ON public.shipment_events;
DROP POLICY IF EXISTS "staff events insert" ON public.shipment_events;
DROP POLICY IF EXISTS "staff events update" ON public.shipment_events;
DROP POLICY IF EXISTS "staff events delete" ON public.shipment_events;
CREATE POLICY "authenticated read events" ON public.shipment_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert events" ON public.shipment_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update events" ON public.shipment_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated delete events" ON public.shipment_events FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Newest tracking event drives shipment status + current location
CREATE OR REPLACE FUNCTION public.sync_shipment_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shipments s
     SET status = NEW.status,
         current_location = COALESCE(NEW.location, s.current_location),
         updated_at = now()
   WHERE s.id = NEW.shipment_id
     AND NEW.occurred_at >= COALESCE((
       SELECT max(e.occurred_at) FROM public.shipment_events e
        WHERE e.shipment_id = NEW.shipment_id AND e.id <> NEW.id
     ), NEW.occurred_at);
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.sync_shipment_from_event() FROM PUBLIC;

DROP TRIGGER IF EXISTS shipment_events_sync ON public.shipment_events;
CREATE TRIGGER shipment_events_sync
AFTER INSERT ON public.shipment_events
FOR EACH ROW EXECUTE FUNCTION public.sync_shipment_from_event();