CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'system_admin',
    'agency_admin',
    'manager',
    'scheduler',
    'hr_staff',
    'caregiver',
    'client'
);


--
-- Name: assignment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assignment_method AS ENUM (
    'manual',
    'ai_suggested',
    'auto_assigned',
    'traded',
    'picked_up'
);


--
-- Name: assignment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assignment_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'completed',
    'no_show',
    'cancelled'
);


--
-- Name: care_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.care_type AS ENUM (
    'personal_care',
    'companionship',
    'medication',
    'mobility',
    'dementia_care',
    'hospice'
);


--
-- Name: caregiver_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.caregiver_role AS ENUM (
    'full_time',
    'part_time',
    'on_call'
);


--
-- Name: request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'cancelled'
);


--
-- Name: request_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_type AS ENUM (
    'vacation',
    'medical',
    'personal',
    'emergency'
);


--
-- Name: shift_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.shift_status AS ENUM (
    'open',
    'assigned',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'unassigned'
);


--
-- Name: trade_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trade_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'cancelled',
    'expired'
);


--
-- Name: trade_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trade_type AS ENUM (
    'trade_board',
    'direct_trade',
    'agency_coverage'
);


--
-- Name: assign_caregiver_role(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_caregiver_role(caregiver_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT id INTO user_record FROM auth.users WHERE email = caregiver_email;
  
  IF user_record.id IS NOT NULL THEN
    -- Insert or update role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_record.id, 'caregiver'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;


--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  next_num INTEGER;
BEGIN
  next_num := nextval('order_number_seq');
  RETURN 'ORD-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;


--
-- Name: get_caregiver_with_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_caregiver_with_profile(caregiver_uuid uuid) RETURNS TABLE(id uuid, agency_id uuid, user_id uuid, full_name text, email text, phone text, role public.caregiver_role, hourly_rate numeric, performance_rating numeric, is_active boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    c.id,
    c.agency_id,
    c.user_id,
    COALESCE(p.full_name, c.first_name || ' ' || c.last_name) as full_name,
    COALESCE(p.email, c.email) as email,
    COALESCE(p.phone, c.phone) as phone,
    c.role,
    c.hourly_rate,
    c.performance_rating,
    c.is_active
  FROM caregivers c
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.id = caregiver_uuid;
$$;


--
-- Name: get_client_with_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_client_with_profile(client_uuid uuid) RETURNS TABLE(id uuid, agency_id uuid, user_id uuid, full_name text, email text, phone text, address text, city text, state text, medical_conditions text[], is_active boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    cl.id,
    cl.agency_id,
    cl.user_id,
    COALESCE(p.full_name, cl.first_name || ' ' || cl.last_name) as full_name,
    COALESCE(p.email, cl.email) as email,
    COALESCE(p.phone, cl.phone) as phone,
    cl.address,
    cl.city,
    cl.state,
    cl.medical_conditions,
    cl.is_active
  FROM clients cl
  LEFT JOIN profiles p ON cl.user_id = p.id
  WHERE cl.id = client_uuid;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'system_admin' THEN 1
    WHEN 'agency_admin' THEN 2
    WHEN 'manager' THEN 3
    WHEN 'scheduler' THEN 4
    WHEN 'hr_staff' THEN 5
    WHEN 'caregiver' THEN 6
  END
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, agency_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'agency_id')::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid  -- Default to system agency
    )
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_permission(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(_user_id uuid, _module_code text, _permission_type text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_code = ur.role
    WHERE ur.user_id = _user_id
      AND rp.module_code = _module_code
      AND (
        CASE _permission_type
          WHEN 'create' THEN rp.can_create
          WHEN 'read' THEN rp.can_read
          WHEN 'update' THEN rp.can_update
          WHEN 'delete' THEN rp.can_delete
          ELSE false
        END
      )
  )
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agency; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agency (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    naics_code text,
    agency_name text NOT NULL,
    business_type text,
    tax_id text,
    address text,
    city text,
    state text,
    zip_code text,
    phone text,
    email text,
    website text
);


--
-- Name: care_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    category text NOT NULL,
    name text NOT NULL,
    description text,
    keywords text,
    price numeric DEFAULT 35.00,
    duration_hours numeric DEFAULT 4.0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: caregiver_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caregiver_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caregiver_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT caregiver_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: caregiver_certifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caregiver_certifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caregiver_id uuid NOT NULL,
    certification_name text NOT NULL,
    certification_number text,
    issued_date date,
    expiry_date date NOT NULL,
    document_url text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: caregiver_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caregiver_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    address text,
    city text,
    state text,
    zip_code text,
    employment_type text DEFAULT 'full_time'::text,
    hourly_rate numeric,
    availability jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text,
    rejection_reason text,
    agency_id uuid,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: caregiver_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caregiver_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caregiver_id uuid NOT NULL,
    care_type_code text NOT NULL,
    years_experience integer DEFAULT 0,
    proficiency_level text DEFAULT 'intermediate'::text,
    is_certified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: caregivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caregivers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agency_id uuid NOT NULL,
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text,
    city text,
    state text,
    zip_code text,
    employment_type text DEFAULT 'full_time'::text,
    role public.caregiver_role DEFAULT 'full_time'::public.caregiver_role NOT NULL,
    hourly_rate numeric,
    availability jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    custom_min_hours integer,
    reliability_score integer DEFAULT 100,
    performance_rating numeric DEFAULT 5.0,
    hire_date date,
    service_radius_miles integer DEFAULT 10,
    emergency_contact_name text,
    emergency_contact_phone text,
    location_address text,
    location_city text,
    location_state text,
    location_zip_code text,
    service_zipcodes text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_care_needs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_care_needs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    care_type_code text NOT NULL,
    priority integer DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text DEFAULT public.generate_order_number() NOT NULL,
    client_id uuid NOT NULL,
    agency_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    frequency text DEFAULT 'once'::text NOT NULL,
    days_of_week text,
    status text DEFAULT 'active'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agency_id uuid NOT NULL,
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    date_of_birth date,
    emergency_contact_name text,
    emergency_contact_phone text,
    care_requirements text[] DEFAULT '{}'::text[],
    medical_conditions text[] DEFAULT '{}'::text[],
    notes text,
    preferred_caregiver_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    phone text,
    agency_id uuid NOT NULL,
    business_license text,
    subscription_tier text DEFAULT 'starter'::text,
    default_ft_min_hours integer DEFAULT 35,
    default_pt_min_hours integer DEFAULT 15,
    overtime_threshold integer DEFAULT 40,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_code public.app_role NOT NULL,
    module_code text NOT NULL,
    can_create boolean DEFAULT false,
    can_read boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: shift_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shift_id uuid NOT NULL,
    caregiver_id uuid NOT NULL,
    status public.assignment_status DEFAULT 'scheduled'::public.assignment_status NOT NULL,
    assignment_method public.assignment_method DEFAULT 'manual'::public.assignment_method NOT NULL,
    is_locked boolean DEFAULT true,
    clock_in_time timestamp with time zone,
    clock_out_time timestamp with time zone,
    clock_in_location text,
    clock_out_location text,
    actual_hours_worked numeric,
    mileage numeric,
    notes text,
    assigned_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: shift_trades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_trades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shift_assignment_id uuid NOT NULL,
    original_caregiver_id uuid NOT NULL,
    new_caregiver_id uuid,
    status public.trade_status DEFAULT 'pending'::public.trade_status NOT NULL,
    trade_type public.trade_type DEFAULT 'trade_board'::public.trade_type NOT NULL,
    surge_pay_amount numeric DEFAULT 0,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agency_id uuid NOT NULL,
    client_id uuid NOT NULL,
    caregiver_id uuid,
    order_id uuid,
    order_title text DEFAULT 'Care Service Order'::text NOT NULL,
    care_type_code text NOT NULL,
    shift_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    duration_hours numeric NOT NULL,
    pay_rate numeric,
    status public.shift_status DEFAULT 'open'::public.shift_status,
    is_recurring boolean DEFAULT false,
    recurrence_pattern text,
    required_skills text[] DEFAULT '{}'::text[],
    special_instructions text,
    special_notes text,
    ai_match_score integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_code text NOT NULL,
    module_name text NOT NULL,
    description text,
    category text DEFAULT 'general'::text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_code public.app_role NOT NULL,
    role_name text NOT NULL,
    description text,
    access_level integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: time_off_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_off_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caregiver_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    request_type public.request_type NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    reason text,
    notes text,
    approved_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    agency_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: agency agency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agency
    ADD CONSTRAINT agency_pkey PRIMARY KEY (id);


--
-- Name: care_types care_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_types
    ADD CONSTRAINT care_types_code_key UNIQUE (code);


--
-- Name: care_types care_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_types
    ADD CONSTRAINT care_types_pkey PRIMARY KEY (id);


--
-- Name: caregiver_availability caregiver_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_availability
    ADD CONSTRAINT caregiver_availability_pkey PRIMARY KEY (id);


--
-- Name: caregiver_certifications caregiver_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_certifications
    ADD CONSTRAINT caregiver_certifications_pkey PRIMARY KEY (id);


--
-- Name: caregiver_registrations caregiver_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_registrations
    ADD CONSTRAINT caregiver_registrations_pkey PRIMARY KEY (id);


--
-- Name: caregiver_skills caregiver_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_skills
    ADD CONSTRAINT caregiver_skills_pkey PRIMARY KEY (id);


--
-- Name: caregivers caregivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregivers
    ADD CONSTRAINT caregivers_pkey PRIMARY KEY (id);


--
-- Name: client_care_needs client_care_needs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_care_needs
    ADD CONSTRAINT client_care_needs_pkey PRIMARY KEY (id);


--
-- Name: client_orders client_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_orders
    ADD CONSTRAINT client_orders_order_number_key UNIQUE (order_number);


--
-- Name: client_orders client_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_orders
    ADD CONSTRAINT client_orders_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_code_module_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_code_module_code_key UNIQUE (role_code, module_code);


--
-- Name: shift_assignments shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_pkey PRIMARY KEY (id);


--
-- Name: shift_trades shift_trades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_trades
    ADD CONSTRAINT shift_trades_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: system_modules system_modules_module_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_modules
    ADD CONSTRAINT system_modules_module_code_key UNIQUE (module_code);


--
-- Name: system_modules system_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_modules
    ADD CONSTRAINT system_modules_pkey PRIMARY KEY (id);


--
-- Name: system_roles system_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_roles
    ADD CONSTRAINT system_roles_pkey PRIMARY KEY (id);


--
-- Name: system_roles system_roles_role_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_roles
    ADD CONSTRAINT system_roles_role_code_key UNIQUE (role_code);


--
-- Name: time_off_requests time_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_off_requests
    ADD CONSTRAINT time_off_requests_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: agency update_agency_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agency_updated_at BEFORE UPDATE ON public.agency FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: caregiver_availability update_caregiver_availability_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_caregiver_availability_updated_at BEFORE UPDATE ON public.caregiver_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: caregiver_skills update_caregiver_skills_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_caregiver_skills_updated_at BEFORE UPDATE ON public.caregiver_skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: caregivers update_caregivers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_caregivers_updated_at BEFORE UPDATE ON public.caregivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shifts update_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: caregiver_availability caregiver_availability_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_availability
    ADD CONSTRAINT caregiver_availability_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id) ON DELETE CASCADE;


--
-- Name: caregiver_certifications caregiver_certifications_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_certifications
    ADD CONSTRAINT caregiver_certifications_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id) ON DELETE CASCADE;


--
-- Name: caregiver_registrations caregiver_registrations_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_registrations
    ADD CONSTRAINT caregiver_registrations_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agency(id);


--
-- Name: caregiver_registrations caregiver_registrations_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_registrations
    ADD CONSTRAINT caregiver_registrations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: caregiver_skills caregiver_skills_care_type_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_skills
    ADD CONSTRAINT caregiver_skills_care_type_code_fkey FOREIGN KEY (care_type_code) REFERENCES public.care_types(code);


--
-- Name: caregiver_skills caregiver_skills_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregiver_skills
    ADD CONSTRAINT caregiver_skills_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id) ON DELETE CASCADE;


--
-- Name: caregivers caregivers_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregivers
    ADD CONSTRAINT caregivers_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agency(id);


--
-- Name: caregivers caregivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caregivers
    ADD CONSTRAINT caregivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: client_care_needs client_care_needs_care_type_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_care_needs
    ADD CONSTRAINT client_care_needs_care_type_code_fkey FOREIGN KEY (care_type_code) REFERENCES public.care_types(code);


--
-- Name: client_care_needs client_care_needs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_care_needs
    ADD CONSTRAINT client_care_needs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_orders client_orders_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_orders
    ADD CONSTRAINT client_orders_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agency(id);


--
-- Name: client_orders client_orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_orders
    ADD CONSTRAINT client_orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: clients clients_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agency(id);


--
-- Name: clients clients_preferred_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_preferred_caregiver_id_fkey FOREIGN KEY (preferred_caregiver_id) REFERENCES public.caregivers(id);


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agency(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_module_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_module_code_fkey FOREIGN KEY (module_code) REFERENCES public.system_modules(module_code);


--
-- Name: shift_assignments shift_assignments_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id);


--
-- Name: shift_assignments shift_assignments_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_assignments
    ADD CONSTRAINT shift_assignments_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;


--
-- Name: shift_trades shift_trades_new_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_trades
    ADD CONSTRAINT shift_trades_new_caregiver_id_fkey FOREIGN KEY (new_caregiver_id) REFERENCES public.caregivers(id);


--
-- Name: shift_trades shift_trades_original_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_trades
    ADD CONSTRAINT shift_trades_original_caregiver_id_fkey FOREIGN KEY (original_caregiver_id) REFERENCES public.caregivers(id);


--
-- Name: shift_trades shift_trades_shift_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_trades
    ADD CONSTRAINT shift_trades_shift_assignment_id_fkey FOREIGN KEY (shift_assignment_id) REFERENCES public.shift_assignments(id) ON DELETE CASCADE;


--
-- Name: shifts shifts_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agency(id);


--
-- Name: shifts shifts_care_type_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_care_type_code_fkey FOREIGN KEY (care_type_code) REFERENCES public.care_types(code);


--
-- Name: shifts shifts_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id);


--
-- Name: shifts shifts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: shifts shifts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.client_orders(id);


--
-- Name: time_off_requests time_off_requests_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_off_requests
    ADD CONSTRAINT time_off_requests_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES auth.users(id);


--
-- Name: time_off_requests time_off_requests_caregiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_off_requests
    ADD CONSTRAINT time_off_requests_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agency(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clients Admins and managers can manage clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can manage clients" ON public.clients USING (((agency_id IN ( SELECT profiles.agency_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) AND (public.has_role(auth.uid(), 'system_admin'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: agency Admins can manage agencies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage agencies" ON public.agency USING ((public.has_role(auth.uid(), 'system_admin'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING ((public.has_role(auth.uid(), 'system_admin'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)));


--
-- Name: care_types Admins can manage care types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage care types" ON public.care_types USING ((public.has_role(auth.uid(), 'system_admin'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ((public.has_role(auth.uid(), 'system_admin'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)));


--
-- Name: caregiver_availability Agency users can manage caregiver availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage caregiver availability" ON public.caregiver_availability USING ((EXISTS ( SELECT 1
   FROM (public.caregivers c
     JOIN public.profiles p ON ((p.agency_id = c.agency_id)))
  WHERE ((c.id = caregiver_availability.caregiver_id) AND (p.id = auth.uid())))));


--
-- Name: caregiver_skills Agency users can manage caregiver skills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage caregiver skills" ON public.caregiver_skills USING ((EXISTS ( SELECT 1
   FROM (public.caregivers c
     JOIN public.profiles p ON ((p.agency_id = c.agency_id)))
  WHERE ((c.id = caregiver_skills.caregiver_id) AND (p.id = auth.uid())))));


--
-- Name: caregiver_certifications Agency users can manage certifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage certifications" ON public.caregiver_certifications USING ((EXISTS ( SELECT 1
   FROM public.caregivers
  WHERE ((caregivers.id = caregiver_certifications.caregiver_id) AND (caregivers.agency_id = auth.uid())))));


--
-- Name: client_care_needs Agency users can manage client care needs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage client care needs" ON public.client_care_needs USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.agency_id IN ( SELECT profiles.agency_id
           FROM public.profiles
          WHERE (profiles.id = auth.uid()))))));


--
-- Name: shift_assignments Agency users can manage shift assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage shift assignments" ON public.shift_assignments USING ((EXISTS ( SELECT 1
   FROM public.shifts
  WHERE ((shifts.id = shift_assignments.shift_id) AND (shifts.agency_id = auth.uid())))));


--
-- Name: caregivers Agency users can manage their caregivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage their caregivers" ON public.caregivers USING ((agency_id IN ( SELECT profiles.agency_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: client_orders Agency users can manage their client orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage their client orders" ON public.client_orders USING ((agency_id IN ( SELECT profiles.agency_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: shifts Agency users can manage their shifts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can manage their shifts" ON public.shifts USING ((agency_id IN ( SELECT profiles.agency_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: shift_trades Agency users can update shift trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can update shift trades" ON public.shift_trades FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.caregivers
  WHERE ((caregivers.id = shift_trades.original_caregiver_id) AND (caregivers.agency_id = auth.uid())))));


--
-- Name: shift_trades Agency users can view shift trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Agency users can view shift trades" ON public.shift_trades FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.caregivers
  WHERE ((caregivers.id = shift_trades.original_caregiver_id) AND (caregivers.agency_id = auth.uid())))));


--
-- Name: system_modules Anyone authenticated can view active modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone authenticated can view active modules" ON public.system_modules FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: system_roles Anyone authenticated can view active system roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone authenticated can view active system roles" ON public.system_roles FOR SELECT USING (((is_active = true) AND (auth.uid() IS NOT NULL)));


--
-- Name: care_types Anyone authenticated can view care types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone authenticated can view care types" ON public.care_types FOR SELECT USING (true);


--
-- Name: role_permissions Anyone authenticated can view permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone authenticated can view permissions" ON public.role_permissions FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: caregiver_registrations Anyone can create caregiver registration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create caregiver registration" ON public.caregiver_registrations FOR INSERT WITH CHECK (true);


--
-- Name: agency Authenticated users can view agencies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view agencies" ON public.agency FOR SELECT USING (true);


--
-- Name: shift_trades Caregivers can create shift trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caregivers can create shift trades" ON public.shift_trades FOR INSERT WITH CHECK ((original_caregiver_id IN ( SELECT caregivers.id
   FROM public.caregivers
  WHERE (caregivers.agency_id = auth.uid()))));


--
-- Name: time_off_requests Caregivers can create time off requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caregivers can create time off requests" ON public.time_off_requests FOR INSERT WITH CHECK ((caregiver_id IN ( SELECT caregivers.id
   FROM public.caregivers
  WHERE (caregivers.agency_id = auth.uid()))));


--
-- Name: caregiver_availability Caregivers can manage their own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caregivers can manage their own availability" ON public.caregiver_availability USING ((caregiver_id IN ( SELECT caregivers.id
   FROM public.caregivers
  WHERE (caregivers.user_id = auth.uid()))));


--
-- Name: caregiver_skills Caregivers can manage their own skills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caregivers can manage their own skills" ON public.caregiver_skills USING ((caregiver_id IN ( SELECT caregivers.id
   FROM public.caregivers
  WHERE (caregivers.user_id = auth.uid()))));


--
-- Name: caregivers Caregivers can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caregivers can update their own profile" ON public.caregivers FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: caregivers Caregivers can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caregivers can view their own profile" ON public.caregivers FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: time_off_requests Caregivers can view their own time off requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caregivers can view their own time off requests" ON public.time_off_requests FOR SELECT USING ((caregiver_id IN ( SELECT caregivers.id
   FROM public.caregivers
  WHERE (caregivers.agency_id = auth.uid()))));


--
-- Name: client_care_needs Clients can manage their own care needs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can manage their own care needs" ON public.client_care_needs USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.user_id = auth.uid()))));


--
-- Name: clients Clients can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can update their own profile" ON public.clients FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: clients Clients can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients can view their own profile" ON public.clients FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: caregiver_availability Clients view caregiver availability (agency scope) 20251106; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients view caregiver availability (agency scope) 20251106" ON public.caregiver_availability FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.caregivers c
     JOIN public.clients cl ON ((cl.agency_id = c.agency_id)))
  WHERE ((c.id = caregiver_availability.caregiver_id) AND (cl.user_id = auth.uid())))));


--
-- Name: caregivers Clients view caregivers (agency scope) 20251106; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clients view caregivers (agency scope) 20251106" ON public.caregivers FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clients cl
  WHERE ((cl.user_id = auth.uid()) AND (cl.agency_id = caregivers.agency_id)))));


--
-- Name: caregiver_registrations Managers can update caregiver registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update caregiver registrations" ON public.caregiver_registrations FOR UPDATE USING (((agency_id = auth.uid()) OR public.has_role(auth.uid(), 'system_admin'::public.app_role)));


--
-- Name: time_off_requests Managers can update time off requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update time off requests" ON public.time_off_requests FOR UPDATE USING ((public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)));


--
-- Name: caregiver_registrations Managers can view caregiver registrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view caregiver registrations" ON public.caregiver_registrations FOR SELECT USING (((agency_id = auth.uid()) OR public.has_role(auth.uid(), 'system_admin'::public.app_role)));


--
-- Name: time_off_requests Managers can view time off requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view time off requests" ON public.time_off_requests FOR SELECT USING ((public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role) OR public.has_role(auth.uid(), 'scheduler'::public.app_role)));


--
-- Name: caregivers Require authentication for caregiver access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for caregiver access" ON public.caregivers USING ((auth.uid() IS NOT NULL));


--
-- Name: client_orders Require authentication for client order access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for client order access" ON public.client_orders USING ((auth.uid() IS NOT NULL));


--
-- Name: shifts Require authentication for shift access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for shift access" ON public.shifts USING ((auth.uid() IS NOT NULL));


--
-- Name: shift_assignments Require authentication for shift assignment access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for shift assignment access" ON public.shift_assignments USING ((auth.uid() IS NOT NULL));


--
-- Name: clients Staff can view clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view clients" ON public.clients FOR SELECT USING (((agency_id IN ( SELECT profiles.agency_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) AND (public.has_role(auth.uid(), 'system_admin'::public.app_role) OR public.has_role(auth.uid(), 'agency_admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'scheduler'::public.app_role) OR public.has_role(auth.uid(), 'hr_staff'::public.app_role))));


--
-- Name: system_modules System admins can manage modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System admins can manage modules" ON public.system_modules USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));


--
-- Name: role_permissions System admins can manage permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System admins can manage permissions" ON public.role_permissions USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));


--
-- Name: system_roles System admins can manage system roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System admins can manage system roles" ON public.system_roles USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agency; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agency ENABLE ROW LEVEL SECURITY;

--
-- Name: care_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.care_types ENABLE ROW LEVEL SECURITY;

--
-- Name: caregiver_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.caregiver_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: caregiver_certifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.caregiver_certifications ENABLE ROW LEVEL SECURITY;

--
-- Name: caregiver_registrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.caregiver_registrations ENABLE ROW LEVEL SECURITY;

--
-- Name: caregiver_skills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.caregiver_skills ENABLE ROW LEVEL SECURITY;

--
-- Name: caregivers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

--
-- Name: client_care_needs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_care_needs ENABLE ROW LEVEL SECURITY;

--
-- Name: client_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_trades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_trades ENABLE ROW LEVEL SECURITY;

--
-- Name: shifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

--
-- Name: system_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: system_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: time_off_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


