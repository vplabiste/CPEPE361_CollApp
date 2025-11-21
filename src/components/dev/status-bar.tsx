'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';

export function DevStatusBar() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // This check is to prevent crashing if Firebase isn't configured
    if (!auth.onAuthStateChanged) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserEmail(user.email);
      } else {
        setCurrentUserEmail(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  let displayUser = currentUserEmail;
  
  // This logic runs after Firebase has confirmed the auth state
  if (!loading && !currentUserEmail) {
    if (pathname.startsWith('/admin')) {
      displayUser = 'admin@collapp.app';
    } else if (pathname.startsWith('/schoolrep')) {
      displayUser = 'schoolrep@collapp.app';
    }
  }

  if (loading || !displayUser) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-md bg-card p-2 px-3 text-xs font-mono shadow-lg border border-border text-card-foreground">
      <p>{displayUser}</p>
    </div>
  );
}
