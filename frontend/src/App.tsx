import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar.js';
import { CartDrawer } from './components/CartDrawer.js';
import { CustomerMenuPage } from './pages/CustomerMenuPage.js';
import { OrderTrackingPage } from './pages/OrderTrackingPage.js';
import { KitchenPage } from './pages/KitchenPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { useAuth } from './hooks/useAuth.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
          <Navbar />
          <CartDrawer />
          <div className="flex-1">
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<CustomerMenuPage />} />
              <Route path="/menu" element={<Navigate to="/" replace />} />
              <Route path="/order/:id" element={<OrderTrackingPage />} />

              {/* Staff & Kitchen Displays */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
