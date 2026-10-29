import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-card mb-4">
        R
      </div>
      <h1 className="text-3xl font-bold text-foreground font-serif tracking-tight">
        RestaurantOS
      </h1>
      <p className="text-muted mt-2 max-w-md">
        Enterprise-grade restaurant ordering, live kitchen operations display, and operations console.
      </p>
    </div>
  );
}
