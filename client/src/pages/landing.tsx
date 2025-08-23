import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { AuthModals } from "@/components/AuthModals";
import { Menu, X } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
}

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState<"login" | "signup" | null>(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => {
    setIsMenuOpen(false);
    setShowAuthModal("login");
  };

  const handleSignupClick = () => {
    setIsMenuOpen(false);
    setShowAuthModal("signup");
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <header className={`bg-white shadow-lg fixed w-full top-0 z-50 transition-all duration-300 ${isHeaderSticky ? 'py-2' : 'py-4'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
              H
            </div>
            <span className="text-2xl font-bold text-gray-800">HedgeFund</span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={handleLoginClick}
              data-testid="button-login"
            >
              Login
            </Button>
            <Button 
              onClick={handleSignupClick}
              data-testid="button-signup"
            >
              Sign Up
            </Button>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center md:hidden">
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white" onClick={() => setIsMenuOpen(false)}>
            <X className="h-8 w-8" />
          </Button>
          <div className="flex flex-col space-y-6">
            <Button
              variant="outline"
              className="text-lg py-6 px-12"
              onClick={handleLoginClick}
            >
              Login
            </Button>
            <Button
              className="text-lg py-6 px-12"
              onClick={handleSignupClick}
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary to-blue-700">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" data-testid="text-hero-title">
              Smart Investment Solutions
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed" data-testid="text-hero-description">
              Join thousands of investors earning consistent returns with our professionally managed hedge fund strategies.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-green-700 w-full md:w-auto"
                onClick={() => setShowAuthModal("signup")}
                data-testid="button-start-investing"
              >
                Start Investing
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white text-primary hover:bg-gray-200 w-full md:w-auto"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4" data-testid="text-features-title">
              Why Choose HedgeFund?
            </h2>
            <p className="text-xl text-gray-600" data-testid="text-features-subtitle">
              Professional investment management with proven results
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-background rounded-xl" data-testid="card-feature-returns">
              <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 12l3 3 7-7 7 7 3-3" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Consistent Returns</h3>
              <p className="text-gray-600">Track record of delivering steady, competitive returns for our investors.</p>
            </div>
            <div className="text-center p-8 bg-background rounded-xl" data-testid="card-feature-security">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Platform</h3>
              <p className="text-gray-600">Bank-level security and encryption to protect your investments.</p>
            </div>
            <div className="text-center p-8 bg-background rounded-xl" data-testid="card-feature-management">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Management</h3>
              <p className="text-gray-600">Professional fund managers with decades of experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4" data-testid="text-partners-title">
              Our Official Partners
            </h2>
            <p className="text-xl text-gray-600" data-testid="text-partners-subtitle">
              Trusted by leading financial institutions worldwide
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-center">
            {partners.map((partner) => (
              <div 
                key={partner.id} 
                className="flex justify-center items-center p-6 bg-white rounded-lg shadow-sm"
                data-testid={`card-partner-${partner.id}`}
              >
                <img 
                  src={partner.logoUrl} 
                  alt={partner.name} 
                  className="h-12 object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modals */}
      <AuthModals 
        showModal={showAuthModal}
        onClose={() => setShowAuthModal(null)}
        onSwitchModal={(type) => setShowAuthModal(type)}
      />
    </div>
  );
}
