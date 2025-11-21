
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/auth-constants';

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // This check is to prevent crashing if Firebase isn't configured
    if (!auth?.onAuthStateChanged) {
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If user is logged in, redirect them from the homepage
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            switch (userData.role) {
              case 'admin':
                router.replace('/admin');
                break;
              case 'schoolrep':
                router.replace('/schoolrep');
                break;
              case 'student':
                router.replace('/student');
                break;
              default:
                // Stay on page if role is unknown or not set
                break;
            }
          }
        } catch (error) {
            console.error("Redirection check failed:", error);
            // Don't redirect if there's an error getting user data,
            // as it might be a temporary network issue.
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null; // This component doesn't render anything
}
