import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Mail, Phone, MapPin, Users, UserCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CaregiverRegistration {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  employment_type: string;
  hourly_rate: number | null;
  status: string;
  created_at: string;
  rejection_reason?: string | null;
  agency_id: string | null;
}

interface ClientRegistration {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  rejection_reason?: string | null;
  agency_id: string | null;
}

const CaregiverApprovals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [caregiverRegistrations, setCaregiverRegistrations] = useState<CaregiverRegistration[]>([]);
  const [clientRegistrations, setClientRegistrations] = useState<ClientRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [activeTab, setActiveTab] = useState("caregivers");
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; registrationId: string | null; type: 'caregiver' | 'client'; reason: string }>({
    open: false,
    registrationId: null,
    type: 'caregiver',
    reason: ""
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Get user's profile for agency_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (profile?.agency_id) {
      setAgencyId(profile.agency_id);
    }

    await Promise.all([fetchCaregiverRegistrations(), fetchClientRegistrations()]);
    setLoading(false);
  };

  const fetchCaregiverRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("caregiver_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCaregiverRegistrations(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const fetchClientRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("client_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientRegistrations(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleApproveCaregiver = async (registration: CaregiverRegistration) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !agencyId) return;

      // Look up the auth user by email to get their user_id
      // The assign_caregiver_role RPC also assigns the role
      const { error: roleError } = await supabase.rpc('assign_caregiver_role', {
        caregiver_email: registration.email
      });
      if (roleError) throw roleError;

      // Find the auth user id from profiles by email
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", registration.email)
        .maybeSingle();

      // Create caregiver record with correct agency_id and user_id
      const { error: caregiverError } = await supabase.from("caregivers").insert({
        email: registration.email,
        phone: registration.phone,
        first_name: registration.first_name,
        last_name: registration.last_name,
        address: registration.address,
        city: registration.city,
        state: registration.state,
        zip_code: registration.zip_code,
        employment_type: registration.employment_type,
        hourly_rate: registration.hourly_rate,
        agency_id: agencyId,
        user_id: profileData?.id || null,
        is_active: true,
      });

      if (caregiverError) throw caregiverError;

      // Update registration status
      const { error: updateError } = await supabase
        .from("caregiver_registrations")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          agency_id: agencyId,
        })
        .eq("id", registration.id);

      if (updateError) throw updateError;

      toast({ title: "Success", description: "Caregiver approved and added to your team" });
      fetchCaregiverRegistrations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleApproveClient = async (registration: ClientRegistration) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !agencyId) return;

      // Find the auth user id from profiles by email
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", registration.email)
        .maybeSingle();

      const authUserId = profileData?.id || null;

      // Create client record
      const { error: clientError } = await supabase.from("clients").insert({
        email: registration.email,
        phone: registration.phone,
        first_name: registration.first_name,
        last_name: registration.last_name,
        address: registration.address || "",
        city: registration.city || "",
        state: registration.state || "",
        zip_code: registration.zip_code || "",
        date_of_birth: registration.date_of_birth,
        emergency_contact_name: registration.emergency_contact_name,
        emergency_contact_phone: registration.emergency_contact_phone,
        notes: registration.notes,
        agency_id: agencyId,
        user_id: authUserId,
        is_active: true,
      });

      if (clientError) throw clientError;

      // Assign client role if we have the user_id
      if (authUserId) {
        await supabase.from("user_roles").insert({
          user_id: authUserId,
          role: "client",
          agency_id: agencyId,
        });
      }

      // Update registration status
      const { error: updateError } = await supabase
        .from("client_registrations")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          agency_id: agencyId,
        })
        .eq("id", registration.id);

      if (updateError) throw updateError;

      toast({ title: "Success", description: "Client approved and added to your roster" });
      fetchClientRegistrations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.registrationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const table = rejectDialog.type === 'caregiver' ? 'caregiver_registrations' : 'client_registrations';

      const { error } = await supabase
        .from(table)
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectDialog.reason,
        })
        .eq("id", rejectDialog.registrationId);

      if (error) throw error;

      toast({ title: "Registration Rejected", description: "The applicant has been notified" });
      setRejectDialog({ open: false, registrationId: null, type: 'caregiver', reason: "" });

      if (rejectDialog.type === 'caregiver') {
        fetchCaregiverRegistrations();
      } else {
        fetchClientRegistrations();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "bg-warning/10 text-warning border-warning/20",
      approved: "bg-success/10 text-success border-success/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
  };

  const filteredCaregivers = caregiverRegistrations.filter(reg => filter === 'all' || reg.status === filter);
  const filteredClients = clientRegistrations.filter(reg => filter === 'all' || reg.status === filter);

  const pendingCaregiverCount = caregiverRegistrations.filter(r => r.status === 'pending').length;
  const pendingClientCount = clientRegistrations.filter(r => r.status === 'pending').length;

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
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registration Approvals</h1>
            <p className="text-muted-foreground">Review and approve caregiver and client registrations</p>
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="caregivers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Caregivers
              {pendingCaregiverCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCaregiverCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Clients
              {pendingClientCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingClientCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="caregivers">
            <div className="grid gap-4">
              {filteredCaregivers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No caregiver applications found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredCaregivers.map((registration) => (
                  <Card key={registration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">
                            {registration.first_name} {registration.last_name}
                          </CardTitle>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              {registration.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4" />
                              {registration.phone}
                            </div>
                            {registration.city && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4" />
                                {registration.city}, {registration.state} {registration.zip_code}
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        {getStatusBadge(registration.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Employment Type</p>
                          <p className="text-muted-foreground capitalize">{registration.employment_type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Desired Rate</p>
                          <p className="text-muted-foreground">${registration.hourly_rate}/hr</p>
                        </div>
                      </div>

                      {registration.rejection_reason && (
                        <div className="bg-destructive/10 p-3 rounded-lg">
                          <p className="font-medium text-sm text-destructive mb-1">Rejection Reason</p>
                          <p className="text-sm text-muted-foreground">{registration.rejection_reason}</p>
                        </div>
                      )}

                      {registration.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90 text-white"
                            onClick={() => handleApproveCaregiver(registration)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => setRejectDialog({ open: true, registrationId: registration.id, type: 'caregiver', reason: "" })}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <div className="grid gap-4">
              {filteredClients.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No client applications found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredClients.map((registration) => (
                  <Card key={registration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">
                            {registration.first_name} {registration.last_name}
                          </CardTitle>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              {registration.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4" />
                              {registration.phone}
                            </div>
                            {registration.city && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4" />
                                {registration.city}, {registration.state} {registration.zip_code}
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        {getStatusBadge(registration.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {registration.date_of_birth && (
                          <div>
                            <p className="font-medium mb-1">Date of Birth</p>
                            <p className="text-muted-foreground">{new Date(registration.date_of_birth).toLocaleDateString()}</p>
                          </div>
                        )}
                        {registration.emergency_contact_name && (
                          <div>
                            <p className="font-medium mb-1">Emergency Contact</p>
                            <p className="text-muted-foreground">{registration.emergency_contact_name} ({registration.emergency_contact_phone})</p>
                          </div>
                        )}
                      </div>

                      {registration.notes && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="font-medium text-sm mb-1">Notes</p>
                          <p className="text-sm text-muted-foreground">{registration.notes}</p>
                        </div>
                      )}

                      {registration.rejection_reason && (
                        <div className="bg-destructive/10 p-3 rounded-lg">
                          <p className="font-medium text-sm text-destructive mb-1">Rejection Reason</p>
                          <p className="text-sm text-muted-foreground">{registration.rejection_reason}</p>
                        </div>
                      )}

                      {registration.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90 text-white"
                            onClick={() => handleApproveClient(registration)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => setRejectDialog({ open: true, registrationId: registration.id, type: 'client', reason: "" })}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. This will be shared with the applicant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rejection</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason..."
                  value={rejectDialog.reason}
                  onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, registrationId: null, type: 'caregiver', reason: "" })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectDialog.reason.trim()}>
                Reject Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default CaregiverApprovals;