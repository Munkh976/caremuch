import { PublicLayout } from "@/components/PublicLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
  { q: "What types of home care services do you offer?", a: "We offer personal care, skilled nursing, companion care, homemaker services, memory care, meal preparation, transportation assistance, and 24/7 live-in care. Each plan is customized to the client's needs." },
  { q: "How do I request care for a loved one?", a: "Simply click 'Request Care' to fill out our client registration form. Our care coordinator will contact you within 24 hours to schedule a free in-home assessment." },
  { q: "Are your caregivers background-checked and trained?", a: "Yes. Every caregiver undergoes comprehensive background checks, reference verification, and skills training before joining our team. We also provide ongoing education and certification programs." },
  { q: "How does caregiver matching work?", a: "Our AI-powered matching system considers care needs, personality preferences, location, schedule compatibility, and specialized skills to pair clients with the ideal caregiver — achieving 85%+ match accuracy." },
  { q: "Can I choose or change my caregiver?", a: "Absolutely. While we recommend our AI-matched caregiver, you can request a different caregiver at any time. Your satisfaction is our top priority." },
  { q: "What are your hours of operation?", a: "Our care services are available 24/7, 365 days a year. Our office is open Monday–Friday, 8 AM – 6 PM, but our on-call team is always available for emergencies." },
  { q: "How do I become a caregiver with CareMuch?", a: "Click 'Join as Caregiver' to fill out our registration form. After review and approval, you'll complete our onboarding and training program before being matched with clients." },
  { q: "Does CareMuch accept insurance?", a: "We accept most major insurance plans, Medicaid, and private pay options. Contact us for specific coverage questions — our team will help navigate your benefits." },
  { q: "What is the referral program?", a: "Our 2-tier referral program rewards caregivers with a one-time bonus when their referred caregiver completes 30 days, plus 1-2% monthly passive income from the referred caregiver's billable revenue." },
  { q: "How do I contact CareMuch in an emergency?", a: "Call our 24/7 emergency line at (555) 123-4567. For non-urgent matters, email info@caremuch.com or use our contact form." },
];

const FAQ = () => (
  <PublicLayout>
    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions about our services, caregivers, and getting started.
        </p>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>

    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
        <p className="text-muted-foreground mb-6">Our team is here to help. Reach out to us anytime.</p>
        <Button asChild>
          <Link to="/contact">Contact Us</Link>
        </Button>
      </div>
    </section>
  </PublicLayout>
);

export default FAQ;
