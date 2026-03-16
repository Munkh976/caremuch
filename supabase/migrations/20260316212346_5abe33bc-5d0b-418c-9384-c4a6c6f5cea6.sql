-- Create client_registrations staging table
CREATE TABLE public.client_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  agency_id uuid REFERENCES public.agency(id),
  status text DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can create (self-registration)
CREATE POLICY "Anyone can create client registration"
  ON public.client_registrations FOR INSERT
  WITH CHECK (true);

-- Staff can view registrations in their agency
CREATE POLICY "Staff can view client registrations"
  ON public.client_registrations FOR SELECT
  USING (
    (agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()))
    OR (agency_id IS NULL AND auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'system_admin'::app_role) OR
      has_role(auth.uid(), 'agency_admin'::app_role) OR
      has_role(auth.uid(), 'manager'::app_role) OR
      has_role(auth.uid(), 'scheduler'::app_role) OR
      has_role(auth.uid(), 'hr_staff'::app_role)
    ))
  );

-- Staff can update registrations
CREATE POLICY "Staff can update client registrations"
  ON public.client_registrations FOR UPDATE
  USING (
    (agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
    OR (agency_id IS NULL AND auth.uid() IS NOT NULL))
    AND (
      has_role(auth.uid(), 'system_admin'::app_role) OR
      has_role(auth.uid(), 'agency_admin'::app_role) OR
      has_role(auth.uid(), 'manager'::app_role) OR
      has_role(auth.uid(), 'scheduler'::app_role) OR
      has_role(auth.uid(), 'hr_staff'::app_role)
    )
  );

-- Fix caregiver_registrations RLS: drop old broken policies and recreate
DROP POLICY IF EXISTS "Managers can view caregiver registrations" ON public.caregiver_registrations;
DROP POLICY IF EXISTS "Managers can update caregiver registrations" ON public.caregiver_registrations;

CREATE POLICY "Staff can view caregiver registrations"
  ON public.caregiver_registrations FOR SELECT
  USING (
    (agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()))
    OR (agency_id IS NULL AND auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'system_admin'::app_role) OR
      has_role(auth.uid(), 'agency_admin'::app_role) OR
      has_role(auth.uid(), 'manager'::app_role) OR
      has_role(auth.uid(), 'scheduler'::app_role) OR
      has_role(auth.uid(), 'hr_staff'::app_role)
    ))
  );

CREATE POLICY "Staff can update caregiver registrations"
  ON public.caregiver_registrations FOR UPDATE
  USING (
    (agency_id IN (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
    OR (agency_id IS NULL AND auth.uid() IS NOT NULL))
    AND (
      has_role(auth.uid(), 'system_admin'::app_role) OR
      has_role(auth.uid(), 'agency_admin'::app_role) OR
      has_role(auth.uid(), 'manager'::app_role) OR
      has_role(auth.uid(), 'scheduler'::app_role) OR
      has_role(auth.uid(), 'hr_staff'::app_role)
    )
  );