'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User, UserRole } from '@/lib/auth-constants';

export function useRoleAuth(requiredRole: UserRole) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // This check is to prevent crashing if Firebase isn't configured
    if (!auth?.onAuthStateChanged) {
        setIsLoading(false);
        // Fallback to prevent access if firebase is down
        router.replace('/');
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            if (userData.role === requiredRole) {
              setIsAuthorized(true);
            } else {
              // Logged in, but with the wrong role for this page.
              router.replace('/');
            }
          } else {
             // User exists in Firebase Auth, but not in our database.
             // This is an invalid state, so deny access.
             router.replace('/');
          }
        } catch (error) {
          console.error("Authorization check failed:", error);
          router.replace('/');
        }
      } else {
        // No user is logged in via Firebase Auth. Deny access to all protected routes.
        router.replace('/');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [requiredRole, router]);

  return { isLoading, isAuthorized };
}
