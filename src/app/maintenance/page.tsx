'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Wrench, Shield } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function MaintenancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role === 'admin') {
              router.replace('/admin');
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role === 'admin') {
          toast({
            title: 'Login Successful',
            description: 'Welcome back, admin!',
          });
          router.replace('/admin');
        } else {
          await auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'Only administrators can access the site during maintenance.',
          });
        }
      } else {
        await auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'User profile not found.',
        });
      }
    } catch (error: any) {
      let message = 'An unexpected error occurred.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: message,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 text-foreground">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-8">
        <div className="max-w-2xl w-full space-y-8">
          <div>
            <Wrench className="h-20 w-20 text-primary mb-6 mx-auto" />
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">Under Maintenance</h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Our site is currently undergoing scheduled maintenance to improve your experience. We'll be back online shortly. Thank you for your patience!
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>
                Administrators can still access the site during maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@collapp.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoggingIn}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoggingIn}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Admin Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
