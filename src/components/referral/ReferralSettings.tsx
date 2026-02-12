import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Props {
  agencyId: string | null;
}

interface Settings {
  id: string;
  referral_base_amount: number;
  referral_qualification_days: number;
  override_base_rate: number;
  override_quality_bonus_rate: number;
  max_override_per_person: number;
  max_referrals_per_person: number;
  current_multiplier: number;
  max_multiplier: number;
  min_multiplier: number;
  client_satisfaction_threshold: number;
}

export const ReferralSettings = ({ agencyId }: Props) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agencyId) fetchSettings();
  }, [agencyId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("bonus_system_settings")
      .select("*")
      .eq("agency_id", agencyId!)
      .eq("is_active", true)
      .maybeSingle();

    if (data) setSettings(data as unknown as Settings);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from("bonus_system_settings")
      .update({
        referral_base_amount: settings.referral_base_amount,
        referral_qualification_days: settings.referral_qualification_days,
        override_base_rate: settings.override_base_rate,
        override_quality_bonus_rate: settings.override_quality_bonus_rate,
        max_override_per_person: settings.max_override_per_person,
        max_referrals_per_person: settings.max_referrals_per_person,
        current_multiplier: settings.current_multiplier,
        client_satisfaction_threshold: settings.client_satisfaction_threshold,
      })
      .eq("id", settings.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings Saved", description: "Referral program settings updated successfully" });
    }
  };

  const updateField = (field: keyof Settings, value: number) => {
    if (settings) setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No bonus system settings found. Please configure the bonus system first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier 1 Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tier 1: One-Time Referral Bonus</CardTitle>
          <CardDescription>
            Configure the one-time payment when a referred caregiver completes training and qualification period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Base Bonus Amount ($)</Label>
              <Input
                type="number"
                value={settings.referral_base_amount}
                onChange={(e) => updateField("referral_base_amount", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Base amount before multiplier</p>
            </div>
            <div className="space-y-2">
              <Label>Qualification Days</Label>
              <Input
                type="number"
                value={settings.referral_qualification_days}
                onChange={(e) => updateField("referral_qualification_days", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Days referred caregiver must stay active</p>
            </div>
            <div className="space-y-2">
              <Label>Current Multiplier</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.current_multiplier}
                onChange={(e) => updateField("current_multiplier", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Range: {settings.min_multiplier}x - {settings.max_multiplier}x
              </p>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <strong>Effective bonus range:</strong> ${settings.referral_base_amount * settings.min_multiplier} - ${settings.referral_base_amount * settings.max_multiplier}
            {" "}(Current: ${(settings.referral_base_amount * settings.current_multiplier).toFixed(0)})
          </div>
        </CardContent>
      </Card>

      {/* Tier 2 Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tier 2: Ongoing Revenue Share</CardTitle>
          <CardDescription>
            Configure the monthly passive income earned from referred caregivers' billable revenue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Base Override Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={(settings.override_base_rate * 100).toFixed(1)}
                onChange={(e) => updateField("override_base_rate", Number(e.target.value) / 100)}
              />
              <p className="text-xs text-muted-foreground">Base % of referred caregiver's revenue</p>
            </div>
            <div className="space-y-2">
              <Label>Quality Bonus Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={(settings.override_quality_bonus_rate * 100).toFixed(1)}
                onChange={(e) => updateField("override_quality_bonus_rate", Number(e.target.value) / 100)}
              />
              <p className="text-xs text-muted-foreground">Extra % when satisfaction threshold is met</p>
            </div>
            <div className="space-y-2">
              <Label>Max Per Person / Month ($)</Label>
              <Input
                type="number"
                value={settings.max_override_per_person}
                onChange={(e) => updateField("max_override_per_person", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Monthly cap per referral</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Referrals Per Person</Label>
              <Input
                type="number"
                value={settings.max_referrals_per_person}
                onChange={(e) => updateField("max_referrals_per_person", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Client Satisfaction Threshold (%)</Label>
              <Input
                type="number"
                value={settings.client_satisfaction_threshold}
                onChange={(e) => updateField("client_satisfaction_threshold", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Min satisfaction to earn quality bonus</p>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <strong>Effective rate:</strong> {(settings.override_base_rate * 100).toFixed(1)}% base
            + {(settings.override_quality_bonus_rate * 100).toFixed(1)}% quality bonus
            = up to {((settings.override_base_rate + settings.override_quality_bonus_rate) * 100).toFixed(1)}% total
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};
