import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "About Us", path: "/about-us" },
    { label: "Services", path: "/services" },
    { label: "Testimonials", path: "/testimonials" },
    { label: "FAQ", path: "/faq" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> (555) 123-4567
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> info@caremuch.com
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/caregiver-login" className="hover:underline">Caregiver Portal</Link>
            <span>|</span>
            <Link to="/client-login" className="hover:underline">Client Portal</Link>
            <span>|</span>
            <Link to="/admin-login" className="hover:underline">Staff Login</Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CareMuch
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/caregiver-registration">Join as Caregiver</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/client-registration">Request Care</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">CareMuch</span>
              </div>
              <p className="text-sm opacity-70">
                Providing compassionate, professional home care services with AI-powered scheduling and workforce management.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><Link to="/about-us" className="hover:opacity-100">About Us</Link></li>
                <li><Link to="/services" className="hover:opacity-100">Our Services</Link></li>
                <li><Link to="/testimonials" className="hover:opacity-100">Testimonials</Link></li>
                <li><Link to="/faq" className="hover:opacity-100">FAQ</Link></li>
                <li><Link to="/contact" className="hover:opacity-100">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Portals</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><Link to="/caregiver-login" className="hover:opacity-100">Caregiver Login</Link></li>
                <li><Link to="/client-login" className="hover:opacity-100">Client Login</Link></li>
                <li><Link to="/admin-login" className="hover:opacity-100">Staff Login</Link></li>
                <li><Link to="/caregiver-registration" className="hover:opacity-100">Join Our Team</Link></li>
                <li><Link to="/client-registration" className="hover:opacity-100">Request Care</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-3 text-sm opacity-70">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>123 Care Street, Suite 100<br />Healthcare City, HC 12345</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>(555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>info@caremuch.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-50">
            <p>&copy; {new Date().getFullYear()} CareMuch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
