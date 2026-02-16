import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Activity, Heart, UserCheck, Shield } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const routeByRole = async (userId: string) => {
    const { data } = await supabase.rpc('get_user_role', { _user_id: userId });
    if (data === 'caregiver') navigate('/caregiver-dashboard');
    else if (data === 'client') navigate('/client-dashboard');
    else if (data === 'system_admin') navigate('/system-admin-dashboard');
    else if (data) navigate('/dashboard');
    else {
      toast.info('Your account is pending approval.');
      await supabase.auth.signOut();
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) routeByRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) routeByRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await routeByRole(session.user.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const portals = [
    { icon: Heart, title: "Caregiver Portal", description: "Access your shifts, schedule, and earnings", path: "/caregiver-login", color: "text-accent" },
    { icon: UserCheck, title: "Client Portal", description: "Manage your care services and schedule", path: "/client-login", color: "text-success" },
    { icon: Shield, title: "Staff Portal", description: "Administration and management access", path: "/admin-login", color: "text-primary" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            CareMuch
          </h1>
          <p className="text-muted-foreground">Choose your portal to sign in</p>
        </div>

        {/* Portal Selection */}
        <div className="grid gap-4 mb-8">
          {portals.map((p) => (
            <Link key={p.path} to={p.path}>
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p.icon className={`h-6 w-6 ${p.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Sign In for returning users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Sign In</CardTitle>
            <CardDescription>We'll route you to the right dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
