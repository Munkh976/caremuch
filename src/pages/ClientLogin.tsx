import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, UserCheck } from "lucide-react";

const ClientLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.rpc('get_user_role', { _user_id: session.user.id }).then(({ data }) => {
          if (data === 'client') navigate('/client-dashboard');
        });
      }
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: role } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
        if (role === 'client') {
          toast.success("Welcome back!");
          navigate('/client-dashboard');
        } else {
          await supabase.auth.signOut();
          toast.error("This portal is for clients only. Please use the appropriate login.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-success/5 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
          </Button>
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-success to-accent">
              <UserCheck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-success mb-2">Client Portal</h1>
          <p className="text-muted-foreground">Sign in to manage your care services</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Sign In</CardTitle>
            <CardDescription>Access your care schedule, team, and history</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="client@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-success hover:bg-success/90" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-center text-sm text-muted-foreground">
            <p>Need care services?</p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/client-registration">Request Care</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ClientLogin;
