-- 1. Move role-check helpers out of the API-exposed schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','dispatcher')) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;

-- 2. Rebuild policies to use private helpers and drop open public reads
DROP POLICY IF EXISTS "public tracking lookup" ON public.shipments;
DROP POLICY IF EXISTS "staff manage shipments update" ON public.shipments;
DROP POLICY IF EXISTS "staff manage shipments delete" ON public.shipments;

CREATE POLICY "own or staff shipments read" ON public.shipments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.is_staff(auth.uid()));
CREATE POLICY "staff manage shipments update" ON public.shipments
  FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "staff manage shipments delete" ON public.shipments
  FOR DELETE TO authenticated
  USING (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "public events read" ON public.shipment_events;
DROP POLICY IF EXISTS "staff events insert" ON public.shipment_events;
DROP POLICY IF EXISTS "staff events update" ON public.shipment_events;
DROP POLICY IF EXISTS "staff events delete" ON public.shipment_events;

CREATE POLICY "own or staff events read" ON public.shipment_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shipments s
    WHERE s.id = shipment_events.shipment_id
      AND (s.user_id = auth.uid() OR private.is_staff(auth.uid()))
  ));
CREATE POLICY "staff events insert" ON public.shipment_events
  FOR INSERT TO authenticated WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "staff events update" ON public.shipment_events
  FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "staff events delete" ON public.shipment_events
  FOR DELETE TO authenticated USING (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff read quotes" ON public.quote_requests;
DROP POLICY IF EXISTS "staff update quotes" ON public.quote_requests;
CREATE POLICY "staff read quotes" ON public.quote_requests
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "staff update quotes" ON public.quote_requests
  FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- anon can no longer read these tables at all
REVOKE SELECT ON public.shipments FROM anon;
REVOKE SELECT ON public.shipment_events FROM anon;

-- 3. Drop the old public-schema helpers
DROP FUNCTION IF EXISTS public.is_staff(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 4. Single-shipment lookup by exact tracking number (public tracking page)
CREATE OR REPLACE FUNCTION public.track_shipment(_tracking_number text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE s public.shipments; result jsonb;
BEGIN
  IF _tracking_number IS NULL OR length(btrim(_tracking_number)) < 6 THEN
    RETURN NULL;
  END IF;
  SELECT * INTO s FROM public.shipments
   WHERE tracking_number = upper(btrim(_tracking_number)) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'shipment', jsonb_build_object(
      'id', s.id,
      'tracking_number', s.tracking_number,
      'origin', s.origin,
      'destination', s.destination,
      'service_level', s.service_level,
      'cargo_type', s.cargo_type,
      'weight_kg', s.weight_kg,
      'pieces', s.pieces,
      'recipient_name', s.recipient_name,
      'status', s.status,
      'estimated_delivery', s.estimated_delivery,
      'created_at', s.created_at,
      'updated_at', s.updated_at
    ),
    'events', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', e.id, 'status', e.status, 'location', e.location,
        'note', e.note, 'occurred_at', e.occurred_at
      ) ORDER BY e.occurred_at DESC)
      FROM public.shipment_events e WHERE e.shipment_id = s.id
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.track_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_shipment(text) TO anon, authenticated, service_role;