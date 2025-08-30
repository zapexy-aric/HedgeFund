import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { AuthModals } from "@/components/AuthModals";
import { Menu, X } from "lucide-react";
import type { Partner } from "@shared/schema";

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
            <img src="https://i.ibb.co/H8mXMmJ/Adobe-Express-file.png" alt="Velora Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold text-gray-800">Velora</span>
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

      {/* Games Section */}
      <section className="py-20 pt-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Provably Fair Games
            </h2>
            <p className="text-xl text-gray-600">
              The best crypto casino experience with 100% transparent and fair games.
            </p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Mines Game Card */}
            <div
              className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
              onClick={() => setShowAuthModal("signup")}
            >
              <div className="relative">
                {/* You can find better images for the games */}
                <img 
                  src="https://i.imgur.com/2lGvx4B.png"
                  alt="Mines Game"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-xl font-bold text-white">Mines</h3>
                </div>
              </div>
            </div>

            {/* Placeholder for more games */}
            <div className="rounded-lg bg-gray-200 flex items-center justify-center h-48 text-gray-500">
              More games coming soon...
            </div>
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
