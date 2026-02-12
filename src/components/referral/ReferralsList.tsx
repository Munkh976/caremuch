import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Edit, Users } from "lucide-react";
import { format } from "date-fns";

interface Props {
  agencyId: string | null;
  canManage: boolean;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_date: string;
  status: string;
  days_employed: number;
  hours_worked: number;
  tier1_amount: number | null;
  tier1_bonus_paid: boolean;
  tier1_multiplier_applied: number | null;
  qualification_date: string | null;
  quality_bonus_active: boolean;
}

interface CaregiverName {
  id: string;
  first_name: string;
  last_name: string;
}

export const ReferralsList = ({ agencyId, canManage }: Props) => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [caregivers, setCaregivers] = useState<Record<string, CaregiverName>>({});
  const [loading, setLoading] = useState(true);
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; referralId: string | null; amount: number }>({
    open: false,
    referralId: null,
    amount: 0,
  });

  useEffect(() => {
    if (agencyId) fetchData();
  }, [agencyId]);

  const fetchData = async () => {
    try {
      const { data: refs, error } = await supabase
        .from("caregiver_referrals")
        .select("*")
        .eq("agency_id", agencyId!)
        .order("referral_date", { ascending: false });

      if (error) throw error;
      const referralData = (refs || []) as unknown as Referral[];
      setReferrals(referralData);

      // Fetch caregiver names
      const ids = [...new Set(referralData.flatMap(r => [r.referrer_id, r.referred_id]))];
      if (ids.length > 0) {
        const { data: cgs } = await supabase
          .from("caregivers")
          .select("id, first_name, last_name")
          .in("id", ids);

        const map: Record<string, CaregiverName> = {};
        (cgs || []).forEach(c => { map[c.id] = c; });
        setCaregivers(map);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBonus = async () => {
    if (!adjustDialog.referralId) return;

    const { error } = await supabase
      .from("caregiver_referrals")
      .update({ tier1_amount: adjustDialog.amount })
      .eq("id", adjustDialog.referralId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bonus Adjusted", description: `One-time bonus set to $${adjustDialog.amount}` });
      setAdjustDialog({ open: false, referralId: null, amount: 0 });
      fetchData();
    }
  };

  const getName = (id: string) => {
    const c = caregivers[id];
    return c ? `${c.first_name} ${c.last_name}` : "Unknown";
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      qualified: "bg-success/10 text-success border-success/20",
      disqualified: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={styles[status] || ""}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Referrals
          </CardTitle>
          <CardDescription>Track referral progress and manage bonuses</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Hours Worked</TableHead>
                    <TableHead>Tier 1 Bonus</TableHead>
                    <TableHead>Tier 1 Paid</TableHead>
                    {canManage && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium">{getName(ref.referrer_id)}</TableCell>
                      <TableCell>{getName(ref.referred_id)}</TableCell>
                      <TableCell>{format(new Date(ref.referral_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(ref.status)}</TableCell>
                      <TableCell>{ref.days_employed || 0}</TableCell>
                      <TableCell>{ref.hours_worked || 0}</TableCell>
                      <TableCell>
                        {ref.tier1_amount ? `$${ref.tier1_amount}` : "—"}
                      </TableCell>
                      <TableCell>
                        {ref.tier1_bonus_paid ? (
                          <Badge className="bg-success/10 text-success border-success/20" variant="outline">Paid</Badge>
                        ) : (
                          <Badge variant="outline">Unpaid</Badge>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => setAdjustDialog({
                              open: true,
                              referralId: ref.id,
                              amount: ref.tier1_amount || 500,
                            })}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Adjust
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust Bonus Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust One-Time Bonus</DialogTitle>
            <DialogDescription>
              Set the one-time referral bonus amount for this referral. This overrides the default calculated amount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bonus Amount ($)</Label>
              <Input
                type="number"
                value={adjustDialog.amount}
                onChange={(e) => setAdjustDialog({ ...adjustDialog, amount: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Typical range: $500-$750</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false, referralId: null, amount: 0 })}>
              Cancel
            </Button>
            <Button onClick={handleAdjustBonus} className="gap-2">
              <DollarSign className="h-4 w-4" />
              Save Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
