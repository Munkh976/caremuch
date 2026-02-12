import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Clock, Gift, Percent } from "lucide-react";

interface Props {
  agencyId: string | null;
}

interface BonusSettings {
  referral_base_amount: number;
  referral_qualification_days: number;
  override_base_rate: number;
  override_quality_bonus_rate: number;
  current_multiplier: number;
  is_active: boolean;
}

export const ReferralProgramOverview = ({ agencyId }: Props) => {
  const [settings, setSettings] = useState<BonusSettings | null>(null);
  const [stats, setStats] = useState({ totalReferrals: 0, pendingReferrals: 0, qualifiedReferrals: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agencyId) fetchData();
  }, [agencyId]);

  const fetchData = async () => {
    try {
      const [settingsRes, referralsRes, earningsRes] = await Promise.all([
        supabase.from("bonus_system_settings").select("*").eq("agency_id", agencyId!).eq("is_active", true).maybeSingle(),
        supabase.from("caregiver_referrals").select("status").eq("agency_id", agencyId!),
        supabase.from("override_earnings").select("calculated_amount").eq("agency_id", agencyId!),
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data as unknown as BonusSettings);
      }

      const referrals = referralsRes.data || [];
      const earnings = earningsRes.data || [];

      setStats({
        totalReferrals: referrals.length,
        pendingReferrals: referrals.filter(r => r.status === "pending").length,
        qualifiedReferrals: referrals.filter(r => r.status === "qualified").length,
        totalEarnings: earnings.reduce((sum, e) => sum + (e.calculated_amount || 0), 0),
      });
    } catch (error) {
      console.error("Failed to fetch referral data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const baseAmount = settings?.referral_base_amount || 500;
  const maxAmount = Math.round(baseAmount * (settings?.current_multiplier || 1.5));
  const overrideRate = ((settings?.override_base_rate || 0.008) * 100).toFixed(1);
  const maxOverrideRate = (((settings?.override_base_rate || 0.008) + (settings?.override_quality_bonus_rate || 0.002)) * 100).toFixed(1);
  const qualDays = settings?.referral_qualification_days || 30;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="border-none bg-gradient-to-br from-primary to-accent text-primary-foreground overflow-hidden relative">
        <CardContent className="p-8">
          <div className="relative z-10">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">Financial Incentives</Badge>
            <h2 className="text-3xl font-bold mb-2">Earn While You Grow Our Team</h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl">
              2-tier system with referral bonuses and ongoing revenue share that rewards retention
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.qualifiedReferrals}</p>
              <p className="text-xs text-muted-foreground">Qualified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 1 */}
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-primary border-primary/30">Tier 1</Badge>
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl mt-2">One-Time Referral Bonus</CardTitle>
            <CardDescription>
              One-time payment when referred caregiver completes training and first {qualDays} days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-primary/5 rounded-lg">
              <p className="text-4xl font-bold text-primary">
                ${baseAmount.toLocaleString()}-${maxAmount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Per qualified referral</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Referred caregiver must complete onboarding training</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Must stay active for at least {qualDays} days</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Amount adjustable by agency manager based on performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Multiplier applied based on current agency conditions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier 2 */}
        <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-accent border-accent/30">Tier 2</Badge>
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <CardTitle className="text-xl mt-2">Ongoing Revenue Share</CardTitle>
            <CardDescription>
              Monthly passive income as long as referred caregiver stays active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-accent/5 rounded-lg">
              <p className="text-4xl font-bold text-accent">
                {overrideRate}-{maxOverrideRate}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Monthly passive income</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Earn {overrideRate}% base rate on referred caregiver's billable revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Up to {maxOverrideRate}% with quality bonus when client satisfaction is high</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Passive income continues as long as referred caregiver stays active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Creates natural mentorship and support networks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
