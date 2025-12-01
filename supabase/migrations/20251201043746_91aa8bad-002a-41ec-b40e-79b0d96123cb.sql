-- Drop the broken policy
DROP POLICY IF EXISTS "Agency users can manage shift assignments" ON public.shift_assignments;

-- Create the corrected policy that properly checks agency membership through profiles
CREATE POLICY "Agency users can manage shift assignments" 
ON public.shift_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM shifts s
    JOIN profiles p ON p.agency_id = s.agency_id
    WHERE s.id = shift_assignments.shift_id 
      AND p.id = auth.uid()
  )
);

-- Also add a policy for caregivers to view their own assignments
DROP POLICY IF EXISTS "Caregivers can view their own assignments" ON public.shift_assignments;

CREATE POLICY "Caregivers can view their own assignments" 
ON public.shift_assignments 
FOR SELECT 
USING (
  caregiver_id IN (
    SELECT id FROM caregivers WHERE user_id = auth.uid()
  )
);

-- Allow caregivers to update their own assignments (for clock-in/clock-out)
DROP POLICY IF EXISTS "Caregivers can update their own assignments" ON public.shift_assignments;

CREATE POLICY "Caregivers can update their own assignments" 
ON public.shift_assignments 
FOR UPDATE 
USING (
  caregiver_id IN (
    SELECT id FROM caregivers WHERE user_id = auth.uid()
  )
);