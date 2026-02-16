import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Users, TrendingUp, ArrowRight, Heart, Shield, Clock } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI-Powered Matching", description: "85%+ matching accuracy with ML-driven caregiver-client pairing", color: "text-accent", bgColor: "bg-accent/10" },
  { icon: Calendar, title: "Smart Scheduling", description: "90% reduction in scheduling time with automated optimization", color: "text-primary", bgColor: "bg-primary/10" },
  { icon: Users, title: "Dedicated Care Teams", description: "Consistent caregivers who know and understand your needs", color: "text-success", bgColor: "bg-success/10" },
  { icon: TrendingUp, title: "Real-Time Updates", description: "Stay informed with live care tracking and communication", color: "text-warning", bgColor: "bg-warning/10" },
];

const whyUs = [
  { icon: Heart, title: "Compassionate Care", description: "Every caregiver is hand-selected for empathy, skill, and reliability." },
  { icon: Shield, title: "Fully Vetted", description: "Comprehensive background checks, training verification, and ongoing education." },
  { icon: Clock, title: "Available 24/7", description: "Round-the-clock care services with emergency support always available." },
];

const Index = () => (
  <PublicLayout>
    {/* Hero Section */}
    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Professional Home Care Services</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Compassionate Care,{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Right at Home
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            CareMuch delivers personalized home care with AI-powered scheduling, dedicated care teams, and a commitment to dignity and independence.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-success hover:bg-success/90 gap-2" asChild>
              <Link to="/client-registration">
                Request Care <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/services">View Our Services</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>

    {/* Features Grid */}
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Families Choose CareMuch</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className={`inline-flex p-3 rounded-lg ${f.bgColor} mb-4`}>
                <f.icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Why Choose Us */}
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-8">
          {whyUs.map((w) => (
            <div key={w.title} className="text-center">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <w.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{w.title}</h3>
              <p className="text-muted-foreground">{w.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Stats Section */}
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-success/10 border border-primary/20">
          <h2 className="text-2xl font-bold text-center mb-8">Proven Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Active Clients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-2">200+</div>
              <div className="text-sm text-muted-foreground">Caregivers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-warning mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Care Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* CTA Sections */}
    <section className="py-16 bg-gradient-to-r from-primary to-accent">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 text-center">
          <div className="p-8 rounded-2xl bg-card/10 backdrop-blur">
            <h3 className="text-2xl font-bold text-primary-foreground mb-4">Need Care?</h3>
            <p className="text-primary-foreground/80 mb-6">Register as a client and we'll create a personalized care plan for you.</p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/client-registration">Request Care</Link>
            </Button>
          </div>
          <div className="p-8 rounded-2xl bg-card/10 backdrop-blur">
            <h3 className="text-2xl font-bold text-primary-foreground mb-4">Join Our Team</h3>
            <p className="text-primary-foreground/80 mb-6">Become a CareMuch caregiver and build a rewarding career in home care.</p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/caregiver-registration">Apply Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default Index;
