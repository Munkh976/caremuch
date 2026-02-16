import { PublicLayout } from "@/components/PublicLayout";
import { Heart, Shield, Users, Award, Target, Eye } from "lucide-react";

const values = [
  { icon: Heart, title: "Compassion", description: "We treat every client like family, delivering care with empathy and warmth." },
  { icon: Shield, title: "Integrity", description: "Transparent, honest service built on trust and accountability." },
  { icon: Users, title: "Community", description: "Building stronger communities through accessible, quality home care." },
  { icon: Award, title: "Excellence", description: "Continuous improvement and the highest standards in every interaction." },
];

const team = [
  { name: "Dr. Sarah Mitchell", role: "Founder & CEO", bio: "25+ years in healthcare management with a passion for home care innovation." },
  { name: "James Rodriguez", role: "Director of Operations", bio: "Expert in healthcare logistics and caregiver workforce optimization." },
  { name: "Aisha Patel", role: "Head of Care Quality", bio: "Certified nurse with deep expertise in home care quality assurance." },
  { name: "Michael Chen", role: "Technology Lead", bio: "Building AI-driven solutions to transform healthcare scheduling." },
];

const AboutUs = () => (
  <PublicLayout>
    {/* Hero */}
    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">About CareMuch</h1>
        <p className="text-lg text-muted-foreground">
          We're on a mission to make quality home care accessible, reliable, and compassionate — powered by smart technology and dedicated caregivers.
        </p>
      </div>
    </section>

    {/* Mission & Vision */}
    <section className="py-16">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 max-w-5xl">
        <div className="p-8 rounded-2xl border bg-card">
          <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground">
            To provide exceptional home care services that enhance the quality of life for our clients while empowering our caregivers with the tools, support, and recognition they deserve.
          </p>
        </div>
        <div className="p-8 rounded-2xl border bg-card">
          <div className="inline-flex p-3 rounded-lg bg-accent/10 mb-4">
            <Eye className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
          <p className="text-muted-foreground">
            A world where every individual has access to personalized, compassionate home care — and every caregiver is valued, supported, and thriving.
          </p>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.title} className="text-center p-6 rounded-xl bg-card border">
              <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-12">Leadership Team</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((t) => (
            <div key={t.name} className="p-6 rounded-xl border bg-card text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <h3 className="font-semibold">{t.name}</h3>
              <p className="text-sm text-accent mb-2">{t.role}</p>
              <p className="text-xs text-muted-foreground">{t.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default AboutUs;
