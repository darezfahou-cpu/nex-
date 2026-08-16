CREATE TYPE public.app_role AS ENUM ('admin','dispatcher','customer');
CREATE TYPE public.shipment_status AS ENUM ('pending','picked_up','in_transit','customs','out_for_delivery','delivered','exception');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  company text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','dispatcher'))
$$;

CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  service_level text NOT NULL DEFAULT 'standard',
  cargo_type text,
  weight_kg numeric,
  pieces integer NOT NULL DEFAULT 1,
  recipient_name text,
  recipient_phone text,
  status public.shipment_status NOT NULL DEFAULT 'pending',
  estimated_delivery date,
  price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public tracking lookup" ON public.shipments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "own shipments insert" ON public.shipments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff manage shipments update" ON public.shipments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff manage shipments delete" ON public.shipments FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status public.shipment_status NOT NULL,
  location text,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipment_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_events TO service_role;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public events read" ON public.shipment_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff events insert" ON public.shipment_events FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff events update" ON public.shipment_events FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff events delete" ON public.shipment_events FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  origin text NOT NULL,
  destination text NOT NULL,
  cargo_type text,
  weight_kg numeric,
  notes text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can request a quote" ON public.quote_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff read quotes" ON public.quote_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff update quotes" ON public.quote_requests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER shipments_touch BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'company')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.shipments (tracking_number, origin, destination, service_level, cargo_type, weight_kg, pieces, recipient_name, status, estimated_delivery, price) VALUES
('NX-4820-DEMO','Rotterdam, NL','Lagos, NG','sea_freight','Machinery parts',1840,12,'Adeyemi Okon','in_transit','2026-09-02',7420),
('NX-1156-DEMO','Shenzhen, CN','Hamburg, DE','air_freight','Electronics',420,6,'Lena Vogt','out_for_delivery','2026-08-17',3180),
('NX-7733-DEMO','Chicago, US','Toronto, CA','road_freight','Palletised goods',960,4,'Marc Dubois','delivered','2026-08-11',1290);

INSERT INTO public.shipment_events (shipment_id, status, location, note, occurred_at)
SELECT s.id, 'pending', s.origin, 'Booking confirmed', now() - interval '9 days' FROM public.shipments s WHERE s.tracking_number LIKE 'NX-%DEMO';
INSERT INTO public.shipment_events (shipment_id, status, location, note, occurred_at)
SELECT s.id, 'picked_up', s.origin, 'Cargo collected at origin hub', now() - interval '7 days' FROM public.shipments s WHERE s.tracking_number LIKE 'NX-%DEMO';
INSERT INTO public.shipment_events (shipment_id, status, location, note, occurred_at)
SELECT s.id, 'in_transit', 'Transit hub', 'Departed origin gateway', now() - interval '4 days' FROM public.shipments s WHERE s.tracking_number LIKE 'NX-%DEMO';
INSERT INTO public.shipment_events (shipment_id, status, location, note, occurred_at)
SELECT s.id, s.status, s.destination, 'Latest status update', now() - interval '1 day' FROM public.shipments s WHERE s.tracking_number LIKE 'NX-%DEMO' AND s.status <> 'in_transit';