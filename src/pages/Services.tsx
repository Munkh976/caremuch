import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Clock, Stethoscope, Home, Users, Brain, Utensils, Car } from "lucide-react";

const services = [
  { icon: Heart, title: "Personal Care", description: "Bathing, grooming, dressing, and personal hygiene assistance with dignity and respect.", color: "text-destructive", bg: "bg-destructive/10" },
  { icon: Stethoscope, title: "Skilled Nursing", description: "Medication management, wound care, vital sign monitoring, and medical support.", color: "text-primary", bg: "bg-primary/10" },
  { icon: Home, title: "Homemaker Services", description: "Light housekeeping, laundry, meal planning, and maintaining a safe home environment.", color: "text-accent", bg: "bg-accent/10" },
  { icon: Users, title: "Companion Care", description: "Meaningful companionship, conversation, social engagement, and emotional support.", color: "text-success", bg: "bg-success/10" },
  { icon: Brain, title: "Memory Care", description: "Specialized care for Alzheimer's and dementia patients with trained caregivers.", color: "text-warning", bg: "bg-warning/10" },
  { icon: Utensils, title: "Meal Preparation", description: "Nutritious meal planning and preparation tailored to dietary needs and preferences.", color: "text-primary", bg: "bg-primary/10" },
  { icon: Car, title: "Transportation", description: "Safe transportation to medical appointments, errands, and social activities.", color: "text-accent", bg: "bg-accent/10" },
  { icon: Clock, title: "24/7 Live-In Care", description: "Round-the-clock care and support for those needing continuous assistance.", color: "text-destructive", bg: "bg-destructive/10" },
];

const Services = () => (
  <PublicLayout>
    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive home care services tailored to each client's unique needs, delivered by trained and compassionate caregivers.
        </p>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.title} className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className={`inline-flex p-3 rounded-lg ${s.bg} mb-4`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-16 bg-gradient-to-r from-primary to-accent">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
        <p className="text-primary-foreground/80 mb-8">
          Contact us today to schedule a free in-home assessment and create a personalized care plan.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/client-registration">Request Care</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default Services;
