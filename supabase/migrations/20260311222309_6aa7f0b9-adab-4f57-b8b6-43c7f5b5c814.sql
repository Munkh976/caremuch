CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHEN 'client' THEN 7
  END
  LIMIT 1
$function$;