import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { ReferralProgramOverview } from "@/components/referral/ReferralProgramOverview";
import { ReferralSettings } from "@/components/referral/ReferralSettings";
import { ReferralsList } from "@/components/referral/ReferralsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Settings, Users } from "lucide-react";

const ReferralProgram = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .maybeSingle();

    setUserRole(roleData?.role || null);
    setAgencyId(profile?.agency_id || null);
    setLoading(false);
  };

  const canManage = userRole === "system_admin" || userRole === "agency_admin" || userRole === "manager";

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Referral Program</h1>
          <p className="text-muted-foreground">
            2-tier incentive system with referral bonuses and ongoing revenue share
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Gift className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-2">
              <Users className="h-4 w-4" />
              Referrals
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <ReferralProgramOverview agencyId={agencyId} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralsList agencyId={agencyId} canManage={canManage} />
          </TabsContent>

          {canManage && (
            <TabsContent value="settings">
              <ReferralSettings agencyId={agencyId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ReferralProgram;
