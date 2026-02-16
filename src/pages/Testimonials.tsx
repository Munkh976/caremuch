import { PublicLayout } from "@/components/PublicLayout";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Martha Johnson", role: "Client's Daughter", rating: 5, text: "CareMuch has been a blessing for our family. The caregiver they matched with my mother is not just skilled but genuinely caring. The scheduling flexibility is incredible." },
  { name: "Robert Davis", role: "Client", rating: 5, text: "I've been receiving home care for 2 years now. My caregiver helps me maintain my independence while ensuring I'm safe. I couldn't ask for better care." },
  { name: "Lisa Chen", role: "Caregiver", rating: 5, text: "Working with CareMuch has been the best career decision. The scheduling system is seamless, the support is excellent, and the referral program really rewards loyalty." },
  { name: "James Williams", role: "Client's Son", rating: 5, text: "The transparency and communication from CareMuch is outstanding. I can always see who is caring for my father and track his care in real-time." },
  { name: "Sarah Thompson", role: "Caregiver", rating: 5, text: "The team structure and mentorship programs help me grow professionally. I feel valued and supported every day. The passive income from referrals is a great bonus." },
  { name: "Elena Rodriguez", role: "Client", rating: 5, text: "From the very first call, CareMuch made everything easy. My caregiver is punctual, professional, and has become like family to me." },
];

const Testimonials = () => (
  <PublicLayout>
    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">What People Say</h1>
        <p className="text-lg text-muted-foreground">
          Hear from the families and caregivers who trust CareMuch for quality home care.
        </p>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 rounded-xl border bg-card">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default Testimonials;
