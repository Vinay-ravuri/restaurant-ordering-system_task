import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, UtensilsCrossed, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';

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
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-card">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold font-serif text-foreground">Staff Portal Sign In</h2>
        <p className="mt-1 text-xs text-muted">Access Kitchen Operations or Admin Console</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-8 px-6 shadow-soft rounded-3xl border border-border text-left">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-danger">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@restaurant.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="mt-6 pt-5 border-t border-border">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2 text-center">
              Quick Demo Fill
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('ADMIN')}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-secondary-hover text-foreground transition-colors"
              >
                Fill Admin (admin@demo.com)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('KITCHEN')}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-secondary-hover text-foreground transition-colors"
              >
                Fill Kitchen (kitchen@demo.com)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
