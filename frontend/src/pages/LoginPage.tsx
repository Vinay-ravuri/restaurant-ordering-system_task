import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, UtensilsCrossed, AlertCircle, ChefHat, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { PAGE_BACKGROUNDS } from '../lib/dishImages.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/kitchen');
      }
    } catch {
      // Handled in store
    }
  };

  const fillCredentials = (role: 'ADMIN' | 'KITCHEN') => {
    if (role === 'ADMIN') {
      setEmail('admin@demo.com');
      setPassword('Admin@123');
    } else {
      setEmail('kitchen@demo.com');
      setPassword('Kitchen@123');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image Layer with Atmospheric Blur & Gradients */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-50 contrast-125"
        style={{ backgroundImage: `url(${PAGE_BACKGROUNDS.loginBackdrop})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/60" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-stone-950/80 pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-card/95 backdrop-blur-xl border border-white/20 shadow-elevated rounded-3xl p-6 sm:p-10 text-left">
          {/* Brand & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-hover text-white shadow-soft mb-3">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground tracking-tight">
              Staff & Operations Portal
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1.5">
              Secure enterprise access for Kitchen Displays & Restaurant Management
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Staff Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@restaurant.com"
                required
                className="rounded-xl bg-background/80"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-xl bg-background/80"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-2 rounded-2xl font-bold shadow-soft"
            >
              Authenticate & Enter
            </Button>
          </form>

          {/* Quick Demo Access Credentials */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                Instant Demo Profiles
              </span>
              <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> One-Click Fill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('ADMIN')}
                className="p-3 text-left rounded-2xl border border-border bg-secondary/60 hover:bg-secondary hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">Admin Console</span>
                  <ShieldCheck className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[11px] text-muted font-mono truncate">admin@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('KITCHEN')}
                className="p-3 text-left rounded-2xl border border-border bg-secondary/60 hover:bg-secondary hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">Kitchen Display</span>
                  <ChefHat className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[11px] text-muted font-mono truncate">kitchen@demo.com</div>
              </button>
            </div>
          </div>

          {/* Security Assurance Footer */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-4 text-[11px] text-muted font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit TLS Encrypted
            </span>
            <span>·</span>
            <span>Zero-Trust RBAC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
