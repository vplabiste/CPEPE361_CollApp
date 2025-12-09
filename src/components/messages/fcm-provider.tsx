
'use client';

import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { getToken } from 'firebase/messaging';
import { auth, messaging, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { saveFCMToken } from '@/app/actions/messages';

export function FCMProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && isFirebaseConfigured && messaging) {
        
        const requestPermission = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted' && auth.currentUser) {
                    const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
                    if (currentToken) {
                        await saveFCMToken(auth.currentUser.uid, currentToken);
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                }
            } catch (err) {
                console.error('An error occurred while retrieving token. ', err);
            }
        };

        requestPermission();

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received.', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });

        return () => {
            unsubscribe();
        };
    }
  }, [toast]);

  return <>{children}</>;
}
