import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, UtensilsCrossed, ChefHat, LayoutDashboard, LogOut } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatPaise } from '../lib/utils.js';

export function Navbar() {
  const { totalItems, totalPaise, setIsDrawerOpen, orderType, tableNumber } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();

  const isKitchen = location.pathname.startsWith('/kitchen');
  const isAdmin = location.pathname.startsWith('/admin');
  const isCustomer = !isKitchen && !isAdmin;

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground group select-none">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-serif text-lg tracking-tight block leading-none">RestaurantOS</span>
            <span className="text-[10px] text-muted tracking-widest uppercase font-sans">Kitchen & Dining</span>
          </div>
        </Link>

        {/* Center / Navigation Links */}
        <div className="hidden sm:flex items-center gap-1 bg-secondary/60 p-1 rounded-xl text-xs font-medium">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              isCustomer ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            Customer Menu
          </Link>
          <Link
            to="/kitchen"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              isKitchen ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen Display
          </Link>
          <Link
            to="/admin"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              isAdmin ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden md:inline px-2 py-0.5 rounded bg-secondary text-foreground font-semibold uppercase tracking-wider">
                {user.role}
              </span>
              <button
                onClick={() => logout()}
                className="p-2 text-muted hover:text-danger hover:bg-secondary rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold text-muted hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              Staff Sign In
            </Link>
          )}

          {/* Cart Button */}
          {isCustomer && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative flex items-center gap-2 bg-primary text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-primary-hover active:scale-95 transition-all min-h-[40px]"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">{formatPaise(totalPaise())}</span>
              {totalItems() > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-primary text-[11px] font-extrabold flex items-center justify-center shadow-sm">
                  {totalItems()}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
