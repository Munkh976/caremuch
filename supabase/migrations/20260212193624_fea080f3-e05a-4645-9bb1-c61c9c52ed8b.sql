
-- Update default qualification days from 90 to 30 for the referral program
UPDATE public.bonus_system_settings 
SET referral_qualification_days = 30
WHERE referral_qualification_days = 90;

-- Also update the default for future rows
ALTER TABLE public.bonus_system_settings 
ALTER COLUMN referral_qualification_days SET DEFAULT 30;

-- Add a referral_program module to system_modules if not exists
INSERT INTO public.system_modules (module_code, module_name, description, category, is_active)
VALUES ('referral_program', 'Referral Program', 'Manage caregiver referral incentives and bonuses', 'hr', true)
ON CONFLICT (module_code) DO NOTHING;

-- Add permissions for referral_program module
INSERT INTO public.role_permissions (role_code, module_code, can_create, can_read, can_update, can_delete) VALUES
('system_admin', 'referral_program', true, true, true, true),
('agency_admin', 'referral_program', true, true, true, true),
('manager', 'referral_program', true, true, true, false),
('hr_staff', 'referral_program', true, true, false, false),
('caregiver', 'referral_program', false, true, false, false)
ON CONFLICT DO NOTHING;
