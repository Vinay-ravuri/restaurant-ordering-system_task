import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, UtensilsCrossed, ChefHat, Search, ArrowRight, X, Info } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatPaise } from '../lib/utils.js';

export function Navbar() {
  const { totalItems, setIsDrawerOpen } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isKitchen = location.pathname.startsWith('/kitchen');
  const isAdmin = location.pathname.startsWith('/admin');

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState('');
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('last_order_id');
    if (saved) setRecentOrderId(saved);
  }, []);

  // Kitchen and Admin display their own sidebars per the reference mockup
  if (isKitchen || isAdmin) {
    return null;
  }

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackOrderId.trim().replace('#', '');
    if (cleanId) {
      setIsTrackModalOpen(false);
      navigate(`/order/${cleanId}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-soft transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo with Chef Hat icon exactly as in reference image */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground group select-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-primary stroke-[2.2]" />
            </div>
            <div className="text-left">
              <span className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-foreground">
                Restaurant<span className="text-primary font-bold">OS</span>
              </span>
            </div>
          </Link>

          {/* Center Navigation Links: Menu, Track Order, About */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-foreground/80">
            <Link
              to="/"
              className={`hover:text-primary transition-colors ${
                location.pathname === '/' ? 'text-primary font-bold' : ''
              }`}
            >
              Menu
            </Link>
            <button
              onClick={() => {
                if (recentOrderId) {
                  navigate(`/order/${recentOrderId}`);
                } else {
                  setIsTrackModalOpen(true);
                }
              }}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Track Order
            </button>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              About
            </button>
            {user ? (
              <Link
                to={user.role === 'ADMIN' ? '/admin' : '/kitchen'}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"
              >
                Staff Portal ({user.role})
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-muted hover:text-foreground"
              >
                Staff Sign In
              </Link>
            )}
          </nav>

          {/* Right Actions: Shopping Cart with Red Notification Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2.5 sm:p-3 text-foreground hover:text-primary rounded-xl hover:bg-secondary/60 transition-all cursor-pointer"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-6 h-6 text-foreground stroke-[1.8]" />
              {totalItems() > 0 && (
                <span className="absolute 1 top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center shadow-sm animate-scaleIn">
                  {totalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Track Order Quick Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card rounded-3xl border border-border shadow-elevated p-6 max-w-sm w-full text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Track Your Order</h3>
              <button
                onClick={() => setIsTrackModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted mt-3">
              Enter your Order Number or UUID to track live preparation and pickup progress:
            </p>
            <form onSubmit={handleTrackSubmit} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="e.g. 1004 or order ID"
                value={trackOrderId}
                onChange={(e) => setTrackOrderId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-mono text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-soft hover:bg-primary-hover transition-colors"
              >
                Find & Track Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card rounded-3xl border border-border shadow-elevated p-6 max-w-md w-full text-left">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">About RestaurantOS</h3>
              </div>
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-muted leading-relaxed">
              <p>
                <strong>RestaurantOS</strong> is an enterprise dining platform combining artisanal culinary heritage with real-time kitchen dispatching and operational intelligence.
              </p>
              <p>
                Every dish is prepared to order using hand-selected regional ingredients, authentic stone-ground spices, and traditional charcoal tandoors.
              </p>
              <div className="p-3 bg-secondary/60 rounded-xl border border-border text-[11px] text-foreground">
                📍 <strong>Operating Hours:</strong> 11:30 AM – 11:00 PM Daily<br />
                🛎️ <strong>Live Dispatch:</strong> Real-time KDS synchronization
              </div>
            </div>
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="mt-5 w-full py-2.5 bg-secondary text-foreground text-xs font-bold rounded-xl hover:bg-secondary-hover transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
