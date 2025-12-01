-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view agencies" ON public.agency;

-- Create a more restrictive policy that only allows users to view their own agency
CREATE POLICY "Users can view their own agency" 
ON public.agency 
FOR SELECT 
USING (
  -- System admins can see all agencies
  has_role(auth.uid(), 'system_admin'::app_role)
  OR
  -- Agency admins can see all agencies (for multi-agency management)
  has_role(auth.uid(), 'agency_admin'::app_role)
  OR
  -- Users can only see the agency they belong to via their profile
  id IN (
    SELECT agency_id FROM profiles WHERE id = auth.uid()
  )
);