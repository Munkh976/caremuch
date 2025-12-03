-- =====================================================
-- BONUS SYSTEM DATABASE SCHEMA
-- Fully Dynamic, Admin-Controlled Incentive System
-- =====================================================

-- 1. BONUS SYSTEM SETTINGS (Admin Control Panel)
-- All rates, percentages, and bonuses adjustable via UI
CREATE TABLE public.bonus_system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency(id) ON DELETE CASCADE,
  
  -- Financial Controls
  monthly_budget DECIMAL(10,2) DEFAULT 10000.00,
  auto_reduce_if_low_budget BOOLEAN DEFAULT true,
  budget_threshold_percent DECIMAL(5,2) DEFAULT 80.00,
  
  -- Multiplier Range
  min_multiplier DECIMAL(4,2) DEFAULT 0.70,
  max_multiplier DECIMAL(4,2) DEFAULT 1.50,
  current_multiplier DECIMAL(4,2) DEFAULT 1.00,
  
  -- TIER 1: Referral Bonus Settings
  referral_base_amount DECIMAL(10,2) DEFAULT 500.00,
  referral_qualification_days INTEGER DEFAULT 90,
  referral_required_hours INTEGER DEFAULT 160,
  max_referrals_per_person INTEGER DEFAULT 10,
  
  -- TIER 2: Override Settings
  override_base_rate DECIMAL(6,4) DEFAULT 0.0080, -- 0.8%
  override_quality_bonus_rate DECIMAL(6,4) DEFAULT 0.0020, -- +0.2%
  client_satisfaction_threshold DECIMAL(4,2) DEFAULT 95.00,
  max_override_per_person DECIMAL(10,2) DEFAULT 500.00,
  
  -- TIER 3: Team Bonus Settings
  team_leader_base_per_member DECIMAL(10,2) DEFAULT 75.00,
  team_pool_base_per_person DECIMAL(10,2) DEFAULT 100.00,
  min_team_size INTEGER DEFAULT 4,
  team_leader_pool_share_percent DECIMAL(5,2) DEFAULT 30.00,
  
  -- Team Leader Qualification
  team_leader_min_referrals INTEGER DEFAULT 3,
  team_leader_min_tenure_months INTEGER DEFAULT 6,
  team_leader_min_satisfaction DECIMAL(4,2) DEFAULT 4.30,
  
  -- Payout Settings
  payout_frequency TEXT DEFAULT 'monthly' CHECK (payout_frequency IN ('weekly', 'biweekly', 'monthly')),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agency_id)
);

-- 2. BONUS MULTIPLIER RULES (Dynamic Adjustment Engine)
-- Admin-configurable triggers that adjust the multiplier
CREATE TABLE public.bonus_multiplier_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_id UUID NOT NULL REFERENCES public.bonus_system_settings(id) ON DELETE CASCADE,
  
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'turnover_rate', 
    'revenue_vs_target', 
    'nps_score', 
    'cash_flow',
    'client_satisfaction',
    'caregiver_tenure'
  )),
  condition_operator TEXT NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=', '=')),
  threshold_value DECIMAL(10,2) NOT NULL,
  multiplier_adjustment DECIMAL(4,2) NOT NULL, -- e.g., +0.2 or -0.3
  
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TEAM BONUS PERFORMANCE CRITERIA
-- Configurable performance bonuses for teams
CREATE TABLE public.team_bonus_performance_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_id UUID NOT NULL REFERENCES public.bonus_system_settings(id) ON DELETE CASCADE,
  
  criteria_name TEXT NOT NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN (
    'team_satisfaction',
    'zero_cancellations', 
    'hours_threshold',
    'retention_rate',
    'team_attendance',
    'team_nps',
    'quality_incidents'
  )),
  condition_operator TEXT NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=', '=')),
  threshold_value DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  applies_to TEXT DEFAULT 'leader' CHECK (applies_to IN ('leader', 'team', 'pool_multiplier')),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CAREGIVER REFERRALS (Referral Tracking)
-- Tracks who referred whom and qualification progress
CREATE TABLE public.caregiver_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency(id) ON DELETE CASCADE,
  
  referrer_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  
  referral_date DATE NOT NULL DEFAULT CURRENT_DATE,
  qualification_date DATE, -- Date when 90 days + 160 hours achieved
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'disqualified', 'terminated')),
  hours_worked DECIMAL(10,2) DEFAULT 0,
  days_employed INTEGER DEFAULT 0,
  
  -- Tier 1 tracking
  tier1_bonus_paid BOOLEAN DEFAULT false,
  tier1_paid_date DATE,
  tier1_amount DECIMAL(10,2),
  tier1_multiplier_applied DECIMAL(4,2),
  
  -- Quality tracking for Tier 2 bonus
  referred_satisfaction_score DECIMAL(4,2),
  quality_bonus_active BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(referrer_id, referred_id)
);

-- 5. OVERRIDE EARNINGS (Tier 2 Monthly Earnings)
-- Monthly override calculations based on shift revenue
CREATE TABLE public.override_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency(id) ON DELETE CASCADE,
  
  referral_id UUID NOT NULL REFERENCES public.caregiver_referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  
  year_month INTEGER NOT NULL, -- Format: YYYYMM (e.g., 202512)
  
  billable_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  override_rate DECIMAL(6,4) NOT NULL,
  quality_bonus_rate DECIMAL(6,4) DEFAULT 0,
  multiplier_applied DECIMAL(4,2) NOT NULL,
  
  calculated_amount DECIMAL(10,2) NOT NULL,
  capped_amount DECIMAL(10,2), -- After applying max cap
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(referral_id, year_month)
);

-- 6. BONUS TEAMS (Team Structure)
-- Auto-formed teams based on referral networks
CREATE TABLE public.bonus_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency(id) ON DELETE CASCADE,
  
  team_leader_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  team_name TEXT,
  
  formed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved')),
  
  -- Current team metrics (updated periodically)
  current_size INTEGER DEFAULT 1,
  current_nps DECIMAL(5,2),
  current_retention_rate DECIMAL(5,2),
  current_satisfaction DECIMAL(4,2),
  current_attendance_rate DECIMAL(5,2),
  cancellations_this_month INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(team_leader_id)
);

-- 7. BONUS TEAM MEMBERS (Team Membership)
-- Links caregivers to their teams
CREATE TABLE public.bonus_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.bonus_teams(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.caregiver_referrals(id) ON DELETE SET NULL,
  
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  left_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'left')),
  
  -- Performance tracking
  performance_tier TEXT DEFAULT 'average' CHECK (performance_tier IN ('top', 'good', 'average', 'below_average')),
  performance_share_percent DECIMAL(5,2), -- Their share of the 70% member pool
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(team_id, caregiver_id)
);

-- 8. TEAM BONUS PAYOUTS (Tier 3 Earnings)
-- Monthly team leader bonus + pool distribution
CREATE TABLE public.team_bonus_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.bonus_teams(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  
  year_month INTEGER NOT NULL, -- Format: YYYYMM
  
  payout_type TEXT NOT NULL CHECK (payout_type IN ('leader_bonus', 'performance_bonus', 'pool_share')),
  
  -- Calculation details
  base_amount DECIMAL(10,2) DEFAULT 0,
  performance_bonuses DECIMAL(10,2) DEFAULT 0,
  pool_share DECIMAL(10,2) DEFAULT 0,
  multiplier_applied DECIMAL(4,2) DEFAULT 1.00,
  team_score_applied DECIMAL(4,2) DEFAULT 1.00,
  
  total_amount DECIMAL(10,2) NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. BONUS CALCULATION LOG (Audit Trail)
-- Logs all bonus calculations for transparency
CREATE TABLE public.bonus_calculation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency(id) ON DELETE CASCADE,
  
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('multiplier', 'tier1', 'tier2', 'tier3_leader', 'tier3_pool')),
  related_id UUID, -- ID of the related record
  caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE SET NULL,
  
  year_month INTEGER,
  
  input_values JSONB NOT NULL, -- All inputs used in calculation
  calculation_details JSONB NOT NULL, -- Step-by-step calculation
  result_value DECIMAL(12,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.bonus_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_multiplier_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_bonus_performance_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.override_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_bonus_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_calculation_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- bonus_system_settings: Agency admins can manage, others can view
CREATE POLICY "Admins can manage bonus settings" ON public.bonus_system_settings
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin'))
  );

CREATE POLICY "Users can view their agency bonus settings" ON public.bonus_system_settings
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- bonus_multiplier_rules: Same as settings
CREATE POLICY "Admins can manage multiplier rules" ON public.bonus_multiplier_rules
  FOR ALL USING (
    settings_id IN (
      SELECT id FROM bonus_system_settings 
      WHERE agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin'))
  );

CREATE POLICY "Users can view multiplier rules" ON public.bonus_multiplier_rules
  FOR SELECT USING (
    settings_id IN (
      SELECT id FROM bonus_system_settings 
      WHERE agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
  );

-- team_bonus_performance_criteria: Same as settings
CREATE POLICY "Admins can manage performance criteria" ON public.team_bonus_performance_criteria
  FOR ALL USING (
    settings_id IN (
      SELECT id FROM bonus_system_settings 
      WHERE agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin'))
  );

CREATE POLICY "Users can view performance criteria" ON public.team_bonus_performance_criteria
  FOR SELECT USING (
    settings_id IN (
      SELECT id FROM bonus_system_settings 
      WHERE agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
  );

-- caregiver_referrals: Agency staff can manage, caregivers can view their own
CREATE POLICY "Staff can manage referrals" ON public.caregiver_referrals
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin') 
         OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'hr_staff'))
  );

CREATE POLICY "Caregivers can view their referrals" ON public.caregiver_referrals
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
    OR referred_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
  );

CREATE POLICY "Caregivers can create referrals" ON public.caregiver_referrals
  FOR INSERT WITH CHECK (
    referrer_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
    AND agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- override_earnings: Agency staff can manage, caregivers can view their own
CREATE POLICY "Staff can manage override earnings" ON public.override_earnings
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin') 
         OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Caregivers can view their override earnings" ON public.override_earnings
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
  );

-- bonus_teams: Agency staff can manage, team members can view
CREATE POLICY "Staff can manage bonus teams" ON public.bonus_teams
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin') 
         OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Team leaders can view their team" ON public.bonus_teams
  FOR SELECT USING (
    team_leader_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
  );

CREATE POLICY "Team members can view their team" ON public.bonus_teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM bonus_team_members 
      WHERE caregiver_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
    )
  );

-- bonus_team_members: Agency staff can manage, caregivers can view
CREATE POLICY "Staff can manage team members" ON public.bonus_team_members
  FOR ALL USING (
    team_id IN (
      SELECT id FROM bonus_teams 
      WHERE agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin') 
         OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Caregivers can view team membership" ON public.bonus_team_members
  FOR SELECT USING (
    caregiver_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
    OR team_id IN (
      SELECT id FROM bonus_teams 
      WHERE team_leader_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
    )
  );

-- team_bonus_payouts: Agency staff can manage, caregivers can view their own
CREATE POLICY "Staff can manage team payouts" ON public.team_bonus_payouts
  FOR ALL USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin') 
         OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Caregivers can view their payouts" ON public.team_bonus_payouts
  FOR SELECT USING (
    caregiver_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
  );

-- bonus_calculation_log: Staff can view for audit
CREATE POLICY "Staff can view calculation logs" ON public.bonus_calculation_log
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    AND (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'agency_admin') 
         OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Caregivers can view their calculation logs" ON public.bonus_calculation_log
  FOR SELECT USING (
    caregiver_id IN (SELECT id FROM caregivers WHERE user_id = auth.uid())
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate billable revenue for a caregiver in a month
CREATE OR REPLACE FUNCTION public.calculate_caregiver_monthly_revenue(
  p_caregiver_id UUID,
  p_year_month INTEGER
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue DECIMAL(12,2);
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  v_year := p_year_month / 100;
  v_month := p_year_month % 100;
  
  SELECT COALESCE(SUM(duration_hours * COALESCE(pay_rate, 0)), 0)
  INTO v_revenue
  FROM shifts
  WHERE caregiver_id = p_caregiver_id
    AND status = 'completed'
    AND EXTRACT(YEAR FROM shift_date) = v_year
    AND EXTRACT(MONTH FROM shift_date) = v_month;
  
  RETURN v_revenue;
END;
$$;

-- Function to calculate caregiver hours in a period
CREATE OR REPLACE FUNCTION public.calculate_caregiver_hours(
  p_caregiver_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(duration_hours), 0)
  INTO v_hours
  FROM shifts
  WHERE caregiver_id = p_caregiver_id
    AND status = 'completed'
    AND shift_date BETWEEN p_start_date AND p_end_date;
  
  RETURN v_hours;
END;
$$;

-- Function to check if caregiver qualifies as team leader
CREATE OR REPLACE FUNCTION public.check_team_leader_eligibility(
  p_caregiver_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_caregiver RECORD;
  v_qualified_referrals INTEGER;
  v_tenure_months INTEGER;
BEGIN
  -- Get caregiver's agency settings
  SELECT bss.* INTO v_settings
  FROM bonus_system_settings bss
  JOIN caregivers c ON c.agency_id = bss.agency_id
  WHERE c.id = p_caregiver_id
    AND bss.is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get caregiver details
  SELECT * INTO v_caregiver
  FROM caregivers WHERE id = p_caregiver_id;
  
  -- Calculate tenure
  v_tenure_months := EXTRACT(MONTH FROM age(CURRENT_DATE, v_caregiver.hire_date)) +
                     EXTRACT(YEAR FROM age(CURRENT_DATE, v_caregiver.hire_date)) * 12;
  
  -- Count qualified referrals (90+ days)
  SELECT COUNT(*) INTO v_qualified_referrals
  FROM caregiver_referrals
  WHERE referrer_id = p_caregiver_id
    AND status = 'qualified';
  
  -- Check all criteria
  RETURN (
    v_qualified_referrals >= v_settings.team_leader_min_referrals
    AND v_tenure_months >= v_settings.team_leader_min_tenure_months
    AND COALESCE(v_caregiver.performance_rating, 0) >= v_settings.team_leader_min_satisfaction
  );
END;
$$;

-- =====================================================
-- TRIGGERS FOR AUTO-TEAM FORMATION
-- =====================================================

-- Trigger function: Auto-create team when caregiver becomes eligible
CREATE OR REPLACE FUNCTION public.auto_create_bonus_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caregiver RECORD;
  v_team_id UUID;
  v_referral RECORD;
BEGIN
  -- Only process when referral becomes qualified
  IF NEW.status = 'qualified' AND (OLD.status IS NULL OR OLD.status != 'qualified') THEN
    
    -- Check if referrer now qualifies as team leader
    IF public.check_team_leader_eligibility(NEW.referrer_id) THEN
      
      -- Get caregiver details
      SELECT * INTO v_caregiver FROM caregivers WHERE id = NEW.referrer_id;
      
      -- Check if team already exists
      SELECT id INTO v_team_id FROM bonus_teams WHERE team_leader_id = NEW.referrer_id;
      
      IF v_team_id IS NULL THEN
        -- Create new team
        INSERT INTO bonus_teams (agency_id, team_leader_id, team_name, current_size)
        VALUES (
          v_caregiver.agency_id,
          NEW.referrer_id,
          v_caregiver.first_name || '''s Team',
          1
        )
        RETURNING id INTO v_team_id;
        
        -- Add all qualified referrals as team members
        FOR v_referral IN 
          SELECT cr.id as referral_id, cr.referred_id 
          FROM caregiver_referrals cr
          WHERE cr.referrer_id = NEW.referrer_id AND cr.status = 'qualified'
        LOOP
          INSERT INTO bonus_team_members (team_id, caregiver_id, referral_id)
          VALUES (v_team_id, v_referral.referred_id, v_referral.referral_id)
          ON CONFLICT (team_id, caregiver_id) DO NOTHING;
        END LOOP;
        
        -- Update team size
        UPDATE bonus_teams 
        SET current_size = (SELECT COUNT(*) + 1 FROM bonus_team_members WHERE team_id = v_team_id)
        WHERE id = v_team_id;
      ELSE
        -- Team exists, just add the new member
        INSERT INTO bonus_team_members (team_id, caregiver_id, referral_id)
        VALUES (v_team_id, NEW.referred_id, NEW.id)
        ON CONFLICT (team_id, caregiver_id) DO NOTHING;
        
        -- Update team size
        UPDATE bonus_teams 
        SET current_size = (SELECT COUNT(*) + 1 FROM bonus_team_members WHERE team_id = v_team_id),
            updated_at = now()
        WHERE id = v_team_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_create_bonus_team
  AFTER UPDATE ON public.caregiver_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_bonus_team();

-- Trigger: Update referral progress based on shifts
CREATE OR REPLACE FUNCTION public.update_referral_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_settings RECORD;
  v_hours DECIMAL(10,2);
  v_days INTEGER;
BEGIN
  -- Only process completed shifts
  IF NEW.status = 'completed' THEN
    -- Find any pending referral for this caregiver
    FOR v_referral IN 
      SELECT cr.*, c.agency_id 
      FROM caregiver_referrals cr
      JOIN caregivers c ON c.id = cr.referred_id
      WHERE cr.referred_id = NEW.caregiver_id
        AND cr.status = 'pending'
    LOOP
      -- Get settings
      SELECT * INTO v_settings 
      FROM bonus_system_settings 
      WHERE agency_id = v_referral.agency_id AND is_active = true;
      
      IF FOUND THEN
        -- Calculate total hours worked since referral
        v_hours := public.calculate_caregiver_hours(
          NEW.caregiver_id, 
          v_referral.referral_date, 
          CURRENT_DATE
        );
        
        -- Calculate days employed
        v_days := CURRENT_DATE - v_referral.referral_date;
        
        -- Update referral record
        UPDATE caregiver_referrals
        SET hours_worked = v_hours,
            days_employed = v_days,
            updated_at = now()
        WHERE id = v_referral.id;
        
        -- Check if qualified
        IF v_hours >= v_settings.referral_required_hours 
           AND v_days >= v_settings.referral_qualification_days THEN
          UPDATE caregiver_referrals
          SET status = 'qualified',
              qualification_date = CURRENT_DATE,
              updated_at = now()
          WHERE id = v_referral.id;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_referral_progress
  AFTER INSERT OR UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_progress();

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE TRIGGER update_bonus_system_settings_updated_at
  BEFORE UPDATE ON public.bonus_system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bonus_multiplier_rules_updated_at
  BEFORE UPDATE ON public.bonus_multiplier_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_bonus_performance_criteria_updated_at
  BEFORE UPDATE ON public.team_bonus_performance_criteria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_caregiver_referrals_updated_at
  BEFORE UPDATE ON public.caregiver_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_override_earnings_updated_at
  BEFORE UPDATE ON public.override_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bonus_teams_updated_at
  BEFORE UPDATE ON public.bonus_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bonus_team_members_updated_at
  BEFORE UPDATE ON public.bonus_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_bonus_payouts_updated_at
  BEFORE UPDATE ON public.team_bonus_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();